// All frames share a 24x32 canvas and a fixed ground line at y=31. Keeping the
// frame size constant lets animation change without moving the Arcade body.
const FRAME_W = 24;
const FRAME_H = 32;

const looks = {
  gianlico: {
    hair: '#281e1d', hairLight: '#594036', skin: '#c48b69', skinShade: '#97644e',
    coat: '#39373d', coatLight: '#5b5454', coatShade: '#25252d',
    shirt: '#ddd1bb', shirtShade: '#b7a38e', trousers: '#303038',
    trousersLight: '#48454a', shoes: '#624a3e', shoeLight: '#866550',
    detail: '#754033'
  },
  borge: {
    hair: '#171619', hairLight: '#454047', skin: '#a9785b', skinShade: '#80553f',
    coat: '#30272b', coatLight: '#53454a', coatShade: '#211b20',
    shirt: '#c3ad82', shirtShade: '#95815e', trousers: '#29242a',
    trousersLight: '#433940', shoes: '#4a3330', shoeLight: '#745248',
    detail: '#b99a58'
  }
};

function block(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function segment(ctx, color, x1, y1, x2, y2, width = 3) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    block(ctx, color, x1 + (x2 - x1) * t - Math.floor(width / 2),
      y1 + (y2 - y1) * t, width, 2);
  }
}

function head(ctx, c, x, y, blink = false) {
  block(ctx, c.skinShade, x + 1, y + 4, 8, 8);
  block(ctx, c.skin, x + 2, y + 3, 7, 7);
  block(ctx, c.skin, x + 8, y + 5, 2, 3); // profile nose
  block(ctx, c.hair, x, y + 1, 10, 4);
  block(ctx, c.hair, x, y + 3, 3, 6);
  block(ctx, c.hairLight, x + 2, y + 1, 6, 1);
  block(ctx, c.hairLight, x + 1, y + 4, 1, 3);
  block(ctx, c.skinShade, x + 1, y + 7, 2, 2); // ear
  block(ctx, c.hair, x + 7, y + 5, 2, 1); // brow
  block(ctx, c.coatShade, x + 8, y + (blink ? 7 : 6), 1, 1); // eye
  block(ctx, c.skinShade, x + 8, y + 9, 2, 1); // mouth
}

function shoe(ctx, c, x, y, forward) {
  block(ctx, c.coatShade, x, y, 6, 2);
  block(ctx, c.shoes, x, y, 5 + (forward ? 1 : 0), 2);
  block(ctx, c.shoeLight, x + 2, y, 3, 1);
}

function standingLeg(ctx, c, hip, knee, foot, lift, front) {
  const y = 30 - lift;
  segment(ctx, front ? c.trousersLight : c.coatShade, hip, 22, knee, 26, 4);
  segment(ctx, c.trousers, knee, 26, foot, y - 1, 4);
  block(ctx, c.trousersLight, foot - 1, y - 2, 1, 1);
  shoe(ctx, c, foot - 2, y, foot >= hip);
}

function arm(ctx, c, shoulder, elbow, hand, front) {
  segment(ctx, front ? c.coatLight : c.coatShade,
    shoulder[0], shoulder[1], elbow[0], elbow[1], 4);
  segment(ctx, c.coat, elbow[0], elbow[1], hand[0], hand[1] - 1, 4);
  block(ctx, c.shirtShade, hand[0] - 1, hand[1] - 1, 3, 1);
  block(ctx, c.skin, hand[0] - 1, hand[1], 3, 2);
}

function jacket(ctx, c, bob = 0) {
  block(ctx, c.coatShade, 6, 12 + bob, 12, 12);
  block(ctx, c.coat, 7, 13 + bob, 10, 10);
  block(ctx, c.coatLight, 7, 14 + bob, 2, 7);
  block(ctx, c.shirtShade, 12, 13 + bob, 4, 8);
  block(ctx, c.shirt, 12, 14 + bob, 3, 6);
  block(ctx, c.coatLight, 11, 13 + bob, 2, 4); // left lapel
  block(ctx, c.coatShade, 15, 13 + bob, 2, 7); // right lapel
  block(ctx, c.detail, 14, 20 + bob, 1, 1); // button
  block(ctx, c.coatShade, 7, 23 + bob, 10, 1);
}

function drawStanding(ctx, c, pose) {
  const { step = 0, bob = 0, blink = false, armLift = 0,
    rearLift = 0, frontLift = 0 } = pose;
  const rearFoot = 14 - step;
  const frontFoot = 10 + step;

  standingLeg(ctx, c, 15, 15 - step * 0.5, rearFoot, rearLift, false);
  arm(ctx, c, [8, 15 + bob], [7 + step * 0.5, 19 + bob - armLift],
    [8 + step, 22 + bob - armLift], false);
  jacket(ctx, c, bob);
  block(ctx, c.skinShade, 12, 10 + bob, 3, 3); // neck
  head(ctx, c, 8, 1 + bob, blink);
  standingLeg(ctx, c, 10, 10 + step * 0.5, frontFoot, frontLift, true);
  arm(ctx, c, [17, 15 + bob], [18 - step * 0.5, 19 + bob - armLift],
    [18 - step, 22 + bob - armLift], true);
}

function drawCrouch(ctx, c, step = 0, blink = false) {
  const shift = Math.abs(step) > 1 ? 1 : 0;
  const rearFoot = 6 - step;
  const frontFoot = 14 + step;
  block(ctx, c.coatShade, 7, 21 - shift, 12, 6);
  block(ctx, c.trousers, 8, 26, 11, 3);
  segment(ctx, c.trousersLight, 11, 25, rearFoot + 2, 28, 3);
  shoe(ctx, c, rearFoot, 30, false);
  block(ctx, c.coat, 6, 19 - shift, 13, 7);
  block(ctx, c.coatLight, 7, 20 - shift, 2, 4);
  block(ctx, c.shirt, 13, 19 - shift, 3, 4);
  block(ctx, c.coatShade, 17, 20 - shift, 2, 5);
  block(ctx, c.skinShade, 12, 17 - shift, 3, 3);
  head(ctx, c, 9, 12 - shift, blink);
  arm(ctx, c, [17, 21 - shift], [19, 24], [19 + step, 26], true);
  segment(ctx, c.trousers, 15, 25, frontFoot + 2, 28, 3);
  shoe(ctx, c, frontFoot, 30, true);
}

function drawJump(ctx, c, phase) {
  // Feet stay inside the same frame. Arcade physics supplies world movement.
  const rise = phase === 0;
  const apex = phase === 1;
  const fall = phase === 2;
  const bob = apex ? -1 : 0;
  jacket(ctx, c, bob);
  block(ctx, c.skinShade, 12, 10 + bob, 3, 3);
  head(ctx, c, 8, 1 + bob);
  const armY = rise ? 15 : apex ? 13 : fall ? 17 : 19;
  arm(ctx, c, [8, 15 + bob], [6, armY], [5, armY + 2], false);
  arm(ctx, c, [17, 15 + bob], [20, armY], [20, armY + 2], true);
  const kneeY = apex ? 25 : rise ? 26 : fall ? 27 : 28;
  segment(ctx, c.trousers, 9, 22, 7, kneeY, 4);
  segment(ctx, c.trousersLight, 15, 22, 17, kneeY, 4);
  shoe(ctx, c, 4, apex ? 27 : 29, false);
  shoe(ctx, c, 16, apex ? 27 : 29, true);
}

function drawFrame(ctx, c, state, index) {
  if (state === 'idle') {
    drawStanding(ctx, c, { bob: index === 2 ? 1 : 0, blink: index === 3 });
  } else if (state === 'walk') {
    const steps = [0, 1, 2, 3, 0, -1, -2, -3];
    const lifts = [0, 0, 0, 1, 2, 1, 0, 0];
    drawStanding(ctx, c, {
      step: steps[index], bob: index === 2 || index === 6 ? 1 : 0,
      frontLift: lifts[index], rearLift: lifts[(index + 4) % 8]
    });
  } else if (state === 'crouch') {
    drawCrouch(ctx, c, [-2, -1, 0, 2, 1, 0][index]);
  } else {
    drawJump(ctx, c, index);
  }
}

function makeSheet(scene, key, look, states) {
  const count = states.reduce((sum, [, frames]) => sum + frames, 0);
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * count;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let frame = 0;
  for (const [state, frames] of states) {
    for (let i = 0; i < frames; i++, frame++) {
      ctx.save();
      ctx.translate(frame * FRAME_W, 0);
      drawFrame(ctx, look, state, i);
      ctx.restore();
    }
  }
  const source = scene.textures.addCanvas(`${key}-source`, canvas);
  scene.textures.addSpriteSheet(key, source, { frameWidth: FRAME_W, frameHeight: FRAME_H });
}

export function installCharacterSprites(scene) {
  makeSheet(scene, 'gianlico-sheet', looks.gianlico,
    [['idle', 4], ['walk', 8], ['crouch', 6], ['jump', 4]]);
  makeSheet(scene, 'borge-sheet', looks.borge, [['idle', 4]]);

  const create = (key, sheet, start, end, frameRate) => scene.anims.create({
    key, frames: scene.anims.generateFrameNumbers(sheet, { start, end }),
    frameRate, repeat: -1
  });
  create('gianlico-idle', 'gianlico-sheet', 0, 3, 4);
  create('gianlico-walk', 'gianlico-sheet', 4, 11, 12);
  create('gianlico-crouch-walk', 'gianlico-sheet', 12, 17, 9);
  create('borge-idle', 'borge-sheet', 0, 3, 3);
}

