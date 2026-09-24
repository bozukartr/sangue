// Shared constants. Every world scene uses the same 1280×720 canvas, the
// same street line and the same character scale, so sprites line up between
// locations without per-scene tuning.
export const GAME_W = 1280;
export const GAME_H = 720;
export const GROUND_TOP = 642;
export const CHAR_SCALE = 2.2;
// Character frames are 32px tall with feet on the last row; the sprite
// origin is centred, so the centre sits 16 frame pixels above the street.
export const CHAR_Y = GROUND_TOP - 16 * CHAR_SCALE;

export const FONT = '"Courier New", ui-monospace, monospace';

export const COLOR = Object.freeze({
  night: 0x18141b,
  sky: 0x302733,
  haze: 0x5c4650,
  stone: 0x6d6257,
  stoneDark: 0x3c3632,
  cream: 0xe7ddca,
  wine: 0x6b1f22,
  red: 0x9c2b2f,
  blood: 0xb3262b,
  gold: 0xb99a58,
  black: 0x171313,
  ink: 0x100d0d,
  green: 0x66715c,
  steel: 0x4a5058
});

export const HEX = Object.freeze({
  cream: '#e7ddca',
  paper: '#efe4d1',
  gold: '#b99a58',
  wine: '#6b1f22',
  red: '#c0393d',
  smoke: '#8e8378',
  dim: '#5d5550',
  mute: '#b3a89d',
  ink: '#100d0d'
});

// Depth bands keep draw order readable across scenes.
export const DEPTH = Object.freeze({
  sky: 0,
  far: 2,
  mid: 5,
  back: 10,
  props: 20,
  npc: 30,
  player: 32,
  front: 40,
  rain: 45,
  light: 48,
  hud: 100,
  prompt: 150,
  dialogue: 200,
  card: 300
});

export function text(scene, x, y, value, style = {}) {
  return scene.add.text(x, y, value, {
    fontFamily: FONT,
    fontSize: '16px',
    color: HEX.cream,
    ...style
  });
}
