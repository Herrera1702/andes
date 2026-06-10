/** Configuración de dificultad progresiva */

export interface DifficultyConfig {
  level: number;
  name: string;
  enemyCount: number;
  enemySpeed: number;
  chaseSpeed: number;
  visionRadius: number;
  visionAngle: number;
  attackRange: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    level: 1,
    name: 'Explorador Novato',
    enemyCount: 2,
    enemySpeed: 70,
    chaseSpeed: 110,
    visionRadius: 200,
    visionAngle: 75,
    attackRange: 28,
  },
  {
    level: 2,
    name: 'Montañista Experto',
    enemyCount: 4,
    enemySpeed: 85,
    chaseSpeed: 135,
    visionRadius: 250,
    visionAngle: 90,
    attackRange: 32,
  },
  {
    level: 3,
    name: 'Guardián de los Andes',
    enemyCount: 6,
    enemySpeed: 100,
    chaseSpeed: 160,
    visionRadius: 300,
    visionAngle: 105,
    attackRange: 36,
  },
];

const LEVEL_KEY = 'andes_difficulty';

export function getSavedLevel(): number {
  const v = parseInt(localStorage.getItem(LEVEL_KEY) ?? '1', 10);
  return v >= 1 && v <= 3 ? v : 1;
}

export function saveLevel(level: number): void {
  localStorage.setItem(LEVEL_KEY, String(clampLevel(level)));
}

function clampLevel(level: number): number {
  return Math.max(1, Math.min(3, level));
}

export function getDifficulty(level: number): DifficultyConfig {
  return DIFFICULTIES[clampLevel(level) - 1];
}
