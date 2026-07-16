import { PALETTE } from './palette.js';

const BARRICADE_GRID_SIZE = 16;

function barricadeBlankGrid() {
  return Array.from({ length: BARRICADE_GRID_SIZE }, () => new Array(BARRICADE_GRID_SIZE).fill('.'));
}

function buildBarricade({ splintered }) {
  const grid = barricadeBlankGrid();
  const left = 1;
  const right = 14;

  // Two stacked planks with a seam between them.
  const plankBands = [
    { top: 1, bottom: 6 },
    { top: 9, bottom: 14 },
  ];
  for (const { top, bottom } of plankBands) {
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const edge = y === top || y === bottom;
        const grain = (x + y * 2) % 7 === 0;
        grid[y][x] = edge ? 'd' : grain ? 'l' : 'w';
      }
    }
  }

  // Diagonal cross-brace nailed across both planks.
  for (let i = 0; i < 14; i++) {
    const x = 1 + i;
    const y = 1 + Math.round(i * (13 / 13));
    if (y <= 14 && grid[y] && grid[y][x] !== undefined) grid[y][x] = 'n';
  }
  // Nail heads at the brace ends.
  grid[2][2] = 'a';
  grid[13][13] = 'a';

  if (splintered) {
    // Jagged crack through both planks plus a few splinter shards poking
    // past the silhouette's edge.
    for (const [x, y] of [[7, 2], [8, 4], [6, 6], [7, 9], [8, 11], [6, 13]]) {
      grid[y][x] = 'k';
    }
    for (const [x, y] of [[0, 3], [15, 5], [0, 11], [15, 12]]) {
      grid[y][x] = 's';
    }
  }

  return grid.map((row) => row.join(''));
}

export const BARRICADE_PALETTE = {
  '.': null,
  w: PALETTE.woodMid,
  l: PALETTE.woodLight,
  d: PALETTE.woodDark,
  n: PALETTE.metalDark,
  a: PALETTE.metalLight,
  k: PALETTE.groundDark,
  s: PALETTE.splinter,
};

// [idle, hit]
export const BARRICADE_FRAMES = [buildBarricade({ splintered: false }), buildBarricade({ splintered: true })];
