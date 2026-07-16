// Debug overlay -- ball velocity, flipper angles, FPS, plunger charge.
// Toggle with the backtick key. Separate from the player-facing HUD (score/
// ball number, see HUD.js) -- toggling one never affects the other. Off by
// default now that there's a real HUD; still the fastest way to tune
// physics constants when it's on.
export class DebugOverlay {
  constructor(ctx) {
    this.ctx = ctx;
    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
  }

  draw({ fps, ball, leftFlipper, rightFlipper, plunger }) {
    if (!this.visible) return;
    const { ctx } = this;

    const lines = [
      `FPS: ${fps.toFixed(0)}`,
      `ball pos: (${ball.x.toFixed(0)}, ${ball.y.toFixed(0)})`,
      `ball vel: (${ball.vx.toFixed(0)}, ${ball.vy.toFixed(0)})  speed: ${ball.speed.toFixed(0)}`,
      `flipper L: ${((leftFlipper.angle * 180) / Math.PI).toFixed(0)}deg  omega: ${leftFlipper.angularVelocity.toFixed(1)}`,
      `flipper R: ${((rightFlipper.angle * 180) / Math.PI).toFixed(0)}deg  omega: ${rightFlipper.angularVelocity.toFixed(1)}`,
      `plunger: ${(plunger.pullback * 100).toFixed(0)}%`,
      `[ \` toggle debug | Z/ShiftL, M/ShiftR flip | Space plunge ]`,
    ];

    ctx.save();
    ctx.font = '11px monospace';
    const pad = 6;
    const lineH = 14;
    const boxW = 230;
    const boxH = lines.length * lineH + pad * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(6, 6, boxW, boxH);
    ctx.fillStyle = '#8effc1';
    lines.forEach((line, i) => {
      ctx.fillText(line, 6 + pad, 6 + pad + lineH * (i + 1) - 4);
    });
    ctx.restore();
  }
}
