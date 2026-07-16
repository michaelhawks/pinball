// Keyboard-only input for now (Milestone 1). Touch controls come later for
// the eventual Capacitor/iOS port.
const LEFT_FLIPPER_KEYS = new Set(['ShiftLeft', 'KeyZ']);
const RIGHT_FLIPPER_KEYS = new Set(['ShiftRight', 'KeyM']);
const PLUNGER_KEYS = new Set(['Space']);
const DEBUG_TOGGLE_KEYS = new Set(['Backquote']);

export class Input {
  constructor(target = window) {
    this.leftFlipper = false;
    this.rightFlipper = false;
    this.plunger = false;
    this.debugTogglePressed = false;

    this._onKeyDown = (e) => {
      if (LEFT_FLIPPER_KEYS.has(e.code)) this.leftFlipper = true;
      if (RIGHT_FLIPPER_KEYS.has(e.code)) this.rightFlipper = true;
      if (PLUNGER_KEYS.has(e.code)) this.plunger = true;
      if (DEBUG_TOGGLE_KEYS.has(e.code) && !e.repeat) this.debugTogglePressed = true;
      if (LEFT_FLIPPER_KEYS.has(e.code) || RIGHT_FLIPPER_KEYS.has(e.code) || PLUNGER_KEYS.has(e.code)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => {
      if (LEFT_FLIPPER_KEYS.has(e.code)) this.leftFlipper = false;
      if (RIGHT_FLIPPER_KEYS.has(e.code)) this.rightFlipper = false;
      if (PLUNGER_KEYS.has(e.code)) this.plunger = false;
    };

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
  }

  // Call once per frame after reading debugTogglePressed.
  consumeDebugToggle() {
    const v = this.debugTogglePressed;
    this.debugTogglePressed = false;
    return v;
  }
}
