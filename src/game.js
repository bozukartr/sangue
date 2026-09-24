import { installCharacterSprites } from './character-sprites.js';
import { SAVE_KEY, STAGE, chapterForStage, normalizeSave, objectiveForStage, writeSave } from './story.js';
import { ApartmentScene } from './scenes/apartment.js';

const GAME_W = 1280;
const GAME_H = 720;
const STREET_GROUND_TOP = 642;
const CHARACTER_SCALE = 2.2;
const STREET_CHARACTER_Y = STREET_GROUND_TOP - 16 * CHARACTER_SCALE;

const palette = {
  night: 0x18141b,
  sky: 0x302733,
  haze: 0x5c4650,
  stone: 0x6d6257,
  stoneDark: 0x3c3632,
  cream: 0xe7ddca,
  wine: 0x6b1f22,
  red: 0x9c2b2f,
  gold: 0xb99a58,
  black: 0x171313,
  skin: 0xb88969,
  suit: 0x262733,
  shirt: 0xb5ada5,
  green: 0x66715c
};

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    this.makeTextures();
    document.body.classList.add('ready');
    this.scene.start('menu');
  }

  makeTextures() {
    installCharacterSprites(this);

    const platform = this.add.graphics();
    platform.fillStyle(palette.stoneDark);
    platform.fillRect(0, 0, 64, 16);
    platform.fillStyle(palette.stone);
    platform.fillRect(0, 0, 64, 5);
    platform.fillStyle(0x514942);
    for (let x = 4; x < 64; x += 12) platform.fillRect(x, 7, 8, 2);
    platform.generateTexture('platform', 64, 16);
    platform.destroy();

    const crate = this.add.graphics();
    crate.fillStyle(0x6a4a35);
    crate.fillRect(0, 0, 32, 32);
    crate.lineStyle(3, 0x3d2c22);
    crate.strokeRect(1, 1, 30, 30);
    crate.lineBetween(3, 3, 29, 29);
    crate.lineBetween(29, 3, 3, 29);
    crate.generateTexture('crate', 32, 32);
    crate.destroy();

    const ledger = this.add.graphics();
    ledger.fillStyle(palette.wine);
    ledger.fillRect(2, 2, 18, 22);
    ledger.fillStyle(palette.gold);
    ledger.fillRect(5, 5, 2, 16);
    ledger.fillRect(10, 7, 7, 2);
    ledger.generateTexture('ledger', 22, 26);
    ledger.destroy();

    const lamp = this.add.graphics();
    lamp.fillStyle(0x302b28);
    lamp.fillRect(7, 0, 4, 44);
    lamp.fillRect(3, 0, 12, 3);
    lamp.fillStyle(0xe0b76c);
    lamp.fillRect(5, 4, 8, 10);
    lamp.generateTexture('lamp', 18, 44);
    lamp.destroy();
  }
}


class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#171216');
    this.menuIndex = 0;
    this.panelOpen = false;
    this.saveKey = SAVE_KEY;
    this.settingsKey = 'sangue-settings-v1';
    this.saveData = this.readSave();
    this.settings = this.readSettings();

    this.createBackdrop();
    this.createMenu();
    this.createFooter();
    this.createRain();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,S,ENTER,ESC,SPACE');

    this.cameras.main.fadeIn(450, 16, 13, 13);
  }

  createBackdrop() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1b1519);

    this.add.circle(1000, 115, 58, 0xd9c7a7, 0.25);
    this.add.rectangle(0, 520, GAME_W, 200, 0x211a1d).setOrigin(0);

    for (let i = 0; i < 13; i++) {
      const x = 500 + i * 78;
      const h = Phaser.Math.Between(170, 310);
      const w = Phaser.Math.Between(70, 110);
      this.add.rectangle(x, 540 - h / 2, w, h, i % 2 ? 0x2f272b : 0x382d31).setOrigin(0, 0.5);
      if (i % 2 === 0) {
        this.add.rectangle(x + 20, 450, 12, 18, 0xcfa968, 0.22);
      }
    }

    this.add.rectangle(640, 628, 1280, 95, 0x100d0d, 0.9);

    this.neon = this.add.text(930, 278, 'BAR ARISEL', {
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      fontSize: '31px',
      color: '#b99a58'
    }).setOrigin(0.5).setAngle(-2).setAlpha(0.68);

    this.tweens.add({
      targets: this.neon,
      alpha: { from: 0.45, to: 0.82 },
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.add.rectangle(765, 360, 255, 150, 0x23191c, 0.92);
    this.add.rectangle(765, 430, 210, 14, 0x5d463a);
    this.add.rectangle(765, 448, 170, 10, 0x3d302b);

    const silhouette = this.add.image(815, 446, 'gianlico-sheet', 0)
      .setScale(4.5)
      .setTint(0x111111)
      .setAlpha(0.7);
    silhouette.setOrigin(0.5, 1);

    this.add.rectangle(430, GAME_H / 2, 470, GAME_H, 0x0b0909, 0.82).setOrigin(0.5);
    this.add.rectangle(468, GAME_H / 2, 2, GAME_H - 90, palette.wine, 0.65);
  }

  createMenu() {
    this.add.text(70, 80, 'SANGUE', {
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      fontSize: '74px',
      color: '#efe4d1'
    }).setShadow(4, 6, '#4d1719', 0, true, true);

    this.add.text(74, 158, 'ROMA · 1980', {
      fontFamily: 'Courier New',
      fontSize: '15px',
      color: '#b99a58'
    });

    this.add.text(74, 196, 'Una storia di sangue, debiti e famiglia.', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#8e8378'
    });

    this.menuItems = [
      { label: 'DEVAM ET', action: () => this.continueGame(), disabled: !this.saveData },
      { label: 'YENİ OYUN', action: () => this.newGame() },
      { label: 'LOAD / SAVE', action: () => this.openSavePanel() },
      { label: 'AYARLAR', action: () => this.openSettingsPanel() }
    ];

    this.menuTexts = this.menuItems.map((item, index) => {
      const text = this.add.text(82, 300 + index * 62, item.label, {
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        fontSize: '24px',
        color: item.disabled ? '#4f4846' : '#d8cdbd',
        backgroundColor: '#00000000',
        padding: { x: 10, y: 8 }
      }).setInteractive({ useHandCursor: !item.disabled });

      text.on('pointerover', () => {
        if (!item.disabled && !this.panelOpen) {
          this.menuIndex = index;
          this.refreshSelection();
        }
      });
      text.on('pointerdown', () => {
        if (!item.disabled && !this.panelOpen) {
          this.menuIndex = index;
          this.activateSelection();
        }
      });
      return text;
    });

    this.selector = this.add.text(55, 305, '›', {
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      fontSize: '28px',
      color: '#9c2b2f'
    });

    this.refreshSelection();
  }

  createFooter() {
    this.add.text(74, 654, 'W/S veya ↑/↓ seç · ENTER onayla · ESC geri', {
      fontFamily: 'Courier New',
      fontSize: '12px',
      color: '#766d67'
    });

    this.add.text(1188, 654, 'v0.1', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      color: '#5d5550'
    }).setOrigin(1, 0);
  }

  createRain() {
    this.rain = [];
    for (let i = 0; i < 75; i++) {
      const line = this.add.rectangle(
        Phaser.Math.Between(0, GAME_W),
        Phaser.Math.Between(0, GAME_H),
        2,
        Phaser.Math.Between(9, 20),
        0xb8beca,
        Phaser.Math.FloatBetween(0.06, 0.18)
      ).setAngle(12);
      this.rain.push(line);
    }
  }

  update(_time, delta) {
    this.rain.forEach((drop) => {
      drop.y += delta * 0.42;
      drop.x -= delta * 0.07;
      if (drop.y > GAME_H + 20) {
        drop.y = -20;
        drop.x = Phaser.Math.Between(0, GAME_W);
      }
    });

    if (this.panelOpen) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.closePanel();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keys.S)) {
      this.moveSelection(1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W)) {
      this.moveSelection(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.activateSelection();
    }
  }

  moveSelection(direction) {
    let next = this.menuIndex;
    do {
      next = Phaser.Math.Wrap(next + direction, 0, this.menuItems.length);
    } while (this.menuItems[next].disabled && next !== this.menuIndex);
    this.menuIndex = next;
    this.refreshSelection();
  }

  refreshSelection() {
    this.menuTexts.forEach((text, index) => {
      const item = this.menuItems[index];
      text.setColor(item.disabled ? '#4f4846' : index === this.menuIndex ? '#efe4d1' : '#b3a89d');
      text.setBackgroundColor(index === this.menuIndex && !item.disabled ? '#2b171acc' : '#00000000');
    });
    this.selector.setY(305 + this.menuIndex * 62).setVisible(!this.menuItems[this.menuIndex].disabled);
  }

  activateSelection() {
    const item = this.menuItems[this.menuIndex];
    if (!item || item.disabled) return;
    item.action();
  }

  newGame() {
    localStorage.removeItem(this.saveKey);
    this.cameras.main.fadeOut(350, 16, 13, 13);
    this.time.delayedCall(370, () => this.scene.start('intro'));
  }

  continueGame() {
    if (!this.saveData) return;
    this.cameras.main.fadeOut(350, 16, 13, 13);
    this.time.delayedCall(370, () => this.scene.start(this.saveData.scene, { saveData: this.saveData }));
  }

  openSavePanel() {
    const body = this.saveData
      ? 'Kayıt bulundu.\n\nBölüm: ' + (this.saveData.chapter || 'Capitolo I') + '\nKonum: ' + (this.saveData.location || 'Trastevere')
      : 'Henüz kayıt bulunmuyor.\n\nOyuna başladıktan sonra kayıt oluşturabilirsin.';
    this.openPanel('LOAD / SAVE', body, this.saveData ? 'ENTER: Yükle   ·   ESC: Geri' : 'ESC: Geri', () => this.continueGame());
  }

  openSettingsPanel() {
    const rainText = this.settings.rain !== false ? 'AÇIK' : 'KAPALI';
    const scanlineText = this.settings.scanlines !== false ? 'AÇIK' : 'KAPALI';
    this.openPanel(
      'AYARLAR',
      'Yağmur: ' + rainText + '\nScanline efekti: ' + scanlineText + '\n\nAyarlar altyapısı hazır. Ses ve görüntü seçenekleri sonraki adımda genişletilecek.',
      'R: Yağmur   ·   T: Scanline   ·   ESC: Geri'
    );

    this.panelKeyHandler = (event) => {
      if (!this.panelOpen) return;
      if (event.code === 'KeyR') {
        this.settings.rain = this.settings.rain === false;
        this.persistSettings();
        this.closePanel();
        this.openSettingsPanel();
      }
      if (event.code === 'KeyT') {
        this.settings.scanlines = this.settings.scanlines === false;
        this.persistSettings();
        document.querySelector('.scanlines')?.style.setProperty('display', this.settings.scanlines === false ? 'none' : 'block');
        this.closePanel();
        this.openSettingsPanel();
      }
    };
    this.input.keyboard.on('keydown', this.panelKeyHandler);
  }

  openPanel(title, body, footer, onEnter = null) {
    this.panelOpen = true;
    this.panelEnter = onEnter;

    this.panel = this.add.container(0, 0).setDepth(120);
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x080606, 0.72);
    const box = this.add.rectangle(830, 345, 560, 330, 0x130f10, 0.98);
    box.setStrokeStyle(2, palette.wine, 0.8);

    const titleText = this.add.text(590, 220, title, {
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      fontSize: '28px',
      color: '#efe4d1'
    });

    const bodyText = this.add.text(590, 278, body, {
      fontFamily: 'Courier New',
      fontSize: '17px',
      color: '#b8ada1',
      lineSpacing: 10,
      wordWrap: { width: 480 }
    });

    const footerText = this.add.text(590, 456, footer, {
      fontFamily: 'Courier New',
      fontSize: '12px',
      color: '#7f746c'
    });

    this.panel.add([dim, box, titleText, bodyText, footerText]);

    this.panelEnterHandler = () => {
      if (this.panelOpen && this.panelEnter) this.panelEnter();
    };
    this.input.keyboard.on('keydown-ENTER', this.panelEnterHandler);
  }

  closePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    this.panel?.destroy(true);
    this.panel = null;
    if (this.panelEnterHandler) {
      this.input.keyboard.off('keydown-ENTER', this.panelEnterHandler);
      this.panelEnterHandler = null;
    }
    if (this.panelKeyHandler) {
      this.input.keyboard.off('keydown', this.panelKeyHandler);
      this.panelKeyHandler = null;
    }
  }

  readSave() {
    try {
      return normalizeSave(JSON.parse(localStorage.getItem(this.saveKey) || 'null'));
    } catch {
      return null;
    }
  }

  readSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.settingsKey) || '{}') || {};
    } catch {
      return {};
    }
  }

  persistSettings() {
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
  }
}

class IntroScene extends Phaser.Scene {
  constructor() { super('intro'); }

  create() {
    this.cameras.main.setBackgroundColor('#100d0d');
    this.advanceIntro = () => this.nextCard();
    this.input.keyboard.on('keydown-SPACE', this.advanceIntro);
    this.input.on('pointerdown', this.advanceIntro);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off('keydown-SPACE', this.advanceIntro);
      this.input.off('pointerdown', this.advanceIntro);
    });

    this.cards = [
      {
        kicker: 'ROMA · 1980',
        title: 'SANGUE',
        body: 'Gianlico Bianchi, 21 yaşında.\nBabası bir gecede ondan alındı.'
      },
      {
        kicker: 'CIMITERO DEL VERANO',
        title: 'IL FUNERALE',
        body: 'Herkes aynı ismi fısıldıyor:\nMonte “Savior” Cranier.'
      },
      {
        kicker: 'ARISEL',
        title: 'UN DEBITO DI SANGUE',
        body: 'Leonard “Borge” Arisel tek bir şey söylüyor:\n“İntikam istiyorsan önce hayatta kalmayı öğren.”'
      }
    ];

    this.cardIndex = -1;
    this.kicker = this.add.text(GAME_W / 2, 214, '', {
      fontFamily: 'Courier New', fontSize: '18px', color: '#b99a58'
    }).setOrigin(0.5).setAlpha(0);

    this.title = this.add.text(GAME_W / 2, 292, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '64px', color: '#e7ddca'
    }).setOrigin(0.5).setAlpha(0);

    this.body = this.add.text(GAME_W / 2, 390, '', {
      fontFamily: 'Courier New', fontSize: '22px', color: '#a9a097',
      align: 'center', lineSpacing: 12
    }).setOrigin(0.5).setAlpha(0);

    this.add.text(GAME_W / 2, 638, 'SPACE / TIKLA  ·  devam', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#6f6661'
    }).setOrigin(0.5);

    this.nextCard();
  }

  nextCard() {
    if (this.transitioning) return;
    this.cardIndex++;

    if (this.cardIndex >= this.cards.length) {
      this.cameras.main.fadeOut(500, 16, 13, 13);
      this.time.delayedCall(520, () => this.scene.start('rome'));
      return;
    }

    const card = this.cards[this.cardIndex];
    this.transitioning = true;
    this.tweens.killTweensOf([this.kicker, this.title, this.body]);

    this.kicker.setText(card.kicker);
    this.title.setText(card.title);
    this.body.setText(card.body);
    this.kicker.setAlpha(0).setY(224);
    this.title.setAlpha(0).setY(302);
    this.body.setAlpha(0).setY(400);

    this.tweens.add({
      targets: [this.kicker, this.title, this.body],
      alpha: 1,
      y: '-=10',
      duration: 550,
      ease: 'Quad.out',
      onComplete: () => { this.transitioning = false; }
    });
  }
}

class RomeScene extends Phaser.Scene {
  constructor() { super('rome'); }

  init(data) {
    this.loadedSave = normalizeSave(data?.saveData);
  }

  create() {
    this.worldWidth = 4200;
    this.cameras.main.setBounds(0, 0, this.worldWidth, GAME_H);
    this.physics.world.setBounds(0, 0, this.worldWidth, GAME_H);

    this.createBackdrop();
    this.createWorld();
    this.createPlayer();
    this.createBorge();
    this.createElena();
    this.createLedger();
    this.createHud();
    this.createRain();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,E,SPACE');

    this.missionStage = this.loadedSave?.missionStage ?? STAGE.FIND_BORGE;
    this.hasLedger = this.loadedSave?.hasLedger ?? false;
    this.evidence = this.loadedSave?.evidence || [];
    this.dialogueOpen = false;
    this.transitioningScene = false;
    this.crouchHintShown = false;
    if (this.missionStage >= STAGE.CURRENT_END) this.cabinetDoor.setFillStyle(0x1a1819);
    this.setObjective(objectiveForStage(this.missionStage));

    if (Number.isFinite(this.loadedSave?.playerX)) {
      this.player.setPosition(this.loadedSave.playerX, this.loadedSave.playerY || STREET_CHARACTER_Y);
    }
    if (this.hasLedger) {
      this.ledger.setActive(false).setVisible(false);
    }

    this.cameras.main.startFollow(this.player, true, 0.14, 0.14, -220, 35);
    this.cameras.main.fadeIn(450, 16, 13, 13);

    this.time.delayedCall(550, () => {
      const chapter = chapterForStage(this.missionStage);
      this.showChapter(chapter.number, chapter.title);
    });
  }

  createBackdrop() {
    this.add.rectangle(this.worldWidth / 2, GAME_H / 2, this.worldWidth, GAME_H, palette.sky)
      .setScrollFactor(0);

    const moon = this.add.circle(1040, 130, 46, 0xd1c2a7, 0.55).setScrollFactor(0.08);
    moon.setBlendMode(Phaser.BlendModes.ADD);

    for (let i = 0; i < 48; i++) {
      const x = i * 115 + Phaser.Math.Between(-20, 30);
      const h = Phaser.Math.Between(90, 230);
      const w = Phaser.Math.Between(80, 145);
      const shade = i % 3 === 0 ? 0x2a2429 : 0x252026;
      this.add.rectangle(x, 520 - h / 2, w, h, shade).setOrigin(0, 0.5).setScrollFactor(0.35);

      if (i % 4 === 0) {
        this.add.rectangle(x + w * 0.5, 520 - h - 18, 5, 36, 0x19161a)
          .setScrollFactor(0.35);
      }
    }

    for (let i = 0; i < 22; i++) {
      const x = 40 + i * 210;
      this.add.rectangle(x, 515, 110, 165, i % 2 ? 0x4b3c3d : 0x544346)
        .setScrollFactor(0.65);
      this.add.rectangle(x + 22, 474, 14, 22, 0xd3ad68, 0.22).setScrollFactor(0.65);
      this.add.rectangle(x + 70, 474, 14, 22, 0xd3ad68, 0.12).setScrollFactor(0.65);
    }

    this.add.rectangle(this.worldWidth / 2, 675, this.worldWidth, 90, 0x171416).setScrollFactor(0.95);
  }

  createWorld() {
    this.platforms = this.physics.add.staticGroup();

    const groundY = STREET_GROUND_TOP + 8;
    for (let x = 0; x < this.worldWidth; x += 64) {
      this.platforms.create(x + 32, groundY, 'platform').refreshBody();
    }

    const streetObstacles = [
      [720, 626], [752, 626],
      [1730, 626], [1762, 626],
      [3010, 626], [3042, 626]
    ];

    streetObstacles.forEach(([x, y]) => {
      const c = this.platforms.create(x, y, 'crate');
      c.refreshBody();
    });

    // Sokak seviyesinde doğal traversal: alçak geçit, basamak ve depo rampası.
    this.streetGeometry = [];

    // A lowered street lintel leaves room to crouch beneath it. Its supports
    // are part of the background wall, so they do not seal off the pavement.
    const lowPass = this.add.rectangle(2230, 577, 250, 34, 0x302b28).setDepth(4);
    this.physics.add.existing(lowPass, true);
    this.streetGeometry.push(lowPass);

    this.add.rectangle(2230, 560, 250, 4, 0x5b4a40).setDepth(5);
    this.add.rectangle(2230, 592, 250, 3, 0x171313).setDepth(5);
    [2096, 2364].forEach((x) => {
      this.add.rectangle(x, 590, 18, 120, 0x3d3632).setDepth(3);
    });

    const steps = [
      [2620, 626, 80, 32],
      [2690, 618, 80, 48],
      [2760, 610, 80, 64]
    ];
    steps.forEach(([x, y, w, h]) => {
      const step = this.add.rectangle(x, y, w, h, 0x4d4540).setDepth(3);
      this.physics.add.existing(step, true);
      this.streetGeometry.push(step);
    });

    for (let x = 250; x < this.worldWidth; x += 460) {
      this.add.image(x, STREET_GROUND_TOP, 'lamp').setOrigin(0.5, 1).setDepth(2);
      this.add.circle(x, STREET_GROUND_TOP - 36, 42, 0xd7a958, 0.04).setDepth(1);
    }

    this.createLandmarks();
  }

  createLandmarks() {
    const wall = (x, width, color) => this.add.rectangle(x, 526, width, 232, color).setDepth(1);
    const window = (x, y, lit = false) => {
      this.add.rectangle(x, y, 45, 53, 0x15191d).setDepth(2);
      this.add.rectangle(x, y, 37, 45, lit ? 0x997044 : 0x38363b, lit ? 0.44 : 0.85).setDepth(2);
      this.add.rectangle(x, y, 3, 49, 0x302c2a).setDepth(3);
      this.add.rectangle(x, y, 43, 3, 0x302c2a).setDepth(3);
    };

    wall(360, 330, 0x443a3a);
    window(266, 485, true);
    window(455, 485);
    this.apartmentDoorX = 370;
    this.add.rectangle(this.apartmentDoorX, 583, 80, 118, 0x252023).setDepth(2);
    this.add.rectangle(this.apartmentDoorX, 583, 66, 110, 0x4b3431).setDepth(3);
    this.add.rectangle(394, 589, 5, 5, palette.gold).setDepth(4);
    this.add.text(307, 509, 'CASA BIANCHI', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#d2c2aa',
      backgroundColor: '#241d1f', padding: { x: 6, y: 3 }
    }).setDepth(4);

    wall(1150, 445, 0x382c30);
    window(995, 480, true);
    window(1305, 480, true);
    this.add.rectangle(1165, 577, 145, 130, 0x1d171b).setDepth(2);
    this.add.rectangle(1165, 576, 120, 115, 0x593a31).setDepth(3);
    this.add.rectangle(1165, 557, 92, 63, 0x9a6b43, 0.3).setDepth(4);
    this.add.text(1063, 437, 'BAR ARISEL', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#b99a58',
      backgroundColor: '#24191b', padding: { x: 8, y: 5 }
    }).setDepth(4);

    this.add.rectangle(3235, 522, 260, 8, 0x4a4947).setDepth(3);
    this.add.rectangle(3130, 578, 7, 120, 0x3e3b3a).setDepth(3);
    this.add.rectangle(3350, 578, 7, 120, 0x3e3b3a).setDepth(3);
    this.add.rectangle(3235, 565, 204, 62, 0x71807a, 0.13).setDepth(2);
    this.add.rectangle(3235, 629, 110, 16, 0x4b3c32).setDepth(3);
    this.add.text(3141, 530, 'FERMATA TRASTEVERE', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#e4d8c3',
      backgroundColor: '#292b2a', padding: { x: 6, y: 3 }
    }).setDepth(4);

    wall(3670, 690, 0x3b3835);
    this.add.rectangle(3650, 558, 465, 166, 0x26282a).setDepth(2);
    for (let y = 490; y < 630; y += 17) {
      this.add.rectangle(3650, y, 460, 3, 0x474748).setDepth(3);
    }
    this.add.text(3494, 452, 'MAGAZZINO 17', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#d8c6ab',
      backgroundColor: '#24191b', padding: { x: 8, y: 5 }
    }).setDepth(4);
    this.add.rectangle(3730, 625, 88, 34, 0x55443a).setDepth(4);
    this.add.rectangle(3730, 608, 92, 5, 0x927155).setDepth(5);
    this.cabinetX = 3910;
    this.add.rectangle(this.cabinetX, 587, 62, 110, 0x342e2d).setDepth(4);
    this.cabinetDoor = this.add.rectangle(this.cabinetX, 587, 51, 100, 0x51413a).setDepth(5);
    this.add.text(this.cabinetX, 560, '31', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#c6ac78'
    }).setOrigin(0.5).setDepth(6);

    [250, 990, 1510, 2410, 3250, 3900].forEach((x, i) => {
      this.add.rectangle(x, 647, 105 + (i % 3) * 18, 2, 0xb88a55, 0.22).setDepth(3);
      this.add.rectangle(x + 22, 653, 70, 1, 0xb88a55, 0.15).setDepth(3);
    });
  }

  createPlayer() {
    this.playerShadow = this.add.ellipse(160, STREET_GROUND_TOP - 2, 45, 8, 0x0b090a, 0.45)
      .setDepth(6);
    this.player = this.physics.add.sprite(160, STREET_CHARACTER_Y, 'gianlico-sheet', 0)
      .setScale(CHARACTER_SCALE)
      .setDepth(8)
      .setCollideWorldBounds(true);

    this.player.play('gianlico-idle');

    this.player.body.setSize(15, 28).setOffset(4, 3);
    this.player.body.setMaxVelocity(300, 1000);
    this.player.body.setDragX(0);

    this.moveSpeed = 300;
    this.crouchSpeed = 145;
    this.groundAccel = 2600;
    this.airAccel = 1500;
    this.groundDecel = 3200;
    this.jumpVelocity = -760;
    this.coyoteMs = 110;
    this.jumpBufferMs = 120;
    this.lastGroundedAt = -Infinity;
    this.jumpBufferedUntil = -Infinity;
    this.isCrouching = false;

    this.physics.add.collider(this.player, this.platforms);
    if (this.streetGeometry) {
      this.streetGeometry.forEach((object) => this.physics.add.collider(this.player, object));
    }
  }

  createBorge() {
    this.add.ellipse(1170, STREET_GROUND_TOP - 2, 45, 8, 0x0b090a, 0.45).setDepth(6);
    this.borge = this.add.sprite(1170, STREET_CHARACTER_Y, 'borge-sheet', 0)
      .setScale(CHARACTER_SCALE).setDepth(7);
    this.borge.play('borge-idle');
    this.borge.nameLabel = this.add.text(1170, 550, 'BORGE', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#b99a58',
      backgroundColor: '#171313', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(9);
  }

  createElena() {
    this.add.ellipse(3270, STREET_GROUND_TOP - 2, 43, 8, 0x0b090a, 0.4).setDepth(6);
    this.elena = this.add.sprite(3270, STREET_CHARACTER_Y, 'elena-sheet', 0)
      .setScale(CHARACTER_SCALE).setDepth(7).play('elena-idle');
    this.add.text(3270, 550, 'ELENA', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#c5aa80',
      backgroundColor: '#171313', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(9);
  }

  createLedger() {
    this.ledger = this.add.image(3730, 585, 'ledger').setScale(1.7).setDepth(6);
  }

  createHud() {
    this.objectivePanel = this.add.rectangle(24, 24, 430, 74, 0x100d0d, 0.82)
      .setOrigin(0).setScrollFactor(0).setDepth(50);
    this.objectivePanel.setStrokeStyle(2, palette.wine);

    this.objectiveText = this.add.text(42, 58, '', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#e7ddca'
    }).setScrollFactor(0).setDepth(51);

    this.hintText = this.add.text(GAME_W - 28, 28, 'A/D hareket · SPACE zıpla · S/↓ çömel · E etkileşim', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#c1b6a7',
      backgroundColor: '#100d0dcc', padding: { x: 10, y: 7 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    this.chapterLabel = this.add.text(42, 35, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '13px', color: '#b99a58'
    }).setScrollFactor(0).setDepth(52);

    this.prompt = this.add.text(GAME_W / 2, GAME_H - 88, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '15px', color: '#e7ddca',
      backgroundColor: '#171313ee', padding: { x: 13, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setVisible(false);

    this.traversalHint = this.add.text(GAME_W / 2, GAME_H - 136, 'ALÇAK GEÇİT  ·  S / ↓ ile çömel', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '15px', color: '#e7ddca',
      backgroundColor: '#171313ee', padding: { x: 13, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setVisible(false).setAlpha(0);

    this.dialogueBox = this.add.container(0, 0).setScrollFactor(0).setDepth(80).setVisible(false);
    const box = this.add.rectangle(80, 494, GAME_W - 160, 170, 0x100d0d, 0.94).setOrigin(0);
    box.setStrokeStyle(2, palette.gold, 0.55);
    this.dialogueName = this.add.text(110, 516, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#b99a58'
    });
    this.dialogueText = this.add.text(110, 550, '', {
      fontFamily: 'Courier New', fontSize: '19px', color: '#e7ddca',
      wordWrap: { width: GAME_W - 220 }, lineSpacing: 8
    });
    this.dialogueContinue = this.add.text(GAME_W - 110, 628, 'E  DEVAM', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#8e8378'
    }).setOrigin(1);
    this.dialogueBox.add([box, this.dialogueName, this.dialogueText, this.dialogueContinue]);
  }

  createRain() {
    this.rain = [];
    for (let i = 0; i < 95; i++) {
      const line = this.add.rectangle(
        Phaser.Math.Between(0, GAME_W),
        Phaser.Math.Between(0, GAME_H),
        2, Phaser.Math.Between(10, 22),
        0xb8beca,
        Phaser.Math.FloatBetween(0.08, 0.22)
      ).setScrollFactor(0).setDepth(45).setAngle(12);
      this.rain.push(line);
    }
  }

  update(_time, delta) {
    if (!this.player) return;

    this.updateRain(delta);
    this.playerShadow.x = this.player.x;
    const heightAboveStreet = Math.max(0, STREET_CHARACTER_Y - this.player.y);
    this.playerShadow.setScale(Math.max(0.55, 1 - heightAboveStreet / 450));
    this.playerShadow.setAlpha(Math.max(0.16, 0.45 - heightAboveStreet / 700));

    if (this.dialogueOpen) {
      this.player.setVelocityX(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.advanceDialogue();
      return;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const crouchHeld = this.cursors.down.isDown || this.keys.S.isDown;
    const grounded = this.player.body.blocked.down;
    const now = this.time.now;
    const dt = Math.min(delta / 1000, 0.033);

    if (grounded) this.lastGroundedAt = now;
    if (jumpPressed && !crouchHeld) this.jumpBufferedUntil = now + this.jumpBufferMs;

    const shouldCrouch = (grounded && crouchHeld) ||
      (this.isCrouching && !this.canStandUp());
    if (shouldCrouch !== this.isCrouching) {
      this.isCrouching = shouldCrouch;
      if (this.isCrouching) {
        this.player.body.setSize(15, 18).setOffset(4, 13);
      } else {
        this.player.body.setSize(15, 28).setOffset(4, 3);
      }
    }

    const input = (right ? 1 : 0) - (left ? 1 : 0);
    const accel = grounded ? this.groundAccel : this.airAccel;
    const currentVx = this.player.body.velocity.x;

    if (input !== 0) {
      const targetSpeed = this.isCrouching ? this.crouchSpeed : this.moveSpeed;
      const targetVx = input * targetSpeed;
      const nextVx = Phaser.Math.Linear(
        currentVx,
        targetVx,
        Math.min(1, (accel * dt) / Math.max(1, Math.abs(targetVx - currentVx)))
      );
      this.player.setVelocityX(nextVx);
      this.player.setFlipX(input < 0);
    } else {
      const decelStep = this.groundDecel * dt;
      const nextVx = Math.abs(currentVx) <= decelStep
        ? 0
        : currentVx - Math.sign(currentVx) * decelStep;
      this.player.setVelocityX(nextVx);
    }

    const canCoyoteJump = now - this.lastGroundedAt <= this.coyoteMs;
    if (!this.isCrouching && this.jumpBufferedUntil >= now && canCoyoteJump) {
      this.player.setVelocityY(this.jumpVelocity);
      this.jumpBufferedUntil = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    if (!jumpHeld && this.player.body.velocity.y < -260) {
      this.player.setVelocityY(-260);
    }

    this.updatePlayerVisual();
    this.updateInteractions();
    this.updateTraversalHint();
  }

  canStandUp() {
    const body = this.player.body;
    const headroom = 10 * Math.abs(this.player.scaleY);
    // Standing and crouching share the same foot position; only the upper
    // ten sprite pixels need checking before restoring the taller body.
    return this.physics.overlapRect(
      body.x + 1, body.y - headroom, body.width - 2, headroom - 1, false, true
    ).length === 0;
  }

  updateTraversalHint() {
    if (this.crouchHintShown || Math.abs(this.player.x - 2230) > 390) return;
    this.crouchHintShown = true;
    this.traversalHint.setVisible(true);
    this.tweens.add({
      targets: this.traversalHint,
      alpha: 1,
      duration: 180,
      hold: 3000,
      yoyo: true,
      onComplete: () => this.traversalHint.setVisible(false)
    });
  }

  updateRain(delta) {
    const speed = delta * 0.48;
    this.rain.forEach((drop) => {
      drop.y += speed;
      drop.x -= speed * 0.16;
      if (drop.y > GAME_H + 20) {
        drop.y = -20;
        drop.x = Phaser.Math.Between(0, GAME_W);
      }
      if (drop.x < -20) drop.x = GAME_W + 20;
    });
  }

  updatePlayerVisual() {
    const vx = this.player.body.velocity.x;
    const vy = this.player.body.velocity.y;

    if (this.isCrouching) {
      if (Math.abs(vx) > 18) {
        this.player.play('gianlico-crouch-walk', true);
      } else {
        this.player.anims.stop();
        this.player.setFrame(12);
      }
      return;
    }

    if (!this.player.body.blocked.down || vy < -10) {
      // Physics drives the vertical position; the pose follows ascent, apex
      // and descent so a short jump cannot get stuck showing a takeoff frame.
      const frame = vy < -280 ? 18 : vy < 180 ? 19 : vy < 540 ? 20 : 21;
      this.player.anims.stop();
      this.player.setFrame(frame);
      return;
    }

    if (Math.abs(vx) > 35) {
      this.player.play('gianlico-walk', true);
    } else {
      this.player.play('gianlico-idle', true);
    }
  }

  updateInteractions() {
    const nearBorge = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.borge.x, this.borge.y
    ) < 105;

    const nearLedger = this.ledger.active && Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ledger.x, this.ledger.y
    ) < 95;

    const nearHome = Math.abs(this.player.x - this.apartmentDoorX) < 75;
    const nearElena = Math.abs(this.player.x - this.elena.x) < 85;
    const nearCabinet = Math.abs(this.player.x - this.cabinetX) < 80;

    if (nearHome && this.missionStage >= STAGE.GO_HOME && this.missionStage <= STAGE.MEET_ELENA) {
      this.prompt.setText('[ E ]  Bianchi dairesine gir').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.enterApartment();
      return;
    }

    if (nearElena && this.missionStage === STAGE.MEET_ELENA) {
      this.prompt.setText('[ E ]  Elena ile konuş').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interactElena();
      return;
    }

    if (nearCabinet && this.missionStage === STAGE.OPEN_CABINET) {
      this.prompt.setText('[ E ]  31 numaralı dolabı aç').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.openCabinet();
      return;
    }

    if (nearBorge) {
      this.prompt.setText('[ E ]  Borge ile konuş').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interactBorge();
      return;
    }

    if (nearLedger && this.missionStage === STAGE.FIND_LEDGER) {
      this.prompt.setText('[ E ]  Defteri al').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.takeLedger();
      return;
    }

    this.prompt.setVisible(false);
  }

  interactBorge() {
    if (this.missionStage === STAGE.FIND_BORGE) {
      this.startDialogue([
        ['GIANLICO', 'Cenazede herkes Cranier’ın adını söyledi. Sen neden söylemedin?'],
        ['BORGE', 'Cenazede konuşmak kolay. Babanın ölümüne dair elimizde yalnızca eksik bir hesap var.'],
        ['BORGE', 'Magazzino 17’de kırmızı bir defter duruyor. Onu getir. Önce neyi bilmediğimizi öğrenelim.']
      ], () => {
        this.missionStage = STAGE.FIND_LEDGER;
        this.setObjective(objectiveForStage(this.missionStage));
        this.saveGame();
      });
    } else if (this.missionStage === STAGE.FIND_LEDGER) {
      this.startDialogue([
        ['BORGE', 'Defter olmadan birini suçlayamam. Sen de suçlama, Gianlico.']
      ]);
    } else if (this.missionStage === STAGE.RETURN_LEDGER) {
      this.startDialogue([
        ['GIANLICO', 'Son sayfada babamın işareti var. Ölmeden iki gün önce, 31 numaralı bir kayıt.'],
        ['BORGE', 'Ödeme yazmıyor. Yalnızca teslimat. O hafta babanı görmedim; ne taşıdığını bilmiyorum.'],
        ['GIANLICO', 'Bana şimdi mi söylüyorsun?'],
        ['BORGE', 'Bildiğim her şeyi söylediğime inanmanı beklemiyorum. Evine git; bıraktığı şeylere bak.']
      ], () => {
        this.missionStage = STAGE.GO_HOME;
        this.setObjective(objectiveForStage(this.missionStage));
        this.saveGame();
        this.showChapter('CAPITOLO II', 'LA STANZA VUOTA');
      });
    } else if (this.missionStage === STAGE.MEET_ELENA) {
      this.startDialogue([['BORGE', 'Evde bir isim bulduysan onunla konuş. Benim anlattıklarıma güvenmek zorunda değilsin.']]);
    } else if (this.missionStage === STAGE.QUESTION_BORGE) {
      this.startDialogue([
        ['GIANLICO', 'Elena sizi o gece babamla gördü. Bana görüşmediğinizi söylemiştin.'],
        ['BORGE', 'Evet, yanındaydım. Yalan söyledim. Peşine düşeceğinden korktum.'],
        ['GIANLICO', 'Onu korudun mu, yoksa kendini mi?'],
        ['BORGE', 'Buna sözümle karar verme. 31 numaralı dolabı aç. İçindekiler ikimizi de suçlayabilir.']
      ], () => {
        this.missionStage = STAGE.OPEN_CABINET;
        this.setObjective(objectiveForStage(this.missionStage));
        this.saveGame();
        this.showChapter('CAPITOLO III', 'IL NUMERO 31');
      });
    } else if (this.missionStage === STAGE.OPEN_CABINET) {
      this.startDialogue([['BORGE', '31 numaralı dolap hâlâ Magazzino 17’de. Gerçeği istiyorsan önce oraya bak.']]);
    } else if (this.missionStage === STAGE.CURRENT_END) {
      this.startDialogue([['BORGE', 'Civitavecchia kaydını gördün. Şimdi o iki imzanın kimlere ait olduğunu kanıtlamamız gerek.']]);
    } else {
      this.startDialogue([['BORGE', 'Babanın eşyalarına bak, Gianlico. Sonra konuşuruz.']]);
    }
  }

  takeLedger() {
    if (this.missionStage !== STAGE.FIND_LEDGER) return;
    this.hasLedger = true;
    this.missionStage = STAGE.RETURN_LEDGER;
    this.ledger.setActive(false).setVisible(false);
    this.setObjective(objectiveForStage(this.missionStage));
    this.saveGame();
    this.cameras.main.flash(180, 183, 154, 88, false);
  }

  enterApartment() {
    if (this.transitioningScene) return;
    this.transitioningScene = true;
    if (this.missionStage === STAGE.GO_HOME) this.missionStage = STAGE.SEARCH_COAT;
    const saveData = this.saveGame('apartment');
    this.cameras.main.fadeOut(240, 12, 10, 11);
    this.time.delayedCall(260, () => this.scene.start('apartment', { saveData }));
  }

  interactElena() {
    this.startDialogue([
      ['GIANLICO', 'Babamın masasındaki notta adın vardı. Ölmeden önce seninle görüşmüş mü?'],
      ['ELENA', 'O gece burada bilet sordu. Saat on biri geçmişti. Yanında Arisel vardı.'],
      ['GIANLICO', 'Borge bana onu o hafta görmediğini söyledi.'],
      ['ELENA', 'Bir araba geldi. Plakayı seçemedim. Baban gitmeden önce bana "Oğlum öğrenirse kendi karar versin" dedi.'],
      ['GIANLICO', 'Neyi öğrenmem gerektiğini söylemedi mi?'],
      ['ELENA', 'Hayır. Korkuyordu. Arisel ise hiçbir şey söylemedi.']
    ], () => {
      this.missionStage = STAGE.QUESTION_BORGE;
      this.setObjective(objectiveForStage(this.missionStage));
      this.saveGame();
    });
  }

  openCabinet() {
    if (!this.evidence.includes('key31')) {
      this.startDialogue([['GIANLICO', 'Dolap kilitli. Paltodaki anahtarı tekrar bulmalıyım.']]);
      return;
    }
    this.startDialogue([
      ['GIANLICO', 'Anahtar uydu. İçeride bir sevkiyat dökümü var.'],
      ['GIANLICO', 'Civitavecchia. Teslim alan iki imza: A. ve C. Babamın adı ikisinin arasında çizilmiş.'],
      ['GIANLICO', 'Borge da Cranier da bu kaydı biliyordu. Babamın neden sustuğunu öğrenmeliyim.']
    ], () => {
      this.cabinetDoor.setFillStyle(0x1a1819);
      this.evidence.push('manifest');
      this.missionStage = STAGE.CURRENT_END;
      this.setObjective(objectiveForStage(this.missionStage));
      this.saveGame();
      this.showChapter('INDIZIO TROVATO', 'CIVITAVECCHIA');
    });
  }

  startDialogue(lines, onComplete) {
    this.dialogueOpen = true;
    this.player.setVelocityX(0);
    this.updatePlayerVisual();
    this.currentDialogue = lines;
    this.dialogueIndex = -1;
    this.dialogueDone = onComplete;
    this.dialogueBox.setVisible(true);
    this.prompt.setVisible(false);
    this.advanceDialogue();
  }

  advanceDialogue() {
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.currentDialogue.length) {
      this.dialogueOpen = false;
      this.dialogueBox.setVisible(false);
      const done = this.dialogueDone;
      this.dialogueDone = null;
      if (done) done();
      return;
    }

    const [name, text] = this.currentDialogue[this.dialogueIndex];
    this.dialogueName.setText(name);
    this.dialogueText.setText(text);
  }

  setObjective(text) {
    if (this.objectiveText) this.objectiveText.setText(text);
    if (this.chapterLabel) {
      this.chapterLabel.setText(`${chapterForStage(this.missionStage).number}  ·  OBIETTIVO`);
    }
  }

  saveGame(scene = 'rome') {
    const saveData = {
      version: 2,
      scene,
      chapter: chapterForStage(this.missionStage).number,
      location: scene === 'apartment' ? 'Casa Bianchi' : 'Trastevere',
      missionStage: this.missionStage,
      hasLedger: this.hasLedger,
      evidence: this.evidence,
      playerX: Math.round(this.player?.x || 160),
      playerY: Math.round(this.player?.y || STREET_CHARACTER_Y),
      streetX: Math.round(this.player?.x || 370)
    };
    return writeSave(saveData);
  }

  showChapter(kicker, title) {
    const overlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x100d0d, 0.72)
      .setScrollFactor(0).setDepth(100).setAlpha(0);

    const k = this.add.text(GAME_W / 2, 308, kicker, {
      fontFamily: 'Courier New', fontSize: '15px', color: '#b99a58'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    const t = this.add.text(GAME_W / 2, 356, title, {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '42px', color: '#e7ddca'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.tweens.add({
      targets: [overlay, k, t],
      alpha: 1,
      duration: 280,
      yoyo: true,
      hold: 1400,
      onComplete: () => {
        overlay.destroy();
        k.destroy();
        t.destroy();
      }
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#100d0d',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 2200 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, IntroScene, RomeScene, ApartmentScene]
};

new Phaser.Game(config);

