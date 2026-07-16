import {
  PLUNGER_MIN_LAUNCH_SPEED,
  PLUNGER_MAX_LAUNCH_SPEED,
  PLUNGER_CHARGE_TIME,
} from '../physics/constants.js';

// Shooter-lane plunger. While the ball rests in the lane, the plunger owns
// its position directly (ball.heldByPlunger = true) rather than being pushed
// by normal physics -- simpler and more reliable than simulating spring
// contact forces frame-to-frame. Charging moves the visual tip down; release
// fires the ball with a speed proportional to how long it was held.
export class Plunger {
  constructor({ laneCenterX, restY, maxPullY }) {
    this.laneCenterX = laneCenterX;
    this.restY = restY;
    this.maxPullY = maxPullY;
    this.pullback = 0; // 0..1
    this.charging = false;
    this.heldBall = null;
  }

  get tipY() {
    return this.restY + this.pullback * (this.maxPullY - this.restY);
  }

  attachBall(ball) {
    ball.heldByPlunger = true;
    ball.x = this.laneCenterX;
    ball.vx = 0;
    ball.vy = 0;
    this.heldBall = ball;
    this.pullback = 0;
    this.charging = false;
  }

  update(dt, pulling) {
    if (!this.heldBall) return;

    if (pulling) {
      this.charging = true;
      this.pullback = Math.min(1, this.pullback + dt / PLUNGER_CHARGE_TIME);
      this.heldBall.y = this.tipY - this.heldBall.radius;
    } else if (this.charging) {
      this.fire();
    } else {
      this.heldBall.y = this.tipY - this.heldBall.radius;
    }
  }

  fire() {
    const ball = this.heldBall;
    if (!ball) return;

    const speed = PLUNGER_MIN_LAUNCH_SPEED + this.pullback * (PLUNGER_MAX_LAUNCH_SPEED - PLUNGER_MIN_LAUNCH_SPEED);
    ball.heldByPlunger = false;
    ball.vy = -speed;
    ball.vx = 0;

    this.heldBall = null;
    this.pullback = 0;
    this.charging = false;
  }
}
