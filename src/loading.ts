/** Pantalla de carga con barra de progreso animada */

export class LoadingScreen {
  private screen: HTMLElement;
  private progressBar: HTMLElement;
  private loadingText: HTMLElement;
  private onParticlesStart?: () => void;

  constructor(onParticlesStart?: () => void) {
    const screen = document.getElementById('screen-loading');
    const progressBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    if (!screen || !progressBar || !loadingText) {
      throw new Error('Elementos de pantalla de carga no encontrados');
    }
    this.screen = screen;
    this.progressBar = progressBar;
    this.loadingText = loadingText;
    this.onParticlesStart = onParticlesStart;
  }

  async run(): Promise<void> {
    this.onParticlesStart?.();

    const steps = [
      { progress: 20, text: 'Despertando las ruinas...' },
      { progress: 45, text: 'Trazando senderos incas...' },
      { progress: 70, text: 'Iluminando el tesoro...' },
      { progress: 90, text: 'Preparando aventura...' },
      { progress: 100, text: '¡Listo!' },
    ];

    await this.waitForFonts();

    for (const step of steps) {
      this.progressBar.style.width = `${step.progress}%`;
      this.loadingText.textContent = step.text;
      await this.delay(step.progress === 100 ? 400 : 280 + Math.random() * 200);
    }

    this.screen.classList.add('loading-done');
    await this.delay(500);
    this.screen.classList.remove('active', 'loading-done');
  }

  private waitForFonts(): Promise<void> {
    if (document.fonts?.ready) {
      return document.fonts.ready.then(() => undefined);
    }
    return this.delay(300);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
