/** Sprites procedurales estilo indie cartoon */

import { drawSoftShadow } from './lighting.js';

export type Facing = 'up' | 'down' | 'left' | 'right';

export type EnemyState = 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'RETURN';

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath();
  const c = ctx as CanvasRenderingContext2D & {
    roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  };
  if (c.roundRect) {
    c.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
}

const SKIN = '#E8B88A';
const SHIRT = '#4A90C8';
const PANTS = '#5C4030';
const HAT = '#8B5E3C';
const BOOT = '#3D2817';

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  facing: Facing,
  animFrame: number,
  isMoving: boolean,
  alpha = 1
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  const bob = isMoving ? Math.sin(animFrame * 0.8) * 2 : Math.sin(animFrame * 0.15) * 1;
  const legSwing = isMoving ? Math.sin(animFrame * 0.8) * 5 : 0;
  const cx = sx + 16;

  drawSoftShadow(ctx, cx, sy + 30, 11, 4.5);

  if (facing === 'left') ctx.scale(-1, 1), ctx.translate(-sx * 2 - 32, 0);

  // Piernas
  ctx.fillStyle = PANTS;
  ctx.fillRect(sx + 10 + legSwing * 0.3, sy + 22 + bob, 5, 9);
  ctx.fillRect(sx + 17 - legSwing * 0.3, sy + 22 + bob, 5, 9);
  ctx.fillStyle = BOOT;
  ctx.fillRect(sx + 9 + legSwing * 0.3, sy + 29 + bob, 7, 3);
  ctx.fillRect(sx + 16 - legSwing * 0.3, sy + 29 + bob, 7, 3);

  // Mochila
  ctx.fillStyle = '#6B4F3A';
  fillRoundRect(ctx, sx + 4, sy + 14 + bob, 7, 12, 2);

  // Torso
  ctx.fillStyle = SHIRT;
  fillRoundRect(ctx, sx + 9, sy + 14 + bob, 14, 11, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(sx + 11, sy + 16 + bob, 4, 6);

  // Brazos
  ctx.fillStyle = SHIRT;
  const armOff = isMoving ? legSwing * 0.5 : 0;
  ctx.fillRect(sx + 6, sy + 15 + bob + armOff, 4, 9);
  ctx.fillRect(sx + 22, sy + 15 + bob - armOff, 4, 9);
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(sx + 8, sy + 25 + bob + armOff, 2.5, 0, Math.PI * 2);
  ctx.arc(sx + 24, sy + 25 + bob - armOff, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, sy + 10 + bob, 7, 0, Math.PI * 2);
  ctx.fill();

  // Sombrero explorador
  ctx.fillStyle = HAT;
  ctx.beginPath();
  ctx.ellipse(cx, sy + 5 + bob, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(sx + 10, sy + 1 + bob, 12, 6);

  // Ojos según dirección
  ctx.fillStyle = '#2C1810';
  if (facing === 'up') {
    ctx.fillRect(sx + 12, sy + 7 + bob, 2, 2);
    ctx.fillRect(sx + 18, sy + 7 + bob, 2, 2);
  } else {
    ctx.fillRect(sx + 13, sy + 9 + bob, 2, 2);
    ctx.fillRect(sx + 17, sy + 9 + bob, 2, 2);
  }

  ctx.restore();
}

export function drawGuardianSprite(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  facing: Facing,
  state: EnemyState,
  animFrame: number,
  alpha = 1
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  const pulse = state === 'CHASE' || state === 'ATTACK'
    ? 0.5 + Math.sin(animFrame * 0.3) * 0.5
    : 0;
  const bob = Math.sin(animFrame * 0.12) * 1.5;
  const cx = sx + 16;
  const cy = sy + 16 + bob;

  drawSoftShadow(ctx, cx, sy + 32, 13, 5);

  if (facing === 'left') ctx.scale(-1, 1), ctx.translate(-sx * 2 - 32, 0);

  // Cuerpo de piedra
  const bodyColor = state === 'RETURN' ? '#6A5E58' : '#8A7B6E';
  ctx.fillStyle = bodyColor;
  fillRoundRect(ctx, sx + 7, sy + 14 + bob, 18, 16, 4);

  // Decoración inca dorada
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy + 22 + bob);
  ctx.lineTo(sx + 22, sy + 22 + bob);
  ctx.stroke();
  ctx.fillStyle = '#D91023';
  ctx.fillRect(sx + 14, sy + 19 + bob, 4, 4);

  // Cabeza máscara
  ctx.fillStyle = '#6B5F52';
  ctx.beginPath();
  ctx.arc(cx, sy + 10 + bob, 9, 0, Math.PI * 2);
  ctx.fill();

  // Ojos
  const eyeColor = state === 'CHASE' || state === 'ATTACK'
    ? `rgba(255,40,40,${0.8 + pulse * 0.2})`
    : state === 'INVESTIGATE'
      ? '#FFD060'
      : '#D91023';
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(sx + 12, sy + 9 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(sx + 20, sy + 9 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (pulse > 0) {
    ctx.fillStyle = `rgba(255,50,50,${pulse * 0.25})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brazos
  const armSwing = Math.sin(animFrame * 0.15) * 3;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx + 3, sy + 16 + bob + armSwing, 5, 10);
  ctx.fillRect(sx + 24, sy + 16 + bob - armSwing, 5, 10);

  ctx.restore();
}

export function drawTreasureSprite(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  floatY: number,
  glowPhase: number,
  sparkPhase: number
): void {
  const y = sy + floatY;

  drawSoftShadow(ctx, sx, y + 12, 8, 3);

  // Chispas doradas
  for (let i = 0; i < 4; i++) {
    const a = sparkPhase + (Math.PI * 2 * i) / 4;
    const dist = 16 + Math.sin(sparkPhase * 2 + i) * 4;
    const px = sx + Math.cos(a) * dist;
    const py = y + Math.sin(a) * dist * 0.6;
    ctx.fillStyle = `rgba(255,220,100,${0.4 + Math.sin(sparkPhase + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gema principal
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(sx, y - 12);
  ctx.lineTo(sx + 11, y);
  ctx.lineTo(sx, y + 12);
  ctx.lineTo(sx - 11, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F5E06A';
  ctx.beginPath();
  ctx.moveTo(sx, y - 7);
  ctx.lineTo(sx + 5, y);
  ctx.lineTo(sx, y + 7);
  ctx.lineTo(sx - 5, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#D91023';
  ctx.beginPath();
  ctx.arc(sx, y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Destello
  const glint = 0.5 + Math.sin(glowPhase * 2) * 0.5;
  ctx.fillStyle = `rgba(255,255,255,${glint * 0.6})`;
  ctx.beginPath();
  ctx.arc(sx - 3, y - 4, 2, 0, Math.PI * 2);
  ctx.fill();
}
