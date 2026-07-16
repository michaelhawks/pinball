// Data-driven table layout: original space theme, no relation to any
// existing table's ramp/bumper/wall arrangement. Milestone 1 only --
// outer walls, one flipper pair, and the shooter lane. Bumpers, ramps,
// lanes and multiball geometry are deliberately not scaffolded here yet.

const deg = (d) => (d * Math.PI) / 180;

// Flipper rest/active positions are specified as clock-face hours for
// readability (this is how they were spec'd). Our angle convention is
// 0 = +x (3 o'clock), increasing clockwise on screen since +y is down --
// which happens to match clock-hand rotation directly, so hour h maps to
// (h - 3) * 30 degrees.
const clock = (hour) => deg((hour - 3) * 30);

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 720;

// Ball falls below this y and is considered drained.
export const DRAIN_Y = 710;

// Wall chains: each is a polyline (list of {x,y}), rendered/collided as a
// series of segments between consecutive points. Not closed loops -- the
// drain gap and lane opening are intentional breaks in the boundary.

// Outer boundary: left wall, up and over the top, down the shooter lane's
// outer wall, to the lane floor.
export const OUTER_WALL = [
  { x: 60, y: 615 }, // left outlane funnel, guides toward left flipper
  { x: 20, y: 560 },
  { x: 20, y: 90 },
  { x: 55, y: 20 },
  { x: 330, y: 20 },
  { x: 380, y: 90 },
  { x: 380, y: 690 }, // shooter lane outer wall down to the floor
  { x: 350, y: 690 }, // lane floor
];

// Shooter-lane divider: separates the lane from the main playfield up top,
// then curves in to double as the right outlane guide lower down.
export const LANE_DIVIDER = [
  { x: 350, y: 110 },
  { x: 348, y: 480 },
  { x: 312, y: 590 },
];

export const WALL_CHAINS = [OUTER_WALL, LANE_DIVIDER];

// Left flipper: rest ~4:15 (tip down-inward), fired ~1:45 (tip up-inward),
// sweeping counter-clockwise (decreasing angle) when pressed.
export const LEFT_FLIPPER = {
  pivotX: 120,
  pivotY: 610,
  restAngle: clock(4.25),
  activeAngle: clock(1.75),
};

// Right flipper: mirror of left -- rest ~7:45, fired ~10:15, sweeping
// clockwise (increasing angle) when pressed.
export const RIGHT_FLIPPER = {
  pivotX: 280,
  pivotY: 610,
  restAngle: clock(7.75),
  activeAngle: clock(10.25),
};

export const PLUNGER_CONFIG = {
  laneCenterX: 365,
  restY: 630,
  maxPullY: 685,
};

export const BALL_SPAWN = {
  x: PLUNGER_CONFIG.laneCenterX,
  y: PLUNGER_CONFIG.restY,
};
