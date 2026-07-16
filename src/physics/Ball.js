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

  // Defense in depth against pathological velocity spikes (e.g. several
  // bumper kicks landing in quick succession) -- caps how far a single
  // substep can need to travel, which bounds the collision loop's worst case
  // regardless of how the speed got that high.
  clampSpeed(maxSpeed) {
    const speed = this.speed;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }
}
