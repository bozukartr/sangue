// Player preferences, stored separately from the save so a new game keeps them.
const SETTINGS_KEY = 'sangue-settings-v1';

const DEFAULTS = Object.freeze({
  master: 0.8,
  music: 0.6,
  sfx: 0.8,
  rain: true,
  scanlines: true,
  shake: true,
  textSpeed: 1, // 0 slow · 1 normal · 2 fast · 3 instant
  completed: false
});

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings = read();

const listeners = new Set();

export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  applySettings();
  listeners.forEach((fn) => fn(settings));
}

export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applySettings() {
  const lines = document.querySelector('.scanlines');
  if (lines) lines.style.display = settings.scanlines ? 'block' : 'none';
}

export const TEXT_SPEEDS = ['YAVAŞ', 'NORMAL', 'HIZLI', 'ANINDA'];
export const TEXT_CPS = [28, 52, 95, Infinity];
