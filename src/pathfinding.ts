/** Pathfinding A* sobre grilla de tiles */

export interface GridPoint {
  col: number;
  row: number;
}

interface AStarNode {
  col: number;
  row: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function heuristic(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function nodeKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function findPath(
  walkable: boolean[][],
  cols: number,
  rows: number,
  start: GridPoint,
  end: GridPoint
): GridPoint[] {
  if (
    start.col < 0 || start.col >= cols || start.row < 0 || start.row >= rows ||
    end.col < 0 || end.col >= cols || end.row < 0 || end.row >= rows
  ) {
    return [];
  }

  if (!walkable[start.row]?.[start.col] || !walkable[end.row]?.[end.col]) {
    return [];
  }

  if (start.col === end.col && start.row === end.row) {
    return [start];
  }

  const open: AStarNode[] = [];
  const closed = new Set<string>();

  const startNode: AStarNode = {
    col: start.col,
    row: start.row,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };
  open.push(startNode);

  const dirs = [
    { dc: 0, dr: -1, cost: 1 },
    { dc: 1, dr: 0, cost: 1 },
    { dc: 0, dr: 1, cost: 1 },
    { dc: -1, dr: 0, cost: 1 },
  ];

  let iterations = 0;
  const maxIter = cols * rows * 2;

  while (open.length > 0 && iterations < maxIter) {
    iterations++;
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const ck = nodeKey(current.col, current.row);

    if (closed.has(ck)) continue;
    closed.add(ck);

    if (current.col === end.col && current.row === end.row) {
      const path: GridPoint[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ col: node.col, row: node.row });
        node = node.parent;
      }
      return path;
    }

    for (const { dc, dr, cost } of dirs) {
      const nc = current.col + dc;
      const nr = current.row + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      if (!walkable[nr][nc]) continue;

      const nk = nodeKey(nc, nr);
      if (closed.has(nk)) continue;

      const g = current.g + cost;
      const h = heuristic({ col: nc, row: nr }, end);
      const f = g + h;

      const existing = open.find((n) => n.col === nc && n.row === nr);
      if (existing && g >= existing.g) continue;

      const newNode: AStarNode = {
        col: nc,
        row: nr,
        g,
        h,
        f,
        parent: current,
      };

      if (existing) {
        existing.g = g;
        existing.f = f;
        existing.parent = current;
      } else {
        open.push(newNode);
      }
    }
  }

  return [];
}
