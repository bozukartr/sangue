// Boot, main menu and the opening titles.
import { GAME_W, GAME_H, GROUND_TOP, FONT, HEX, DEPTH } from '../config.js';
import { audio } from '../core/audio.js';
import { Controls } from '../core/controls.js';
import { applySettings, settings } from '../core/settings.js';
import { installTouchControls } from '../core/touch.js';
import { state, formatTime } from '../core/state.js';
import { readSave, chapterForStage } from '../story.js';
import { installCharacterSprites } from '../gfx/characters.js';
import { installPortraits } from '../gfx/portraits.js';
import { installTextures, PX } from '../gfx/textures.js';
import { Fx } from '../systems/fx.js';
import { MenuList, SettingsPanel, panel, dim, CONTROLS_TEXT } from './ui.js';

const LOCATION_NAMES = {
  rome: 'Trastevere', apartment: 'Casa Bianchi', bar: 'Bar Arisel',
  port: 'Civitavecchia', questura: 'Questura Centrale', villa: 'Villa Cranier'
};

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    installTextures(this);
    installCharacterSprites(this);
    installPortraits(this);
    audio.installUnlock();
    installTouchControls();
    applySettings();
    document.body.classList.add('ready');
    this.scene.start('menu');
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#171216');
    this.save = readSave();
    this.controls = new Controls(this);
    this.fx = new Fx(this);
    this.sub = null;
    this.createBackdrop();
    this.createMenu();
    audio.music('menu');
    audio.setAmbience({ rain: settings.rain ? 0.7 : 0.3 });
    audio.muffle(false);
    this.cameras.main.fadeIn(600, 16, 13, 13);
    this.controls.reset();
  }

  createBackdrop() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1b1519).setOrigin(0);
    this.add.image(GAME_W / 2, 470, 'skyline').setScale(PX * 1.3).setTint(0x8a7a90).setAlpha(0.6);
    this.add.circle(1040, 120, 50, 0xd9c7a7, 0.22);
    this.fx.glow(1040, 120, 140, 0xd9c7a7, 0.1, { cut: false });
    this.add.image(700, 480, 'midrow').setScale(PX).setTint(0x9a8a9a);
    this.add.image(640, GROUND_TOP, 'facade-rose').setOrigin(0.5, 1).setScale(PX);
    this.add.image(980, GROUND_TOP, 'facade-ochre').setOrigin(0.5, 1).setScale(PX);
    this.add.image(1260, GROUND_TOP, 'facade-terra').setOrigin(0.5, 1).setScale(PX);
    this.add.tileSprite(0, GROUND_TOP - 2, GAME_W, 90, 'tile-street').setOrigin(0).setTileScale(PX);
    this.add.image(850, GROUND_TOP, 'lamp').setOrigin(0.5, 1).setScale(PX);
    this.fx.glow(862, GROUND_TOP - 140, 70, 0xffd890, 0.6, { cut: false, flicker: true });
    this.fx.glow(862, GROUND_TOP - 30, 200, 0xf3b060, 0.2, { cut: false });
    this.add.image(1100, 540, 'awning').setScale(PX);
    this.neon = this.add.text(1100, 500, 'BAR ARISEL', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '22px', color: '#e0b060'
    }).setOrigin(0.5).setAlpha(0.8);
    this.tweens.add({ targets: this.neon, alpha: { from: 0.45, to: 0.95 }, duration: 1150, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const hero = this.add.sprite(900, GROUND_TOP - 16 * 4.2, 'gianlico-sheet', 0).setScale(4.2).setFlipX(true);
    hero.play('gianlico-idle');
    this.add.ellipse(900, GROUND_TOP, 90, 12, 0x000000, 0.5);
    this.fx.rain(1.2);
    this.fx.groundY = GROUND_TOP;
    this.fx.lightning(8000, 18000);
    this.add.rectangle(0, 0, 520, GAME_H, 0x0b0909, 0.86).setOrigin(0);
    this.add.rectangle(520, 45, 2, GAME_H - 90, 0x6b1f22, 0.7).setOrigin(0);
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDisplaySize(GAME_W, GAME_H).setDepth(DEPTH.light + 1);
  }

  createMenu() {
    this.add.text(70, 76, 'SANGUE', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '84px', color: '#efe4d1', letterSpacing: 4
    }).setShadow(4, 6, '#4d1719', 0, true, true);
    this.add.text(76, 172, 'ROMA · 1980', { fontFamily: FONT, fontSize: '16px', color: HEX.gold, letterSpacing: 6 });
    this.add.text(76, 202, 'Una storia di sangue, debiti e famiglia.', { fontFamily: FONT, fontSize: '13px', color: HEX.smoke });

    const save = this.save;
    const items = [
      { label: 'DEVAM ET', disabled: !save, action: () => this.continueGame() },
      { label: 'YENİ OYUN', action: () => this.confirmNewGame() },
      { label: 'AYARLAR', action: () => this.openSettings() },
      { label: 'KONTROLLER', action: () => this.openControls() },
      { label: 'JENERİK', action: () => this.openCredits() }
    ];
    this.menu = new MenuList(this, 88, 300, items, { spacing: 58, size: '24px', depth: DEPTH.light + 5 });
    if (save) {
      const ch = chapterForStage(save.stage);
      this.add.text(88, 262, `${ch.number} · ${LOCATION_NAMES[save.scene] || 'Roma'} · ${formatTime(save.stats.time)}`, {
        fontFamily: FONT, fontSize: '12px', color: HEX.dim
      }).setDepth(DEPTH.light + 5);
    }
    this.add.text(76, 664, 'W/S veya ↑/↓ seç · ENTER onayla · ESC geri', {
      fontFamily: FONT, fontSize: '12px', color: '#766d67'
    }).setDepth(DEPTH.light + 5);
    this.add.text(GAME_W - 30, 690, 'v1.0' + (settings.completed ? '  ·  ★ tamamlandı' : ''), {
      fontFamily: FONT, fontSize: '11px', color: '#5d5550'
    }).setOrigin(1).setDepth(DEPTH.light + 5);
  }

  openSub(builder) {
    this.menu.setVisible(false);
    this.subObjects = [dim(this, 0.6, DEPTH.light + 6), panel(this, 820, 360, 760, 520, DEPTH.light + 7)];
    this.sub = builder();
  }

  closeSub() {
    this.sub?.destroy();
    this.subObjects?.forEach((o) => o.destroy());
    this.sub = null;
    this.menu.setVisible(true);
    this.menu.refresh();
    audio.sfx('ui_back');
  }

  openSettings() {
    this.openSub(() => {
      const title = this.add.text(480, 140, 'AYARLAR', { fontFamily: FONT, fontStyle: 'bold', fontSize: '28px', color: HEX.paper }).setDepth(DEPTH.light + 8);
      const p = new SettingsPanel(this, 480, 220, DEPTH.light + 8);
      return { update: (c) => p.update(c), destroy: () => { p.destroy(); title.destroy(); } };
    });
  }

  openControls() {
    this.openSub(() => {
      const objs = [this.add.text(470, 130, 'KONTROLLER', { fontFamily: FONT, fontStyle: 'bold', fontSize: '28px', color: HEX.paper }).setDepth(DEPTH.light + 8)];
      CONTROLS_TEXT.forEach(([k, v], i) => {
        objs.push(this.add.text(470, 190 + i * 36, k, { fontFamily: FONT, fontStyle: 'bold', fontSize: '15px', color: HEX.gold }).setDepth(DEPTH.light + 8));
        objs.push(this.add.text(680, 190 + i * 36, v, { fontFamily: FONT, fontSize: '15px', color: HEX.cream, wordWrap: { width: 480 } }).setDepth(DEPTH.light + 8));
      });
      return { update: () => {}, destroy: () => objs.forEach((o) => o.destroy()) };
    });
  }

  openCredits() {
    this.openSub(() => {
      const t = this.add.text(820, 360, CREDITS.join('\n'), {
        fontFamily: FONT, fontSize: '16px', color: HEX.cream, align: 'center', lineSpacing: 8
      }).setOrigin(0.5).setDepth(DEPTH.light + 8);
      return { update: () => {}, destroy: () => t.destroy() };
    });
  }

  confirmNewGame() {
    if (!this.save) { this.newGame(); return; }
    this.openSub(() => {
      const t = this.add.text(820, 250, 'Yeni oyun mevcut kaydın üzerine yazılacak.\nEmin misin?', {
        fontFamily: FONT, fontSize: '20px', color: HEX.cream, align: 'center', lineSpacing: 10
      }).setOrigin(0.5).setDepth(DEPTH.light + 8);
      const list = new MenuList(this, 820, 380, [
        { label: 'EVET, BAŞTAN BAŞLA', action: () => this.newGame() },
        { label: 'VAZGEÇ', action: () => this.time.delayedCall(0, () => this.closeSub()) }
      ], { align: 'center', size: '20px', depth: DEPTH.light + 8 });
      return { update: (c) => list.update(c), destroy: () => { list.destroy(); t.destroy(); } };
    });
  }

  newGame() {
    if (this.leaving) return;
    this.leaving = true;
    state.newGame();
    this.cameras.main.fadeOut(500, 16, 13, 13);
    this.time.delayedCall(520, () => this.scene.start('intro'));
  }

  continueGame() {
    if (this.leaving || !this.save) return;
    this.leaving = true;
    state.loadFromStorage();
    this.cameras.main.fadeOut(400, 16, 13, 13);
    this.time.delayedCall(420, () => this.scene.start(state.data.scene, { entry: state.data.entry || 'resume' }));
  }

  update() {
    this.controls.update();
    const c = this.controls;
    if (this.sub) {
      if (c.pressed.back) { this.closeSub(); return; }
      this.sub.update(c);
      return;
    }
    this.menu.update(c);
  }
}

export const CREDITS = [
  'SANGUE',
  '',
  'Hikâye, tasarım ve kod',
  'bozukartr',
  '',
  'Prosedürel piksel sanat, ses ve müzik',
  'tarayıcıda, gerçek zamanlı üretildi',
  '',
  'Phaser 3 · WebAudio',
  '',
  'Roma, 1980 — yağmurun hiç dinmediği bir yıl.'
];

// ------------------------------------------------------------------ intro

export class IntroScene extends Phaser.Scene {
  constructor() { super('intro'); }

  create() {
    this.cameras.main.setBackgroundColor('#0c0a0a');
    this.controls = new Controls(this);
    this.controls.reset();
    this.fx = new Fx(this);
    audio.music('sorrow');
    audio.setAmbience({ rain: 0.8 });

    // Funeral at Verano: umbrellas under the rain.
    this.stage = this.add.container(0, 0).setAlpha(0);
    const ground = this.add.rectangle(0, 560, GAME_W, 160, 0x141013).setOrigin(0);
    const cypresses = [120, 260, 1020, 1160].map((x) => this.add.image(x, 560, 'cypress').setOrigin(0.5, 1).setScale(3).setTint(0x2a2a30));
    const grave = this.add.rectangle(640, 540, 90, 50, 0x2e2a2a);
    const cross = this.add.image(640, 515, 'crucifix').setScale(4).setTint(0x5a5250);
    const mourners = [440, 520, 760, 840, 600, 690].map((x, i) => {
      const look = ['borge', 'patron', 'thug2', 'patron', 'elena', 'gianlico'][i];
      const s = this.add.sprite(x, 560 - 16 * 3, `${look}-sheet`, 0).setScale(3).setTint(0x3a3438).setFlipX(x > 640);
      return s;
    });
    const umbrellas = [440, 520, 760, 840].map((x) => {
      const g = this.add.graphics();
      g.fillStyle(0x0c0a0c, 1);
      g.slice(x, 470, 46, Math.PI, 0, false);
      g.fillPath();
      g.fillRect(x - 1, 470, 2, 30);
      return g;
    });
    this.stage.add([ground, ...cypresses, grave, cross, ...mourners, ...umbrellas]);
    this.fx.rain(1.4);
    this.fx.groundY = 560;
    this.fx.lightning(7000, 14000);
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDisplaySize(GAME_W, GAME_H).setDepth(DEPTH.light + 1);

    this.cards = [
      { kicker: 'ROMA · MARZO 1980', title: 'SANGUE', body: 'Gianlico Bianchi, 21 yaşında.\nBabası Paolo bir gecede ondan alındı.', stage: false, photo: true },
      { kicker: 'CIMITERO DEL VERANO', title: 'IL FUNERALE', body: 'Polis “kaza” diyor.\nHerkes aynı ismi fısıldıyor: Monte “Savior” Cranier.', stage: true },
      { kicker: 'ARISEL', title: 'UN DEBITO DI SANGUE', body: 'Leonard “Borge” Arisel tek bir şey söylüyor:\n“İntikam istiyorsan önce hayatta kalmayı öğren.”', stage: true },
      { kicker: 'TRASTEVERE · 23:40', title: 'IL PRIMO PASSO', body: 'Borge, Bar Arisel’de bekliyor.', stage: false }
    ];
    // Paolo's funeral photograph for the first card.
    this.photo = this.add.container(GAME_W / 2, 520).setAlpha(0).setDepth(DEPTH.card);
    this.photo.add([
      this.add.rectangle(0, 0, 176, 206, 0xe7ddca),
      this.add.rectangle(0, -12, 152, 152, 0x2a2224),
      this.add.image(0, -12, 'portrait-paolo').setScale(2.3).setTint(0xd8ccb8),
      this.add.text(0, 84, 'PAOLO BIANCHI · 1931–1980', { fontFamily: FONT, fontSize: '11px', color: '#3a2a22' }).setOrigin(0.5),
      this.add.rectangle(-70, -96, 30, 3, 0x6b1f22).setAngle(-35)
    ]);
    this.index = -1;
    this.kicker = this.add.text(GAME_W / 2, 150, '', { fontFamily: FONT, fontSize: '18px', color: HEX.gold, letterSpacing: 6 })
      .setOrigin(0.5).setDepth(DEPTH.card);
    this.title = this.add.text(GAME_W / 2, 220, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '64px', color: HEX.cream, letterSpacing: 6 })
      .setOrigin(0.5).setDepth(DEPTH.card).setShadow(3, 5, '#4d1719', 0, true, true);
    this.body = this.add.text(GAME_W / 2, 300, '', { fontFamily: FONT, fontSize: '22px', color: '#b9b0a6', align: 'center', lineSpacing: 12 })
      .setOrigin(0.5, 0).setDepth(DEPTH.card);
    this.add.text(GAME_W / 2, 680, 'SPACE / E / TIKLA  ·  devam        ESC  ·  atla', {
      fontFamily: FONT, fontSize: '13px', color: '#6f6661'
    }).setOrigin(0.5).setDepth(DEPTH.card);
    this.input.on('pointerdown', () => this.next());
    this.next();
  }

  next() {
    if (this.transitioning) {
      // A press during the fade-in completes the card instead of skipping it.
      this.tweens.killTweensOf([this.kicker, this.title, this.body]);
      [this.kicker, this.title, this.body].forEach((t) => t.setAlpha(1));
      this.transitioning = false;
      return;
    }
    this.index++;
    if (this.index >= this.cards.length) { this.finish(); return; }
    const card = this.cards[this.index];
    this.transitioning = true;
    audio.sfx('typewriter');
    this.tweens.add({ targets: this.stage, alpha: card.stage ? 1 : 0, duration: 900 });
    this.tweens.add({ targets: this.photo, alpha: card.photo ? 1 : 0, duration: 900 });
    [this.kicker, this.title, this.body].forEach((t) => t.setAlpha(0));
    this.kicker.setText(card.kicker);
    this.title.setText(card.title);
    this.body.setText(card.body);
    this.tweens.add({ targets: this.kicker, alpha: 1, duration: 500 });
    this.tweens.add({ targets: this.title, alpha: 1, duration: 700, delay: 200 });
    this.tweens.add({ targets: this.body, alpha: 1, duration: 700, delay: 600, onComplete: () => { this.transitioning = false; } });
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(700, 10, 8, 8);
    this.time.delayedCall(720, () => this.scene.start('rome', { entry: 'start' }));
  }

  update() {
    this.controls.update();
    const c = this.controls;
    if (c.pressed.back) { this.finish(); return; }
    if (c.pressed.confirm || c.pressed.interact || c.pressed.attack) this.next();
  }
}
