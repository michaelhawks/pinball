// Circle-vs-line-segment collision helpers. Walls and flipper capsules both
// reduce to "closest point on a segment", so a single primitive covers both.

export function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = abx * abx + aby * aby;
  let t = abLenSq > 0 ? ((px - ax) * abx + (py - ay) * aby) / abLenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return { x: ax + abx * t, y: ay + aby * t, t };
}

// Static wall: reflects the ball's velocity about the wall normal with
// restitution, and pushes the ball out of penetration.
// Returns true if a collision was resolved.
export function resolveCircleSegment(ball, ax, ay, bx, by, restitution) {
  const cp = closestPointOnSegment(ball.x, ball.y, ax, ay, bx, by);
  const dx = ball.x - cp.x;
  const dy = ball.y - cp.y;
  let dist = Math.hypot(dx, dy);

  if (dist >= ball.radius) return false;

  let nx, ny;
  if (dist > 1e-6) {
    nx = dx / dist;
    ny = dy / dist;
  } else {
    // Ball center exactly on the segment (rare) -- push out along the
    // segment's perpendicular instead of dividing by zero.
    const segLen = Math.hypot(bx - ax, by - ay) || 1;
    nx = -(by - ay) / segLen;
    ny = (bx - ax) / segLen;
    dist = 0;
  }

  const penetration = ball.radius - dist;
  ball.x += nx * penetration;
  ball.y += ny * penetration;

  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + restitution) * vn * nx;
    ball.vy -= (1 + restitution) * vn * ny;
  }
  return true;
}

// Moving capsule (flipper): reflects the ball's velocity RELATIVE to the
// capsule surface velocity at the contact point (surface velocity comes from
// the flipper's angular velocity), then adds a scaled kick from that surface
// velocity back in. This is what makes an actively-swinging flipper launch
// the ball hard, rather than just bouncing it off a static shape.
export function resolveCircleCapsule(ball, flipper, restitution, kickTransfer) {
  const cp = closestPointOnSegment(ball.x, ball.y, flipper.pivotX, flipper.pivotY, flipper.tipX, flipper.tipY);
  const dx = ball.x - cp.x;
  const dy = ball.y - cp.y;
  const combinedRadius = ball.radius + flipper.radius;
  let dist = Math.hypot(dx, dy);

  if (dist >= combinedRadius) return false;

  let nx, ny;
  if (dist > 1e-6) {
    nx = dx / dist;
    ny = dy / dist;
  } else {
    nx = 0;
    ny = -1;
    dist = 0;
  }

  const penetration = combinedRadius - dist;
  ball.x += nx * penetration;
  ball.y += ny * penetration;

  const surface = flipper.surfaceVelocityAt(cp.x, cp.y);
  const relVx = ball.vx - surface.vx;
  const relVy = ball.vy - surface.vy;
  const vn = relVx * nx + relVy * ny;

  if (vn < 0) {
    const reflectedVx = relVx - (1 + restitution) * vn * nx;
    const reflectedVy = relVy - (1 + restitution) * vn * ny;
    ball.vx = reflectedVx + surface.vx * kickTransfer;
    ball.vy = reflectedVy + surface.vy * kickTransfer;
  }
  return true;
}

// Static circular bumper: push-out + reflect, same shape as a wall. Returns
// the contact normal when a collision was resolved, or null. Deliberately
// does NOT apply the radial "pop" kick itself -- that's gated by the
// bumper's own hit-cooldown (see entities/Bumper.js), so a ball resting
// against a bumper across several substeps still gets pushed out cleanly
// every substep (no sticking/tunneling) without being re-launched on every
// one of those substeps (which would happen if the kick lived here).
export function resolveCircleBumper(ball, bumperX, bumperY, bumperRadius, restitution) {
  const dx = ball.x - bumperX;
  const dy = ball.y - bumperY;
  const combinedRadius = ball.radius + bumperRadius;
  let dist = Math.hypot(dx, dy);

  if (dist >= combinedRadius) return null;

  let nx, ny;
  if (dist > 1e-6) {
    nx = dx / dist;
    ny = dy / dist;
  } else {
    nx = 0;
    ny = -1;
    dist = 0;
  }

  const penetration = combinedRadius - dist;
  ball.x += nx * penetration;
  ball.y += ny * penetration;

  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + restitution) * vn * nx;
    ball.vy -= (1 + restitution) * vn * ny;
  }
  return { nx, ny };
}
