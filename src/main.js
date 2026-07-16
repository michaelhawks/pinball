import { Ball } from './physics/Ball.js';
import { Flipper } from './physics/Flipper.js';
import { resolveCircleSegment, resolveCircleCapsule, resolveCircleBumper } from './physics/collision.js';
import { BALL_RESTITUTION_WALL, FLIPPER_KICK_TRANSFER, MAX_SUBSTEP_DISTANCE, MAX_BALL_SPEED } from './physics/constants.js';
import { Plunger } from './entities/Plunger.js';
import { Bumper } from './entities/Bumper.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WALL_CHAINS,
  LEFT_FLIPPER,
  RIGHT_FLIPPER,
  PLUNGER_CONFIG,
  BALL_SPAWN,
  DRAIN_Y,
  BUMPERS,
  BUMPER_TYPES,
} from './game/TableConfig.js';
import { Input } from './game/Input.js';
import { GameLoop } from './game/GameLoop.js';
import { ScoreManager } from './game/ScoreManager.js';
import { TableRenderer } from './render/TableRenderer.js';
import { HUD } from './render/HUD.js';
import { DebugOverlay } from './render/DebugOverlay.js';
import { SoundManager } from './audio/SoundManager.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const ball = new Ball(BALL_SPAWN.x, BALL_SPAWN.y);
const leftFlipper = new Flipper(LEFT_FLIPPER);
const rightFlipper = new Flipper(RIGHT_FLIPPER);
const plunger = new Plunger(PLUNGER_CONFIG);
plunger.attachBall(ball);
const bumpers = BUMPERS.map((cfg) => new Bumper({ ...cfg, ...BUMPER_TYPES[cfg.type] }));

const input = new Input();
const renderer = new TableRenderer(ctx);
const hud = new HUD(ctx);
const debugOverlay = new DebugOverlay(ctx);
const sound = new SoundManager();
const scoreManager = new ScoreManager();

// Browsers block audio until a user gesture -- unlock on the first one.
function unlockAudioOnce() {
  sound.unlock();
  window.removeEventListener('keydown', unlockAudioOnce);
  window.removeEventListener('pointerdown', unlockAudioOnce);
}
window.addEventListener('keydown', unlockAudioOnce);
window.addEventListener('pointerdown', unlockAudioOnce);

let elapsed = 0;

function handleBumperHit(bumper) {
  sound.playHitFor(bumper.type);
  const { crossedMilestone } = scoreManager.registerHit(bumper.points, elapsed);
  if (crossedMilestone) sound.playMilestoneStinger();
}

function resolveCollisions() {
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
  for (const bumper of bumpers) {
    const contact = resolveCircleBumper(ball, bumper.x, bumper.y, bumper.radius, bumper.restitution);
    if (contact && !bumper.isOnCooldown) {
      ball.vx += contact.nx * bumper.kickStrength;
      ball.vy += contact.ny * bumper.kickStrength;
      bumper.triggerHit();
      handleBumperHit(bumper);
    }
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

  ball.clampSpeed(MAX_BALL_SPEED);
}

function checkDrain() {
  if (ball.y - ball.radius > DRAIN_Y) {
    plunger.attachBall(ball);
    scoreManager.nextBall();
  }
}

function physicsStep(dt) {
  leftFlipper.setPressed(input.leftFlipper);
  rightFlipper.setPressed(input.rightFlipper);
  leftFlipper.update(dt);
  rightFlipper.update(dt);

  plunger.update(dt, input.plunger);
  for (const bumper of bumpers) bumper.update(dt);

  if (!ball.heldByPlunger) {
    // Adaptive substepping, recomputed every iteration from the ball's
    // CURRENT speed -- not once per tick from the speed at the top of it.
    // A bumper kick mid-tick can multiply the ball's speed instantly; if the
    // remaining substeps that tick kept using a step size sized for the
    // slower pre-kick speed, they could cover more than a ball-radius of
    // travel in one step and skip clean through a thin wall (this is
    // exactly how the ball was tunneling into the shooter lane). Chewing
    // through a fixed time budget with a step size re-derived from the
    // live speed each time keeps every step's travel bounded regardless of
    // when within the tick the ball got fast.
    let remaining = dt;
    let guard = 0;
    while (remaining > 1e-9 && guard < 64) {
      const speed = ball.speed;
      const maxSubDt = speed > 1e-6 ? MAX_SUBSTEP_DISTANCE / speed : remaining;
      const subDt = Math.min(remaining, maxSubDt);
      ball.integrate(subDt);
      resolveCollisions();
      remaining -= subDt;
      guard++;
    }
    checkDrain();
  }

  elapsed += dt;
}

function render(fps) {
  renderer.drawBackground(elapsed);
  renderer.drawWalls();
  renderer.drawBumpers(bumpers);
  renderer.drawPlunger(plunger);
  renderer.drawFlipper(leftFlipper);
  renderer.drawFlipper(rightFlipper);
  renderer.drawBall(ball);

  hud.draw({
    score: scoreManager.score,
    ballNumber: scoreManager.ballNumber,
    combo: scoreManager.comboCount,
    comboActive: scoreManager.isComboActive(elapsed),
  });

  if (input.consumeDebugToggle()) debugOverlay.toggle();
  debugOverlay.draw({ fps, ball, leftFlipper, rightFlipper, plunger });
}

const loop = new GameLoop({ update: physicsStep, render });
loop.start();

// Exposed for debugging / e2e smoke checks. physicsStep is included so
// tests can step the simulation deterministically (loop.stop(), then call
// physicsStep(dt) directly) instead of racing the real-time rAF loop.
window.__pinball = { ball, leftFlipper, rightFlipper, plunger, bumpers, loop, sound, scoreManager, physicsStep };
