// Hand-authored pixel art, rendered with canvas -- no image assets. Each
// sprite is a small grid of palette-index characters (built procedurally by
// its own module in src/assets/sprites/), rasterized once to an offscreen
// canvas at 1 grid-cell = 1px, then blitted scaled up with image smoothing
// disabled so it stays crisp and blocky at game-canvas size.

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rasterizeFrame(rows, paletteMap) {
  const height = rows.length;
  const width = rows[0].length;
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const octx = off.getContext('2d');
  const img = octx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const color = paletteMap[row[x]];
      const idx = (y * width + x) * 4;
      if (!color) continue; // leave alpha 0 -- transparent
      const [r, g, b] = hexToRgb(color);
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return off;
}

export class PixelSprite {
  // framesRows: array of frames, each frame an array of equal-length strings.
  constructor(framesRows, paletteMap) {
    this.cols = framesRows[0][0].length;
    this.rows = framesRows[0].length;
    this._frames = framesRows.map((rows) => rasterizeFrame(rows, paletteMap));
  }

  get frameCount() {
    return this._frames.length;
  }

  // Draws frame `index`, centered at (x, y), scaled to (width, height),
  // optionally rotated (radians) about its own center.
  draw(ctx, index, x, y, width, height, rotation = 0) {
    const frame = this._frames[Math.max(0, Math.min(this._frames.length - 1, index))];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.drawImage(frame, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
}
