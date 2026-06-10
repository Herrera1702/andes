/** Colisiones avanzadas con hitboxes y deslizamiento */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Hitbox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export function getHitboxRect(x: number, y: number, hitbox: Hitbox): Rect {
  return {
    x: x + hitbox.offsetX,
    y: y + hitbox.offsetY,
    width: hitbox.width,
    height: hitbox.height,
  };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function circleRectOverlap(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect
): boolean {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Movimiento con deslizamiento por ejes separados */
export function moveWithSlide(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dtSec: number,
  mapWidth: number,
  mapHeight: number,
  hitbox: Hitbox,
  isBlocked: (x: number, y: number, hb: Hitbox) => boolean
): { x: number; y: number } {
  let nx = x + vx * dtSec;
  let ny = y + vy * dtSec;

  const hbW = hitbox.width;
  const hbH = hitbox.height;

  nx = clamp(nx, -hitbox.offsetX, mapWidth - hitbox.offsetX - hbW);
  ny = clamp(ny, -hitbox.offsetY, mapHeight - hitbox.offsetY - hbH);

  if (!isBlocked(nx, y, hitbox)) {
    x = nx;
  }
  if (!isBlocked(x, ny, hitbox)) {
    y = ny;
  }

  return { x, y };
}
