import { Ball } from './physics/Ball.js';
import { Flipper } from './physics/Flipper.js';
import { resolveCircleSegment, resolveCircleCapsule, resolveCircleBumper } from './physics/collision.js';
import { BALL_RESTITUTION_WALL, FLIPPER_KICK_TRANSFER, MAX_SUBSTEP_DISTANCE } from './physics/constants.js';
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
    // Adaptive substepping: keep each substep's travel distance under the
    // ball radius so fast-moving balls can't skip through thin walls
    // within a single physics tick.
    const speed = ball.speed;
    const substeps = Math.min(8, Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP_DISTANCE)));
    const subDt = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      ball.integrate(subDt);
      resolveCollisions();
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

// Exposed for debugging / e2e smoke checks.
window.__pinball = { ball, leftFlipper, rightFlipper, plunger, bumpers, loop, sound, scoreManager };
