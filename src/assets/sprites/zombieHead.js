import { PALETTE } from './palette.js';

// Procedurally-built pixel art: a radial "skull" silhouette with hand-placed
// feature pixels (eyes, wound patches, mouth). Building it with a formula
// rather than typing 16 rows of ASCII by hand keeps the shape symmetric and
// easy to tune, while every design decision (proportions, palette, features)
// is original to this project.
const ZOMBIE_GRID_SIZE = 16;

function zombieBlankGrid() {
  return Array.from({ length: ZOMBIE_GRID_SIZE }, () => new Array(ZOMBIE_GRID_SIZE).fill('.'));
}

function buildHead({ mouthOpen }) {
  const grid = zombieBlankGrid();
  const cx = 7.5;
  const cy = 7.5;
  const r = 6.5;

  for (let y = 0; y < ZOMBIE_GRID_SIZE; y++) {
    for (let x = 0; x < ZOMBIE_GRID_SIZE; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (Math.hypot(dx, dy) > r) continue;
      const shade = dx - dy; // light upper-left, dark lower-right
      grid[y][x] = shade < -3 ? 'l' : shade > 3 ? 'd' : 'g';
    }
  }

  // Wound/hair patches across the scalp.
  for (const [x, y] of [[5, 1], [6, 1], [9, 2], [10, 2], [6, 2]]) grid[y][x] = 'h';

  // Eye sockets + pupils.
  grid[5][4] = 'd';
  grid[5][10] = 'd';
  grid[6][4] = 'w';
  grid[6][5] = 'p';
  grid[6][9] = 'p';
  grid[6][10] = 'w';

  // Mouth: closed line at rest, gaping with teeth on the hit/chomp frame.
  if (mouthOpen) {
    for (let x = 5; x <= 10; x++) {
      grid[10][x] = 'm';
      grid[11][x] = 'm';
    }
    grid[11][6] = 't';
    grid[11][8] = 't';
  } else {
    for (let x = 6; x <= 9; x++) grid[10][x] = 'm';
  }

  return grid.map((row) => row.join(''));
}

export const ZOMBIE_HEAD_PALETTE = {
  '.': null,
  g: PALETTE.skinMid,
  l: PALETTE.skinLight,
  d: PALETTE.skinDark,
  h: PALETTE.wound,
  w: PALETTE.eyeWhite,
  p: PALETTE.eyePupil,
  m: PALETTE.mouth,
  t: PALETTE.teeth,
};

// [idle, hit]
export const ZOMBIE_HEAD_FRAMES = [buildHead({ mouthOpen: false }), buildHead({ mouthOpen: true })];
