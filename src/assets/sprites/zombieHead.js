import { PALETTE } from './palette.js';
import { outlineFrame } from '../../render/PixelSprite.js';

// Procedurally-built pixel art: per-row half-width function gives a
// distinct cranium-wide / jaw-tapered head silhouette (not a plain circle),
// plus hand-placed features (ears, brow shading, eyes, wound, mouth) and a
// traced dark outline so it reads as a head at a glance instead of a blob.
const ZOMBIE_GRID_SIZE = 18;
const CX = 8.5;

function zombieBlankGrid() {
  return Array.from({ length: ZOMBIE_GRID_SIZE }, () => new Array(ZOMBIE_GRID_SIZE).fill('.'));
}

// Wide cranium, tapering jaw -- this shape alone is what reads as "head"
// rather than "ball".
function halfWidthAt(y) {
  if (y <= 1) return 3.2;
  if (y <= 3) return 5.5;
  if (y <= 10) return 7.2; // brow/cheek, near-full width
  const t = (y - 10) / (16 - 10);
  return 7.2 - t * 4.4; // taper to the chin
}

function buildHead({ mouthOpen }) {
  const grid = zombieBlankGrid();

  for (let y = 1; y <= 16; y++) {
    const hw = halfWidthAt(y);
    const left = Math.round(CX - hw);
    const right = Math.round(CX + hw);
    for (let x = left; x <= right; x++) {
      if (x < 0 || x >= ZOMBIE_GRID_SIZE) continue;
      const dx = x - CX;
      const shade = dx - (y - 8) * 0.5; // light upper-left, dark lower-right
      grid[y][x] = shade < -3.5 ? 'l' : shade > 3.5 ? 'd' : 'g';
    }
  }

  // Ears: small notches just outside the brow/cheek line.
  for (const y of [8, 9]) {
    const hw = Math.round(halfWidthAt(y));
    grid[y][Math.round(CX - hw - 1)] = 'g';
    grid[y][Math.round(CX + hw + 1)] = 'g';
  }

  // Brow ridge shading.
  for (let x = 3; x <= 14; x++) {
    if (grid[5][x] && grid[5][x] !== '.') grid[5][x] = 'd';
  }

  // Wound/stitch mark on the forehead.
  for (const [x, y] of [[6, 3], [7, 4], [8, 3]]) grid[y][x] = 'h';

  // Eyes: deep sockets, off-center pupils for an unfocused zombie stare.
  grid[7][5] = 'd';
  grid[7][6] = 'w';
  grid[7][7] = 'p';
  grid[7][10] = 'd';
  grid[7][11] = 'w';
  grid[7][12] = 'p';

  // Mouth: jagged closed line at rest, gaping with teeth on the hit frame.
  if (mouthOpen) {
    for (let x = 5; x <= 12; x++) {
      grid[12][x] = 'm';
      grid[13][x] = 'm';
      grid[14][x] = 'm';
    }
    grid[13][6] = 't';
    grid[13][8] = 't';
    grid[13][10] = 't';
  } else {
    for (const [x, y] of [[5, 12], [6, 13], [7, 12], [8, 13], [9, 12], [10, 13], [11, 12], [12, 12]]) {
      grid[y][x] = 'm';
    }
  }

  return outlineFrame(
    grid.map((row) => row.join('')),
    'o'
  );
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
  o: PALETTE.groundDark,
};

// [idle, hit]
export const ZOMBIE_HEAD_FRAMES = [buildHead({ mouthOpen: false }), buildHead({ mouthOpen: true })];
