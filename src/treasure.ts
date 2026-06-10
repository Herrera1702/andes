/** Piezas del tesoro inca con animación y chispas */

import { circleRectOverlap } from './collision.js';
import { Player } from './player.js';
import { drawTreasureSprite } from './sprites.js';
import { drawTreasureGlow } from './lighting.js';

export const TREASURE_RADIUS = 14;
const TOTAL_PIECES = 5;

export class Treasure {
  x: number;
  y: number;
  collected = false;
  private floatOffset = 0;
  private glowPhase = Math.random() * Math.PI * 2;
  private sparkPhase = Math.random() * Math.PI * 2;
  readonly id: number;

  constructor(x: number, y: number, id: number) {
    this.x = x;
    this.y = y;
    this.id = id;
  }

  get sortY(): number {
    return this.y + this.floatOffset + 10;
  }

  update(dt: number): void {
    if (this.collected) return;
    this.floatOffset = Math.sin(performance.now() / 500 + this.id) * 5;
    this.glowPhase += dt * 0.003;
    this.sparkPhase += dt * 0.005;
  }

  checkCollection(player: Player): boolean {
    if (this.collected) return false;
    const collected = circleRectOverlap(
      this.x,
      this.y + this.floatOffset,
      TREASURE_RADIUS,
      player.getHitboxRect()
    );
    if (collected) this.collected = true;
    return collected;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.collected) return;

    const sx = this.x - cameraX;
    const sy = this.y - cameraY;
    const fy = this.floatOffset;

    drawTreasureGlow(ctx, sx, sy + fy, this.glowPhase);
    drawTreasureSprite(ctx, sx, sy, fy, this.glowPhase, this.sparkPhase);
  }
}

export function createTreasures(
  getPosition: () => { x: number; y: number }
): Treasure[] {
  const treasures: Treasure[] = [];
  for (let i = 0; i < TOTAL_PIECES; i++) {
    const pos = getPosition();
    treasures.push(new Treasure(pos.x, pos.y, i));
  }
  return treasures;
}
