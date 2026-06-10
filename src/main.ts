/** Punto de entrada — El Tesoro Perdido de los Andes */

import { Game } from './game.js';
import { UIManager, VirtualJoystick, ScreenId } from './ui.js';
import { saveHighScore } from './storage.js';
import { SoundManager } from './audio.js';
import { getSavedLevel, saveLevel, getDifficulty } from './difficulty.js';
import { ParticleOverlay, ParallaxController } from './effects.js';
import { LoadingScreen } from './loading.js';

function bindClick(id: string, handler: () => void): void {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`Botón no encontrado: #${id}`);
    return;
  }
  el.addEventListener('click', handler);
}

function updateSoundToggle(sounds: SoundManager): void {
  const btn = document.getElementById('btn-sound-toggle');
  if (!btn) return;
  btn.textContent = sounds.isEnabled() ? '🔊' : '🔇';
  btn.setAttribute('aria-label', sounds.isEnabled() ? 'Desactivar sonido' : 'Activar sonido');
  btn.classList.toggle('sound-on', sounds.isEnabled());
}

function manageEffects(
  screen: ScreenId,
  menuParticles: ParticleOverlay,
  victoryParticles: ParticleOverlay,
  parallax: ParallaxController
): void {
  menuParticles.stop();
  victoryParticles.stop();
  parallax.stop();

  if (screen === 'menu') {
    menuParticles.start();
    parallax.start();
  } else if (screen === 'victory') {
    victoryParticles.start();
  }
}

async function init(): Promise<void> {
  const sounds = new SoundManager();
  const ui = new UIManager();
  const joystick = new VirtualJoystick('joystick-base', 'joystick-stick');

  const menuParticles = new ParticleOverlay('menu-particles');
  const victoryParticles = new ParticleOverlay('victory-particles');
  const loadingParticles = new ParticleOverlay('loading-particles', 40);
  const parallax = new ParallaxController('screen-menu', '.parallax-layer');

  const loader = new LoadingScreen(() => loadingParticles.start());
  await loader.run();
  loadingParticles.stop();

  ui.setScreenChangeListener((screen) => {
    manageEffects(screen, menuParticles, victoryParticles, parallax);
  });

  let pendingScore = 0;
  let selectedLevel = getSavedLevel();

  const updateLevelUI = (level: number): void => {
    document.querySelectorAll('.btn-level').forEach((btn) => {
      const el = btn as HTMLElement;
      el.classList.toggle('active', parseInt(el.dataset.level ?? '1', 10) === level);
    });
    const diff = getDifficulty(level);
    const desc = document.getElementById('level-desc');
    if (desc) desc.textContent = `${diff.name} — ${diff.enemyCount} guardianes`;
  };

  updateLevelUI(selectedLevel);

  document.querySelectorAll('.btn-level').forEach((btn) => {
    btn.addEventListener('click', () => {
      const level = parseInt((btn as HTMLElement).dataset.level ?? '1', 10);
      selectedLevel = level;
      saveLevel(level);
      updateLevelUI(level);
      sounds.playClick();
    });
  });

  const game = new Game(ui, joystick, (score, time) => {
    pendingScore = score;
    ui.showVictory(score, time);
  }, sounds);

  updateSoundToggle(sounds);

  // Menú principal
  bindClick('btn-play', () => {
    sounds.playTransition();
    game.start(selectedLevel);
  });
  bindClick('btn-ranking', () => {
    sounds.playClick();
    ui.showScreen('ranking');
  });
  bindClick('btn-instructions', () => {
    sounds.playClick();
    ui.showScreen('instructions');
  });
  bindClick('btn-sound-toggle', () => {
    sounds.toggle();
    updateSoundToggle(sounds);
  });

  // Sonido al hover en botones del menú
  document.querySelectorAll('.menu-buttons .btn, .panel .btn').forEach((btn) => {
    btn.addEventListener('mouseenter', () => sounds.playMenuHover());
  });

  // Instrucciones y ranking
  bindClick('btn-back-instructions', () => {
    sounds.playClick();
    ui.showScreen('menu');
  });
  bindClick('btn-back-ranking', () => {
    sounds.playClick();
    ui.showScreen('menu');
  });

  // Pausa
  bindClick('btn-pause', () => {
    sounds.playClick();
    game.pause();
  });
  bindClick('btn-resume', () => {
    sounds.playClick();
    game.resume();
  });
  bindClick('btn-quit', () => {
    sounds.playClick();
    game.stop();
    ui.showScreen('menu');
  });

  // Victoria
  const victoryForm = document.getElementById('victory-form');
  if (victoryForm) {
    victoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = ui.elements.playerName.value;
      saveHighScore(name, pendingScore);
      sounds.playClick();
      ui.showScreen('ranking');
    });
  }

  bindClick('btn-play-again', () => {
    sounds.playTransition();
    game.start(selectedLevel);
  });
  bindClick('btn-menu-victory', () => {
    sounds.playClick();
    game.stop();
    ui.showScreen('menu');
  });

  // Navegación por teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const screen = ui.getCurrentScreen();
      if (screen === 'game') {
        game.pause();
      } else if (screen === 'pause') {
        game.resume();
      } else if (screen === 'instructions' || screen === 'ranking') {
        ui.showScreen('menu');
      }
    }
  });

  window.addEventListener('resize', () => {
    const screen = ui.getCurrentScreen();
    if (screen === 'game' || screen === 'pause') {
      ui.toggleJoystick(ui.shouldShowJoystick());
    }
  });

  // Mostrar menú tras la carga
  ui.showScreen('menu');
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => console.error('Error al iniciar:', err));
});
