import { BUMPER_HIT_COOLDOWN, BUMPER_HIT_ANIM_DURATION } from '../physics/constants.js';

// A pop bumper: static circle, ball bounces off it, and on a fresh (non-
// cooldown) contact gets an extra radial "pop" kick plus points. Each type
// (zombie head / tombstone / barricade) supplies its own restitution, kick
// strength, and point value so the three feel distinct rather than sharing
// one bounce constant.
export class Bumper {
  constructor({ x, y, radius, type, points, restitution, kickStrength }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type;
    this.points = points;
    this.restitution = restitution;
    this.kickStrength = kickStrength;

    this.cooldown = 0;
    this.hitTimer = 0;
  }

  get isOnCooldown() {
    return this.cooldown > 0;
  }

  get isAnimatingHit() {
    return this.hitTimer > 0;
  }

  // 0 (just hit) -> 1 (fully back to idle), for animation/render use.
  get hitAnimProgress() {
    if (BUMPER_HIT_ANIM_DURATION <= 0) return 1;
    return 1 - Math.max(0, this.hitTimer) / BUMPER_HIT_ANIM_DURATION;
  }

  triggerHit() {
    this.cooldown = BUMPER_HIT_COOLDOWN;
    this.hitTimer = BUMPER_HIT_ANIM_DURATION;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.hitTimer > 0) this.hitTimer = Math.max(0, this.hitTimer - dt);
  }
}
