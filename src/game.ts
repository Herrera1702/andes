/** Motor principal del juego — render AAA */

import { GameMap } from './map.js';
import { Player } from './player.js';
import { createTreasures, Treasure } from './treasure.js';
import { createEnemies, Enemy } from './enemy.js';
import { ScoreManager, TOTAL_TREASURES } from './score.js';
import { UIManager, VirtualJoystick } from './ui.js';
import { SoundManager } from './audio.js';
import { WorldBackground } from './background.js';
import { ParticleSystem } from './particles.js';
import { applyVignette, applyWarmLight } from './lighting.js';
import { DifficultyConfig, getDifficulty } from './difficulty.js';
import { Hitbox } from './collision.js';

interface Drawable {
  sortY: number;
  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ui: UIManager;
  private joystick: VirtualJoystick;

  private map!: GameMap;
  private player!: Player;
  private treasures: Treasure[] = [];
  private enemies: Enemy[] = [];
  private scoreManager = new ScoreManager();
  private background = new WorldBackground();
  private particles = new ParticleSystem();
  private difficulty!: DifficultyConfig;

  private keys: Set<string> = new Set();
  private running = false;
  private paused = false;
  private animationId = 0;
  private lastTime = 0;
  private cameraX = 0;
  private cameraY = 0;
  private victoryTimer = 0;
  private victoryPending = false;
  private victoryScore = 0;
  private victoryTime = '';

  private onVictory: (score: number, time: string) => void;
  private sounds: SoundManager | null;
  constructor(
    ui: UIManager,
    joystick: VirtualJoystick,
    onVictory: (score: number, time: string) => void,
    sounds: SoundManager | null = null
  ) {
    this.canvas = ui.elements.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.ctx = ctx;
    this.ui = ui;
    this.joystick = joystick;
    this.onVictory = onVictory;
    this.sounds = sounds;

    this.bindInput();
    this.bindResize();
  }

  start(level = 1): void {
    this.stop();

    this.difficulty = getDifficulty(level);
    this.map = new GameMap();
    const spawn = this.map.getRandomWalkablePosition();
    this.player = new Player(spawn.x - 16, spawn.y - 16);

    this.treasures = createTreasures(() => this.map.getRandomWalkablePosition());
    this.enemies = createEnemies(this.map, this.difficulty);
    this.scoreManager.reset();
    this.victoryPending = false;
    this.victoryTimer = 0;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();

    this.ui.showScreen('game');
    this.ui.updateLevel(this.difficulty.level, this.difficulty.name);
    this.sounds?.startAmbient();
    this.resizeCanvas();

    if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
      requestAnimationFrame(() => {
        this.resizeCanvas();
        this.loop(this.lastTime);
      });
    } else {
      this.loop(this.lastTime);
    }
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.scoreManager.stop();
    this.ui.showPauseOverlay();
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.scoreManager.resume();
    this.ui.hidePauseOverlay();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.victoryPending = false;
    cancelAnimationFrame(this.animationId);
    this.scoreManager.stop();
    this.sounds?.stopAmbient();
    this.ui.hidePauseOverlay();
  }

  private bindInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private bindResize(): void {
    window.addEventListener('resize', () => {
      if (this.running) this.resizeCanvas();
    });
  }

  private resizeCanvas(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private getInput(): { dx: number; dy: number } {
    let dx = 0, dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    const joy = this.joystick.direction;
    if (joy.dx !== 0 || joy.dy !== 0) { dx = joy.dx; dy = joy.dy; }
    return { dx, dy };
  }

  private loop(timestamp: number): void {
    if (!this.running || this.paused) return;
    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    if (this.victoryPending) {
      this.victoryTimer -= dt;
      this.particles.update(dt, this.viewW, this.viewH, this.cameraX, this.cameraY);
      this.render();
      if (this.victoryTimer <= 0) {
        this.running = false;
        this.sounds?.stopAmbient();
        this.onVictory(this.victoryScore, this.victoryTime);
      }
    } else {
      this.update(dt);
      this.render();
    }

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  private get viewW(): number {
    return this.canvas.width / (window.devicePixelRatio || 1);
  }

  private get viewH(): number {
    return this.canvas.height / (window.devicePixelRatio || 1);
  }

  private update(dt: number): void {
    this.map.update(dt);
    this.background.update(dt);

    const input = this.getInput();
    this.player.setInput(input.dx, input.dy);

    const blockFn = (x: number, y: number, hb: Hitbox) =>
      this.map.isHitboxBlocked(x, y, hb);

    const walked = this.player.update(dt, this.map.width, this.map.height, blockFn);
    if (walked) {
      this.particles.spawnDust(this.player.centerX, this.player.centerY + 14);
    }

    this.scoreManager.update(dt);

    for (const treasure of this.treasures) {
      treasure.update(dt);
      if (treasure.checkCollection(this.player)) {
        this.scoreManager.collectTreasure();
        this.particles.spawnSpark(treasure.x, treasure.y);
        this.sounds?.playTreasure();
        this.ui.pulseHudValue('hud-treasures');
        this.ui.pulseHudValue('hud-score');
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.map, this.player, () => this.sounds?.playAlert());
      if (enemy.checkCollision(this.player)) {
        this.scoreManager.enemyHit();
        this.player.hit();
        this.sounds?.playEnemyHit();
        this.sounds?.playDefeat();
      }
    }

    this.particles.update(dt, this.viewW, this.viewH, this.cameraX, this.cameraY);
    this.updateCamera();

    const treasures = this.scoreManager.treasuresCollected;
    this.ui.updateHUD(
      this.scoreManager.score,
      this.scoreManager.formatTime(),
      treasures,
      TOTAL_TREASURES
    );
    if (this.scoreManager.allTreasuresFound) {
      this.scoreManager.stop();
      this.victoryPending = true;
      this.victoryTimer = 1800;
      this.victoryScore = this.scoreManager.score;
      this.victoryTime = this.scoreManager.formatTime();
      this.particles.spawnVictoryBurst(this.player.centerX, this.player.centerY);
      this.sounds?.playVictory();
    }
  }

  private updateCamera(): void {
    const viewW = this.viewW;
    const viewH = this.viewH;
    this.cameraX = this.player.centerX - viewW / 2;
    this.cameraY = this.player.centerY - viewH / 2;
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.map.width - viewW));
    this.cameraY = Math.max(0, Math.min(this.cameraY, this.map.height - viewH));
  }

  private render(): void {
    const viewW = this.viewW;
    const viewH = this.viewH;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, viewW, viewH);

    this.background.draw(ctx, this.cameraX, this.cameraY, viewW, viewH, this.map.width, this.map.height);
    this.map.draw(ctx, this.cameraX, this.cameraY, viewW, viewH);

    const drawables: Drawable[] = [
      ...this.treasures.filter((t) => !t.collected),
      this.player,
      ...this.enemies,
    ];
    drawables.sort((a, b) => a.sortY - b.sortY);
    for (const d of drawables) {
      d.draw(ctx, this.cameraX, this.cameraY);
    }

    this.particles.draw(ctx, this.cameraX, this.cameraY);

    applyWarmLight(ctx, viewW, viewH);
    applyVignette(ctx, viewW, viewH, this.victoryPending ? 0.35 : 0.2);

    if (this.victoryPending) {
      const alpha = Math.min(1, (1800 - this.victoryTimer) / 800) * 0.4;
      ctx.fillStyle = `rgba(255,215,80,${alpha})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }
}
