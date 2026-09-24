// On-screen buttons for touch devices. Each button feeds one or more
// Controls actions; Controls merges these with keyboard and gamepad input.
const BUTTONS = [
  { id: 'left', label: '◀', actions: ['left'], pad: 'move' },
  { id: 'up', label: '▲', actions: ['up'], pad: 'move' },
  { id: 'down', label: '▼', actions: ['down'], pad: 'move' },
  { id: 'right', label: '▶', actions: ['right'], pad: 'move' },
  { id: 'dodge', label: 'KAÇ', actions: ['dodge'], pad: 'act' },
  { id: 'attack', label: 'VUR', actions: ['attack'], pad: 'act' },
  { id: 'interact', label: 'E', actions: ['interact', 'confirm'], pad: 'act' },
  { id: 'jump', label: 'ZIPLA', actions: ['jump'], pad: 'act' },
  { id: 'heal', label: 'Q', actions: ['heal'], pad: 'sys' },
  { id: 'journal', label: '☰', actions: ['journal'], pad: 'sys' },
  { id: 'pause', label: 'II', actions: ['pause', 'back'], pad: 'sys' }
];

export const touch = { held: {}, tapped: new Set(), enabled: false };

export function installTouchControls() {
  const root = document.getElementById('touch-controls');
  if (!root) return;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!coarse) return;
  touch.enabled = true;
  document.body.classList.add('touch');
  const pads = {};
  ['move', 'act', 'sys'].forEach((name) => {
    const pad = document.createElement('div');
    pad.className = `touch-pad touch-${name}`;
    root.appendChild(pad);
    pads[name] = pad;
  });
  BUTTONS.forEach((b) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `touch-btn touch-${b.id}`;
    el.textContent = b.label;
    el.setAttribute('aria-label', b.id);
    const press = (on) => (event) => {
      event.preventDefault();
      el.classList.toggle('on', on);
      b.actions.forEach((a) => {
        touch.held[a] = on;
        if (on) touch.tapped.add(a);
      });
    };
    el.addEventListener('pointerdown', press(true));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => el.addEventListener(type, press(false)));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    pads[b.pad].appendChild(el);
  });
}
