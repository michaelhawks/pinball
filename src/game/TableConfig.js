// Data-driven table layout: original "Zombie Invasion" graveyard/barricade
// theme, no relation to any existing table's wall/bumper arrangement.
// Milestone 2 adds bumpers; ramps, lanes and multiball geometry are still
// deliberately not scaffolded here yet.

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

// Outer boundary: left flipper outlane guard, left wall, up and over the
// top, down the shooter lane's outer wall, to the lane floor.
//
// The first point closes the gap outside the left flipper's pivot. Both
// flippers rest and fire with their tip pointing INWARD (see LEFT_FLIPPER/
// RIGHT_FLIPPER below) -- that means the flipper capsule never sweeps past
// its own pivot on the outer side, so without a wall there the ball can
// roll straight down the outside of the flipper and drain untouched. The
// guard point sits right at the pivot's outer edge (pivotX - flipper
// radius) so there's no ball-sized gap between it and the flipper.
export const OUTER_WALL = [
  { x: 112, y: 608 }, // left flipper outlane guard (seals outside of pivot)
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
// curves in to double as the right outlane guide lower down, then closes
// the right flipper's outlane -- same reasoning as the OUTER_WALL guard
// above (right flipper only sweeps inward, leaving its outside open).
//
// This needs three extra points, not one: a tight point right at the
// pivot's outer edge (292,608) to seal the immediate gap beside the
// flipper, then straight down to lane-floor height (292,690), then across
// to (350,690) to meet OUTER_WALL's existing lane floor point exactly.
// Stopping at just the pivot point (as an earlier version of this fix did)
// dead-ends the wall there and leaves the whole pocket between it and the
// shooter lane's own floor (roughly x 292-350, y 608-690) open on the
// bottom -- which is exactly how the ball kept draining down the right
// side even after the immediate pivot gap was sealed.
export const LANE_DIVIDER = [
  { x: 350, y: 110 },
  { x: 348, y: 480 },
  { x: 312, y: 590 },
  { x: 292, y: 608 }, // right flipper outlane guard (seals outside of pivot)
  { x: 292, y: 690 }, // ...down to lane-floor height...
  { x: 350, y: 690 }, // ...and across to meet OUTER_WALL's lane floor -- no gap
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

// Per-type bounce/value tuning -- deliberately distinct rather than one
// shared bounce constant. Zombie head is the showy, high-value "mechanism"
// bumper (strongest pop); tombstone is the dullest, heaviest, lowest-value
// hit; barricade splits the difference.
export const BUMPER_TYPES = {
  zombieHead: { points: 150, restitution: 0.9, kickStrength: 900 },
  barricade: { points: 100, restitution: 0.75, kickStrength: 700 },
  tombstone: { points: 75, restitution: 0.6, kickStrength: 500 },
};

// Positions chosen for clearance: >= ball diameter + ~20px from every wall
// and from each other, so the ball always has a path between them.
export const BUMPERS = [
  { type: 'zombieHead', x: 150, y: 180, radius: 20 },
  { type: 'tombstone', x: 260, y: 200, radius: 19 },
  { type: 'barricade', x: 205, y: 290, radius: 20 },
  { type: 'zombieHead', x: 110, y: 320, radius: 20 },
];
