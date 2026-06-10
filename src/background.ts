/** Fondo multicapa con parallax estilo indie */

export class WorldBackground {
  private fogPhase = 0;

  update(dt: number): void {
    this.fogPhase += dt * 0.0003;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
    mapW: number,
    mapH: number
  ): void {
    // Cielo vibrante
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, '#5BA3D9');
    sky.addColorStop(0.35, '#9AD4E8');
    sky.addColorStop(0.6, '#C8E8C0');
    sky.addColorStop(1, '#7CB868');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, viewH);

    // Capa 1: Montañas lejanas (parallax 0.15)
    this.drawMountainLayer(ctx, cameraX * 0.15, cameraY * 0.1, viewW, viewH, '#6B8F9E', 0.35, 0.55);
    // Capa 2: Bosques (parallax 0.35)
    this.drawForestLayer(ctx, cameraX * 0.35, cameraY * 0.2, viewW, viewH);
    // Capa 3: Ruinas lejanas (parallax 0.5)
    this.drawRuinSilhouettes(ctx, cameraX * 0.5, cameraY * 0.25, viewW, viewH, mapW, mapH);
    // Niebla animada
    this.drawFog(ctx, viewW, viewH);
  }

  private drawMountainLayer(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    _offsetY: number,
    viewW: number,
    viewH: number,
    color: string,
    baseY: number,
    height: number
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    const base = viewH * baseY;
    const h = viewH * height;
    ctx.beginPath();
    ctx.moveTo(0, base + h);
    for (let x = 0; x <= viewW + 100; x += 50) {
      const px = x - (offsetX % 100);
      const peak = base + Math.sin((x + offsetX) * 0.008) * h * 0.4 + Math.cos((x + offsetX) * 0.015) * h * 0.25;
      ctx.lineTo(px, peak);
    }
    ctx.lineTo(viewW + 100, base + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawForestLayer(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    _offsetY: number,
    viewW: number,
    viewH: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.45;
    const treeSpacing = 60;
    const start = Math.floor(offsetX / treeSpacing) * treeSpacing - treeSpacing;
    for (let x = start; x < viewW + treeSpacing; x += treeSpacing) {
      const tx = x - (offsetX % treeSpacing);
      const ty = viewH * 0.62 + Math.sin(x * 0.05) * 15;
      const scale = 0.6 + Math.sin(x * 0.03) * 0.2;
      ctx.fillStyle = '#3D7A48';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 30 * scale);
      ctx.lineTo(tx + 18 * scale, ty);
      ctx.lineTo(tx - 18 * scale, ty);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2D5A35';
      ctx.fillRect(tx - 3 * scale, ty, 6 * scale, 12 * scale);
    }
    ctx.restore();
  }

  private drawRuinSilhouettes(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    _offsetY: number,
    viewW: number,
    viewH: number,
    mapW: number,
    _mapH: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#5A4535';
    const positions = [0.15, 0.45, 0.72, 0.9];
    for (const frac of positions) {
      const wx = frac * mapW - offsetX * 0.5;
      const sx = ((wx % (mapW + 200)) + mapW + 200) % (mapW + 200) - 100;
      if (sx < -80 || sx > viewW + 80) continue;
      const by = viewH * 0.58;
      ctx.fillRect(sx, by - 40, 12, 40);
      ctx.fillRect(sx + 20, by - 55, 15, 55);
      ctx.beginPath();
      ctx.moveTo(sx + 8, by - 50);
      ctx.lineTo(sx + 28, by - 30);
      ctx.lineTo(sx - 4, by - 30);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawFog(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    const fogY = viewH * 0.5;
    const grad = ctx.createLinearGradient(0, fogY - 40, 0, fogY + 80);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, `rgba(230,240,250,${0.12 + Math.sin(this.fogPhase) * 0.04})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, fogY - 40, viewW, 120);

    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.sin(this.fogPhase * 1.3) * 0.02})`;
    for (let i = 0; i < 3; i++) {
      const fx = (Math.sin(this.fogPhase + i * 2) * 0.5 + 0.5) * viewW;
      const fy = fogY + i * 25;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 120, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
