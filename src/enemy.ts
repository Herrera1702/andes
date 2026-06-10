/** Guardianes con IA por estados, visión y pathfinding A* */

import { Hitbox, circleRectOverlap, moveWithSlide } from './collision.js';
import { Player } from './player.js';
import { GameMap, TILE_SIZE, MAP_COLS, MAP_ROWS } from './map.js';
import { DifficultyConfig } from './difficulty.js';
import { findPath, GridPoint } from './pathfinding.js';
import { canSeePlayer, angleBetween } from './vision.js';
import { drawGuardianSprite, Facing, EnemyState } from './sprites.js';

export const ENEMY_SPRITE_W = 32;
export const ENEMY_SPRITE_H = 34;

const ENEMY_HITBOX: Hitbox = {
  width: 16,
  height: 12,
  offsetX: 8,
  offsetY: 20,
};

interface PatrolPoint {
  x: number;
  y: number;
}

export class Enemy {
  x: number;
  y: number;
  readonly width = ENEMY_SPRITE_W;
  readonly height = ENEMY_SPRITE_H;
  state: EnemyState = 'PATROL';
  facing: Facing = 'down';
  facingAngle = Math.PI / 2;
  animFrame = 0;

  private patrol: PatrolPoint[];
  private patrolIndex = 0;
  private waitTimer = 0;
  private lastSeenX = 0;
  private lastSeenY = 0;
  private homeX: number;
  private homeY: number;
  private path: GridPoint[] = [];
  private pathIndex = 0;
  private repathTimer = 0;
  private stuckTimer = 0;
  private lastX = 0;
  private lastY = 0;
  private attackCooldown = 0;
  private alertPlayed = false;
  readonly config: DifficultyConfig;

  constructor(
    x: number,
    y: number,
    patrol: PatrolPoint[],
    config: DifficultyConfig
  ) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.patrol = patrol.length > 0 ? patrol : [{ x: x + ENEMY_SPRITE_W / 2, y: y + ENEMY_SPRITE_H / 2 }];
    this.config = config;
    this.lastX = x;
    this.lastY = y;
  }

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  get sortY(): number {
    return this.y + this.height;
  }

  update(
    dt: number,
    map: GameMap,
    player: Player,
    onAlert?: () => void
  ): void {
    const dtSec = dt / 1000;
    this.animFrame += dtSec * 8;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.repathTimer > 0) this.repathTimer -= dt;

    const canSee = canSeePlayer(
      map,
      this.centerX, this.centerY, this.facingAngle,
      player.centerX, player.centerY,
      this.config.visionRadius,
      this.config.visionAngle
    );

    if (canSee) {
      this.lastSeenX = player.centerX;
      this.lastSeenY = player.centerY;
      if (this.state === 'PATROL' || this.state === 'RETURN' || this.state === 'INVESTIGATE') {
        this.state = 'CHASE';
        if (!this.alertPlayed) {
          this.alertPlayed = true;
          onAlert?.();
        }
      }
    }

    const distToPlayer = Math.hypot(player.centerX - this.centerX, player.centerY - this.centerY);

    if (this.state === 'CHASE' && distToPlayer <= this.config.attackRange) {
      this.state = 'ATTACK';
    } else if (this.state === 'ATTACK' && distToPlayer > this.config.attackRange * 1.5) {
      this.state = 'CHASE';
    }

    if (this.state === 'CHASE' && !canSee && distToPlayer > this.config.visionRadius * 1.2) {
      this.state = 'INVESTIGATE';
      this.alertPlayed = false;
    }

    if (this.state === 'INVESTIGATE') {
      const distToLast = Math.hypot(this.lastSeenX - this.centerX, this.lastSeenY - this.centerY);
      if (distToLast < 16) {
        this.state = 'RETURN';
      }
    }

    if (this.state === 'RETURN') {
      const distHome = Math.hypot(this.homeX + this.width / 2 - this.centerX, this.homeY + this.height / 2 - this.centerY);
      if (distHome < 20) {
        this.state = 'PATROL';
        this.patrolIndex = 0;
        this.alertPlayed = false;
      }
    }

    let targetX = this.centerX;
    let targetY = this.centerY;
    let speed = this.config.enemySpeed;

    switch (this.state) {
      case 'PATROL':
        if (this.waitTimer > 0) {
          this.waitTimer -= dt;
          break;
        }
        targetX = this.patrol[this.patrolIndex].x;
        targetY = this.patrol[this.patrolIndex].y;
        speed = this.config.enemySpeed;
        if (Math.hypot(targetX - this.centerX, targetY - this.centerY) < 8) {
          this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
          this.waitTimer = 600 + Math.random() * 1200;
          this.path = [];
          break;
        }
        this.moveToward(map, targetX, targetY, speed, dt);
        break;

      case 'INVESTIGATE':
        this.moveToward(map, this.lastSeenX, this.lastSeenY, this.config.enemySpeed * 1.1, dt);
        break;

      case 'CHASE':
        this.moveToward(map, player.centerX, player.centerY, this.config.chaseSpeed, dt);
        break;

      case 'ATTACK':
        this.moveToward(map, player.centerX, player.centerY, this.config.chaseSpeed * 0.6, dt);
        break;

      case 'RETURN':
        this.moveToward(map, this.homeX + this.width / 2, this.homeY + this.height / 2, this.config.enemySpeed, dt);
        break;
    }

    const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (moved < 0.5 && (this.state === 'CHASE' || this.state === 'INVESTIGATE')) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 800) {
        this.repathTimer = 0;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;
  }

  private moveToward(map: GameMap, targetX: number, targetY: number, speed: number, dt: number): void {
    const dist = Math.hypot(targetX - this.centerX, targetY - this.centerY);
    if (dist < 4) return;

    this.facingAngle = angleBetween(this.centerX, this.centerY, targetX, targetY);
    this.updateFacing();

    if (this.repathTimer <= 0 || this.path.length === 0) {
      this.computePath(map, targetX, targetY);
      this.repathTimer = 500;
    }

    let goalX = targetX;
    let goalY = targetY;

    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      const wp = map.gridToWorld(this.path[this.pathIndex].col, this.path[this.pathIndex].row);
      goalX = wp.x;
      goalY = wp.y;
      if (Math.hypot(goalX - this.centerX, goalY - this.centerY) < 12) {
        this.pathIndex++;
        if (this.pathIndex < this.path.length) {
          const next = map.gridToWorld(this.path[this.pathIndex].col, this.path[this.pathIndex].row);
          goalX = next.x;
          goalY = next.y;
        }
      }
    }

    const dx = goalX - this.centerX;
    const dy = goalY - this.centerY;
    const d = Math.hypot(dx, dy) || 1;
    const vx = (dx / d) * speed;
    const vy = (dy / d) * speed;

    const result = moveWithSlide(
      this.x, this.y, vx, vy, dt / 1000,
      map.width, map.height, ENEMY_HITBOX,
      (x, y, hb) => map.isHitboxBlocked(x, y, hb)
    );
    this.x = result.x;
    this.y = result.y;
  }

  private computePath(map: GameMap, targetX: number, targetY: number): void {
    const start = map.worldToGrid(this.centerX, this.centerY);
    const end = map.worldToGrid(targetX, targetY);
    const grid = map.getWalkableGrid();
    this.path = findPath(grid, MAP_COLS, MAP_ROWS, start, end);
    this.pathIndex = this.path.length > 1 ? 1 : 0;
  }

  private updateFacing(): void {
    const a = this.facingAngle;
    if (a > -Math.PI / 4 && a <= Math.PI / 4) this.facing = 'right';
    else if (a > Math.PI / 4 && a <= (3 * Math.PI) / 4) this.facing = 'down';
    else if (a > -(3 * Math.PI) / 4 && a <= -Math.PI / 4) this.facing = 'up';
    else this.facing = 'left';
  }

  checkCollision(player: Player): boolean {
    if (player.isInvincible || this.attackCooldown > 0) return false;
    if (this.state !== 'ATTACK' && this.state !== 'CHASE') return false;
    const hit = circleRectOverlap(
      this.centerX, this.centerY, 16,
      player.getHitboxRect()
    );
    if (hit) this.attackCooldown = 800;
    return hit;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, debug = false): void {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY;
    drawGuardianSprite(ctx, sx, sy, this.facing, this.state, this.animFrame);

    if (debug) {
      ctx.strokeStyle = 'rgba(255,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(sx + this.width / 2, sy + this.height / 2, this.config.visionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function createEnemies(map: GameMap, config: DifficultyConfig): Enemy[] {
  const enemies: Enemy[] = [];

  for (let i = 0; i < config.enemyCount; i++) {
    const start = map.getRandomWalkablePosition();
    const ex = start.x - ENEMY_SPRITE_W / 2;
    const ey = start.y - ENEMY_SPRITE_H / 2;
    const patrol: PatrolPoint[] = [{ x: start.x, y: start.y }];

    for (let p = 0; p < 4; p++) {
      const col = Math.floor(start.x / TILE_SIZE) + Math.floor(Math.random() * 9) - 4;
      const row = Math.floor(start.y / TILE_SIZE) + Math.floor(Math.random() * 9) - 4;
      if (map.isWalkable(col, row)) {
        const w = map.gridToWorld(col, row);
        patrol.push(w);
      }
    }

    enemies.push(new Enemy(ex, ey, patrol, config));
  }

  return enemies;
}
