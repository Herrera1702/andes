/** Sistema de iluminación: sombras, glow y viñeta */

export function drawSoftShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number
): void {
  ctx.fillStyle = 'rgba(20,12,8,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  intensity: number
): void {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, `rgba(${r},${g},${b},${intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${intensity * 0.4})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTreasureGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: number
): void {
  const pulse = 0.5 + Math.sin(phase) * 0.35;
  drawGlow(ctx, x, y, 28 + pulse * 8, 255, 215, 80, 0.55 * pulse);
  drawGlow(ctx, x, y, 14, 255, 240, 160, 0.35 * pulse);
}

export function applyVignette(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  strength = 0.22
): void {
  const vignette = ctx.createRadialGradient(
    viewW / 2, viewH / 2, viewW * 0.25,
    viewW / 2, viewH / 2, viewW * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(10,6,4,${strength})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewW, viewH);
}

export function applyWarmLight(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number
): void {
  const light = ctx.createRadialGradient(
    viewW * 0.7, viewH * 0.15, 0,
    viewW * 0.5, viewH * 0.3, viewW * 0.8
  );
  light.addColorStop(0, 'rgba(255,220,140,0.08)');
  light.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, viewW, viewH);
}
