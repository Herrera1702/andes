/** Jugador explorador con sprites animados y hitbox */

import { Hitbox, moveWithSlide, getHitboxRect } from './collision.js';
import { drawPlayerSprite, Facing } from './sprites.js';

export const PLAYER_SPRITE_W = 32;
export const PLAYER_SPRITE_H = 34;
export const PLAYER_SPEED = 185;

export const PLAYER_HITBOX: Hitbox = {
  width: 14,
  height: 10,
  offsetX: 9,
  offsetY: 22,
};

export class Player {
  x: number;
  y: number;
  readonly width = PLAYER_SPRITE_W;
  readonly height = PLAYER_SPRITE_H;
  private vx = 0;
  private vy = 0;
  facing: Facing = 'down';
  private invincibleTimer = 0;
  animFrame = 0;
  isMoving = false;
  private wasMoving = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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

  get isInvincible(): boolean {
    return this.invincibleTimer > 0;
  }

  get hitbox(): Hitbox {
    return PLAYER_HITBOX;
  }

  getHitboxRect() {
    return getHitboxRect(this.x, this.y, PLAYER_HITBOX);
  }

  setInput(dx: number, dy: number): void {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      this.vx = (dx / len) * PLAYER_SPEED;
      this.vy = (dy / len) * PLAYER_SPEED;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.facing = dy > 0 ? 'down' : 'up';
      }
      this.isMoving = true;
    } else {
      this.vx = 0;
      this.vy = 0;
      this.isMoving = false;
    }
  }

  update(
    dt: number,
    mapWidth: number,
    mapHeight: number,
    isBlocked: (x: number, y: number, hb: Hitbox) => boolean
  ): boolean {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    const dtSec = dt / 1000;
    if (this.isMoving) {
      this.animFrame += dtSec * 10;
    } else {
      this.animFrame += dtSec * 2;
    }

    const moved = this.vx !== 0 || this.vy !== 0;
    const result = moveWithSlide(
      this.x, this.y, this.vx, this.vy, dtSec,
      mapWidth, mapHeight, PLAYER_HITBOX, isBlocked
    );
    this.x = result.x;
    this.y = result.y;

    const didMove = moved && (this.isMoving !== this.wasMoving || this.isMoving);
    this.wasMoving = this.isMoving;
    return didMove && this.isMoving;
  }

  hit(): void {
    this.invincibleTimer = 1500;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY;
    const alpha = this.isInvincible && Math.floor(this.invincibleTimer / 100) % 2 === 0 ? 0.5 : 1;
    drawPlayerSprite(ctx, sx, sy, this.facing, this.animFrame, this.isMoving, alpha);
  }
}
