/** Audio procedural: música ambiental andina y efectos */

const SOUND_KEY = 'andes_sound_enabled';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private ambientPlaying = false;

  constructor() {
    this.enabled = localStorage.getItem(SOUND_KEY) === 'true';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem(SOUND_KEY, String(this.enabled));
    if (this.enabled) {
      this.playClick();
    } else {
      this.stopAmbient();
    }
    return this.enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  startAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.ambientPlaying) return;
    this.ambientPlaying = true;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.04;
    this.ambientGain.connect(ctx.destination);

    const notes = [261.63, 329.63, 392.0, 493.88];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.15 / notes.length;
      osc.connect(g);
      g.connect(this.ambientGain!);
      osc.start();
      this.ambientOscs.push(osc);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.02;
      const lfoG = ctx.createGain();
      lfoG.gain.value = freq * 0.02;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      lfo.start();
      this.ambientOscs.push(lfo);
    });
  }

  stopAmbient(): void {
    this.ambientOscs.forEach((o) => {
      try { o.stop(); } catch { /* ya detenido */ }
    });
    this.ambientOscs = [];
    this.ambientGain = null;
    this.ambientPlaying = false;
  }

  playClick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 520, 0.06, 'sine', 0.08);
  }

  playMenuHover(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 680, 0.04, 'sine', 0.04);
  }

  playTreasure(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    [523, 659, 784, 988].forEach((freq, i) => {
      setTimeout(() => this.tone(ctx!, freq, 0.15, 'triangle', 0.1), i * 80);
    });
  }

  playEnemyHit(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 180, 0.15, 'sawtooth', 0.07);
    setTimeout(() => this.tone(ctx, 120, 0.2, 'sawtooth', 0.05), 80);
  }

  playAlert(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 440, 0.1, 'square', 0.06);
    setTimeout(() => this.tone(ctx, 550, 0.12, 'square', 0.07), 100);
    setTimeout(() => this.tone(ctx, 660, 0.15, 'square', 0.05), 200);
  }

  playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [392, 494, 587, 784, 988, 1175];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(ctx!, freq, 0.25, 'triangle', 0.09), i * 130);
    });
  }

  playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    [330, 294, 262, 220].forEach((freq, i) => {
      setTimeout(() => this.tone(ctx!, freq, 0.3, 'sawtooth', 0.06), i * 150);
    });
  }

  playTransition(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 440, 0.08, 'sine', 0.05);
  }

  private tone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
