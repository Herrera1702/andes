/** Gestión de pantallas e interfaz de usuario */

import { getHighScores } from './storage.js';

export type ScreenId =
  | 'menu'
  | 'instructions'
  | 'ranking'
  | 'game'
  | 'victory'
  | 'pause';

function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Elemento requerido no encontrado: #${id}`);
  }
  return el as T;
}

export class UIManager {
  private screens: Map<ScreenId, HTMLElement>;
  private currentScreen: ScreenId = 'menu';
  private readonly rankingTable: HTMLElement;
  private screenChangeListener?: (id: ScreenId) => void;

  readonly elements = {
    hudScore: requireElement<HTMLElement>('hud-score'),
    hudTime: requireElement<HTMLElement>('hud-time'),
    hudTreasures: requireElement<HTMLElement>('hud-treasures'),
    victoryScore: requireElement<HTMLElement>('victory-score'),
    victoryTime: requireElement<HTMLElement>('victory-time'),
    rankingBody: requireElement<HTMLElement>('ranking-body'),
    rankingEmpty: requireElement<HTMLElement>('ranking-empty'),
    playerName: requireElement<HTMLInputElement>('player-name'),
    joystick: requireElement<HTMLElement>('joystick'),
    canvas: requireElement<HTMLCanvasElement>('game-canvas'),
  };

  constructor() {
    this.rankingTable = requireElement<HTMLElement>('ranking-table');
    this.screens = new Map([
      ['menu', requireElement<HTMLElement>('screen-menu')],
      ['instructions', requireElement<HTMLElement>('screen-instructions')],
      ['ranking', requireElement<HTMLElement>('screen-ranking')],
      ['game', requireElement<HTMLElement>('screen-game')],
      ['victory', requireElement<HTMLElement>('screen-victory')],
      ['pause', requireElement<HTMLElement>('screen-pause')],
    ]);
  }

  setScreenChangeListener(listener: (id: ScreenId) => void): void {
    this.screenChangeListener = listener;
  }

  showScreen(id: ScreenId): void {
    const prev = this.currentScreen;
    this.screens.get('pause')!.classList.remove('active');

    this.screens.forEach((el, key) => {
      if (key === 'pause') return;
      const isActive = key === id;
      el.classList.toggle('active', isActive);
      if (isActive && prev !== id) {
        el.classList.remove('screen-enter');
        void el.offsetWidth;
        el.classList.add('screen-enter');
      }
    });
    this.currentScreen = id;
    this.screenChangeListener?.(id);

    if (id === 'ranking') {
      this.renderRanking();
    }

    if (id === 'game') {
      this.toggleJoystick(this.shouldShowJoystick());
    }

    if (id === 'menu') {
      const playBtn = document.getElementById('btn-play');
      if (playBtn) {
        requestAnimationFrame(() => playBtn.focus());
      }
    }
  }

  pulseHudValue(id: 'hud-score' | 'hud-treasures'): void {
    const el = document.getElementById(id);
    el?.classList.remove('hud-pulse');
    void el?.offsetWidth;
    el?.classList.add('hud-pulse');
  }

  showPauseOverlay(): void {
    this.screens.get('game')!.classList.add('active');
    this.screens.get('pause')!.classList.add('active');
    this.currentScreen = 'pause';
  }

  hidePauseOverlay(): void {
    const pauseEl = this.screens.get('pause')!;
    if (!pauseEl.classList.contains('active')) return;
    pauseEl.classList.remove('active');
    if (this.currentScreen === 'pause') {
      this.currentScreen = 'game';
    }
  }

  getCurrentScreen(): ScreenId {
    return this.currentScreen;
  }

  updateHUD(score: number, time: string, treasures: number, total: number): void {
    this.elements.hudScore.textContent = String(score);
    this.elements.hudTime.textContent = time;
    this.elements.hudTreasures.textContent = `${treasures} / ${total}`;
  }

  updateLevel(level: number, name: string): void {
    const el = document.getElementById('hud-level');
    if (el) el.textContent = String(level);
    const label = document.getElementById('hud-level-name');
    if (label) label.textContent = name;
  }

  showVictory(score: number, time: string): void {
    this.elements.victoryScore.textContent = String(score);
    this.elements.victoryTime.textContent = time;
    this.elements.playerName.value = '';
    this.showScreen('victory');
    setTimeout(() => this.elements.playerName.focus(), 300);
  }

  renderRanking(): void {
    const scores = getHighScores();
    const tbody = this.elements.rankingBody;
    const empty = this.elements.rankingEmpty;

    tbody.innerHTML = '';

    if (scores.length === 0) {
      this.rankingTable.hidden = true;
      empty.hidden = false;
      return;
    }

    this.rankingTable.hidden = false;
    empty.hidden = true;
    scores.forEach((entry, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${this.escapeHtml(entry.name)}</td>
        <td>${entry.score}</td>
        <td>${this.escapeHtml(entry.date)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  toggleJoystick(visible: boolean): void {
    this.elements.joystick.classList.toggle('visible', visible);
  }

  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  shouldShowJoystick(): boolean {
    return this.isTouchDevice() || window.matchMedia('(max-width: 768px)').matches;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/** Joystick táctil virtual */
export class VirtualJoystick {
  private base: HTMLElement;
  private stick: HTMLElement;
  private active = false;
  private dx = 0;
  private dy = 0;
  private readonly maxRadius: number;

  constructor(baseId: string, stickId: string) {
    const base = document.getElementById(baseId);
    const stick = document.getElementById(stickId);
    if (!base || !stick) {
      throw new Error('Joystick: elementos base o stick no encontrados');
    }
    this.base = base;
    this.stick = stick;
    this.maxRadius = 35;
    this.bindEvents();
  }

  get direction(): { dx: number; dy: number } {
    return { dx: this.dx, dy: this.dy };
  }

  private bindEvents(): void {
    const onStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      this.active = true;
      this.moveStick(e);
    };

    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!this.active) return;
      e.preventDefault();
      this.moveStick(e);
    };

    const onEnd = () => {
      this.active = false;
      this.dx = 0;
      this.dy = 0;
      this.stick.style.transform = 'translate(-50%, -50%)';
    };

    this.base.addEventListener('touchstart', onStart, { passive: false });
    this.base.addEventListener('touchmove', onMove, { passive: false });
    this.base.addEventListener('touchend', onEnd);
    this.base.addEventListener('touchcancel', onEnd);
    this.base.addEventListener('mousedown', onStart);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
  }

  private moveStick(e: TouchEvent | MouseEvent): void {
    const rect = this.base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    let offsetX = clientX - centerX;
    let offsetY = clientY - centerY;
    const dist = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

    if (dist > this.maxRadius) {
      offsetX = (offsetX / dist) * this.maxRadius;
      offsetY = (offsetY / dist) * this.maxRadius;
    }

    this.dx = offsetX / this.maxRadius;
    this.dy = offsetY / this.maxRadius;

    this.stick.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }
}
