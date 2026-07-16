import { PALETTE } from './palette.js';
import { outlineFrame } from '../../render/PixelSprite.js';

// Taller/narrower than a brick on purpose, with a pronounced rounded arch
// top and a small ground mound at the base -- proportions and silhouette
// are what read as "tombstone" rather than shading detail, and the traced
// outline (see outlineFrame) keeps that silhouette crisp against the
// background instead of blending into it.
const TOMBSTONE_WIDTH = 16;
const TOMBSTONE_HEIGHT = 20;

function tombstoneBlankGrid() {
  return Array.from({ length: TOMBSTONE_HEIGHT }, () => new Array(TOMBSTONE_WIDTH).fill('.'));
}

function buildTombstone({ cracked }) {
  const grid = tombstoneBlankGrid();
  const left = 4;
  const right = 11;
  const shoulderY = 7; // arch ends, straight sides begin
  const baseY = 16; // straight sides end, ground mound begins
  const archCx = 7.5;
  const archCy = 7;
  const archRx = 3.5;
  const archRy = 5;

  for (let y = 2; y <= baseY; y++) {
    for (let x = left; x <= right; x++) {
      if (y < shoulderY) {
        const nx = (x - archCx) / archRx;
        const ny = (y - archCy) / archRy;
        if (nx * nx + ny * ny > 1) continue;
      }
      const edge = x === left || x === right || y === baseY;
      const fleck = (x * 3 + y * 5) % 11 === 0;
      grid[y][x] = edge ? 'd' : fleck ? 'l' : 's';
    }
  }

  // Ground mound, wider than the stone itself, grounding it in the plot.
  for (let x = left - 2; x <= right + 2; x++) {
    if (x >= 0 && x < TOMBSTONE_WIDTH) grid[baseY + 1][x] = 'e';
  }
  for (let x = left - 1; x <= right + 1; x++) {
    grid[baseY + 2][x] = 'e';
  }

  // Engraved cross, larger and more centered than a plain notch.
  for (let y = 9; y <= 13; y++) grid[y][7] = 'g';
  for (let x = 6; x <= 8; x++) grid[10][x] = 'g';

  if (cracked) {
    for (const [x, y] of [[6, 3], [7, 5], [6, 7], [8, 9], [7, 11], [8, 13], [6, 15]]) {
      grid[y][x] = 'k';
    }
    // A chunk chipped clean off the shoulder reads as damage more clearly
    // than a same-color crack line alone.
    grid[3][10] = '.';
    grid[4][10] = '.';
    grid[3][9] = 'c';
  }

  return outlineFrame(
    grid.map((row) => row.join('')),
    'o'
  );
}

export const TOMBSTONE_PALETTE = {
  '.': null,
  s: PALETTE.stoneMid,
  l: PALETTE.stoneLight,
  d: PALETTE.stoneDark,
  g: PALETTE.engrave,
  k: PALETTE.groundDark,
  c: PALETTE.stoneLight,
  e: PALETTE.groundMid,
  o: PALETTE.groundDark,
};

// [idle, hit]
export const TOMBSTONE_FRAMES = [buildTombstone({ cracked: false }), buildTombstone({ cracked: true })];
