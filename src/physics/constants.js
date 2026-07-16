// Tunable physics constants for Milestone 1 (core feel).
// Units: pixels, seconds, radians. Tune these live via the debug overlay's
// underlying values -- change here, refresh, playtest.

export const PHYSICS_HZ = 120;
export const PHYSICS_DT = 1 / PHYSICS_HZ;

export const GRAVITY = 1900; // px/s^2, downward

export const BALL_RADIUS = 9;
export const BALL_RESTITUTION_WALL = 0.42;
// Linear drag applied to velocity per second (rolling/air resistance combined).
export const BALL_LINEAR_DAMPING = 0.35;
// Max px a substep may move the ball, to avoid tunneling through thin walls.
export const MAX_SUBSTEP_DISTANCE = BALL_RADIUS * 0.5;

export const FLIPPER_LENGTH = 62;
export const FLIPPER_RADIUS = 9; // capsule thickness / 2
// Angular speed caps -- deliberately exaggerated & game-y, not realistic torque.
export const FLIPPER_MAX_OMEGA = 20; // rad/s while actively swinging up
export const FLIPPER_RETURN_OMEGA = 14; // rad/s while falling back to rest
// Swing sweep, in radians, from rest to fully active.
export const FLIPPER_SWING = 0.95;
// How much of the flipper's surface velocity gets transferred into the ball
// on contact, on top of the reflected relative velocity. >1 exaggerates kick.
export const FLIPPER_KICK_TRANSFER = 1.35;

export const PLUNGER_MIN_LAUNCH_SPEED = 500;
export const PLUNGER_MAX_LAUNCH_SPEED = 1750;
export const PLUNGER_CHARGE_TIME = 0.55; // seconds held to reach full power
