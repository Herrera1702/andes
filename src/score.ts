/** Sistema de puntuación del juego */

export const SCORE_TREASURE = 100;
export const SCORE_EXPLORATION = 10;
export const SCORE_ENEMY_HIT = -25;
export const TOTAL_TREASURES = 5;

export class ScoreManager {
  private _score = 0;
  private _treasuresCollected = 0;
  private _startTime = 0;
  private _elapsedMs = 0;
  private _running = false;
  private _explorationTimer = 0;

  get score(): number {
    return this._score;
  }

  get treasuresCollected(): number {
    return this._treasuresCollected;
  }

  get elapsedMs(): number {
    if (this._running) {
      return this._elapsedMs + (performance.now() - this._startTime);
    }
    return this._elapsedMs;
  }

  get allTreasuresFound(): boolean {
    return this._treasuresCollected >= TOTAL_TREASURES;
  }

  reset(): void {
    this._score = 0;
    this._treasuresCollected = 0;
    this._elapsedMs = 0;
    this._explorationTimer = 0;
    this._running = true;
    this._startTime = performance.now();
  }

  stop(): void {
    if (this._running) {
      this._elapsedMs += performance.now() - this._startTime;
      this._running = false;
    }
  }

  resume(): void {
    if (!this._running) {
      this._running = true;
      this._startTime = performance.now();
    }
  }

  update(dt: number): void {
    if (!this._running) return;
    this._explorationTimer += dt;
    // +10 puntos cada segundo de exploración
    if (this._explorationTimer >= 1000) {
      this._score += SCORE_EXPLORATION;
      this._explorationTimer -= 1000;
    }
  }

  collectTreasure(): void {
    this._treasuresCollected++;
    this._score += SCORE_TREASURE;
  }

  enemyHit(): void {
    this._score = Math.max(0, this._score + SCORE_ENEMY_HIT);
  }

  formatTime(): string {
    const totalSec = Math.floor(this.elapsedMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}
