// Atmosphere and feedback: rain and splashes, lightning, a darkness layer
// with light cut-outs, fog, particles, hit-stop, shake and title cards.
import { GAME_W, GAME_H, GROUND_TOP, DEPTH, FONT, HEX } from '../config.js';
import { settings } from '../core/settings.js';
import { audio } from '../core/audio.js';

export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    this.darkness = null;
    this.stamp = scene.make.image({ key: 'lightmask', add: false }).setOrigin(0.5);

    this.dust = scene.add.particles(0, 0, 'soft', {
      speed: { min: 20, max: 90 }, angle: { min: 200, max: 340 }, lifespan: 500,
      scale: { start: 0.6, end: 0 }, alpha: { start: 0.35, end: 0 }, tint: 0xb8a890,
      gravityY: -40, emitting: false
    }).setDepth(DEPTH.player + 1);

    this.sparks = scene.add.particles(0, 0, 'px', {
      speed: { min: 120, max: 320 }, lifespan: 260, scale: { start: 1, end: 0 },
      tint: [0xffe9b8, 0xffffff, 0xd4b25a], gravityY: 500, emitting: false
    }).setDepth(DEPTH.player + 2);

    this.blood = scene.add.particles(0, 0, 'px', {
      speed: { min: 60, max: 220 }, lifespan: 420, scale: { start: 0.9, end: 0.2 },
      tint: [0x9c2b2f, 0x6b1f22], gravityY: 900, emitting: false
    }).setDepth(DEPTH.player + 2);

    this.flash = scene.add.rectangle(0, 0, GAME_W, GAME_H, 0xdfe6ff, 0).setOrigin(0)
      .setScrollFactor(0).setDepth(DEPTH.light + 2);
  }

  // ---------------------------------------------------------- weather

  rain(intensity = 1) {
    if (!settings.rain || intensity <= 0) return;
    const s = this.scene;
    const make = (depth, alpha, speed, freq) => s.add.particles(0, 0, 'raindrop', {
      x: { min: -200, max: GAME_W + 200 }, y: -30,
      speedY: { min: speed, max: speed * 1.25 }, speedX: -speed * 0.18,
      rotate: 10, lifespan: 1100, alpha: { min: alpha * 0.5, max: alpha },
      scaleY: { min: 0.7, max: 1.3 }, frequency: freq / intensity, quantity: 2
    }).setScrollFactor(0).setDepth(depth);
    this.rainBack = make(DEPTH.mid + 1, 0.35, 700, 18);
    this.rainFront = make(DEPTH.rain, 0.55, 950, 14);

    this.splash = s.add.particles(0, 0, 'px', {
      speed: { min: 30, max: 90 }, angle: { min: 220, max: 320 }, lifespan: 260,
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: 0xb8c4d0,
      gravityY: 400, emitting: false
    }).setDepth(DEPTH.player + 3);
    s.time.addEvent({
      delay: 40, loop: true, callback: () => {
        const cam = s.cameras.main;
        for (let i = 0; i < Math.ceil(2 * intensity); i++) {
          this.splash.emitParticleAt(cam.scrollX + Math.random() * GAME_W, this.groundY ?? GROUND_TOP, 2);
        }
      }
    });
  }

  lightning(minDelay = 9000, maxDelay = 22000) {
    const s = this.scene;
    const strike = () => {
      if (!s.sys.isActive()) return;
      this.flash.setAlpha(0.45);
      s.tweens.add({ targets: this.flash, alpha: 0, duration: 90, yoyo: true, repeat: 1, onComplete: () => {
        s.tweens.add({ targets: this.flash, alpha: 0, duration: 400 });
      } });
      s.time.delayedCall(400 + Math.random() * 1200, () => audio.sfx('thunder'));
      s.time.delayedCall(Phaser.Math.Between(minDelay, maxDelay), strike);
    };
    s.time.delayedCall(Phaser.Math.Between(minDelay / 2, maxDelay / 2), strike);
  }

  fog(y, depth, alpha = 0.6, speed = 8, tint = 0xb8b0c0) {
    const s = this.scene;
    const f = s.add.tileSprite(0, y, GAME_W, 128, 'fog').setOrigin(0, 0.5).setScrollFactor(0)
      .setDepth(depth).setAlpha(alpha).setTint(tint).setTileScale(2);
    const drift = (_t, delta) => {
      f.tilePositionX += (speed * delta) / 1000 + (s.cameras.main.scrollX - (f.lastScroll ?? s.cameras.main.scrollX)) * 0.3;
      f.lastScroll = s.cameras.main.scrollX;
    };
    s.events.on('update', drift);
    s.events.once('shutdown', () => s.events.off('update', drift));
    return f;
  }

  // ---------------------------------------------------------- lighting

  // A halo in the world. `flicker` makes it waver like old sodium lamps.
  glow(x, y, radius, color = 0xf3c47a, alpha = 0.35, opts = {}) {
    const s = this.scene;
    const img = s.add.image(x, y, 'glow').setTint(color).setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(opts.depth ?? DEPTH.props - 1);
    img.setDisplaySize(radius * 2, radius * 2);
    if (opts.scrollFactor !== undefined) img.setScrollFactor(opts.scrollFactor);
    if (opts.flicker) {
      s.tweens.add({
        targets: img, alpha: alpha * 0.6, duration: Phaser.Math.Between(60, 140),
        yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(800, 4000)
      });
    }
    const light = { x, y, radius, img, on: true, cut: opts.cut ?? true };
    this.lights.push(light);
    return light;
  }

  // Full-screen darkness with holes around lights; drawn above the world.
  enableDarkness(alpha = 0.6, color = 0x05060c) {
    const s = this.scene;
    this.darkAlpha = alpha;
    this.darkColor = color;
    this.darkness = s.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.light);
    this.extraCuts = [];
  }

  // Temporary light, e.g. a guard's flashlight or the player's lighter.
  cut(x, y, radius, strength = 1) {
    if (this.extraCuts) this.extraCuts.push({ x, y, radius, strength });
  }

  isLit(x, y) {
    return this.lights.some((l) => l.on && l.cut && Math.hypot(l.x - x, (l.y - y) * 0.6) < l.radius * 0.55);
  }

  update() {
    if (!this.darkness) return;
    const cam = this.scene.cameras.main;
    const rt = this.darkness;
    rt.clear();
    rt.fill(this.darkColor, this.darkAlpha);
    const erase = (x, y, radius, strength) => {
      const sx = x - cam.scrollX;
      const sy = y - cam.scrollY;
      if (sx < -radius || sx > GAME_W + radius || sy < -radius || sy > GAME_H + radius) return;
      this.stamp.setDisplaySize(radius * 2, radius * 2).setAlpha(strength);
      rt.erase(this.stamp, sx, sy);
    };
    this.lights.forEach((l) => { if (l.on && l.cut) erase(l.x, l.y, l.radius, 1); });
    this.extraCuts.forEach((c) => erase(c.x, c.y, c.radius, c.strength));
    this.extraCuts.length = 0;
  }

  // ---------------------------------------------------------- feedback

  shake(duration = 120, intensity = 0.006) {
    if (settings.shake) this.scene.cameras.main.shake(duration, intensity);
  }

  hitStop(ms = 60) {
    const world = this.scene.physics.world;
    if (world.isPaused) return;
    world.pause();
    this.scene.anims.pauseAll();
    // The animation manager is global: always resume it, even if the scene
    // changed during the pause.
    setTimeout(() => {
      this.scene.anims.resumeAll();
      if (this.scene.sys.isActive() || this.scene.sys.isPaused()) world.resume();
    }, ms);
  }

  puff(x, y, count = 6) { this.dust.explode(count, x, y); }
  hitSpark(x, y, count = 8) { this.sparks.explode(count, x, y); }
  bleed(x, y, count = 6) { this.blood.explode(count, x, y); }

  // ---------------------------------------------------------- cards

  locationCard(title, subtitle) {
    const s = this.scene;
    const c = s.add.container(60, GAME_H - 150).setScrollFactor(0).setDepth(DEPTH.card - 10).setAlpha(0);
    const line = s.add.rectangle(0, 0, 4, 58, 0x9c2b2f).setOrigin(0);
    const t = s.add.text(18, -2, title, { fontFamily: FONT, fontStyle: 'bold', fontSize: '30px', color: HEX.paper, letterSpacing: 4 });
    const sub = s.add.text(20, 38, subtitle, { fontFamily: FONT, fontSize: '14px', color: HEX.gold, letterSpacing: 2 });
    c.add([line, t, sub]);
    c.setScrollFactor(0, 0, true);
    s.tweens.add({ targets: c, alpha: 1, x: 70, duration: 600, ease: 'Quad.out', hold: 2600, yoyo: true,
      onComplete: () => c.destroy() });
  }

  chapterCard(number, title) {
    const s = this.scene;
    return new Promise((resolve) => {
      const d = DEPTH.card;
      const overlay = s.add.rectangle(0, 0, GAME_W, GAME_H, 0x0a0808, 0.86).setOrigin(0).setScrollFactor(0).setDepth(d).setAlpha(0);
      const k = s.add.text(GAME_W / 2, 300, number, {
        fontFamily: FONT, fontSize: '17px', color: HEX.gold, letterSpacing: 8
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0);
      const t = s.add.text(GAME_W / 2, 352, title, {
        fontFamily: FONT, fontStyle: 'bold', fontSize: '54px', color: HEX.paper, letterSpacing: 6
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0).setShadow(3, 4, '#4d1719', 0, true, true);
      const rule = s.add.rectangle(GAME_W / 2, 402, 0, 3, 0x9c2b2f).setScrollFactor(0).setDepth(d + 1);
      audio.sfx('typewriter');
      s.tweens.add({ targets: rule, width: 360, duration: 700, ease: 'Quad.out' });
      s.tweens.add({
        targets: [overlay, k, t], alpha: 1, duration: 420, hold: 1900, yoyo: true,
        onComplete: () => { overlay.destroy(); k.destroy(); t.destroy(); rule.destroy(); resolve(); }
      });
      s.tweens.add({ targets: rule, alpha: 0, delay: 2300, duration: 400 });
    });
  }

  // Short banner for big moments ("KANIT", "ALLARME").
  banner(textValue, color = HEX.red) {
    const s = this.scene;
    const t = s.add.text(GAME_W / 2, 200, textValue, {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '28px', color, letterSpacing: 6,
      backgroundColor: '#0d0a0bdd', padding: { x: 22, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.card - 5).setAlpha(0).setScale(1.3);
    s.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 200, ease: 'Back.out', hold: 1400, yoyo: true, onComplete: () => t.destroy() });
  }
}
