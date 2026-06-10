/** Efectos visuales: partículas, parallax y bursts de recolección */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Partículas doradas en canvas overlay (menú, carga, victoria) */
export class ParticleOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private running = false;
  private rafId = 0;
  private readonly maxParticles: number;

  constructor(canvasId: string, maxParticles = 55) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas no encontrado: #${canvasId}`);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.canvas = canvas;
    this.ctx = ctx;
    this.maxParticles = maxParticles;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  start(): void {
    if (prefersReducedMotion() || this.running) return;
    this.running = true;
    if (this.particles.length === 0) this.seedParticles();
    this.tick();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  burst(x: number, y: number, count = 12): void {
    if (prefersReducedMotion()) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (x - rect.left) * dpr;
    const py = (y - rect.top) * dpr;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2.5;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 3,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.5,
        alpha: 0.9,
      });
    }
    if (!this.running) {
      this.running = true;
      this.tick();
    }
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth ?? window.innerWidth;
    const h = parent?.clientHeight ?? window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private seedParticles(): void {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createAmbient(w, h));
    }
  }

  private createAmbient(w: number, h: number): Particle {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.5,
      size: 1.5 + Math.random() * 2.5,
      life: Math.random(),
      maxLife: 4 + Math.random() * 6,
      alpha: 0.3 + Math.random() * 0.5,
    };
  }

  private tick = (): void => {
    if (!this.running) return;

    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    this.ctx.clearRect(0, 0, w, h);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += 0.016;

      if (p.life > p.maxLife || p.y < -10 || p.x < -10 || p.x > w + 10) {
        if (this.particles.length <= this.maxParticles + 20) {
          this.particles[i] = this.createAmbient(w, h);
          this.particles[i].y = h + 10;
        } else {
          this.particles.splice(i, 1);
        }
        continue;
      }

      const fade = 1 - p.life / p.maxLife;
      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grad.addColorStop(0, `rgba(240,208,96,${p.alpha * fade})`);
      grad.addColorStop(0.5, `rgba(212,175,55,${p.alpha * fade * 0.6})`);
      grad.addColorStop(1, 'rgba(212,175,55,0)');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}

/** Parallax suave en capas del menú */
export class ParallaxController {
  private container: HTMLElement;
  private layers: HTMLElement[];
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private running = false;
  private rafId = 0;
  private readonly maxOffset = 18;

  constructor(containerId: string, layerSelector: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Contenedor no encontrado: #${containerId}`);
    this.container = container;
    this.layers = Array.from(container.querySelectorAll(layerSelector));
    this.onMove = this.onMove.bind(this);
  }

  start(): void {
    if (prefersReducedMotion()) return;
    this.running = true;
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('touchmove', this.onMove, { passive: true });
    this.animate();
  }

  stop(): void {
    this.running = false;
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('touchmove', this.onMove);
    cancelAnimationFrame(this.rafId);
    this.layers.forEach((l) => {
      l.style.transform = '';
    });
  }

  private onMove(e: MouseEvent | TouchEvent): void {
    const rect = this.container.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else return;

    const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
    this.targetX = nx * this.maxOffset;
    this.targetY = ny * this.maxOffset;
  }

  private animate = (): void => {
    if (!this.running) return;
    this.currentX += (this.targetX - this.currentX) * 0.06;
    this.currentY += (this.targetY - this.currentY) * 0.06;

    this.layers.forEach((layer, i) => {
      const depth = (i + 1) * 0.35;
      const tx = this.currentX * depth;
      const ty = this.currentY * depth;
      layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });

    this.rafId = requestAnimationFrame(this.animate);
  };
}

/** Burst de partículas en el canvas del juego al recolectar tesoro */
export class GameParticleBurst {
  private particles: Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; size: number;
  }> = [];

  spawn(worldX: number, worldY: number): void {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
      });
    }
  }

  update(dt: number): void {
    const sec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += sec;
      p.x += p.vx * sec;
      p.y += p.vy * sec;
      p.vy += 120 * sec;
      if (p.life >= p.maxLife) this.particles.splice(i, 1);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;
      ctx.fillStyle = `rgba(212,175,55,${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(240,208,96,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  get active(): boolean {
    return this.particles.length > 0;
  }
}
