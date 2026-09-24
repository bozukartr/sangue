// Code-drawn pixel characters.
//
// All frames share a 24×32 canvas and a fixed ground line at y=31. Keeping
// the frame size constant lets animation change without moving the Arcade
// body. Every character gets the same sheet layout:
//
//   0–3 idle · 4–11 walk · 12–17 crouch · 18–21 jump · 22–25 punch
//   26–27 hurt · 28–29 down · 30–31 aim (pistol)
//
// Characters face right; sprites flip for left.
const FRAME_W = 24;
const FRAME_H = 32;

export const FRAMES = Object.freeze({
  idle: 0, walk: 4, crouch: 12, jump: 18, punch: 22, hurt: 26, down: 28, aim: 30
});

export const LOOKS = {
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
    detail: '#b99a58', mustache: true
  },
  elena: {
    hair: '#241d1c', hairLight: '#5e4439', skin: '#b78164', skinShade: '#865947',
    coat: '#39453f', coatLight: '#59695c', coatShade: '#27332d',
    shirt: '#cbb49a', shirtShade: '#a48c75', trousers: '#303434',
    trousersLight: '#4a5350', shoes: '#4a3935', shoeLight: '#705449',
    detail: '#b59363', longHair: true
  },
  cranier: {
    hair: '#b8b2aa', hairLight: '#dcd6cc', skin: '#b88468', skinShade: '#8c5f4a',
    coat: '#d9d2c3', coatLight: '#efe9dc', coatShade: '#a79f90',
    shirt: '#2a2428', shirtShade: '#1b1719', trousers: '#cfc8b8',
    trousersLight: '#e2dccd', shoes: '#2a2020', shoeLight: '#4a3a34',
    detail: '#b99a58', mustache: true
  },
  vitale: {
    hair: '#3a2f2a', hairLight: '#5a4a40', skin: '#b58163', skinShade: '#8a5d48',
    coat: '#7d6d52', coatLight: '#9a8866', coatShade: '#5a4d3a',
    shirt: '#c8c2b6', shirtShade: '#9e988c', trousers: '#3a3a40',
    trousersLight: '#52525a', shoes: '#2b2220', shoeLight: '#4b3b35',
    detail: '#6b1f22', mustache: true, hat: 'fedora', hatColor: '#3a3430', hatBand: '#1e1a18'
  },
  thug: {
    hair: '#2a2220', hairLight: '#4a3c36', skin: '#b07a5c', skinShade: '#855943',
    coat: '#2e2522', coatLight: '#4a3a33', coatShade: '#1e1816',
    shirt: '#6e2a26', shirtShade: '#4e1d1a', trousers: '#2c2c33',
    trousersLight: '#44444c', shoes: '#231c1a', shoeLight: '#3e322d',
    detail: '#6e2a26', hat: 'cap', hatColor: '#3d3a36', hatBand: '#2a2826'
  },
  thug2: {
    hair: '#8a6a3c', hairLight: '#ab8a58', skin: '#c08a6a', skinShade: '#935f48',
    coat: '#3b3f44', coatLight: '#575c63', coatShade: '#282b2f',
    shirt: '#bfb49c', shirtShade: '#968b75', trousers: '#2a2a2e',
    trousersLight: '#424248', shoes: '#231c1a', shoeLight: '#3e322d',
    detail: '#b99a58'
  },
  guard: {
    hair: '#231d1b', hairLight: '#453833', skin: '#b48062', skinShade: '#86584a',
    coat: '#2c3444', coatLight: '#46506a', coatShade: '#1d2330',
    shirt: '#c9c3b5', shirtShade: '#9d978a', trousers: '#262b36',
    trousersLight: '#3b4250', shoes: '#1d1a1a', shoeLight: '#35302e',
    detail: '#b99a58', hat: 'beanie', hatColor: '#4b2b2b', hatBand: '#3a2020'
  },
  agent: {
    hair: '#261f1c', hairLight: '#4a3c35', skin: '#ba8666', skinShade: '#8b5e49',
    coat: '#34404f', coatLight: '#4f5f73', coatShade: '#232c37',
    shirt: '#d8d4c8', shirtShade: '#aaa598', trousers: '#2a3340',
    trousersLight: '#3f4b5c', shoes: '#151313', shoeLight: '#2e2a28',
    detail: '#d4b25a', hat: 'police', hatColor: '#1f2630', hatBand: '#0f1216'
  },
  nico: {
    hair: '#8f8a84', hairLight: '#b3aea6', skin: '#a8704f', skinShade: '#7c4f39',
    coat: '#3f5a78', coatLight: '#56759a', coatShade: '#2d4058',
    shirt: '#b8ab94', shirtShade: '#8f846f', trousers: '#34496a',
    trousersLight: '#4a6288', shoes: '#3a2c24', shoeLight: '#5a4636',
    detail: '#c8b27a', mustache: true, hat: 'beanie', hatColor: '#6d3a2c', hatBand: '#52291f'
  },
  tonino: {
    hair: '#3a302c', hairLight: '#5c4c44', skin: '#c9906e', skinShade: '#9a6650',
    coat: '#e0d9cb', coatLight: '#f3eee4', coatShade: '#b9b1a2',
    shirt: '#e0d9cb', shirtShade: '#b9b1a2', trousers: '#2d2a2a',
    trousersLight: '#454040', shoes: '#231c1a', shoeLight: '#3e322d',
    detail: '#6b1f22', mustache: true, bald: true
  },
  paolo: {
    hair: '#4a3e38', hairLight: '#8a7e76', skin: '#bf8a6a', skinShade: '#906048',
    coat: '#4a3a30', coatLight: '#6a5646', coatShade: '#33281f',
    shirt: '#e0d8c8', shirtShade: '#b8ae9c', trousers: '#3a3230',
    trousersLight: '#524846', shoes: '#3a2a22', shoeLight: '#5a463a',
    detail: '#b99a58', mustache: true, glasses: true
  },
  patron: {
    hair: '#3a2c26', hairLight: '#5a4840', skin: '#b17c5f', skinShade: '#855a45',
    coat: '#4b4040', coatLight: '#655858', coatShade: '#342c2c',
    shirt: '#a79b86', shirtShade: '#80755f', trousers: '#2e2a2c',
    trousersLight: '#454043', shoes: '#2a201c', shoeLight: '#44362e',
    detail: '#8a6a3c', hat: 'fedora', hatColor: '#2e2828', hatBand: '#1b1717'
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

function hat(ctx, c, x, y) {
  if (c.hat === 'fedora') {
    block(ctx, c.hatColor, x + 1, y - 1, 8, 3);
    block(ctx, c.hatBand, x + 1, y + 1, 8, 1);
    block(ctx, c.hatColor, x - 1, y + 2, 12, 1);
  } else if (c.hat === 'cap') {
    block(ctx, c.hatColor, x, y, 9, 3);
    block(ctx, c.hatBand, x + 7, y + 2, 4, 1);
  } else if (c.hat === 'beanie') {
    block(ctx, c.hatColor, x, y - 1, 10, 4);
    block(ctx, c.hatBand, x, y + 2, 10, 1);
  } else if (c.hat === 'police') {
    block(ctx, c.hatColor, x, y - 1, 10, 3);
    block(ctx, c.hatBand, x, y + 2, 10, 1);
    block(ctx, c.hatBand, x + 7, y + 3, 4, 1);
    block(ctx, c.detail, x + 5, y, 2, 1);
  }
}

function head(ctx, c, x, y, blink = false) {
  block(ctx, c.skinShade, x + 1, y + 4, 8, 8);
  block(ctx, c.skin, x + 2, y + 3, 7, 7);
  block(ctx, c.skin, x + 8, y + 5, 2, 3); // profile nose
  if (c.bald) {
    block(ctx, c.hair, x, y + 4, 3, 4);
    block(ctx, c.skin, x + 2, y + 1, 6, 3);
  } else {
    block(ctx, c.hair, x, y + 1, 10, 4);
    block(ctx, c.hair, x, y + 3, 3, 6);
    block(ctx, c.hairLight, x + 2, y + 1, 6, 1);
    block(ctx, c.hairLight, x + 1, y + 4, 1, 3);
  }
  if (c.longHair) block(ctx, c.hair, x, y + 8, 2, 5);
  block(ctx, c.skinShade, x + 1, y + 7, 2, 2); // ear
  block(ctx, c.hair, x + 7, y + 5, 2, 1); // brow
  block(ctx, c.coatShade, x + 8, y + (blink ? 7 : 6), 1, 1); // eye
  if (c.glasses) block(ctx, '#1d1618', x + 6, y + 6, 4, 1);
  if (c.mustache) block(ctx, c.hair, x + 7, y + 8, 3, 1);
  else block(ctx, c.skinShade, x + 8, y + 9, 2, 1); // mouth
  if (c.hat) hat(ctx, c, x, y);
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

function jacket(ctx, c, bob = 0, dx = 0) {
  block(ctx, c.coatShade, 6 + dx, 12 + bob, 12, 12);
  block(ctx, c.coat, 7 + dx, 13 + bob, 10, 10);
  block(ctx, c.coatLight, 7 + dx, 14 + bob, 2, 7);
  block(ctx, c.shirtShade, 12 + dx, 13 + bob, 4, 8);
  block(ctx, c.shirt, 12 + dx, 14 + bob, 3, 6);
  block(ctx, c.coatLight, 11 + dx, 13 + bob, 2, 4); // left lapel
  block(ctx, c.coatShade, 15 + dx, 13 + bob, 2, 7); // right lapel
  block(ctx, c.detail, 14 + dx, 20 + bob, 1, 1); // button
  block(ctx, c.coatShade, 7 + dx, 23 + bob, 10, 1);
}

// A standing body with optional arm overrides. Arms are [shoulder, elbow, hand].
function drawPose(ctx, c, pose) {
  const { step = 0, bob = 0, blink = false, armLift = 0, rearLift = 0, frontLift = 0,
    dx = 0, headDx = 0, headDy = 0, rearArm = null, frontArm = null, gun = null } = pose;
  const rearFoot = 14 - step;
  const frontFoot = 10 + step;

  standingLeg(ctx, c, 15, 15 - step * 0.5, rearFoot, rearLift, false);
  const ra = rearArm || [[8, 15 + bob], [7 + step * 0.5, 19 + bob - armLift], [8 + step, 22 + bob - armLift]];
  arm(ctx, c, ra[0], ra[1], ra[2], false);
  jacket(ctx, c, bob, dx);
  block(ctx, c.skinShade, 12 + dx, 10 + bob, 3, 3); // neck
  head(ctx, c, 8 + dx + headDx, 1 + bob + headDy, blink);
  standingLeg(ctx, c, 10, 10 + step * 0.5, frontFoot, frontLift, true);
  const fa = frontArm || [[17, 15 + bob], [18 - step * 0.5, 19 + bob - armLift], [18 - step, 22 + bob - armLift]];
  arm(ctx, c, fa[0], fa[1], fa[2], true);
  if (gun) {
    block(ctx, '#1d1c1f', gun[0], gun[1], 5, 2);
    block(ctx, '#3a383c', gun[0], gun[1], 5, 1);
    block(ctx, '#1d1c1f', gun[0], gun[1] + 2, 2, 2);
    if (gun[2]) {
      block(ctx, '#ffd27a', 22, gun[1] - 1, 2, 4);
      block(ctx, '#fff4d6', 22, gun[1], 2, 2);
    }
  }
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

function drawPunch(ctx, c, index) {
  const guardFront = [[17, 15], [19, 18], [18, 15]];
  const guardRear = [[9, 15], [12, 18], [14, 15]];
  if (index === 0) {
    drawPose(ctx, c, { step: 2, dx: -1, headDx: -1, rearArm: guardRear, frontArm: [[16, 15], [14, 18], [16, 14]] });
  } else if (index === 1) {
    drawPose(ctx, c, { step: 2, dx: 1, headDx: 1, rearArm: guardRear, frontArm: [[18, 14], [20, 14], [22, 14]] });
  } else if (index === 2) {
    drawPose(ctx, c, { step: 3, dx: 2, headDx: 2, frontArm: guardFront, rearArm: [[10, 14], [16, 13], [22, 13]] });
  } else {
    drawPose(ctx, c, { step: 1, rearArm: guardRear, frontArm: guardFront });
  }
}

function drawHurt(ctx, c, index) {
  drawPose(ctx, c, {
    step: index ? 1 : 2, dx: -1, headDx: -2, headDy: index ? 1 : 0, bob: index,
    rearArm: [[8, 15], [5, 13], [4, 11]],
    frontArm: [[17, 15], [15, 12], [14, 10]]
  });
}

function drawDown(ctx, c, index) {
  if (index === 0) {
    // Knees buckling.
    block(ctx, c.trousers, 8, 26, 12, 3);
    shoe(ctx, c, 4, 30, false);
    shoe(ctx, c, 16, 30, true);
    block(ctx, c.coatShade, 6, 18, 12, 9);
    block(ctx, c.coat, 7, 19, 10, 7);
    block(ctx, c.shirt, 12, 19, 3, 5);
    block(ctx, c.skinShade, 11, 16, 3, 3);
    head(ctx, c, 6, 9, true);
    arm(ctx, c, [16, 20], [18, 24], [18, 28], true);
    return;
  }
  // Flat on the street, head towards the back.
  shoe(ctx, c, 18, 28, true);
  block(ctx, c.trousers, 13, 27, 7, 3);
  block(ctx, c.trousersLight, 13, 27, 7, 1);
  block(ctx, c.coatShade, 5, 25, 10, 6);
  block(ctx, c.coat, 6, 25, 9, 4);
  block(ctx, c.shirt, 9, 25, 3, 2);
  block(ctx, c.coat, 7, 29, 8, 2);
  block(ctx, c.skin, 15, 29, 2, 2);
  block(ctx, c.skinShade, 0, 25, 7, 6);
  block(ctx, c.skin, 1, 25, 5, 4);
  block(ctx, c.hair, 0, 25, 2, 6);
  if (c.hat) block(ctx, c.hatColor, 0, 31, 6, 1);
}

function drawAim(ctx, c, index) {
  const recoil = index === 1 ? -1 : 0;
  drawPose(ctx, c, {
    step: 1, dx: index, headDx: index,
    rearArm: [[9, 15], [13, 16], [17, 15 + recoil]],
    frontArm: [[17, 15], [19, 15 + recoil], [20, 15 + recoil]],
    gun: [18, 13 + recoil, index === 1]
  });
}

function drawFrame(ctx, c, state, index) {
  if (state === 'idle') {
    drawPose(ctx, c, { bob: index === 2 ? 1 : 0, blink: index === 3 });
  } else if (state === 'walk') {
    const steps = [0, 1, 2, 3, 0, -1, -2, -3];
    const lifts = [0, 0, 0, 1, 2, 1, 0, 0];
    drawPose(ctx, c, {
      step: steps[index], bob: index === 2 || index === 6 ? 1 : 0,
      frontLift: lifts[index], rearLift: lifts[(index + 4) % 8]
    });
  } else if (state === 'crouch') {
    drawCrouch(ctx, c, [-2, -1, 0, 2, 1, 0][index]);
  } else if (state === 'jump') {
    drawJump(ctx, c, index);
  } else if (state === 'punch') {
    drawPunch(ctx, c, index);
  } else if (state === 'hurt') {
    drawHurt(ctx, c, index);
  } else if (state === 'down') {
    drawDown(ctx, c, index);
  } else if (state === 'aim') {
    drawAim(ctx, c, index);
  }
}

const LAYOUT = [['idle', 4], ['walk', 8], ['crouch', 6], ['jump', 4], ['punch', 4], ['hurt', 2], ['down', 2], ['aim', 2]];

function makeSheet(scene, key, look) {
  const count = LAYOUT.reduce((sum, [, frames]) => sum + frames, 0);
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * count;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let frame = 0;
  for (const [state, frames] of LAYOUT) {
    for (let i = 0; i < frames; i++, frame++) {
      ctx.save();
      ctx.translate(frame * FRAME_W, 0);
      // Clip so extended fists and muzzle flashes never bleed into the
      // neighbouring frame.
      ctx.beginPath();
      ctx.rect(0, 0, FRAME_W, FRAME_H);
      ctx.clip();
      drawFrame(ctx, look, state, i);
      ctx.restore();
    }
  }
  // A CanvasTexture is already registered under this key. Give it numeric
  // frames directly; addSpriteSheet does not create a second named texture
  // when its source is an existing Phaser Texture.
  const texture = scene.textures.addCanvas(key, canvas);
  if (!texture) throw new Error(`Cannot register character texture: ${key}`);
  for (let i = 0; i < count; i++) {
    if (!texture.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H)) {
      throw new Error(`Cannot register frame ${i} in ${key}`);
    }
  }
}

export function installCharacterSprites(scene) {
  Object.entries(LOOKS).forEach(([name, look]) => {
    const sheet = `${name}-sheet`;
    if (scene.textures.exists(sheet)) return;
    makeSheet(scene, sheet, look);
    const create = (suffix, start, end, frameRate, repeat = -1) => scene.anims.create({
      key: `${name}-${suffix}`, frames: scene.anims.generateFrameNumbers(sheet, { start, end }),
      frameRate, repeat
    });
    create('idle', 0, 3, name === 'gianlico' ? 4 : 3);
    create('walk', 4, 11, 12);
    create('crouch-walk', 12, 17, 9);
    create('punch', 22, 25, 16, 0);
    create('hurt', 26, 27, 10, 0);
    create('down', 28, 29, 5, 0);
  });
}
