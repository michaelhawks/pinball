// Keyboard-only input for now (Milestone 1). Touch controls come later for
// the eventual Capacitor/iOS port.
const LEFT_FLIPPER_KEYS = new Set(['ShiftLeft', 'KeyZ']);
const RIGHT_FLIPPER_KEYS = new Set(['ShiftRight', 'KeyM']);
const PLUNGER_KEYS = new Set(['Space']);
const DEBUG_TOGGLE_KEYS = new Set(['Backquote']);
const TRACKED_KEYS = new Set([...LEFT_FLIPPER_KEYS, ...RIGHT_FLIPPER_KEYS, ...PLUNGER_KEYS, ...DEBUG_TOGGLE_KEYS]);

export class Input {
  constructor(target = window) {
    // Set of currently-held key codes, rather than one boolean per action.
    // Two codes map to the same flipper (e.g. ShiftLeft and KeyZ); tracking
    // a single boolean per action meant releasing either one cleared it even
    // if the other was still held. Deriving the action from set membership
    // fixes that regardless of which key(s) are down.
    this._down = new Set();
    this.debugTogglePressed = false;

    this._onKeyDown = (e) => {
      if (!TRACKED_KEYS.has(e.code)) return;
      e.preventDefault();
      if (DEBUG_TOGGLE_KEYS.has(e.code)) {
        if (!e.repeat) this.debugTogglePressed = true;
        return;
      }
      this._down.add(e.code);
    };
    this._onKeyUp = (e) => {
      this._down.delete(e.code);
    };
    // A key's keyup can be lost entirely -- alt-tabbing away, an OS-level
    // shortcut consuming the release, devtools or a browser dialog stealing
    // focus mid-press. Without this, a flipper key can register as "stuck"
    // down forever since no keyup ever arrives to clear it. Losing focus or
    // tab visibility means every physical key is effectively released.
    this._onReleaseAll = () => this._down.clear();

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onReleaseAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._onReleaseAll();
    });
  }

  get leftFlipper() {
    return this._hasAny(LEFT_FLIPPER_KEYS);
  }

  get rightFlipper() {
    return this._hasAny(RIGHT_FLIPPER_KEYS);
  }

  get plunger() {
    return this._hasAny(PLUNGER_KEYS);
  }

  _hasAny(codes) {
    for (const code of codes) {
      if (this._down.has(code)) return true;
    }
    return false;
  }

  // Call once per frame after reading debugTogglePressed.
  consumeDebugToggle() {
    const v = this.debugTogglePressed;
    this.debugTogglePressed = false;
    return v;
  }
}
