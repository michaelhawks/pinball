import { GRAVITY, BALL_RADIUS, BALL_LINEAR_DAMPING } from './constants.js';

export class Ball {
  constructor(x, y, radius = BALL_RADIUS) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    // While resting on the plunger tip, gravity/damping are suppressed and
    // the plunger drives position directly.
    this.heldByPlunger = false;
  }

  integrate(dt) {
    if (this.heldByPlunger) return;

    this.vy += GRAVITY * dt;

    const damping = Math.max(0, 1 - BALL_LINEAR_DAMPING * dt);
    this.vx *= damping;
    this.vy *= damping;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }
}
