/** Mapa top-down con arte indie y colisiones por hitbox */

import { Hitbox, getHitboxRect, rectsOverlap } from './collision.js';

export const TILE_SIZE = 48;
export const MAP_COLS = 30;
export const MAP_ROWS = 22;

export enum TileType {
  Grass = 0,
  Path = 1,
  Stone = 2,
  Tree = 3,
  Ruin = 4,
  Temple = 5,
  Rock = 6,
}

const BLOCKING = new Set([
  TileType.Tree,
  TileType.Ruin,
  TileType.Temple,
  TileType.Rock,
  TileType.Stone,
]);

/** Hitboxes por tipo de tile (relativas al tile) */
const TILE_HITBOXES: Partial<Record<TileType, Hitbox>> = {
  [TileType.Tree]: { width: 14, height: 12, offsetX: 17, offsetY: 30 },
  [TileType.Rock]: { width: 22, height: 14, offsetX: 13, offsetY: 26 },
  [TileType.Stone]: { width: 14, height: 10, offsetX: 17, offsetY: 28 },
  [TileType.Ruin]: { width: 44, height: 36, offsetX: 2, offsetY: 10 },
  [TileType.Temple]: { width: 44, height: 38, offsetX: 2, offsetY: 8 },
};

const PALETTE = {
  grass1: '#6DBF5C',
  grass2: '#5AAF4A',
  grass3: '#4A9E3E',
  path: '#D4B896',
  pathDark: '#B89B72',
  stone: '#A89888',
  treeTrunk: '#6B4423',
  treeLeaf1: '#3D9B4A',
  treeLeaf2: '#5CBF60',
  treeLeaf3: '#7AD878',
  ruin: '#9A8878',
  ruinDark: '#6B5D50',
  temple: '#8A7A68',
  templeGold: '#E8C84A',
  rock: '#A09080',
  rockDark: '#706050',
};

export class GameMap {
  readonly width: number;
  readonly height: number;
  private tiles: TileType[][];
  private animTime = 0;
  private readonly walkableGrid: boolean[][];

  constructor() {
    this.width = MAP_COLS * TILE_SIZE;
    this.height = MAP_ROWS * TILE_SIZE;
    this.tiles = this.generateMap();
    this.walkableGrid = this.buildWalkableGrid();
  }

  update(dt: number): void {
    this.animTime += dt;
  }

  private generateMap(): TileType[][] {
    const map: TileType[][] = [];
    for (let row = 0; row < MAP_ROWS; row++) {
      map[row] = [];
      for (let col = 0; col < MAP_COLS; col++) {
        map[row][col] = TileType.Grass;
      }
    }

    this.carvePath(map, 1, 10, MAP_COLS - 2, 10, 2);
    this.carvePath(map, 15, 1, 15, MAP_ROWS - 2, 2);
    this.carvePath(map, 5, 5, 25, 16, 1);

    this.placeRuin(map, 3, 3, 4, 3);
    this.placeRuin(map, 22, 2, 3, 3);
    this.placeRuin(map, 2, 15, 3, 4);
    this.placeRuin(map, 24, 14, 4, 3);
    this.placeTemple(map, 12, 2, 5, 4);
    this.placeTemple(map, 20, 17, 4, 3);

    const rocks: [number, number][] = [
      [7, 7], [10, 14], [18, 8], [22, 12], [8, 18],
      [26, 6], [4, 12], [16, 18], [20, 5], [12, 14],
    ];
    for (const [c, r] of rocks) {
      if (map[r][c] === TileType.Grass) map[r][c] = TileType.Rock;
    }

    const trees: [number, number][] = [
      [1, 8], [6, 2], [9, 16], [14, 6], [17, 14],
      [23, 8], [27, 15], [11, 19], [19, 3], [28, 10],
      [3, 20], [13, 11], [25, 19], [7, 12], [21, 10],
      [5, 3], [16, 12], [24, 5],
    ];
    for (const [c, r] of trees) {
      if (map[r][c] === TileType.Grass) map[r][c] = TileType.Tree;
    }

    for (let i = 0; i < 8; i++) {
      const c = 3 + Math.floor(Math.random() * (MAP_COLS - 6));
      const r = 3 + Math.floor(Math.random() * (MAP_ROWS - 6));
      if (map[r][c] === TileType.Path) map[r][c] = TileType.Stone;
    }

    return map;
  }

  private buildWalkableGrid(): boolean[][] {
    const grid: boolean[][] = [];
    for (let row = 0; row < MAP_ROWS; row++) {
      grid[row] = [];
      for (let col = 0; col < MAP_COLS; col++) {
        grid[row][col] = !BLOCKING.has(this.tiles[row][col]);
      }
    }
    return grid;
  }

  getWalkableGrid(): boolean[][] {
    return this.walkableGrid;
  }

  private carvePath(map: TileType[][], x1: number, y1: number, x2: number, y2: number, width: number): void {
    const dx = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
    const dy = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;
    let x = x1, y = y1;
    while (x !== x2 || y !== y2) {
      for (let w = -width; w <= width; w++) {
        for (let h = -width; h <= width; h++) {
          const nc = x + w, nr = y + h;
          if (nc >= 0 && nc < MAP_COLS && nr >= 0 && nr < MAP_ROWS && map[nr][nc] === TileType.Grass) {
            map[nr][nc] = TileType.Path;
          }
        }
      }
      if (x !== x2) x += dx;
      else if (y !== y2) y += dy;
    }
    for (let w = -width; w <= width; w++) {
      for (let h = -width; h <= width; h++) {
        const nc = x2 + w, nr = y2 + h;
        if (nc >= 0 && nc < MAP_COLS && nr >= 0 && nr < MAP_ROWS && map[nr][nc] === TileType.Grass) {
          map[nr][nc] = TileType.Path;
        }
      }
    }
  }

  private placeRuin(map: TileType[][], col: number, row: number, w: number, h: number): void {
    for (let r = row; r < row + h && r < MAP_ROWS; r++) {
      for (let c = col; c < col + w && c < MAP_COLS; c++) {
        map[r][c] = TileType.Ruin;
      }
    }
  }

  private placeTemple(map: TileType[][], col: number, row: number, w: number, h: number): void {
    for (let r = row; r < row + h && r < MAP_ROWS; r++) {
      for (let c = col; c < col + w && c < MAP_COLS; c++) {
        map[r][c] = TileType.Temple;
      }
    }
  }

  private getTileHitboxWorld(col: number, row: number): { rect: ReturnType<typeof getHitboxRect> } | null {
    const tile = this.tiles[row]?.[col];
    if (!tile || !BLOCKING.has(tile)) return null;
    const hb = TILE_HITBOXES[tile];
    if (!hb) {
      const wx = col * TILE_SIZE;
      const wy = row * TILE_SIZE;
      return { rect: { x: wx, y: wy, width: TILE_SIZE, height: TILE_SIZE } };
    }
    const wx = col * TILE_SIZE;
    const wy = row * TILE_SIZE;
    return { rect: getHitboxRect(wx, wy, hb) };
  }

  isHitboxBlocked(x: number, y: number, hitbox: Hitbox): boolean {
    const entityRect = getHitboxRect(x, y, hitbox);
    const minCol = Math.max(0, Math.floor(entityRect.x / TILE_SIZE) - 1);
    const maxCol = Math.min(MAP_COLS - 1, Math.floor((entityRect.x + entityRect.width) / TILE_SIZE) + 1);
    const minRow = Math.max(0, Math.floor(entityRect.y / TILE_SIZE) - 1);
    const maxRow = Math.min(MAP_ROWS - 1, Math.floor((entityRect.y + entityRect.height) / TILE_SIZE) + 1);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const tileHb = this.getTileHitboxWorld(col, row);
        if (tileHb && rectsOverlap(entityRect, tileHb.rect)) return true;
      }
    }
    return false;
  }

  isPointBlocked(wx: number, wy: number): boolean {
    const col = Math.floor(wx / TILE_SIZE);
    const row = Math.floor(wy / TILE_SIZE);
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return true;
    return BLOCKING.has(this.tiles[row][col]);
  }

  isBlocked(x: number, y: number, width: number, height: number): boolean {
    return this.isHitboxBlocked(x, y, { width, height, offsetX: 0, offsetY: 0 });
  }

  isWalkable(col: number, row: number): boolean {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
    return this.walkableGrid[row][col];
  }

  worldToGrid(wx: number, wy: number): { col: number; row: number } {
    return {
      col: Math.floor(wx / TILE_SIZE),
      row: Math.floor(wy / TILE_SIZE),
    };
  }

  gridToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  getRandomWalkablePosition(): { x: number; y: number } {
    for (let i = 0; i < 300; i++) {
      const col = Math.floor(Math.random() * MAP_COLS);
      const row = Math.floor(Math.random() * MAP_ROWS);
      if (this.isWalkable(col, row)) {
        return this.gridToWorld(col, row);
      }
    }
    return { x: 15 * TILE_SIZE, y: 10 * TILE_SIZE };
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewW: number, viewH: number): void {
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endCol = Math.min(MAP_COLS, Math.ceil((cameraX + viewW) / TILE_SIZE) + 1);
    const endRow = Math.min(MAP_ROWS, Math.ceil((cameraY + viewH) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.tiles[row][col];
        const sx = col * TILE_SIZE - cameraX;
        const sy = row * TILE_SIZE - cameraY;
        this.drawTileBase(ctx, tile, sx, sy, col, row);
      }
    }

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.tiles[row][col];
        if (tile === TileType.Grass || tile === TileType.Path) continue;
        const sx = col * TILE_SIZE - cameraX;
        const sy = row * TILE_SIZE - cameraY;
        this.drawTileObject(ctx, tile, sx, sy, col, row);
      }
    }
  }

  private drawTileBase(ctx: CanvasRenderingContext2D, tile: TileType, sx: number, sy: number, col: number, row: number): void {
    const seed = col * 73 + row * 37;
    if (tile === TileType.Grass) {
      const variant = seed % 3;
      ctx.fillStyle = variant === 0 ? PALETTE.grass1 : variant === 1 ? PALETTE.grass2 : PALETTE.grass3;
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(45,90,40,0.25)';
      for (let i = 0; i < 4; i++) {
        const ox = (seed * (i + 1)) % 38 + 5;
        const oy = (seed * (i + 3)) % 38 + 5;
        ctx.fillRect(sx + ox, sy + oy, 2, 5);
      }
    } else if (tile === TileType.Path) {
      ctx.fillStyle = PALETTE.path;
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = PALETTE.pathDark;
      ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      if (seed % 5 === 0) {
        ctx.fillStyle = 'rgba(90,70,50,0.2)';
        ctx.beginPath();
        ctx.arc(sx + 24, sy + 24, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = PALETTE.grass2;
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    }
  }

  private drawTileObject(ctx: CanvasRenderingContext2D, tile: TileType, sx: number, sy: number, col: number, _row: number): void {
    const sway = Math.sin(this.animTime * 0.002 + col * 0.5) * 2;

    switch (tile) {
      case TileType.Tree:
        ctx.fillStyle = PALETTE.treeTrunk;
        ctx.fillRect(sx + 20, sy + 30, 8, 16);
        ctx.fillStyle = PALETTE.treeLeaf1;
        ctx.beginPath();
        ctx.arc(sx + 24 + sway * 0.3, sy + 20, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.treeLeaf2;
        ctx.beginPath();
        ctx.arc(sx + 18 + sway * 0.2, sy + 16, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.treeLeaf3;
        ctx.beginPath();
        ctx.arc(sx + 28 + sway * 0.15, sy + 18, 10, 0, Math.PI * 2);
        ctx.fill();
        break;

      case TileType.Rock:
        ctx.fillStyle = PALETTE.rockDark;
        ctx.beginPath();
        ctx.ellipse(sx + 24, sy + 32, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.rock;
        ctx.beginPath();
        ctx.ellipse(sx + 22, sy + 30, 12, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(sx + 18, sy + 27, 4, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case TileType.Stone:
        ctx.fillStyle = PALETTE.stone;
        ctx.beginPath();
        ctx.ellipse(sx + 24, sy + 30, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case TileType.Ruin:
        ctx.fillStyle = PALETTE.ruinDark;
        ctx.fillRect(sx + 4, sy + 10, 14, 34);
        ctx.fillRect(sx + 28, sy + 14, 14, 30);
        ctx.fillStyle = PALETTE.ruin;
        ctx.fillRect(sx + 16, sy + 22, 14, 22);
        ctx.strokeStyle = PALETTE.templeGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 23, sy + 22, 9, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(212,175,55,0.2)';
        ctx.fillRect(sx + 6, sy + 12, 4, 30);
        break;

      case TileType.Temple:
        ctx.fillStyle = PALETTE.ruinDark;
        ctx.fillRect(sx + 2, sy + 32, TILE_SIZE - 4, 14);
        ctx.fillStyle = PALETTE.temple;
        ctx.fillRect(sx + 6, sy + 22, TILE_SIZE - 12, 12);
        ctx.fillRect(sx + 10, sy + 12, TILE_SIZE - 20, 12);
        ctx.fillStyle = PALETTE.templeGold;
        ctx.beginPath();
        ctx.moveTo(sx + TILE_SIZE / 2, sy + 4);
        ctx.lineTo(sx + 8, sy + 16);
        ctx.lineTo(sx + TILE_SIZE - 8, sy + 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(sx + TILE_SIZE / 2, sy + 6);
        ctx.lineTo(sx + 14, sy + 14);
        ctx.lineTo(sx + TILE_SIZE / 2, sy + 14);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }
}
