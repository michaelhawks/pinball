import { CANVAS_WIDTH, CANVAS_HEIGHT, WALL_CHAINS, DRAIN_Y } from '../game/TableConfig.js';

// Everything is canvas-drawn vector shapes -- deliberately no sprite/asset
// dependency for Milestone 1 (see project brief).
export class TableRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.stars = this._makeStars(90);
  }

  _makeStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        r: Math.random() * 1.4 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
    return stars;
  }

  drawBackground(t) {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, '#050415');
    grad.addColorStop(1, '#0c0a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const s of this.stars) {
      const flicker = 0.55 + 0.45 * Math.sin(t * 2 + s.twinkle);
      ctx.globalAlpha = flicker;
      ctx.fillStyle = '#cfe0ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawWalls() {
    const { ctx } = this;
    ctx.strokeStyle = '#6fd7ff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#3fb8ff';
    ctx.shadowBlur = 8;

    for (const chain of WALL_CHAINS) {
      ctx.beginPath();
      ctx.moveTo(chain[0].x, chain[0].y);
      for (let i = 1; i < chain.length; i++) ctx.lineTo(chain[i].x, chain[i].y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Drain line, purely visual reference.
    ctx.strokeStyle = 'rgba(255,80,80,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, DRAIN_Y);
    ctx.lineTo(CANVAS_WIDTH, DRAIN_Y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawFlipper(flipper) {
    const { ctx } = this;
    ctx.strokeStyle = '#ff5fd1';
    ctx.fillStyle = '#ff8ce0';
    ctx.shadowColor = '#ff5fd1';
    ctx.shadowBlur = 10;
    ctx.lineWidth = flipper.radius * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(flipper.pivotX, flipper.pivotY);
    ctx.lineTo(flipper.tipX, flipper.tipY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#3a2b4a';
    ctx.beginPath();
    ctx.arc(flipper.pivotX, flipper.pivotY, 4, 0, Math.PI * 2);
    ctx.fill();
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
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#9fb3c8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlunger(plunger) {
    const { ctx } = this;
    ctx.strokeStyle = '#ffd85f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(plunger.laneCenterX, plunger.maxPullY + 15);
    ctx.lineTo(plunger.laneCenterX, plunger.tipY);
    ctx.stroke();
  }
}
