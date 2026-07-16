import { Ball } from './physics/Ball.js';
import { Flipper } from './physics/Flipper.js';
import { resolveCircleSegment, resolveCircleCapsule } from './physics/collision.js';
import { BALL_RESTITUTION_WALL, FLIPPER_KICK_TRANSFER, MAX_SUBSTEP_DISTANCE } from './physics/constants.js';
import { Plunger } from './entities/Plunger.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WALL_CHAINS,
  LEFT_FLIPPER,
  RIGHT_FLIPPER,
  PLUNGER_CONFIG,
  BALL_SPAWN,
  DRAIN_Y,
} from './game/TableConfig.js';
import { Input } from './game/Input.js';
import { GameLoop } from './game/GameLoop.js';
import { TableRenderer } from './render/TableRenderer.js';
import { HUD } from './render/HUD.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const ball = new Ball(BALL_SPAWN.x, BALL_SPAWN.y);
const leftFlipper = new Flipper(LEFT_FLIPPER);
const rightFlipper = new Flipper(RIGHT_FLIPPER);
const plunger = new Plunger(PLUNGER_CONFIG);
plunger.attachBall(ball);

const input = new Input();
const renderer = new TableRenderer(ctx);
const hud = new HUD(ctx);

let elapsed = 0;

function resolveWallCollisions() {
  for (const chain of WALL_CHAINS) {
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      resolveCircleSegment(ball, a.x, a.y, b.x, b.y, BALL_RESTITUTION_WALL);
    }
  }
  for (const flipper of [leftFlipper, rightFlipper]) {
    resolveCircleCapsule(ball, flipper, BALL_RESTITUTION_WALL, FLIPPER_KICK_TRANSFER);
  }
  // Canvas side/bottom edges as a last-resort backstop (the drain gap is
  // intentionally open at the bottom -- see checkDrain).
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    if (ball.vx < 0) ball.vx *= -BALL_RESTITUTION_WALL;
  }
  if (ball.x + ball.radius > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.radius;
    if (ball.vx > 0) ball.vx *= -BALL_RESTITUTION_WALL;
  }
}

function checkDrain() {
  if (ball.y - ball.radius > DRAIN_Y) {
    plunger.attachBall(ball);
  }
}

function physicsStep(dt) {
  leftFlipper.setPressed(input.leftFlipper);
  rightFlipper.setPressed(input.rightFlipper);
  leftFlipper.update(dt);
  rightFlipper.update(dt);

  plunger.update(dt, input.plunger);

  if (!ball.heldByPlunger) {
    // Adaptive substepping: keep each substep's travel distance under the
    // ball radius so fast-moving balls can't skip through thin walls
    // within a single physics tick.
    const speed = ball.speed;
    const substeps = Math.min(8, Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP_DISTANCE)));
    const subDt = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      ball.integrate(subDt);
      resolveWallCollisions();
    }
    checkDrain();
  }

  elapsed += dt;
}

function render(fps) {
  renderer.drawBackground(elapsed);
  renderer.drawWalls();
  renderer.drawPlunger(plunger);
  renderer.drawFlipper(leftFlipper);
  renderer.drawFlipper(rightFlipper);
  renderer.drawBall(ball);

  if (input.consumeDebugToggle()) hud.toggle();
  hud.draw({ fps, ball, leftFlipper, rightFlipper, plunger });
}

const loop = new GameLoop({ update: physicsStep, render });
loop.start();

// Exposed for debugging / e2e smoke checks.
window.__pinball = { ball, leftFlipper, rightFlipper, plunger, loop };
