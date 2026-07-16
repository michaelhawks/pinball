import { CANVAS_WIDTH, CANVAS_HEIGHT, WALL_CHAINS, DRAIN_Y, BUMPERS } from '../game/TableConfig.js';
import { PALETTE } from '../assets/sprites/palette.js';
import { PixelSprite } from './PixelSprite.js';
import { ZOMBIE_HEAD_FRAMES, ZOMBIE_HEAD_PALETTE } from '../assets/sprites/zombieHead.js';
import { TOMBSTONE_FRAMES, TOMBSTONE_PALETTE } from '../assets/sprites/tombstone.js';
import { BARRICADE_FRAMES, BARRICADE_PALETTE } from '../assets/sprites/barricade.js';

const BUMPER_SPRITES = {
  zombieHead: () => new PixelSprite(ZOMBIE_HEAD_FRAMES, ZOMBIE_HEAD_PALETTE),
  tombstone: () => new PixelSprite(TOMBSTONE_FRAMES, TOMBSTONE_PALETTE),
  barricade: () => new PixelSprite(BARRICADE_FRAMES, BARRICADE_PALETTE),
};

// Zombie Invasion table: overrun graveyard / barricaded town square at
// night. Background/environment pieces (fog, trees, moon, ground) are
// vector-drawn silhouettes with a restricted flat palette -- true pixel-grid
// sprites (see PixelSprite.js) are reserved for the animated foreground
// characters (bumpers), where per-pixel detail actually reads at their
// small on-screen size.
export class TableRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.fogPuffs = this._makeFog(20);
    this.groundMist = this._makeGroundMist(5);
    this.graves = this._makeBackgroundGraves(20);
    this.trees = this._makeTrees(8);

    this.bumperSprites = {
      zombieHead: BUMPER_SPRITES.zombieHead(),
      tombstone: BUMPER_SPRITES.tombstone(),
      barricade: BUMPER_SPRITES.barricade(),
    };
  }

  _makeFog(count) {
    const puffs = [];
    for (let i = 0; i < count; i++) {
      puffs.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 100 + Math.random() * (CANVAS_HEIGHT - 160),
        r: 40 + Math.random() * 70,
        speed: 4 + Math.random() * 8,
        alpha: 0.05 + Math.random() * 0.07,
        dir: Math.random() < 0.5 ? -1 : 1,
      });
    }
    return puffs;
  }

  // Low, wide drifting mist -- distinct from the floating fog puffs above:
  // flatter, hugs a handful of fixed heights, reads as ground-hugging haze
  // rather than airborne cloud.
  _makeGroundMist(count) {
    const bands = [];
    for (let i = 0; i < count; i++) {
      bands.push({
        y: 220 + (i / count) * 420 + (Math.random() - 0.5) * 30,
        rx: 90 + Math.random() * 60,
        ry: 22 + Math.random() * 10,
        speed: 3 + Math.random() * 5,
        alpha: 0.05 + Math.random() * 0.05,
        dir: Math.random() < 0.5 ? -1 : 1,
        phase: Math.random() * CANVAS_WIDTH,
      });
    }
    return bands;
  }

  _drawGroundMistBand(band, t) {
    const { ctx } = this;
    const span = CANVAS_WIDTH + 240;
    const drift = ((t * band.speed * band.dir) % span + span) % span;
    const x = ((band.phase + drift) % span) - 120;
    ctx.save();
    ctx.translate(x, band.y);
    ctx.scale(band.rx / band.ry, 1);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, band.ry);
    grad.addColorStop(0, `rgba(150,158,150,${band.alpha})`);
    grad.addColorStop(1, 'rgba(150,158,150,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, band.ry, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Rejects candidates that would land on top of a bumper or inside the
  // shooter lane, so decoration never competes visually with gameplay
  // elements -- otherwise a denser background reads as clutter instead of
  // atmosphere.
  _keepsClearOfPlayfield(x, y, margin = 26) {
    if (x > 338) return false; // shooter lane corridor
    for (const b of BUMPERS) {
      if (Math.hypot(x - b.x, y - b.y) < b.radius + margin) return false;
    }
    return true;
  }

  _makeBackgroundGraves(count) {
    const graves = [];
    for (let i = 0; i < count; i++) {
      let x;
      let y;
      let attempts = 0;
      do {
        x = 26 + Math.random() * (CANVAS_WIDTH - 52);
        y = 95 + Math.random() * (CANVAS_HEIGHT - 210);
        attempts++;
      } while (!this._keepsClearOfPlayfield(x, y) && attempts < 20);

      graves.push({
        x,
        y,
        w: 11 + Math.random() * 9,
        h: 15 + Math.random() * 11,
        lean: (Math.random() - 0.5) * 0.32,
        alpha: 0.55 + Math.random() * 0.3,
      });
    }
    return graves;
  }

  _makeTrees(count) {
    // Spread down both side margins (outside the shooter lane on the
    // right), not just clustered at the top -- and kept clear of the
    // moon's corner so silhouettes never overlap its halo.
    const trees = [];
    const bands = [
      { xMin: 24, xMax: 48 }, // left margin
      { xMin: 356, xMax: 379 }, // right margin, glimpsed behind the fence
    ];
    for (let i = 0; i < count; i++) {
      const band = bands[i % 2];
      const y = 90 + (i / count) * 460 + (Math.random() - 0.5) * 40;
      const isTopRight = band.xMin > 300 && y < 110;
      trees.push({
        x: band.xMin + Math.random() * (band.xMax - band.xMin),
        y: isTopRight ? y + 60 : y,
        scale: 0.75 + Math.random() * 0.55,
        seed: Math.random() * 1000,
      });
    }
    return trees;
  }

  drawBackground(t) {
    const { ctx } = this;

    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.55, PALETTE.skyBottom);
    sky.addColorStop(1, PALETTE.groundDark);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this._drawMoon(368, 48);

    for (const tree of this.trees) this._drawDeadTree(tree);
    for (const g of this.graves) this._drawBackgroundGrave(g);

    // Ground haze at the very bottom of the yard.
    const groundGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 120, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, 'rgba(20,18,26,0)');
    groundGrad.addColorStop(1, PALETTE.groundDark);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - 120, CANVAS_WIDTH, 120);

    for (const band of this.groundMist) this._drawGroundMistBand(band, t);
    for (const p of this.fogPuffs) this._drawFogPuff(p, t);
  }

  _drawMoon(x, y) {
    const { ctx } = this;
    const haloGrad = ctx.createRadialGradient(x, y, 6, x, y, 48);
    haloGrad.addColorStop(0, 'rgba(205,214,160,0.35)');
    haloGrad.addColorStop(1, 'rgba(205,214,160,0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y + 8, 3, 0, Math.PI * 2);
    ctx.arc(x + 8, y - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawDeadTree({ x, y, scale, seed }) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = PALETTE.groundDark;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const branch = (bx, by, angle, len, depth) => {
      if (depth <= 0 || len < 6) return;
      const ex = bx + Math.cos(angle) * len;
      const ey = by + Math.sin(angle) * len;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const spread = 0.55 + (Math.sin(seed + depth) + 1) * 0.08;
      branch(ex, ey, angle - spread, len * 0.68, depth - 1);
      branch(ex, ey, angle + spread, len * 0.68, depth - 1);
    };

    branch(0, 40, -Math.PI / 2, 34, 4);
    ctx.restore();
  }

  _drawBackgroundGrave({ x, y, w, h, lean, alpha }) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.fillStyle = `rgba(20,18,24,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h);
    ctx.lineTo(-w / 2, -h * 0.2);
    ctx.quadraticCurveTo(-w / 2, -h, 0, -h);
    ctx.quadraticCurveTo(w / 2, -h, w / 2, -h * 0.2);
    ctx.lineTo(w / 2, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawFogPuff(p, t) {
    const { ctx } = this;
    const drift = ((t * p.speed * p.dir) % (CANVAS_WIDTH + 200)) - 100;
    const x = ((p.x + drift) % (CANVAS_WIDTH + 200) + (CANVAS_WIDTH + 200)) % (CANVAS_WIDTH + 200) - 100;
    const grad = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
    grad.addColorStop(0, `rgba(140,150,150,${p.alpha})`);
    grad.addColorStop(1, 'rgba(140,150,150,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Walls: wrought-iron cemetery fence / barricade, same collision
  // geometry as WALL_CHAINS -- purely a skin over Milestone 1's polylines.
  drawWalls() {
    const { ctx } = this;

    for (const chain of WALL_CHAINS) {
      // Two parallel rust-flecked rails.
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = PALETTE.metalDark;
      ctx.lineWidth = 5;
      this._strokeChain(chain);
      ctx.strokeStyle = PALETTE.metalMid;
      ctx.lineWidth = 2;
      this._strokeChain(chain);

      this._drawFencePosts(chain);
    }

    // Drain line, faint reference only.
    ctx.strokeStyle = 'rgba(160,40,40,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, DRAIN_Y);
    ctx.lineTo(CANVAS_WIDTH, DRAIN_Y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _strokeChain(chain) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(chain[0].x, chain[0].y);
    for (let i = 1; i < chain.length; i++) ctx.lineTo(chain[i].x, chain[i].y);
    ctx.stroke();
  }

  _drawFencePosts(chain) {
    const { ctx } = this;
    const SPACING = 22;
    let carry = 0;

    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen < 1e-3) continue;
      const ux = dx / segLen;
      const uy = dy / segLen;

      let dist = SPACING - carry;
      while (dist < segLen) {
        const px = a.x + ux * dist;
        const py = a.y + uy * dist;
        this._drawFencePost(px, py);
        dist += SPACING;
      }
      carry = segLen - (dist - SPACING);
    }
  }

  _drawFencePost(x, y) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = PALETTE.metalDark;
    ctx.fillRect(-1.5, -7, 3, 14);
    ctx.fillStyle = PALETTE.rust;
    ctx.beginPath();
    ctx.moveTo(-2.5, -7);
    ctx.lineTo(0, -12);
    ctx.lineTo(2.5, -7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- Bumpers: each type reacts differently on hit -- zombie heads swap
  // to a chomp frame, tombstones/barricades additionally get a positional
  // shake (barricade's is faster/sharper, a "shudder" vs the tombstone's
  // slower "shake"), matching each material's feel.
  drawBumpers(bumpers) {
    const { ctx } = this;
    for (const bumper of bumpers) {
      const sprite = this.bumperSprites[bumper.type];
      if (!sprite) continue;

      const size = bumper.radius * 2.6;
      let ox = 0;
      let oy = 0;

      if (bumper.isAnimatingHit) {
        const t = bumper.hitAnimProgress; // 0 at moment of hit -> 1 back to idle
        const decay = 1 - t;
        if (bumper.type === 'tombstone') {
          ox = Math.sin(t * Math.PI * 4) * 2.5 * decay;
        } else if (bumper.type === 'barricade') {
          ox = Math.sin(t * Math.PI * 9) * 3.5 * decay;
          oy = Math.sin(t * Math.PI * 7 + 1) * 2 * decay;
        }

        ctx.save();
        ctx.globalAlpha = 0.35 * decay;
        const glow = ctx.createRadialGradient(bumper.x, bumper.y, 0, bumper.x, bumper.y, bumper.radius * 1.8);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const frame = bumper.isAnimatingHit ? 1 : 0;
      sprite.draw(ctx, frame, bumper.x + ox, bumper.y + oy, size, size);
    }
  }

  // ---- Flipper: reskinned as a survivor's plank/bat. Geometry (pivot,
  // length, angle) comes entirely from the Flipper physics object -- this
  // draws over the exact same verified Milestone 1 capsule, nothing about
  // the shape or rotation math changes here.
  drawFlipper(flipper) {
    const { ctx } = this;
    const len = flipper.length;
    const w = flipper.radius * 2;

    ctx.save();
    ctx.translate(flipper.pivotX, flipper.pivotY);
    ctx.rotate(flipper.angle);

    const grad = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    grad.addColorStop(0, PALETTE.woodLight);
    grad.addColorStop(0.5, PALETTE.woodMid);
    grad.addColorStop(1, PALETTE.woodDark);

    ctx.fillStyle = grad;
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 1.5;
    this._roundedPlankPath(ctx, len, w);
    ctx.fill();
    ctx.stroke();

    // Wood grain flecks.
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    for (let gx = 10; gx < len - 8; gx += 9) {
      ctx.beginPath();
      ctx.moveTo(gx, -w / 2 + 2);
      ctx.lineTo(gx + 3, w / 2 - 2);
      ctx.stroke();
    }

    // Nail-studded metal cap at the striking tip.
    ctx.fillStyle = PALETTE.metalLight;
    ctx.beginPath();
    ctx.arc(len - w * 0.55, 0, w * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.metalDark;
    ctx.beginPath();
    ctx.arc(len - w * 0.55, 0, w * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Pivot bolt, drawn in world space.
    ctx.fillStyle = PALETTE.metalDark;
    ctx.beginPath();
    ctx.arc(flipper.pivotX, flipper.pivotY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  _roundedPlankPath(ctx, len, w) {
    const r = w / 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(0, -r, len, w, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(r, -r);
    ctx.lineTo(len - r, -r);
    ctx.arc(len - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(r, r);
    ctx.arc(r, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
  }

  drawBall(ball) {
    const { ctx } = this;
    const grad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.35,
      ball.y - ball.radius * 0.35,
      ball.radius * 0.1,
      ball.x,
      ball.y,
      ball.radius
    );
    grad.addColorStop(0, '#f4f6f2');
    grad.addColorStop(0.6, '#a9b3ad');
    grad.addColorStop(1, '#5d675f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Plunger: reskinned as a wooden stake on a lever.
  drawPlunger(plunger) {
    const { ctx } = this;
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(plunger.laneCenterX, plunger.maxPullY + 15);
    ctx.lineTo(plunger.laneCenterX, plunger.tipY);
    ctx.stroke();

    ctx.strokeStyle = PALETTE.woodLight;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(plunger.laneCenterX, plunger.maxPullY + 15);
    ctx.lineTo(plunger.laneCenterX, plunger.tipY);
    ctx.stroke();

    // Sharpened stake tip.
    ctx.fillStyle = PALETTE.woodLight;
    ctx.beginPath();
    ctx.moveTo(plunger.laneCenterX - 5, plunger.tipY);
    ctx.lineTo(plunger.laneCenterX + 5, plunger.tipY);
    ctx.lineTo(plunger.laneCenterX, plunger.tipY - 10);
    ctx.closePath();
    ctx.fill();
  }
}
