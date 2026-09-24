import { touch } from './touch.js';

// Unified keyboard + gamepad + touch input. Each frame `update()` samples every
// binding once and stores "held" and "pressed" booleans, so the player, the
// dialogue box and menus can all read the same edge without consuming it
// from each other (Phaser's JustDown clears on first read).

const BINDINGS = {
  left: ['A', 'LEFT'],
  right: ['D', 'RIGHT'],
  up: ['W', 'UP'],
  down: ['S', 'DOWN'],
  jump: ['SPACE', 'W', 'UP'],
  attack: ['J', 'F'],
  dodge: ['SHIFT', 'K'],
  interact: ['E'],
  heal: ['Q'],
  pause: ['ESC', 'P'],
  journal: ['TAB', 'I'],
  confirm: ['ENTER', 'E', 'SPACE'],
  back: ['ESC', 'BACKSPACE']
};

// Standard gamepad mapping (Xbox layout).
const PAD = {
  jump: [0],
  attack: [2],
  dodge: [1, 5],
  interact: [3],
  heal: [4],
  pause: [9],
  journal: [8],
  confirm: [0],
  back: [1]
};

export class Controls {
  constructor(scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    this.keys = {};
    const names = new Set(Object.values(BINDINGS).flat());
    names.forEach((name) => { this.keys[name] = kb.addKey(name, true, false); });
    // TAB would otherwise move browser focus away from the canvas.
    kb.addCapture(['TAB', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.held = {};
    this.pressed = {};
    this.prev = {};
    // Key-down events are recorded too, so a tap shorter than one frame
    // (down and up before the next update) still counts as a press.
    this.tapped = new Set();
    kb.on('keydown', (event) => { if (!event.repeat) this.tapped.add(event.keyCode); });
    Object.keys(BINDINGS).forEach((action) => { this.held[action] = false; this.pressed[action] = false; });
  }

  pad() {
    const gp = this.scene.input.gamepad;
    return gp && gp.total ? gp.getPad(0) : null;
  }

  update() {
    const pad = this.pad();
    const codes = Phaser.Input.Keyboard.KeyCodes;
    Object.entries(BINDINGS).forEach(([action, keys]) => {
      let down = keys.some((name) => this.keys[name]?.isDown);
      const tapped = keys.some((name) => this.tapped.has(codes[name])) || touch.tapped.has(action);
      if (touch.held[action]) down = true;
      if (pad) {
        if (PAD[action]) down = down || PAD[action].some((i) => pad.buttons[i]?.pressed);
        const ax = pad.axes.length ? pad.axes[0].getValue() : 0;
        const ay = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
        if (action === 'left') down = down || ax < -0.4 || Boolean(pad.buttons[14]?.pressed);
        if (action === 'right') down = down || ax > 0.4 || Boolean(pad.buttons[15]?.pressed);
        if (action === 'up') down = down || ay < -0.6 || Boolean(pad.buttons[12]?.pressed);
        if (action === 'down') down = down || ay > 0.6 || Boolean(pad.buttons[13]?.pressed);
      }
      this.pressed[action] = (down && !this.prev[action]) || (tapped && !this.blocked);
      this.held[action] = down || tapped;
      this.prev[action] = down;
    });
    this.tapped.clear();
    touch.tapped.clear();
    this.blocked = false;
  }

  // Menus, overlays and scene changes call this so a key held through a
  // transition does not immediately fire in the next context.
  reset() {
    this.scene.input.keyboard.resetKeys();
    this.tapped.clear();
    this.blocked = true;
    Object.keys(this.held).forEach((action) => {
      this.prev[action] = true;
      this.pressed[action] = false;
    });
  }

  axisX() {
    return (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
  }
}
