// Score, ball number, and a simple combo/chain bonus. Deliberately minimal
// for this pass: a short timer window rather than a full combo system (tier
// multipliers, decaying meters, etc. can come later if wanted).
const COMBO_WINDOW_SECONDS = 0.8;
const COMBO_BONUS_PER_STEP = 25;
const MILESTONE_STEP = 1000;

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.ballNumber = 1;
    this.comboCount = 0;
    this._lastHitAt = -Infinity;
    this._milestonesCrossed = 0;
  }

  // `now` is the game clock in seconds (main.js's `elapsed`), not wall time,
  // so the combo window is measured in simulated time consistently with the
  // rest of the physics.
  registerHit(basePoints, now) {
    const withinWindow = now - this._lastHitAt <= COMBO_WINDOW_SECONDS;
    this.comboCount = withinWindow ? this.comboCount + 1 : 0;
    this._lastHitAt = now;

    const comboBonus = this.comboCount * COMBO_BONUS_PER_STEP;
    const awarded = basePoints + comboBonus;
    this.score += awarded;

    return { awarded, combo: this.comboCount, crossedMilestone: this._checkMilestone() };
  }

  _checkMilestone() {
    const currentMilestone = Math.floor(this.score / MILESTONE_STEP);
    if (currentMilestone > this._milestonesCrossed) {
      this._milestonesCrossed = currentMilestone;
      return true;
    }
    return false;
  }

  // For HUD display: whether the chain is still "live" right now, vs. just
  // holding a stale count from a chain that already timed out.
  isComboActive(now) {
    return this.comboCount > 0 && now - this._lastHitAt <= COMBO_WINDOW_SECONDS;
  }

  nextBall() {
    this.ballNumber += 1;
    this.comboCount = 0;
    this._lastHitAt = -Infinity;
  }
}
