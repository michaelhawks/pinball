import { PHYSICS_DT } from '../physics/constants.js';

// Fixed-timestep accumulator loop: physics always advances in PHYSICS_DT
// increments regardless of display refresh rate, so ball/flipper behavior
// stays consistent across machines. Render runs once per animation frame.
export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this._accumulator = 0;
    this._lastTime = null;
    this._running = false;
    this._frameCount = 0;
    this._fpsTimer = 0;
    this.fps = 0;
    this.physicsTicks = 0;

    this._tick = this._tick.bind(this);
  }

  start() {
    this._running = true;
    requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
  }

  _tick(now) {
    if (!this._running) return;

    if (this._lastTime === null) this._lastTime = now;
    let frameTime = (now - this._lastTime) / 1000;
    this._lastTime = now;
    // Clamp to avoid a "spiral of death" after a tab is backgrounded.
    frameTime = Math.min(frameTime, 0.25);

    this._accumulator += frameTime;
    while (this._accumulator >= PHYSICS_DT) {
      this.update(PHYSICS_DT);
      this._accumulator -= PHYSICS_DT;
      this.physicsTicks++;
    }

    this._frameCount++;
    this._fpsTimer += frameTime;
    if (this._fpsTimer >= 0.5) {
      this.fps = this._frameCount / this._fpsTimer;
      this._frameCount = 0;
      this._fpsTimer = 0;
    }

    this.render(this.fps);
    requestAnimationFrame(this._tick);
  }
}
