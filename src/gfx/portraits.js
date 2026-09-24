// Front-facing 64×64 dialogue portraits, drawn from the same palettes as the
// sprites so a character reads the same in the world and in conversation.
import { LOOKS } from './characters.js';

function block(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const TRAITS = {
  gianlico: { brow: 'worried', jaw: 0, age: 0 },
  borge: { brow: 'stern', jaw: 2, age: 2 },
  elena: { brow: 'soft', jaw: -2, age: 0 },
  cranier: { brow: 'stern', jaw: 1, age: 3 },
  vitale: { brow: 'stern', jaw: 2, age: 2 },
  thug: { brow: 'stern', jaw: 3, age: 1 },
  nico: { brow: 'soft', jaw: 1, age: 3 },
  tonino: { brow: 'soft', jaw: 2, age: 2 },
  agent: { brow: 'stern', jaw: 1, age: 1 },
  guard: { brow: 'stern', jaw: 2, age: 1 },
  paolo: { brow: 'soft', jaw: 1, age: 3 }
};

function drawPortrait(ctx, c, t) {
  // Shoulders and collar.
  block(ctx, c.coatShade, 4, 50, 56, 14);
  block(ctx, c.coat, 7, 49, 50, 15);
  block(ctx, c.coatLight, 9, 50, 8, 14);
  block(ctx, c.shirtShade, 25, 48, 14, 16);
  block(ctx, c.shirt, 27, 48, 10, 16);
  block(ctx, c.coatLight, 21, 48, 6, 10);
  block(ctx, c.coatShade, 37, 48, 6, 12);
  if (c === LOOKS.vitale || c === LOOKS.borge) block(ctx, c.detail, 30, 50, 4, 14); // tie

  // Neck.
  block(ctx, c.skinShade, 25, 40, 14, 10);

  // Head with a softened silhouette.
  const jaw = t.jaw;
  block(ctx, c.skinShade, 17, 15, 30, 29);
  block(ctx, c.skin, 19, 14, 27, 29);
  block(ctx, c.skinShade, 20 - jaw / 2, 42, 24 + jaw, 3);
  block(ctx, c.skin, 22, 42, 20, 2);
  block(ctx, c.skinShade, 18, 22, 3, 18); // cheek shadow
  block(ctx, c.skinShade, 15, 26, 4, 9);  // ears
  block(ctx, c.skinShade, 46, 26, 3, 9);

  // Hair.
  if (c.bald) {
    block(ctx, c.hair, 16, 22, 4, 10);
    block(ctx, c.hair, 45, 22, 3, 10);
    block(ctx, '#ffffff22', 25, 15, 12, 2);
  } else {
    block(ctx, c.hair, 16, 9, 32, 9);
    block(ctx, c.hair, 15, 13, 5, 14);
    block(ctx, c.hair, 44, 13, 4, 11);
    block(ctx, c.hairLight, 21, 10, 18, 2);
    block(ctx, c.hairLight, 18, 13, 2, 7);
    if (c.longHair) {
      block(ctx, c.hair, 13, 16, 6, 38);
      block(ctx, c.hair, 45, 16, 6, 36);
      block(ctx, c.hairLight, 14, 22, 2, 20);
      block(ctx, c.hair, 20, 16, 14, 4);
    }
  }
  if (t.age >= 3) {
    block(ctx, c.hairLight, 16, 16, 3, 8);
    block(ctx, c.hairLight, 45, 16, 3, 6);
  }

  // Eyes and brows.
  block(ctx, '#e8e0d0', 23, 28, 6, 3);
  block(ctx, '#e8e0d0', 35, 28, 6, 3);
  block(ctx, '#1d1618', 26, 28, 2, 3);
  block(ctx, '#1d1618', 38, 28, 2, 3);
  if (t.brow === 'stern') {
    block(ctx, c.hair, 22, 24, 8, 2);
    block(ctx, c.hair, 27, 26, 3, 1);
    block(ctx, c.hair, 34, 24, 8, 2);
    block(ctx, c.hair, 34, 26, 3, 1);
  } else if (t.brow === 'worried') {
    block(ctx, c.hair, 22, 25, 8, 2);
    block(ctx, c.hair, 27, 24, 3, 1);
    block(ctx, c.hair, 34, 25, 8, 2);
    block(ctx, c.hair, 34, 24, 3, 1);
  } else {
    block(ctx, c.hair, 22, 24, 8, 2);
    block(ctx, c.hair, 34, 24, 8, 2);
  }
  if (t.age >= 2) {
    block(ctx, c.skinShade, 22, 32, 6, 1);
    block(ctx, c.skinShade, 36, 32, 6, 1);
  }

  if (c.glasses) {
    ctx.strokeStyle = '#1d1618';
    ctx.lineWidth = 1;
    ctx.strokeRect(21.5, 26.5, 9, 6);
    ctx.strokeRect(33.5, 26.5, 9, 6);
    block(ctx, '#1d1618', 30, 28, 4, 1);
  }

  // Nose and mouth.
  block(ctx, c.skinShade, 31, 30, 3, 8);
  block(ctx, c.skinShade, 29, 37, 7, 2);
  if (c.mustache) {
    block(ctx, c.hair, 25, 39, 15, 3);
    block(ctx, '#6e3f33', 28, 42, 9, 1);
  } else {
    block(ctx, '#7a4a3a', 27, 41, 11, 2);
    if (c.longHair) block(ctx, '#95524a', 28, 41, 9, 1);
  }

  // Headwear.
  if (c.hat === 'fedora') {
    block(ctx, c.hatColor, 10, 12, 44, 4);
    block(ctx, c.hatColor, 17, 1, 30, 12);
    block(ctx, c.hatBand, 17, 9, 30, 3);
    block(ctx, '#ffffff18', 20, 2, 20, 2);
  } else if (c.hat === 'cap') {
    block(ctx, c.hatColor, 15, 6, 34, 9);
    block(ctx, c.hatBand, 14, 14, 36, 3);
  } else if (c.hat === 'beanie') {
    block(ctx, c.hatColor, 15, 4, 34, 14);
    block(ctx, c.hatBand, 15, 14, 34, 4);
    for (let x = 17; x < 48; x += 4) block(ctx, c.hatBand, x, 5, 1, 9);
  } else if (c.hat === 'police') {
    block(ctx, c.hatColor, 14, 3, 36, 10);
    block(ctx, c.hatBand, 16, 12, 32, 4);
    block(ctx, '#0b0d10', 18, 16, 28, 3);
    block(ctx, c.detail, 30, 5, 4, 5);
  }
}

export function installPortraits(scene) {
  Object.keys(TRAITS).forEach((name) => {
    const key = `portrait-${name}`;
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, 64, 64);
    const ctx = tex.context;
    ctx.imageSmoothingEnabled = false;
    drawPortrait(ctx, LOOKS[name], TRAITS[name]);
    tex.refresh();
  });
}
