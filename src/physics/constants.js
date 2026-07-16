// Tunable physics constants for Milestone 1 (core feel).
// Units: pixels, seconds, radians. Tune these live via the debug overlay's
// underlying values -- change here, refresh, playtest.

export const PHYSICS_HZ = 120;
export const PHYSICS_DT = 1 / PHYSICS_HZ;

// px/s^2, downward. Verified the fixed-timestep integration itself is
// correct (velocity and position both track the closed-form solution for
// gravity+drag within ~1-4% over a measured 0.5s free-fall); 1900 simply
// felt too strong for a ~720px-tall table, so it's tuned down here rather
// than papering over a (nonexistent) timestep bug.
export const GRAVITY = 1300;

export const BALL_RADIUS = 9;
export const BALL_RESTITUTION_WALL = 0.42;
// Linear drag applied to velocity per second (rolling/air resistance combined).
export const BALL_LINEAR_DAMPING = 0.35;
// Max px a substep may move the ball, to avoid tunneling through thin walls.
// The substep loop (main.js) recomputes how much time this buys on EVERY
// substep from the ball's current speed, not just once per tick -- a mid-
// tick bumper kick immediately shrinks the remaining substeps' step size
// instead of leaving them sized for the ball's slower pre-kick speed.
export const MAX_SUBSTEP_DISTANCE = BALL_RADIUS * 0.5;
// Hard velocity ceiling, mainly defense in depth for stacked bumper kicks
// landing within the same tick (each kick doesn't reduce the substep
// loop's remaining time budget, so several in a row could in principle
// compound past anything reasonable) -- keeps the substep loop's worst-case
// iteration count bounded regardless of how a spike happens.
export const MAX_BALL_SPEED = 2600;

export const FLIPPER_LENGTH = 62;
export const FLIPPER_RADIUS = 9; // capsule thickness / 2
// Angular speed caps -- deliberately exaggerated & game-y, not realistic torque.
export const FLIPPER_MAX_OMEGA = 20; // rad/s while actively swinging up
export const FLIPPER_RETURN_OMEGA = 14; // rad/s while falling back to rest
// How much of the flipper's surface velocity gets transferred into the ball
// on contact, on top of the reflected relative velocity. >1 exaggerates kick.
export const FLIPPER_KICK_TRANSFER = 1.35;

export const PLUNGER_MIN_LAUNCH_SPEED = 500;
export const PLUNGER_MAX_LAUNCH_SPEED = 1750;
export const PLUNGER_CHARGE_TIME = 0.55; // seconds held to reach full power

// Seconds a bumper is locked out from re-"popping" after a hit. Keeps a
// ball resting/dragging against a bumper across many substeps from being
// re-launched every substep -- position push-out and basic reflection still
// happen every substep regardless (see resolveCircleBumper), only the extra
// radial kick + score/sound/animation trigger are gated by this.
export const BUMPER_HIT_COOLDOWN = 0.15;
// Seconds the hit animation (idle -> reacting -> idle) plays for. Allowed to
// run a bit longer than the cooldown -- a fast double-tap can start a new
// hit while the previous animation is still finishing, which reads fine.
export const BUMPER_HIT_ANIM_DURATION = 0.25;
