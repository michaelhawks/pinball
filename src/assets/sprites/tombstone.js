import { PALETTE } from './palette.js';

const TOMBSTONE_GRID_SIZE = 16;

function tombstoneBlankGrid() {
  return Array.from({ length: TOMBSTONE_GRID_SIZE }, () => new Array(TOMBSTONE_GRID_SIZE).fill('.'));
}

function buildTombstone({ cracked }) {
  const grid = tombstoneBlankGrid();
  const left = 3;
  const right = 12;
  const top = 2;
  const bottom = 15;
  const archCx = 7.5;
  const archCy = 5;
  const archRx = 4.5;
  const archRy = 3;

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (y < archCy) {
        const nx = (x - archCx) / archRx;
        const ny = (y - archCy) / archRy;
        if (nx * nx + ny * ny > 1) continue;
      }
      const edge = x === left || x === right || y === bottom;
      const fleck = (x * 3 + y * 5) % 11 === 0;
      grid[y][x] = edge ? 'd' : fleck ? 'l' : 's';
    }
  }

  // Engraved marker (simple cross).
  for (let y = 6; y <= 9; y++) grid[y][7] = 'e';
  for (let x = 6; x <= 8; x++) grid[7][x] = 'e';

  if (cracked) {
    for (const [x, y] of [[7, 3], [6, 5], [8, 7], [6, 9], [7, 11], [8, 13]]) {
      grid[y][x] = 'k';
    }
    // A couple of chipped-off highlight bits either side of the crack.
    grid[6][9] = 'c';
    grid[10][5] = 'c';
  }

  return grid.map((row) => row.join(''));
}

export const TOMBSTONE_PALETTE = {
  '.': null,
  s: PALETTE.stoneMid,
  l: PALETTE.stoneLight,
  d: PALETTE.stoneDark,
  e: PALETTE.engrave,
  k: PALETTE.groundDark,
  c: PALETTE.stoneLight,
};

// [idle, hit]
export const TOMBSTONE_FRAMES = [buildTombstone({ cracked: false }), buildTombstone({ cracked: true })];
