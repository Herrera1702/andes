/** Sistema de partículas con object pooling */

export type ParticleKind = 'dust' | 'leaf' | 'spark' | 'victory';

interface PooledParticle {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
}

const POOL_SIZE = 120;

export class ParticleSystem {
  private pool: PooledParticle[] = [];
  private time = 0;

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this.createInactive());
    }
  }

  private createInactive(): PooledParticle {
    return {
      active: false,
      kind: 'dust',
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, size: 2,
      rotation: 0, rotSpeed: 0, color: '#fff',
    };
  }

  private acquire(): PooledParticle | null {
    const p = this.pool.find((x) => !x.active);
    if (!p) return null;
    p.active = true;
    return p;
  }

  spawnDust(x: number, y: number): void {
    const p = this.acquire();
    if (!p) return;
    p.kind = 'dust';
    p.x = x + (Math.random() - 0.5) * 8;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 30;
    p.vy = -10 - Math.random() * 20;
    p.life = 0;
    p.maxLife = 0.3 + Math.random() * 0.3;
    p.size = 2 + Math.random() * 2;
    p.rotation = 0;
    p.rotSpeed = 0;
    p.color = 'rgba(180,150,100,0.7)';
  }

  spawnLeaf(viewW: number, _viewH: number, cameraX: number, cameraY: number): void {
    if (Math.random() > 0.02) return;
    const p = this.acquire();
    if (!p) return;
    p.kind = 'leaf';
    p.x = cameraX + Math.random() * viewW;
    p.y = cameraY - 10;
    p.vx = 15 + Math.random() * 25;
    p.vy = 20 + Math.random() * 30;
    p.life = 0;
    p.maxLife = 3 + Math.random() * 2;
    p.size = 4 + Math.random() * 3;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 4;
    p.color = Math.random() > 0.5 ? '#5A9E4A' : '#7CB868';
  }

  spawnSpark(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const p = this.acquire();
      if (!p) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      p.kind = 'spark';
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0;
      p.maxLife = 0.4 + Math.random() * 0.3;
      p.size = 2 + Math.random() * 2;
      p.rotation = 0;
      p.rotSpeed = 0;
      p.color = '#FFD060';
    }
  }

  spawnVictoryBurst(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const p = this.acquire();
      if (!p) return;
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 60 + Math.random() * 120;
      p.kind = 'victory';
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 40;
      p.life = 0;
      p.maxLife = 1 + Math.random() * 0.8;
      p.size = 3 + Math.random() * 4;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 6;
      p.color = Math.random() > 0.3 ? '#FFD060' : '#D4AF37';
    }
  }

  update(dt: number, viewW: number, viewH: number, cameraX: number, cameraY: number): void {
    const sec = dt / 1000;
    this.time += sec;

    this.spawnLeaf(viewW, viewH, cameraX, cameraY);

    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += sec;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.x += p.vx * sec;
      p.y += p.vy * sec;
      p.rotation += p.rotSpeed * sec;

      if (p.kind === 'dust') {
        p.vy += 40 * sec;
        p.vx *= 0.95;
      } else if (p.kind === 'leaf') {
        p.vx += Math.sin(this.time * 2 + p.y * 0.01) * 20 * sec;
        p.vy += 8 * sec;
      } else if (p.kind === 'spark' || p.kind === 'victory') {
        p.vy += 80 * sec;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = 1 - p.life / p.maxLife;
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.kind === 'leaf') {
        ctx.translate(sx, sy);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'spark' || p.kind === 'victory') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }
  }

  get hasActive(): boolean {
    return this.pool.some((p) => p.active);
  }
}
