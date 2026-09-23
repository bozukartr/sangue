const GAME_W = 1280;
const GAME_H = 720;

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
    this.scene.start('intro');
  }

  makeTextures() {
    const makeCharacter = (key, pose, coat = palette.suit, accent = palette.cream) => {
      const g = this.add.graphics();

      g.fillStyle(0x000000, 0.25);
      g.fillRect(5, 29, 14, 3);

      g.fillStyle(palette.skin);
      g.fillRect(8, 3, 8, 8);
      g.fillStyle(0x3a2722);
      g.fillRect(7, 2, 10, 3);
      g.fillRect(7, 5, 2, 4);

      g.fillStyle(accent);
      g.fillRect(9, 11, 6, 4);

      g.fillStyle(coat);
      g.fillRect(6, 14, 12, 10);
      g.fillRect(4, 15, 3, 8);
      g.fillRect(17, 15, 3, 8);

      g.fillStyle(palette.black);
      if (pose === 'runA') {
        g.fillRect(7, 24, 4, 6);
        g.fillRect(14, 24, 4, 4);
        g.fillRect(16, 28, 5, 3);
      } else if (pose === 'runB') {
        g.fillRect(7, 24, 4, 4);
        g.fillRect(4, 28, 7, 3);
        g.fillRect(14, 24, 4, 6);
      } else if (pose === 'jump') {
        g.fillRect(6, 24, 5, 4);
        g.fillRect(14, 24, 5, 4);
        g.fillRect(4, 27, 7, 3);
        g.fillRect(14, 27, 7, 3);
      } else {
        g.fillRect(7, 24, 4, 7);
        g.fillRect(14, 24, 4, 7);
      }

      g.generateTexture(key, 24, 32);
      g.destroy();
    };

    makeCharacter('gianlico-idle', 'idle');
    makeCharacter('gianlico-run-a', 'runA');
    makeCharacter('gianlico-run-b', 'runB');
    makeCharacter('gianlico-jump', 'jump');
    makeCharacter('borge', 'idle', 0x292126, palette.gold);

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

class IntroScene extends Phaser.Scene {
  constructor() { super('intro'); }

  create() {
    this.cameras.main.setBackgroundColor('#100d0d');
    this.input.keyboard.once('keydown-SPACE', () => this.nextCard(true));
    this.input.once('pointerdown', () => this.nextCard(true));

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

  nextCard(force = false) {
    if (this.transitioning && !force) return;
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

  create() {
    this.worldWidth = 4200;
    this.cameras.main.setBounds(0, 0, this.worldWidth, GAME_H);
    this.physics.world.setBounds(0, 0, this.worldWidth, GAME_H);

    this.createBackdrop();
    this.createWorld();
    this.createPlayer();
    this.createBorge();
    this.createLedger();
    this.createHud();
    this.createRain();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,E,SPACE');

    this.missionStage = 0;
    this.hasLedger = false;
    this.dialogueOpen = false;
    this.setObjective('Borge’u bul · Trastevere');

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -220, 35);
    this.cameras.main.fadeIn(450, 16, 13, 13);

    this.time.delayedCall(550, () => {
      this.showChapter('CAPITOLO I', 'IL PRIMO PASSO');
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

    const groundY = 650;
    for (let x = 0; x < this.worldWidth; x += 64) {
      this.platforms.create(x + 32, groundY, 'platform').refreshBody();
    }

    const ledges = [
      [520, 535, 4], [910, 455, 3], [1240, 545, 3], [1540, 500, 2],
      [1870, 420, 4], [2250, 520, 2], [2490, 450, 3], [2800, 380, 3],
      [3150, 500, 4], [3570, 430, 3]
    ];

    ledges.forEach(([x, y, count]) => {
      for (let i = 0; i < count; i++) {
        this.platforms.create(x + i * 64, y, 'platform').refreshBody();
      }
    });

    const crates = [
      [750, 610], [782, 610], [1770, 610], [1802, 610], [1834, 610],
      [2960, 610], [2992, 610]
    ];

    crates.forEach(([x, y]) => {
      const c = this.platforms.create(x, y, 'crate');
      c.refreshBody();
    });

    for (let x = 250; x < this.worldWidth; x += 460) {
      this.add.image(x, 606, 'lamp').setOrigin(0.5, 1).setDepth(2);
      this.add.circle(x, 568, 42, 0xd7a958, 0.04).setDepth(1);
    }

    this.add.text(1070, 596, 'BAR ARISEL', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#b99a58',
      backgroundColor: '#24191b', padding: { x: 8, y: 5 }
    }).setDepth(3);

    this.add.text(3420, 596, 'MAGAZZINO 17', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#d8c6ab',
      backgroundColor: '#24191b', padding: { x: 8, y: 5 }
    }).setDepth(3);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(160, 588, 'gianlico-idle')
      .setScale(2.2)
      .setDepth(8)
      .setCollideWorldBounds(true);

    this.player.body.setSize(15, 28).setOffset(4, 3);
    this.player.body.setMaxVelocity(320, 850);
    this.player.body.setDragX(1500);

    this.physics.add.collider(this.player, this.platforms);
  }

  createBorge() {
    this.borge = this.physics.add.staticSprite(1170, 584, 'borge').setScale(2.2).setDepth(7);
    this.borge.nameLabel = this.add.text(1170, 538, 'BORGE', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#b99a58',
      backgroundColor: '#171313', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(9);
  }

  createLedger() {
    this.ledger = this.physics.add.staticImage(3730, 584, 'ledger').setScale(1.7).setDepth(6);
    this.tweens.add({
      targets: this.ledger,
      y: 574,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.inOut'
    });
  }

  createHud() {
    this.objectivePanel = this.add.rectangle(24, 24, 430, 74, 0x100d0d, 0.82)
      .setOrigin(0).setScrollFactor(0).setDepth(50);
    this.objectivePanel.setStrokeStyle(2, palette.wine);

    this.add.text(42, 36, 'OBIETTIVO', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '13px', color: '#b99a58'
    }).setScrollFactor(0).setDepth(51);

    this.objectiveText = this.add.text(42, 58, '', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#e7ddca'
    }).setScrollFactor(0).setDepth(51);

    this.hintText = this.add.text(GAME_W - 28, 28, 'A/D veya ←/→  hareket   ·   SPACE zıpla   ·   E etkileşim', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#c1b6a7',
      backgroundColor: '#100d0dcc', padding: { x: 10, y: 7 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    this.prompt = this.add.text(GAME_W / 2, GAME_H - 88, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '15px', color: '#e7ddca',
      backgroundColor: '#171313ee', padding: { x: 13, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setVisible(false);

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

    if (this.dialogueOpen) {
      this.player.setVelocityX(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.advanceDialogue();
      return;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

    if (left) this.player.setAccelerationX(-1100);
    else if (right) this.player.setAccelerationX(1100);
    else this.player.setAccelerationX(0);

    if (left) this.player.setFlipX(true);
    else if (right) this.player.setFlipX(false);

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-720);
    }

    this.updatePlayerVisual();
    this.updateInteractions();
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

    if (!this.player.body.blocked.down) {
      this.player.setTexture('gianlico-jump');
      return;
    }

    if (Math.abs(vx) > 35) {
      const frame = Math.floor(this.time.now / 130) % 2;
      this.player.setTexture(frame ? 'gianlico-run-a' : 'gianlico-run-b');
    } else {
      this.player.setTexture('gianlico-idle');
      this.player.y += Math.sin(this.time.now / 220) * 0.03;
    }
  }

  updateInteractions() {
    const nearBorge = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.borge.x, this.borge.y
    ) < 105;

    const nearLedger = this.ledger.active && Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ledger.x, this.ledger.y
    ) < 95;

    if (nearBorge) {
      this.prompt.setText('[ E ]  Borge ile konuş').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interactBorge();
      return;
    }

    if (nearLedger) {
      this.prompt.setText('[ E ]  Defteri al').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.takeLedger();
      return;
    }

    this.prompt.setVisible(false);
  }

  interactBorge() {
    if (this.missionStage === 0) {
      this.startDialogue([
        ['BORGE', 'Babanın öfkesi sende de var. Ama öfke, Roma’da adamı yalnızca mezara daha hızlı götürür.'],
        ['GIANLICO', 'Cranier’in adını biliyorum. Bana geri kalanını söyle.'],
        ['BORGE', 'Önce Magazzino 17’ye git. Kırmızı bir hesap defteri var. Onu bana getir. Sonra konuşuruz.']
      ], () => {
        this.missionStage = 1;
        this.setObjective('Magazzino 17’ye ulaş · kırmızı defteri al');
      });
    } else if (this.missionStage === 1) {
      this.startDialogue([
        ['BORGE', 'Deftersiz dönme, ragazzo. Bu gece yalnızca ayaklarını değil, sabrını da sınayacağım.']
      ]);
    } else if (this.missionStage === 2) {
      this.startDialogue([
        ['GIANLICO', 'Defter burada. Şimdi Cranier’i konuşacağız.'],
        ['BORGE', 'Hayır. Şimdi ilk kez neden acele etmemen gerektiğini konuşacağız.'],
        ['BORGE', 'Bu defterdeki isimlerden biri babanın ölümünden üç gün önce onunla görüşmüş.'],
        ['GIANLICO', 'Kim?'],
        ['BORGE', 'Yarın öğreneceksin. Bu gece eve git. Ve kimseye güvenme.']
      ], () => {
        this.missionStage = 3;
        this.setObjective('Görev tamamlandı · Il Primo Passo');
        this.showChapter('MISSIONE COMPLETA', 'IL PRIMO PASSO');
      });
    }
  }

  takeLedger() {
    if (this.missionStage !== 1) return;
    this.hasLedger = true;
    this.missionStage = 2;
    this.ledger.setActive(false).setVisible(false);
    this.setObjective('Borge’a dön · defteri teslim et');
    this.cameras.main.flash(180, 183, 154, 88, false);
  }

  startDialogue(lines, onComplete) {
    this.dialogueOpen = true;
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
      gravity: { y: 1800 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, IntroScene, RomeScene]
};

new Phaser.Game(config);
