import {
  FLIPPER_LENGTH,
  FLIPPER_RADIUS,
  FLIPPER_MAX_OMEGA,
  FLIPPER_RETURN_OMEGA,
} from './constants.js';

// A flipper is modeled as a capsule (line segment + radius) rotating about a
// fixed pivot. Angle is a plain math angle in radians: 0 = +x (right),
// increasing clockwise on screen since +y is down. Rest/active angles are
// authored explicitly per-flipper in TableConfig rather than derived from a
// generic "swing" constant, since the correct sweep direction depends on
// which side of the table the flipper sits on.
//
// Rotation is NOT torque-simulated. It's direct angular-velocity-capped
// kinematic control: the angle chases its target (rest or active) at a
// capped rate. This is deliberate -- see project brief: "feel > realism".
export class Flipper {
  constructor({ pivotX, pivotY, restAngle, activeAngle, length = FLIPPER_LENGTH, radius = FLIPPER_RADIUS }) {
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.restAngle = restAngle;
    this.activeAngle = activeAngle;
    this.length = length;
    this.radius = radius;

    this.angle = restAngle;
    this.angularVelocity = 0;
    this.pressed = false;
  }

  setPressed(pressed) {
    this.pressed = pressed;
  }

  update(dt) {
    const target = this.pressed ? this.activeAngle : this.restAngle;
    const totalSweep = this.activeAngle - this.restAngle;
    // Sign of travel toward "active" vs toward "rest" depends on which side
    // of the table this flipper is on (left flippers decrease angle to
    // activate, right flippers increase it) -- infer direction from the
    // configured sweep rather than hardcoding it.
    const towardActive = this.pressed;
    const speed = towardActive ? FLIPPER_MAX_OMEGA : FLIPPER_RETURN_OMEGA;
    const sweepSign = Math.sign(totalSweep) || 1;
    const dirSign = towardActive ? sweepSign : -sweepSign;

    const prevAngle = this.angle;
    let next = this.angle + dirSign * speed * dt;

    // Clamp so we never overshoot the target.
    if (dirSign > 0) {
      next = Math.min(next, target);
    } else {
      next = Math.max(next, target);
    }
    this.angle = next;
    this.angularVelocity = (this.angle - prevAngle) / dt;
  }

  get tipX() {
    return this.pivotX + Math.cos(this.angle) * this.length;
  }

  get tipY() {
    return this.pivotY + Math.sin(this.angle) * this.length;
  }

  // Velocity of the capsule surface at a given world point, assuming the
  // point is rigidly attached to the rotating flipper (v = omega x r).
  surfaceVelocityAt(px, py) {
    const rx = px - this.pivotX;
    const ry = py - this.pivotY;
    // 2D cross product of angular velocity (scalar, about z) with radius
    // vector: v = omega * (-ry, rx)
    return {
      vx: -this.angularVelocity * ry,
      vy: this.angularVelocity * rx,
    };
  }
}
