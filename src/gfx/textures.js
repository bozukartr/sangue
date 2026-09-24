// Procedural environment art. Textures are painted at half resolution and
// displayed at 2× (`PX`) so props share the chunky pixel grid of the
// characters. Seeded randomness keeps every building identical between runs.
export const PX = 2;

// Lit window positions per facade key, in texture pixels. Levels use these to
// place light halos on the street.
export const FACADE_LIGHTS = {};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1, 7), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.context;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  tex.refresh();
}

// ------------------------------------------------------------------ light

function lights(scene) {
  canvasTex(scene, 'px', 4, 4, (ctx) => rect(ctx, '#ffffff', 0, 0, 4, 4));

  canvasTex(scene, 'glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

  // Darkness cut-out: a solid core with a soft rim.
  canvasTex(scene, 'lightmask', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

  canvasTex(scene, 'soft', 16, 16, (ctx) => {
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  });

  // Flashlight / vision cone, apex at the left edge centre.
  canvasTex(scene, 'cone', 256, 128, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(256, 0);
    ctx.lineTo(256, 128);
    ctx.lineTo(0, 68);
    ctx.closePath();
    ctx.fill();
  });

  canvasTex(scene, 'vignette', 320, 180, (ctx) => {
    const g = ctx.createRadialGradient(160, 90, 40, 160, 90, 200);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 320, 180);
  });

  canvasTex(scene, 'raindrop', 2, 16, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 16);
    g.addColorStop(0, 'rgba(200,210,225,0)');
    g.addColorStop(1, 'rgba(200,210,225,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 16);
  });

  canvasTex(scene, 'fog', 256, 64, (ctx) => {
    const rnd = mulberry32(77);
    for (let i = 0; i < 60; i++) {
      const x = rnd() * 256;
      const y = 16 + rnd() * 32;
      const r = 10 + rnd() * 22;
      [x, x - 256, x + 256].forEach((cx) => {
        const g = ctx.createRadialGradient(cx, y, 0, cx, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.08)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, y - r, r * 2, r * 2);
      });
    }
  });
}

// ------------------------------------------------------------------ ground

function groundTiles(scene) {
  // Roman sampietrini: square basalt setts in offset rows, wet on top.
  canvasTex(scene, 'tile-street', 32, 40, (ctx) => {
    rect(ctx, '#1a1618', 0, 0, 32, 40);
    rect(ctx, '#7a6d60', 0, 0, 32, 2);
    rect(ctx, '#4a423c', 0, 2, 32, 2);
    const rnd = mulberry32(11);
    for (let row = 0; row < 9; row++) {
      const y = 5 + row * 4;
      const off = row % 2 ? 2 : 0;
      for (let x = -off; x < 32; x += 4) {
        const dark = 0.25 + row * 0.06;
        const base = rnd() > 0.5 ? '#3c3634' : '#35302f';
        rect(ctx, shade(base, -dark * 0.6), x, y, 3, 3);
        if (row < 3 && rnd() > 0.55) rect(ctx, 'rgba(190,170,140,0.18)', x, y, 3, 1);
      }
    }
  });

  canvasTex(scene, 'tile-quay', 32, 40, (ctx) => {
    rect(ctx, '#1c1d20', 0, 0, 32, 40);
    rect(ctx, '#6c6a64', 0, 0, 32, 2);
    rect(ctx, '#3f3e3b', 0, 2, 32, 5);
    rect(ctx, '#b99a58', 0, 3, 32, 1);
    const rnd = mulberry32(21);
    for (let i = 0; i < 40; i++) rect(ctx, 'rgba(0,0,0,0.25)', rnd() * 32, 8 + rnd() * 32, 2, 1);
    rect(ctx, '#2a2a2c', 0, 20, 32, 1);
    rect(ctx, '#2a2a2c', 15, 8, 1, 12);
  });

  canvasTex(scene, 'tile-wood', 32, 40, (ctx) => {
    rect(ctx, '#2a1f1b', 0, 0, 32, 40);
    rect(ctx, '#6b4b36', 0, 0, 32, 2);
    for (let y = 2; y < 40; y += 3) {
      rect(ctx, y % 2 ? '#3d2b22' : '#452f25', 0, y, 32, 2);
      rect(ctx, '#2a1d17', (y * 7) % 32, y, 1, 2);
    }
    const g = ctx.createLinearGradient(0, 0, 0, 40);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 40);
  });

  canvasTex(scene, 'tile-lino', 32, 40, (ctx) => {
    rect(ctx, '#1d2022', 0, 0, 32, 40);
    rect(ctx, '#6f7470', 0, 0, 32, 2);
    for (let y = 2; y < 40; y += 6) {
      for (let x = 0; x < 32; x += 8) {
        rect(ctx, ((x + y) / 2) % 2 ? '#3a3e3c' : '#2e3231', x + (y % 12 ? 4 : 0), y, 8, 6);
      }
    }
    const g = ctx.createLinearGradient(0, 0, 0, 40);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 40);
  });

  canvasTex(scene, 'tile-gravel', 32, 40, (ctx) => {
    rect(ctx, '#1b1a17', 0, 0, 32, 40);
    rect(ctx, '#8d8676', 0, 0, 32, 2);
    rect(ctx, '#5d584c', 0, 2, 32, 3);
    const rnd = mulberry32(31);
    for (let i = 0; i < 110; i++) {
      const y = 5 + rnd() * 35;
      rect(ctx, rnd() > 0.5 ? '#4a463d' : '#3a372f', rnd() * 32, y, 1, 1);
    }
  });
}

// ------------------------------------------------------------------ props

function props(scene) {
  canvasTex(scene, 'crate', 16, 16, (ctx) => {
    rect(ctx, '#3d2c22', 0, 0, 16, 16);
    rect(ctx, '#6a4a35', 1, 1, 14, 14);
    rect(ctx, '#7d5a41', 1, 1, 14, 1);
    rect(ctx, '#3d2c22', 1, 5, 14, 1);
    rect(ctx, '#3d2c22', 1, 10, 14, 1);
    for (let i = 1; i < 15; i++) rect(ctx, '#523a2b', i, i, 1, 1);
    rect(ctx, '#b99a58', 2, 12, 3, 2);
  });

  canvasTex(scene, 'barrel', 12, 16, (ctx) => {
    rect(ctx, '#2b3b40', 1, 0, 10, 16);
    rect(ctx, '#3f5359', 2, 0, 3, 16);
    rect(ctx, '#1b2528', 1, 3, 10, 1);
    rect(ctx, '#1b2528', 1, 12, 10, 1);
    rect(ctx, '#6b1f22', 4, 6, 4, 3);
  });

  canvasTex(scene, 'firebarrel', 12, 16, (ctx) => {
    rect(ctx, '#3a2a22', 1, 2, 10, 14);
    rect(ctx, '#4c3a2f', 2, 2, 3, 14);
    rect(ctx, '#1b1512', 1, 5, 10, 1);
    rect(ctx, '#ffb347', 2, 0, 8, 2);
    rect(ctx, '#ff7a2a', 3, 1, 6, 2);
  });

  // Roman street lamp: cast-iron post, curved bracket, lantern.
  canvasTex(scene, 'lamp', 20, 80, (ctx) => {
    rect(ctx, '#1c1a19', 7, 12, 3, 64);
    rect(ctx, '#2f2b28', 8, 12, 1, 64);
    rect(ctx, '#1c1a19', 5, 74, 7, 6);
    rect(ctx, '#1c1a19', 9, 10, 8, 2);
    rect(ctx, '#1c1a19', 15, 11, 2, 3);
    rect(ctx, '#1c1a19', 12, 13, 8, 2);
    rect(ctx, '#f3d38c', 13, 15, 6, 7);
    rect(ctx, '#ffe9b8', 14, 16, 4, 4);
    rect(ctx, '#1c1a19', 13, 22, 6, 1);
    rect(ctx, '#1c1a19', 15, 23, 2, 1);
  });

  canvasTex(scene, 'wall-lamp', 8, 10, (ctx) => {
    rect(ctx, '#1c1a19', 0, 2, 3, 2);
    rect(ctx, '#1c1a19', 2, 1, 6, 2);
    rect(ctx, '#f3d38c', 3, 3, 4, 5);
    rect(ctx, '#1c1a19', 3, 8, 4, 1);
  });

  canvasTex(scene, 'ledger', 11, 13, (ctx) => {
    rect(ctx, '#3f1012', 0, 0, 11, 13);
    rect(ctx, '#6b1f22', 1, 0, 10, 12);
    rect(ctx, '#b99a58', 2, 2, 1, 9);
    rect(ctx, '#b99a58', 5, 3, 4, 1);
    rect(ctx, '#e7ddca', 10, 1, 1, 11);
  });

  canvasTex(scene, 'papers', 12, 6, (ctx) => {
    rect(ctx, '#bfb29a', 0, 2, 12, 4);
    rect(ctx, '#e7ddca', 1, 0, 10, 4);
    rect(ctx, '#8e8378', 3, 1, 6, 1);
  });

  canvasTex(scene, 'wallet', 8, 6, (ctx) => {
    rect(ctx, '#3a2418', 0, 0, 8, 6);
    rect(ctx, '#5a3a28', 0, 0, 8, 2);
    rect(ctx, '#9fb08a', 5, 1, 3, 2);
  });

  canvasTex(scene, 'sparkle', 9, 9, (ctx) => {
    rect(ctx, '#fff4d6', 4, 0, 1, 9);
    rect(ctx, '#fff4d6', 0, 4, 9, 1);
    rect(ctx, '#ffffff', 3, 3, 3, 3);
  });

  canvasTex(scene, 'bollard', 8, 10, (ctx) => {
    rect(ctx, '#2a2a2c', 1, 2, 6, 8);
    rect(ctx, '#3f3f42', 0, 0, 8, 3);
    rect(ctx, '#4f4f52', 1, 0, 3, 1);
  });

  canvasTex(scene, 'fusebox', 10, 14, (ctx) => {
    rect(ctx, '#2d3236', 0, 0, 10, 14);
    rect(ctx, '#4a5156', 1, 1, 8, 12);
    rect(ctx, '#d6b54a', 2, 2, 6, 2);
    rect(ctx, '#1b1d1f', 4, 7, 2, 4);
    rect(ctx, '#9c2b2f', 4, 7, 2, 1);
  });

  canvasTex(scene, 'alarm-light', 6, 4, (ctx) => {
    rect(ctx, '#3a1414', 0, 2, 6, 2);
    rect(ctx, '#c0393d', 1, 0, 4, 3);
  });
}

// ------------------------------------------------------------------ Rome

const FACADES = {
  // Warm Trastevere plaster: ochre, terracotta, faded pink.
  'facade-ochre': { w: 150, h: 200, wall: '#8a6440', trim: '#b89468', shutter: '#4a5a42', floors: 4, seed: 3 },
  'facade-terra': { w: 130, h: 180, wall: '#7c4431', trim: '#a8715a', shutter: '#3e4f3d', floors: 3, seed: 7 },
  'facade-rose': { w: 170, h: 210, wall: '#8a5a55', trim: '#b8857d', shutter: '#4b5a46', floors: 4, seed: 12 },
  'facade-cream': { w: 140, h: 190, wall: '#8c7a5c', trim: '#b8a680', shutter: '#5a4a3a', floors: 4, seed: 19 },
  'facade-grey': { w: 220, h: 170, wall: '#4c4a47', trim: '#6c6a65', shutter: '#353a3d', floors: 3, seed: 23, industrial: true },
  'facade-questura': { w: 240, h: 210, wall: '#6a6558', trim: '#8e887a', shutter: '#3a3a38', floors: 4, seed: 31, formal: true },
  'facade-villa': { w: 260, h: 200, wall: '#b39b7a', trim: '#d8c6a4', shutter: '#4a5a42', floors: 2, seed: 41, formal: true }
};

function drawFacade(ctx, key, o) {
  const rnd = mulberry32(o.seed);
  const { w, h } = o;
  const lights = [];
  rect(ctx, o.wall, 0, 6, w, h - 6);
  // Plaster wear.
  for (let i = 0; i < w * h / 18; i++) {
    const c = rnd() > 0.5 ? shade(o.wall, -0.12 - rnd() * 0.1) : shade(o.wall, 0.06);
    rect(ctx, c, rnd() * w, 6 + rnd() * (h - 6), 1 + rnd() * 3, 1 + rnd() * 2);
  }
  // Big faded patches where the plaster has fallen.
  for (let i = 0; i < 4; i++) {
    const px = rnd() * (w - 30);
    const py = 20 + rnd() * (h - 60);
    rect(ctx, shade(o.wall, -0.18), px, py, 12 + rnd() * 20, 6 + rnd() * 10);
    rect(ctx, '#6b5a4a', px + 3, py + 2, 4, 2);
  }
  // Cornice.
  rect(ctx, shade(o.trim, 0.1), 0, 0, w, 3);
  rect(ctx, o.trim, 0, 3, w, 2);
  rect(ctx, shade(o.wall, -0.35), 0, 5, w, 2);
  if (o.formal) for (let x = 2; x < w; x += 6) rect(ctx, shade(o.trim, -0.1), x, 5, 3, 3);

  const groundH = 44;
  const top = 10;
  const floorH = Math.floor((h - groundH - top) / o.floors);
  const cols = Math.max(2, Math.floor(w / 36));
  const gap = w / cols;

  for (let f = 0; f < o.floors; f++) {
    const fy = top + f * floorH;
    rect(ctx, shade(o.trim, -0.05), 0, fy + floorH - 2, w, 2); // string course
    for (let c = 0; c < cols; c++) {
      const cx = Math.round(gap * c + gap / 2);
      const ww = o.industrial ? 18 : 12;
      const wh = Math.min(22, floorH - 8);
      const wx = cx - ww / 2;
      const wy = fy + 3;
      // Frame.
      rect(ctx, o.trim, wx - 2, wy - 2, ww + 4, wh + 4);
      if (o.formal) rect(ctx, shade(o.trim, 0.12), wx - 3, wy - 4, ww + 6, 2);
      const lit = rnd() > 0.62;
      rect(ctx, lit ? '#d9a55a' : '#1c1f26', wx, wy, ww, wh);
      if (lit) {
        rect(ctx, '#f0c47a', wx + 1, wy + 1, ww - 2, 3);
        rect(ctx, '#8e5a30', wx, wy + wh - 3, ww, 3);
        lights.push({ x: cx, y: wy + wh / 2 });
      } else {
        rect(ctx, '#2c3240', wx + 1, wy + 1, 3, wh - 2);
      }
      rect(ctx, o.trim, cx, wy, 1, wh);
      if (o.industrial) {
        rect(ctx, o.trim, wx, wy + wh / 2, ww, 1);
        continue;
      }
      // Persiane — some closed, some open.
      const closed = !lit && rnd() > 0.55;
      if (closed) {
        rect(ctx, o.shutter, wx, wy, ww, wh);
        for (let y = wy + 1; y < wy + wh; y += 2) rect(ctx, shade(o.shutter, -0.3), wx, y, ww, 1);
        rect(ctx, shade(o.shutter, -0.45), cx, wy, 1, wh);
      } else {
        rect(ctx, o.shutter, wx - 7, wy, 5, wh);
        rect(ctx, o.shutter, wx + ww + 2, wy, 5, wh);
        for (let y = wy + 1; y < wy + wh; y += 2) {
          rect(ctx, shade(o.shutter, -0.3), wx - 7, y, 5, 1);
          rect(ctx, shade(o.shutter, -0.3), wx + ww + 2, y, 5, 1);
        }
      }
      // Rain streaks.
      rect(ctx, 'rgba(0,0,0,0.12)', wx + 2, wy + wh + 2, 2, 10 + rnd() * 10);
      // Balcony with geraniums.
      if (f > 0 && rnd() > 0.55) {
        rect(ctx, shade(o.trim, -0.1), wx - 5, wy + wh + 1, ww + 10, 2);
        rect(ctx, '#1f1c1b', wx - 5, wy + wh - 6, ww + 10, 1);
        for (let x = wx - 5; x <= wx + ww + 5; x += 2) rect(ctx, '#1f1c1b', x, wy + wh - 6, 1, 7);
        for (let x = wx - 4; x < wx + ww + 4; x += 3) {
          rect(ctx, '#3f5a2f', x, wy + wh - 9, 2, 3);
          if (rnd() > 0.4) rect(ctx, rnd() > 0.5 ? '#b3262b' : '#d96a6a', x, wy + wh - 10, 2, 2);
        }
      }
    }
    // Laundry line across the floor.
    if (!o.formal && !o.industrial && f > 0 && rnd() > 0.5) {
      const ly = fy + floorH - 6;
      rect(ctx, '#2a2626', 4, ly, w - 8, 1);
      const colors = ['#d8d0c0', '#8a3a3a', '#5a6a8a', '#e0d8c0', '#6a7a5a'];
      for (let x = 8; x < w - 12; x += 10 + rnd() * 10) {
        rect(ctx, colors[Math.floor(rnd() * colors.length)], x, ly + 1, 4 + rnd() * 4, 4 + rnd() * 4);
      }
    }
  }

  // Ground floor: stone base and plinth.
  const gy = h - groundH;
  rect(ctx, shade(o.wall, -0.2), 0, gy, w, groundH);
  for (let y = gy + 4; y < h; y += 8) rect(ctx, shade(o.wall, -0.32), 0, y, w, 1);
  rect(ctx, shade(o.wall, -0.45), 0, h - 5, w, 5);
  rect(ctx, shade(o.trim, -0.1), 0, gy, w, 2);

  // Ivy climbing from the corner.
  if (!o.formal && !o.industrial) {
    const side = rnd() > 0.5 ? 0 : w - 18;
    for (let i = 0; i < 90; i++) {
      const y = h - rnd() * rnd() * (h * 0.8);
      const x = side + rnd() * 18;
      rect(ctx, rnd() > 0.5 ? '#2f4a2a' : '#3c5a32', x, y, 2, 2);
    }
  }
  FACADE_LIGHTS[key] = lights;
}

function rome(scene) {
  Object.entries(FACADES).forEach(([key, o]) => canvasTex(scene, key, o.w, o.h, (ctx) => drawFacade(ctx, key, o)));

  // Distant skyline with St Peter's dome, bell towers and umbrella pines.
  canvasTex(scene, 'skyline', 512, 140, (ctx) => {
    const rnd = mulberry32(5);
    const col = '#241e26';
    for (let x = 0; x < 512; x += 10 + rnd() * 16) {
      const bh = 30 + rnd() * 40;
      rect(ctx, col, x, 140 - bh, 12 + rnd() * 18, bh);
    }
    // Dome.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(170, 78, 30, 34, 0, Math.PI, 0);
    ctx.fill();
    rect(ctx, col, 138, 78, 64, 62);
    rect(ctx, col, 166, 34, 8, 14);
    rect(ctx, col, 168, 26, 4, 8);
    // Bell towers.
    [60, 330, 450].forEach((x) => {
      rect(ctx, col, x, 60, 12, 80);
      rect(ctx, col, x + 2, 52, 8, 8);
      rect(ctx, '#3a2f33', x + 3, 66, 6, 6);
    });
    // Umbrella pines.
    [100, 250, 290, 400, 490].forEach((x) => {
      rect(ctx, col, x, 80, 3, 60);
      ctx.beginPath();
      ctx.ellipse(x + 1, 78, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let i = 0; i < 18; i++) rect(ctx, 'rgba(217,165,90,0.35)', rnd() * 512, 90 + rnd() * 45, 1, 2);
  });

  canvasTex(scene, 'midrow', 512, 170, (ctx) => {
    const rnd = mulberry32(9);
    let x = 0;
    while (x < 512) {
      const bw = 50 + rnd() * 50;
      const bh = 90 + rnd() * 70;
      const c = rnd() > 0.5 ? '#3a2e31' : '#33292c';
      rect(ctx, c, x, 170 - bh, bw, bh);
      rect(ctx, shade(c, 0.12), x, 170 - bh, bw, 2);
      for (let wy = 170 - bh + 10; wy < 150; wy += 16) {
        for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
          const lit = rnd() > 0.78;
          rect(ctx, lit ? 'rgba(217,165,90,0.75)' : 'rgba(10,10,14,0.55)', wx, wy, 5, 8);
        }
      }
      // Roof tiles & chimneys.
      if (rnd() > 0.5) rect(ctx, shade(c, -0.2), x + bw * 0.3, 170 - bh - 8, 4, 8);
      x += bw;
    }
  });

  // ATAC bus, 1980 orange.
  canvasTex(scene, 'bus', 96, 36, (ctx) => {
    rect(ctx, '#1a1616', 2, 30, 92, 3);
    rect(ctx, '#c46a22', 0, 4, 96, 26);
    rect(ctx, '#e08a3a', 0, 4, 96, 3);
    rect(ctx, '#8a4516', 0, 26, 96, 4);
    for (let x = 6; x < 84; x += 13) {
      rect(ctx, '#1d2530', x, 9, 11, 9);
      rect(ctx, '#3a4a5a', x + 1, 10, 3, 7);
    }
    rect(ctx, '#1d2530', 86, 9, 9, 12);
    rect(ctx, '#f3d38c', 93, 22, 3, 3);
    rect(ctx, '#2a2020', 60, 10, 8, 18);
    rect(ctx, '#e7ddca', 4, 20, 22, 4);
    rect(ctx, '#6b1f22', 5, 21, 20, 2);
    [16, 76].forEach((x) => {
      rect(ctx, '#111', x - 6, 26, 12, 8);
      rect(ctx, '#444', x - 2, 28, 4, 4);
    });
  });

  // Alfa Romeo Alfetta, police blue.
  canvasTex(scene, 'alfetta', 60, 20, (ctx) => {
    rect(ctx, '#15181f', 4, 16, 52, 3);
    rect(ctx, '#243247', 2, 8, 56, 9);
    rect(ctx, '#2f4260', 14, 2, 28, 7);
    rect(ctx, '#1b2430', 16, 3, 11, 5);
    rect(ctx, '#1b2430', 29, 3, 11, 5);
    rect(ctx, '#e7ddca', 2, 12, 56, 1);
    rect(ctx, '#f3d38c', 56, 10, 2, 2);
    rect(ctx, '#9c2b2f', 2, 10, 2, 2);
    rect(ctx, '#3a70c0', 26, 0, 4, 2);
    [13, 46].forEach((x) => {
      rect(ctx, '#0d0d0f', x - 5, 14, 10, 6);
      rect(ctx, '#555', x - 2, 16, 4, 2);
    });
  });

  canvasTex(scene, 'fountain', 70, 34, (ctx) => {
    rect(ctx, '#5b5650', 0, 20, 70, 14);
    rect(ctx, '#7a746c', 0, 20, 70, 3);
    rect(ctx, '#27404a', 4, 23, 62, 4);
    rect(ctx, '#5b5650', 30, 6, 10, 16);
    rect(ctx, '#7a746c', 24, 6, 22, 3);
    rect(ctx, '#7a746c', 33, 0, 4, 6);
    rect(ctx, 'rgba(160,200,220,0.6)', 34, 2, 1, 6);
    rect(ctx, 'rgba(160,200,220,0.4)', 22, 9, 1, 12);
    rect(ctx, 'rgba(160,200,220,0.4)', 47, 9, 1, 12);
  });

  canvasTex(scene, 'vespa', 30, 18, (ctx) => {
    rect(ctx, '#0f0f10', 2, 12, 8, 6);
    rect(ctx, '#0f0f10', 21, 12, 8, 6);
    rect(ctx, '#7a9a8a', 16, 5, 12, 9);
    rect(ctx, '#7a9a8a', 6, 8, 12, 5);
    rect(ctx, '#2a2222', 12, 5, 8, 3);
    rect(ctx, '#7a9a8a', 25, 0, 2, 7);
    rect(ctx, '#2a2a2a', 23, 0, 6, 1);
  });

  canvasTex(scene, 'awning', 60, 14, (ctx) => {
    for (let x = 0; x < 60; x += 6) rect(ctx, (x / 6) % 2 ? '#e7ddca' : '#6b1f22', x, 0, 6, 10);
    for (let x = 0; x < 60; x += 6) rect(ctx, (x / 6) % 2 ? '#c8bea8' : '#4f1618', x, 10, 6, 4);
  });

  canvasTex(scene, 'newsstand', 50, 56, (ctx) => {
    rect(ctx, '#25332d', 0, 8, 50, 48);
    rect(ctx, '#3a4a40', 0, 8, 50, 3);
    rect(ctx, '#1a221e', 0, 0, 50, 8);
    rect(ctx, '#d9a55a', 6, 16, 38, 18);
    rect(ctx, '#f0c47a', 7, 17, 36, 3);
    const colors = ['#b3262b', '#e7ddca', '#5a6a8a', '#d8c070'];
    for (let x = 4; x < 46; x += 6) rect(ctx, colors[(x / 6) % colors.length | 0], x, 38, 5, 8);
    rect(ctx, '#e7ddca', 10, 2, 30, 4);
  });
}

// ------------------------------------------------------------------ port

function port(scene) {
  const containers = { red: '#7a2a24', blue: '#27445e', green: '#3a5a3a', rust: '#7a4a24' };
  Object.entries(containers).forEach(([name, color]) => {
    canvasTex(scene, `container-${name}`, 64, 28, (ctx) => {
      rect(ctx, shade(color, -0.35), 0, 0, 64, 28);
      rect(ctx, color, 1, 1, 62, 26);
      for (let x = 3; x < 62; x += 4) rect(ctx, shade(color, -0.22), x, 2, 1, 24);
      rect(ctx, shade(color, 0.15), 1, 1, 62, 1);
      rect(ctx, shade(color, -0.45), 0, 26, 64, 2);
      rect(ctx, '#d8d0c0', 6, 5, 16, 3);
      rect(ctx, shade(color, -0.4), 58, 4, 1, 20);
      const rnd = mulberry32(color.length * 13);
      for (let i = 0; i < 20; i++) rect(ctx, 'rgba(90,50,30,0.35)', rnd() * 64, rnd() * 28, 2, 1);
    });
  });

  canvasTex(scene, 'crane', 110, 190, (ctx) => {
    const c = '#1d2024';
    rect(ctx, c, 20, 40, 5, 150);
    rect(ctx, c, 45, 40, 5, 150);
    for (let y = 44; y < 186; y += 12) {
      for (let i = 0; i < 20; i++) rect(ctx, c, 25 + i, y + i * 0.5, 1, 1);
    }
    rect(ctx, c, 0, 34, 110, 6);
    rect(ctx, c, 30, 20, 8, 20);
    rect(ctx, c, 0, 30, 30, 4);
    rect(ctx, c, 90, 40, 1, 70);
    rect(ctx, c, 86, 110, 9, 5);
    rect(ctx, '#c0393d', 32, 18, 3, 3);
  });

  canvasTex(scene, 'ship', 260, 70, (ctx) => {
    const c = '#15171b';
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 40); ctx.lineTo(260, 40); ctx.lineTo(240, 70); ctx.lineTo(16, 70); ctx.closePath(); ctx.fill();
    rect(ctx, c, 180, 12, 50, 28);
    rect(ctx, c, 196, 0, 10, 12);
    rect(ctx, c, 40, 20, 3, 20);
    rect(ctx, c, 90, 10, 3, 30);
    for (let x = 30; x < 170; x += 22) rect(ctx, '#2a3b4f', x, 28, 18, 12);
    for (let x = 184; x < 226; x += 7) rect(ctx, 'rgba(240,200,120,0.8)', x, 18, 3, 3);
    rect(ctx, '#c0393d', 200, 2, 3, 3);
  });

  canvasTex(scene, 'lighthouse', 24, 100, (ctx) => {
    rect(ctx, '#2a2a2e', 6, 20, 12, 80);
    for (let y = 30; y < 100; y += 20) rect(ctx, '#6b1f22', 6, y, 12, 8);
    rect(ctx, '#1b1b1e', 4, 16, 16, 4);
    rect(ctx, '#f3e3b0', 8, 8, 8, 8);
    rect(ctx, '#1b1b1e', 6, 4, 12, 4);
  });

  canvasTex(scene, 'office', 150, 120, (ctx) => {
    rect(ctx, '#3b3e40', 0, 10, 150, 110);
    rect(ctx, '#55585a', 0, 10, 150, 3);
    rect(ctx, '#2a2c2e', 0, 0, 150, 10);
    rect(ctx, '#e7ddca', 34, 2, 82, 6);
    rect(ctx, '#6b1f22', 36, 3, 78, 4);
    rect(ctx, '#1c2230', 12, 26, 40, 30);
    rect(ctx, '#d9a55a', 14, 28, 36, 26);
    rect(ctx, '#1c2230', 98, 26, 40, 30);
    rect(ctx, '#2c3240', 100, 28, 36, 26);
    rect(ctx, '#1a1616', 64, 60, 24, 60);
    rect(ctx, '#3a2a22', 66, 62, 20, 58);
  });
}

// ------------------------------------------------------------------ interiors

function interiors(scene) {
  canvasTex(scene, 'desk', 56, 22, (ctx) => {
    rect(ctx, '#4a342a', 0, 0, 56, 4);
    rect(ctx, '#6b4b36', 0, 0, 56, 1);
    rect(ctx, '#3a2820', 2, 4, 16, 18);
    rect(ctx, '#3a2820', 38, 4, 16, 18);
    rect(ctx, '#2a1d17', 4, 8, 12, 1);
    rect(ctx, '#2a1d17', 4, 14, 12, 1);
    rect(ctx, '#b99a58', 9, 10, 2, 1);
    rect(ctx, '#b99a58', 9, 16, 2, 1);
  });

  canvasTex(scene, 'desk-lamp', 10, 14, (ctx) => {
    rect(ctx, '#2a4a3a', 0, 0, 10, 4);
    rect(ctx, '#f3d38c', 1, 4, 8, 1);
    rect(ctx, '#b99a58', 4, 4, 2, 9);
    rect(ctx, '#b99a58', 2, 13, 6, 1);
  });

  canvasTex(scene, 'typewriter', 14, 8, (ctx) => {
    rect(ctx, '#2a2a2e', 0, 3, 14, 5);
    rect(ctx, '#3f3f44', 1, 3, 12, 1);
    rect(ctx, '#e7ddca', 3, 0, 8, 3);
    for (let x = 2; x < 12; x += 2) rect(ctx, '#8e8378', x, 5, 1, 1);
  });

  canvasTex(scene, 'filing', 16, 30, (ctx) => {
    rect(ctx, '#3f4548', 0, 0, 16, 30);
    rect(ctx, '#565d61', 1, 0, 14, 1);
    for (let y = 2; y < 30; y += 7) {
      rect(ctx, '#4b5256', 1, y, 14, 6);
      rect(ctx, '#2c3134', 1, y + 5, 14, 1);
      rect(ctx, '#9a9a90', 6, y + 2, 4, 1);
      rect(ctx, '#e7ddca', 5, y + 1, 6, 1);
    }
  });

  canvasTex(scene, 'bookshelf', 34, 44, (ctx) => {
    rect(ctx, '#3a2820', 0, 0, 34, 44);
    rect(ctx, '#2a1d17', 2, 2, 30, 40);
    const rnd = mulberry32(99);
    const colors = ['#6b1f22', '#3a4a5a', '#5a4a2a', '#2f3f2f', '#8a7a5a', '#4a2a3a'];
    for (let s = 0; s < 4; s++) {
      const y = 3 + s * 10;
      rect(ctx, '#3a2820', 2, y + 8, 30, 2);
      for (let x = 3; x < 31; x += 2 + Math.floor(rnd() * 2)) {
        const bh = 5 + Math.floor(rnd() * 3);
        rect(ctx, colors[Math.floor(rnd() * colors.length)], x, y + 8 - bh, 2, bh);
      }
    }
  });

  canvasTex(scene, 'plant', 14, 26, (ctx) => {
    rect(ctx, '#6b3a2a', 3, 18, 8, 8);
    rect(ctx, '#8a4a34', 3, 18, 8, 2);
    const rnd = mulberry32(4);
    for (let i = 0; i < 40; i++) rect(ctx, rnd() > 0.5 ? '#2f4a2a' : '#46663a', 1 + rnd() * 12, rnd() * 18, 2, 2);
  });

  canvasTex(scene, 'counter', 120, 30, (ctx) => {
    rect(ctx, '#2a1d17', 0, 4, 120, 26);
    rect(ctx, '#6b4b36', 0, 0, 120, 5);
    rect(ctx, '#8a6446', 0, 0, 120, 1);
    for (let x = 4; x < 116; x += 14) rect(ctx, '#3a2820', x, 8, 10, 18);
    rect(ctx, '#b99a58', 0, 5, 120, 1);
  });

  canvasTex(scene, 'espresso-machine', 26, 20, (ctx) => {
    rect(ctx, '#9a9aa0', 0, 4, 26, 16);
    rect(ctx, '#c8c8ce', 1, 4, 24, 2);
    rect(ctx, '#b99a58', 10, 0, 6, 4);
    rect(ctx, '#2a2a2e', 4, 12, 4, 5);
    rect(ctx, '#2a2a2e', 18, 12, 4, 5);
    rect(ctx, '#9c2b2f', 12, 8, 2, 2);
  });

  canvasTex(scene, 'bottles', 100, 40, (ctx) => {
    rect(ctx, '#2a1d17', 0, 0, 100, 40);
    rect(ctx, '#3a2820', 0, 12, 100, 2);
    rect(ctx, '#3a2820', 0, 26, 100, 2);
    rect(ctx, '#3a2820', 0, 38, 100, 2);
    const rnd = mulberry32(55);
    const colors = ['#3f6a3a', '#7a4a24', '#d8c070', '#6b1f22', '#8aa0a8', '#5a3a2a'];
    [12, 26, 38].forEach((sy) => {
      for (let x = 2; x < 98; x += 4 + Math.floor(rnd() * 3)) {
        const bh = 6 + Math.floor(rnd() * 4);
        const c = colors[Math.floor(rnd() * colors.length)];
        rect(ctx, c, x, sy - bh, 3, bh);
        rect(ctx, c, x + 1, sy - bh - 2, 1, 2);
        rect(ctx, 'rgba(255,255,255,0.25)', x, sy - bh + 1, 1, 2);
      }
    });
  });

  canvasTex(scene, 'jukebox', 20, 34, (ctx) => {
    rect(ctx, '#4a2a1a', 0, 8, 20, 26);
    ctx.fillStyle = '#6a3a22';
    ctx.beginPath(); ctx.ellipse(10, 9, 10, 9, 0, Math.PI, 0); ctx.fill();
    rect(ctx, '#d9a55a', 3, 6, 14, 10);
    rect(ctx, '#f0c47a', 5, 7, 10, 2);
    rect(ctx, '#b3262b', 3, 18, 14, 2);
    rect(ctx, '#2a1a12', 4, 22, 12, 10);
    for (let x = 5; x < 15; x += 2) rect(ctx, '#6a3a22', x, 23, 1, 8);
  });

  canvasTex(scene, 'table', 30, 16, (ctx) => {
    rect(ctx, '#e7ddca', 0, 0, 30, 3);
    rect(ctx, '#b3262b', 0, 3, 30, 2);
    rect(ctx, '#3a2820', 13, 5, 4, 10);
    rect(ctx, '#3a2820', 8, 15, 14, 1);
  });

  canvasTex(scene, 'chair', 10, 18, (ctx) => {
    rect(ctx, '#3a2820', 0, 0, 2, 18);
    rect(ctx, '#3a2820', 0, 9, 10, 2);
    rect(ctx, '#3a2820', 8, 11, 2, 7);
  });

  canvasTex(scene, 'bed', 60, 22, (ctx) => {
    rect(ctx, '#3a2820', 0, 0, 4, 22);
    rect(ctx, '#3a2820', 56, 8, 4, 14);
    rect(ctx, '#e7ddca', 4, 10, 52, 6);
    rect(ctx, '#6b1f22', 18, 8, 38, 8);
    rect(ctx, '#8a2a2e', 18, 8, 38, 2);
    rect(ctx, '#d8d0c0', 5, 7, 12, 4);
    rect(ctx, '#2a1d17', 4, 16, 52, 3);
  });

  canvasTex(scene, 'wardrobe', 28, 50, (ctx) => {
    rect(ctx, '#3a2820', 0, 0, 28, 50);
    rect(ctx, '#4a342a', 1, 3, 12, 45);
    rect(ctx, '#4a342a', 15, 3, 12, 45);
    rect(ctx, '#2a1d17', 0, 0, 28, 3);
    rect(ctx, '#b99a58', 12, 24, 1, 3);
    rect(ctx, '#b99a58', 15, 24, 1, 3);
  });

  canvasTex(scene, 'painting', 24, 18, (ctx) => {
    rect(ctx, '#8a6a3c', 0, 0, 24, 18);
    rect(ctx, '#2a3a4a', 2, 2, 20, 14);
    rect(ctx, '#5a6a5a', 2, 10, 20, 6);
    rect(ctx, '#d9a55a', 15, 4, 3, 3);
  });

  canvasTex(scene, 'crucifix', 8, 12, (ctx) => {
    rect(ctx, '#3a2820', 3, 0, 2, 12);
    rect(ctx, '#3a2820', 0, 3, 8, 2);
  });

  canvasTex(scene, 'window-night', 30, 40, (ctx) => {
    rect(ctx, '#5a4a3a', 0, 0, 30, 40);
    rect(ctx, '#1c2230', 2, 2, 26, 36);
    rect(ctx, '#2c3a52', 3, 3, 11, 16);
    rect(ctx, '#2c3a52', 16, 3, 11, 16);
    rect(ctx, '#243048', 3, 21, 11, 16);
    rect(ctx, '#243048', 16, 21, 11, 16);
    rect(ctx, '#e7e0c8', 20, 6, 3, 3);
  });
}

// ------------------------------------------------------------------ villa

function villa(scene) {
  canvasTex(scene, 'cypress', 16, 72, (ctx) => {
    rect(ctx, '#2a1d17', 7, 64, 2, 8);
    ctx.fillStyle = '#16211a';
    ctx.beginPath();
    ctx.ellipse(8, 36, 7, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    const rnd = mulberry32(8);
    for (let i = 0; i < 30; i++) rect(ctx, '#223326', 3 + rnd() * 9, 8 + rnd() * 56, 2, 2);
  });

  canvasTex(scene, 'statue', 18, 44, (ctx) => {
    rect(ctx, '#6c6a62', 1, 32, 16, 12);
    rect(ctx, '#8a877e', 1, 32, 16, 2);
    rect(ctx, '#9a978e', 6, 4, 6, 6);
    rect(ctx, '#8a877e', 4, 10, 10, 14);
    rect(ctx, '#8a877e', 5, 24, 3, 8);
    rect(ctx, '#8a877e', 10, 24, 3, 8);
    rect(ctx, '#8a877e', 13, 8, 2, 8);
    rect(ctx, '#6c6a62', 4, 14, 2, 10);
  });

  canvasTex(scene, 'hedge', 44, 18, (ctx) => {
    rect(ctx, '#1a2a1c', 0, 2, 44, 16);
    const rnd = mulberry32(12);
    for (let i = 0; i < 80; i++) rect(ctx, rnd() > 0.5 ? '#233a26' : '#2c4a30', rnd() * 42, rnd() * 16, 2, 2);
  });

  canvasTex(scene, 'column', 14, 90, (ctx) => {
    rect(ctx, '#b8a888', 2, 6, 10, 80);
    rect(ctx, '#d8c8a8', 3, 6, 2, 80);
    rect(ctx, '#968868', 10, 6, 2, 80);
    rect(ctx, '#d8c8a8', 0, 0, 14, 6);
    rect(ctx, '#d8c8a8', 0, 84, 14, 6);
  });

  canvasTex(scene, 'planter', 20, 20, (ctx) => {
    rect(ctx, '#8a877e', 0, 6, 20, 14);
    rect(ctx, '#a8a59c', 0, 6, 20, 2);
    rect(ctx, '#6c6a62', 2, 18, 16, 2);
    const rnd = mulberry32(17);
    for (let i = 0; i < 30; i++) rect(ctx, rnd() > 0.5 ? '#2f4a2a' : '#46663a', 2 + rnd() * 16, rnd() * 7, 2, 2);
  });

  canvasTex(scene, 'lantern', 8, 14, (ctx) => {
    rect(ctx, '#1c1a19', 3, 0, 2, 2);
    rect(ctx, '#1c1a19', 1, 2, 6, 2);
    rect(ctx, '#f3d38c', 2, 4, 4, 7);
    rect(ctx, '#1c1a19', 1, 11, 6, 2);
  });

  canvasTex(scene, 'greenhouse', 140, 90, (ctx) => {
    rect(ctx, 'rgba(120,150,140,0.18)', 0, 20, 140, 70);
    for (let x = 0; x <= 140; x += 14) rect(ctx, '#2a2e2c', x, 20, 2, 70);
    rect(ctx, '#2a2e2c', 0, 20, 140, 2);
    rect(ctx, '#2a2e2c', 0, 50, 140, 1);
    ctx.fillStyle = 'rgba(120,150,140,0.18)';
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(70, 0); ctx.lineTo(140, 20); ctx.fill();
    ctx.strokeStyle = '#2a2e2c';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(70, 0); ctx.lineTo(140, 20); ctx.stroke();
  });

  canvasTex(scene, 'chandelier', 30, 20, (ctx) => {
    rect(ctx, '#b99a58', 14, 0, 2, 8);
    rect(ctx, '#b99a58', 2, 8, 26, 2);
    [2, 9, 15, 21, 27].forEach((x) => {
      rect(ctx, '#b99a58', x, 10, 1, 4);
      rect(ctx, '#ffe9b8', x - 1, 14, 3, 4);
    });
  });

  canvasTex(scene, 'persian-rug', 90, 6, (ctx) => {
    rect(ctx, '#5a1a1c', 0, 0, 90, 6);
    for (let x = 0; x < 90; x += 6) rect(ctx, '#b99a58', x + 2, 2, 2, 2);
    rect(ctx, '#2a1a3a', 0, 0, 90, 1);
  });
}

// ------------------------------------------------------------------ icons

function icons(scene) {
  const icon = (key, draw) => canvasTex(scene, key, 12, 12, draw);
  icon('icon-lira', (ctx) => {
    rect(ctx, '#9fb08a', 0, 2, 12, 8);
    rect(ctx, '#6f8060', 1, 3, 10, 6);
    rect(ctx, '#d8e0c8', 5, 4, 2, 4);
  });
  icon('icon-espresso', (ctx) => {
    rect(ctx, '#e7ddca', 2, 5, 7, 6);
    rect(ctx, '#3a2418', 3, 5, 5, 2);
    rect(ctx, '#e7ddca', 9, 6, 2, 3);
    rect(ctx, '#bfb29a', 1, 11, 10, 1);
    rect(ctx, 'rgba(255,255,255,0.5)', 4, 1, 1, 3);
    rect(ctx, 'rgba(255,255,255,0.5)', 6, 0, 1, 3);
  });
  icon('icon-panino', (ctx) => {
    rect(ctx, '#c88a4a', 1, 3, 10, 3);
    rect(ctx, '#d96a6a', 1, 6, 10, 2);
    rect(ctx, '#6a8a4a', 1, 8, 10, 1);
    rect(ctx, '#b87a3a', 1, 9, 10, 2);
  });
  icon('icon-ticket', (ctx) => {
    rect(ctx, '#e0a050', 0, 3, 12, 7);
    rect(ctx, '#8a4516', 2, 5, 6, 1);
    rect(ctx, '#8a4516', 2, 7, 4, 1);
    rect(ctx, '#c46a22', 9, 3, 1, 7);
  });
  icon('ev-ledger', (ctx) => {
    rect(ctx, '#6b1f22', 2, 1, 8, 10);
    rect(ctx, '#b99a58', 3, 2, 1, 8);
    rect(ctx, '#e7ddca', 9, 2, 1, 8);
  });
  icon('ev-key31', (ctx) => {
    rect(ctx, '#d4b25a', 1, 4, 4, 4);
    rect(ctx, '#100d0d', 2, 5, 2, 2);
    rect(ctx, '#d4b25a', 5, 5, 6, 2);
    rect(ctx, '#d4b25a', 9, 7, 1, 2);
    rect(ctx, '#d4b25a', 7, 7, 1, 2);
  });
  icon('ev-photo', (ctx) => {
    rect(ctx, '#e7ddca', 1, 1, 10, 10);
    rect(ctx, '#5a5048', 2, 2, 8, 7);
    rect(ctx, '#2a2420', 3, 5, 2, 4);
    rect(ctx, '#2a2420', 5, 4, 2, 5);
    rect(ctx, '#2a2420', 7, 5, 2, 4);
  });
  icon('ev-manifest', (ctx) => {
    rect(ctx, '#d8d0bc', 2, 0, 8, 12);
    for (let y = 2; y < 10; y += 2) rect(ctx, '#6b6358', 3, y, 6, 1);
    rect(ctx, '#9c2b2f', 3, 6, 6, 1);
  });
  icon('ev-register', (ctx) => {
    rect(ctx, '#2a3b4f', 1, 1, 10, 10);
    rect(ctx, '#e7ddca', 2, 2, 8, 8);
    for (let y = 3; y < 10; y += 2) rect(ctx, '#2a3b4f', 3, y, 6, 1);
  });
  icon('ev-statement', (ctx) => {
    rect(ctx, '#e7ddca', 2, 0, 8, 12);
    for (let y = 2; y < 8; y += 2) rect(ctx, '#3a3a40', 3, y, 6, 1);
    rect(ctx, '#9c2b2f', 6, 9, 3, 2);
  });
  icon('icon-memento', (ctx) => {
    rect(ctx, '#d4b25a', 5, 0, 2, 12);
    rect(ctx, '#d4b25a', 0, 5, 12, 2);
    rect(ctx, '#fff4d6', 4, 4, 4, 4);
  });
  icon('icon-eye', (ctx) => {
    rect(ctx, '#e7ddca', 1, 4, 10, 4);
    rect(ctx, '#e7ddca', 3, 3, 6, 6);
    rect(ctx, '#100d0d', 5, 4, 2, 4);
  });
  icon('icon-hidden', (ctx) => {
    rect(ctx, '#8e8378', 1, 6, 10, 1);
    rect(ctx, '#8e8378', 2, 7, 1, 2);
    rect(ctx, '#8e8378', 5, 7, 1, 2);
    rect(ctx, '#8e8378', 9, 7, 1, 2);
  });
  icon('mark-q', (ctx) => {
    rect(ctx, '#e8c14a', 3, 0, 6, 2);
    rect(ctx, '#e8c14a', 8, 1, 2, 4);
    rect(ctx, '#e8c14a', 5, 5, 3, 2);
    rect(ctx, '#e8c14a', 5, 7, 2, 2);
    rect(ctx, '#e8c14a', 5, 10, 2, 2);
  });
  icon('mark-ex', (ctx) => {
    rect(ctx, '#e0393d', 5, 0, 3, 8);
    rect(ctx, '#e0393d', 5, 10, 3, 2);
  });
  icon('icon-pistol', (ctx) => {
    rect(ctx, '#3a383c', 1, 3, 10, 3);
    rect(ctx, '#1d1c1f', 2, 6, 3, 5);
    rect(ctx, '#5a585c', 1, 3, 10, 1);
  });
}

// ------------------------------------------------------------------ map

function map(scene) {
  canvasTex(scene, 'map', 400, 250, (ctx) => {
    rect(ctx, '#d8ccb0', 0, 0, 400, 250);
    const rnd = mulberry32(64);
    for (let i = 0; i < 900; i++) rect(ctx, 'rgba(120,100,70,0.08)', rnd() * 400, rnd() * 250, 2, 1);
    // Street grid.
    ctx.strokeStyle = 'rgba(110,90,60,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const x = rnd() * 400;
      const y = rnd() * 250;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 80, y + (rnd() - 0.5) * 60);
      ctx.stroke();
    }
    // Tevere.
    ctx.strokeStyle = '#6a8a9a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(90, 0);
    ctx.bezierCurveTo(150, 60, 60, 110, 120, 150);
    ctx.bezierCurveTo(170, 185, 90, 210, 130, 250);
    ctx.stroke();
    // Sea toward Civitavecchia.
    ctx.fillStyle = '#7a9aaa';
    ctx.beginPath();
    ctx.moveTo(300, 250); ctx.lineTo(400, 150); ctx.lineTo(400, 250); ctx.fill();
    // Highway to the coast.
    ctx.strokeStyle = 'rgba(107,31,34,0.6)';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(50, 155); ctx.lineTo(344, 195); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(60,40,30,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 396, 246);
  });
}

export function installTextures(scene) {
  lights(scene);
  groundTiles(scene);
  props(scene);
  rome(scene);
  port(scene);
  interiors(scene);
  villa(scene);
  icons(scene);
  map(scene);
}
