/** Gestión de puntuaciones en LocalStorage */

export interface HighScore {
  name: string;
  score: number;
  date: string;
}

const STORAGE_KEY = 'andes_highscores';
const MAX_SCORES = 10;

function isHighScore(value: unknown): value is HighScore {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.name === 'string' &&
    typeof entry.score === 'number' &&
    typeof entry.date === 'string'
  );
}

export function getHighScores(): HighScore[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isHighScore)
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export function saveHighScore(name: string, score: number): void {
  const scores = getHighScores();
  const entry: HighScore = {
    name: name.trim() || 'Explorador',
    score,
    date: new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, MAX_SCORES)));
}

export function clearHighScores(): void {
  localStorage.removeItem(STORAGE_KEY);
}
