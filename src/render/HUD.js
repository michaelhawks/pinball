import { PALETTE } from '../assets/sprites/palette.js';
import { CANVAS_WIDTH } from '../game/TableConfig.js';

// Player-facing HUD: score, ball number, and a brief chain/combo indicator.
// Deliberately separate from DebugOverlay.js -- independent visibility,
// independent draw call, so toggling the debug view never hides this.
export class HUD {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw({ score, ballNumber, combo, comboActive }) {
    const { ctx } = this;
    const barH = 34;

    ctx.save();

    const grad = ctx.createLinearGradient(0, 0, 0, barH);
    grad.addColorStop(0, 'rgba(10,8,14,0.85)');
    grad.addColorStop(1, 'rgba(10,8,14,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, barH);
    ctx.strokeStyle = 'rgba(140,90,40,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(CANVAS_WIDTH, barH);
    ctx.stroke();

    ctx.textBaseline = 'middle';

    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = PALETTE.scoreGlow;
    ctx.shadowColor = PALETTE.scoreGlow;
    ctx.shadowBlur = 6;
    ctx.fillText(String(score).padStart(6, '0'), 10, barH / 2 + 1);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = PALETTE.hudRed;
    ctx.textAlign = 'right';
    ctx.fillText(`BALL ${ballNumber}`, CANVAS_WIDTH - 10, barH / 2 + 1);

    if (comboActive && combo > 0) {
      ctx.fillStyle = PALETTE.bruiseLight;
      ctx.textAlign = 'center';
      ctx.fillText(`CHAIN x${combo}`, CANVAS_WIDTH / 2, barH / 2 + 1);
    }

    ctx.restore();
  }
}
