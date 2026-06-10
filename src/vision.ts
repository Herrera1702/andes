/** Detección de visión con cono y raycasting */

import { GameMap } from './map.js';

const DEG_TO_RAD = Math.PI / 180;

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function angleBetween(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

export function isInVisionCone(
  fromX: number,
  fromY: number,
  facing: number,
  toX: number,
  toY: number,
  radius: number,
  angleDeg: number
): boolean {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distSq = dx * dx + dy * dy;
  if (distSq > radius * radius) return false;

  const angleToTarget = Math.atan2(dy, dx);
  let diff = normalizeAngle(angleToTarget - facing);
  const halfCone = (angleDeg / 2) * DEG_TO_RAD;
  return Math.abs(diff) <= halfCone;
}

/** Raycasting simple: comprueba línea de visión sin obstáculos */
export function hasLineOfSight(
  map: GameMap,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return true;

  const steps = Math.ceil(dist / 12);
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let i = 1; i < steps; i++) {
    const px = x1 + stepX * i;
    const py = y1 + stepY * i;
    if (map.isPointBlocked(px, py)) return false;
  }
  return true;
}

export function canSeePlayer(
  map: GameMap,
  guardX: number,
  guardY: number,
  facing: number,
  playerX: number,
  playerY: number,
  visionRadius: number,
  visionAngle: number
): boolean {
  if (!isInVisionCone(guardX, guardY, facing, playerX, playerY, visionRadius, visionAngle)) {
    return false;
  }
  return hasLineOfSight(map, guardX, guardY, playerX, playerY);
}
