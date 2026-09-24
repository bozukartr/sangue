import { STAGE, chapterForStage, normalizeSave, objectiveForStage, writeSave } from '../story.js';

const WIDTH = 1280;
const HEIGHT = 720;
const FLOOR_TOP = 642;
const PLAYER_Y = FLOOR_TOP - 16 * 2.2;

export class ApartmentScene extends Phaser.Scene {
  constructor() { super('apartment'); }

  init(data) {
    this.loadedSave = normalizeSave(data?.saveData);
    this.missionStage = this.loadedSave?.missionStage === STAGE.GO_HOME
      ? STAGE.SEARCH_COAT : (this.loadedSave?.missionStage ?? STAGE.SEARCH_COAT);
    this.evidence = [...(this.loadedSave?.evidence || [])];
    this.streetX = this.loadedSave?.streetX || 370;
  }

  create() {
    this.cameras.main.setBackgroundColor('#201b1d');
    this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);
    this.createRoom();
    this.createPlayer();
    this.createHud();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,E,SPACE');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.dialogueOpen = false;
    this.transitioningScene = false;
    this.refreshObjective();
    this.cameras.main.fadeIn(380, 12, 10, 11);
    this.add.text(WIDTH / 2, 130, 'CASA BIANCHI  ·  TRASTEVERE', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#d2b995',
      backgroundColor: '#171315cc', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setAlpha(0.9);
  }

  createRoom() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x272225);
    this.add.rectangle(WIDTH / 2, 392, WIDTH, 500, 0x403437);
    this.add.rectangle(WIDTH / 2, 618, WIDTH, 48, 0x2a2222);
    this.add.rectangle(WIDTH / 2, 684, WIDTH, 84, 0x251f20);
    for (let x = 0; x < WIDTH; x += 64) {
      this.add.rectangle(x + 32, 658, 2, 30, 0x3d3431, 0.55);
    }
    this.add.rectangle(WIDTH / 2, 411, WIDTH, 8, 0x574548);
    this.add.rectangle(WIDTH / 2, 204, WIDTH, 9, 0x30282a);

    // The rainy street outside is cooler than the apartment's lamp light.
    this.add.rectangle(1094, 345, 232, 244, 0x171d27);
    this.add.rectangle(1094, 345, 202, 214, 0x303b4b);
    for (let i = 0; i < 15; i++) {
      const x = 1000 + (i * 37) % 185;
      const y = 252 + (i * 53) % 175;
      this.add.rectangle(x, y, 2, 18, 0xb1b5bf, 0.18);
    }
    this.add.rectangle(1094, 345, 8, 244, 0x6b5450);
    this.add.rectangle(1094, 345, 232, 7, 0x6b5450);
    this.add.rectangle(988, 360, 18, 254, 0x4e3239).setAlpha(0.9);
    this.add.rectangle(1200, 360, 18, 254, 0x4e3239).setAlpha(0.9);

    this.doorX = 112;
    this.add.rectangle(this.doorX, 568, 110, 148, 0x191719);
    this.add.rectangle(this.doorX, 571, 96, 136, 0x59413c);
    this.add.rectangle(this.doorX + 30, 574, 5, 5, 0xb99a58);
    this.add.text(55, 474, 'USCITA', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#cdb79d'
    });

    this.coatX = 414;
    this.add.rectangle(this.coatX, 540, 12, 205, 0x6c5142);
    this.add.rectangle(this.coatX, 449, 96, 8, 0x775c49);
    this.add.rectangle(this.coatX, 533, 62, 116, 0x282a2c);
    this.add.rectangle(this.coatX - 20, 529, 20, 100, 0x38383a);
    this.add.rectangle(this.coatX + 20, 529, 20, 100, 0x38383a);
    this.add.rectangle(this.coatX, 587, 65, 8, 0x1d1d20);

    this.deskX = 828;
    this.add.rectangle(this.deskX, 595, 255, 14, 0x75543f);
    this.add.rectangle(this.deskX - 100, 620, 15, 48, 0x4a342d);
    this.add.rectangle(this.deskX + 100, 620, 15, 48, 0x4a342d);
    this.add.rectangle(this.deskX + 35, 579, 70, 4, 0xd5c6a7);
    this.add.rectangle(this.deskX + 22, 574, 42, 3, 0x94867b);
    this.add.rectangle(this.deskX - 70, 548, 12, 72, 0x544238);
    this.add.circle(this.deskX - 70, 507, 24, 0xd7ae68, 0.35);
    this.add.rectangle(671, 540, 42, 86, 0x44312e);
    this.add.rectangle(671, 502, 51, 9, 0x62483b);

    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < WIDTH; x += 64) {
      this.platforms.create(x + 32, FLOOR_TOP + 8, 'platform').refreshBody();
    }
  }

  createPlayer() {
    const savedX = this.loadedSave?.apartmentX;
    const x = Number.isFinite(savedX) ? Phaser.Math.Clamp(savedX, 80, WIDTH - 80) : 185;
    this.player = this.physics.add.sprite(x, PLAYER_Y, 'gianlico-sheet', 0)
      .setScale(2.2).setDepth(10).setCollideWorldBounds(true);
    this.player.body.setSize(15, 28).setOffset(4, 3);
    this.player.body.setMaxVelocity(260, 900);
    this.player.play('gianlico-idle');
    this.physics.add.collider(this.player, this.platforms);
  }

  createHud() {
    this.add.rectangle(24, 24, 470, 74, 0x100d0d, 0.86).setOrigin(0).setDepth(40)
      .setStrokeStyle(2, 0x6b1f22);
    this.add.text(42, 35, 'CAPITOLO II  ·  OBIETTIVO', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '13px', color: '#b99a58'
    }).setDepth(41);
    this.objectiveText = this.add.text(42, 58, '', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#e7ddca'
    }).setDepth(41);
    this.add.text(WIDTH - 28, 28, 'A/D hareket · E incele / çıkış', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#c1b6a7',
      backgroundColor: '#100d0dcc', padding: { x: 10, y: 7 }
    }).setOrigin(1, 0).setDepth(41);
    this.prompt = this.add.text(WIDTH / 2, HEIGHT - 88, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '15px', color: '#e7ddca',
      backgroundColor: '#171313ee', padding: { x: 13, y: 8 }
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    this.dialogueBox = this.add.container(0, 0).setDepth(80).setVisible(false);
    const box = this.add.rectangle(80, 494, WIDTH - 160, 170, 0x100d0d, 0.95).setOrigin(0);
    box.setStrokeStyle(2, 0xb99a58, 0.55);
    this.dialogueName = this.add.text(110, 516, '', {
      fontFamily: 'Courier New', fontStyle: 'bold', fontSize: '16px', color: '#b99a58'
    });
    this.dialogueText = this.add.text(110, 550, '', {
      fontFamily: 'Courier New', fontSize: '19px', color: '#e7ddca',
      wordWrap: { width: WIDTH - 220 }, lineSpacing: 8
    });
    this.dialogueContinue = this.add.text(WIDTH - 110, 628, 'E  DEVAM', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#8e8378'
    }).setOrigin(1);
    this.dialogueBox.add([box, this.dialogueName, this.dialogueText, this.dialogueContinue]);
  }

  update(_time, delta) {
    if (this.dialogueOpen) {
      this.player.setVelocityX(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.advanceDialogue();
      return;
    }

    const direction = Number(this.keys.D.isDown || this.cursors.right.isDown) -
      Number(this.keys.A.isDown || this.cursors.left.isDown);
    const crouch = this.keys.S.isDown || this.cursors.down.isDown;
    const grounded = this.player.body.blocked.down;
    const target = direction * (crouch ? 135 : 250);
    const current = this.player.body.velocity.x;
    const step = (grounded ? 2600 : 1400) * Math.min(delta / 1000, 0.033);
    this.player.setVelocityX(Phaser.Math.Clamp(target - current, -step, step) + current);
    if (direction) this.player.setFlipX(direction < 0);

    if (grounded && !crouch && (
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up)
    )) this.player.setVelocityY(-650);

    if (crouch && grounded) {
      this.player.body.setSize(15, 18).setOffset(4, 13);
      if (Math.abs(this.player.body.velocity.x) > 18) this.player.play('gianlico-crouch-walk', true);
      else { this.player.anims.stop(); this.player.setFrame(12); }
    } else {
      this.player.body.setSize(15, 28).setOffset(4, 3);
      if (!grounded || this.player.body.velocity.y < -10) {
        const vy = this.player.body.velocity.y;
        this.player.anims.stop();
        this.player.setFrame(vy < -280 ? 18 : vy < 180 ? 19 : vy < 540 ? 20 : 21);
      } else if (Math.abs(this.player.body.velocity.x) > 35) this.player.play('gianlico-walk', true);
      else this.player.play('gianlico-idle', true);
    }

    this.updateInteractions();
  }

  updateInteractions() {
    const x = this.player.x;
    if (Math.abs(x - this.doorX) < 80) {
      this.prompt.setText('[ E ]  Sokağa çık').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.leaveApartment();
    } else if (Math.abs(x - this.coatX) < 80) {
      this.prompt.setText('[ E ]  Paltoyu incele').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.inspectCoat();
    } else if (Math.abs(x - this.deskX) < 100) {
      this.prompt.setText('[ E ]  Masayı incele').setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.inspectDesk();
    } else this.prompt.setVisible(false);
  }

  inspectCoat() {
    if (this.missionStage !== STAGE.SEARCH_COAT) {
      this.startDialogue([['GIANLICO', 'Astığı gibi duruyor. Astarındaki gizli dikişi artık biliyorum.']]);
      return;
    }
    this.startDialogue([
      ['GIANLICO', 'Babam bu paltoyu cenazeden önceki akşam giymişti.'],
      ['GIANLICO', 'Astarın içinde küçük bir anahtar var. Pirinç etikette yalnızca 31 yazıyor.'],
      ['GIANLICO', 'Bunu benden sakladıysa bir sebebi olmalı.']
    ], () => {
      this.evidence.push('key31');
      this.missionStage = STAGE.SEARCH_DESK;
      this.refreshObjective();
      this.persist();
    });
  }

  inspectDesk() {
    if (this.missionStage < STAGE.SEARCH_DESK) {
      this.startDialogue([['GIANLICO', 'Önce babamın paltosuna bakmalıyım.']]);
      return;
    }
    if (this.missionStage > STAGE.SEARCH_DESK) {
      this.startDialogue([['GIANLICO', 'Fotoğraftaki üç kişi hâlâ aynı yerde: babam, Borge ve Cranier.']]);
      return;
    }
    this.startDialogue([
      ['GIANLICO', 'Eski bir fotoğraf. Babam, Borge ve Cranier aynı masada. Düşman olmadan önce tanışıyorlarmış.'],
      ['GIANLICO', 'Arkasına bir isim yazmış: Elena Bellini. Yanında da "Trastevere durağı".'],
      ['GIANLICO', 'Borge bana fotoğraftan söz etmedi. Elena hâlâ oradaysa o geceyi anlatabilir.']
    ], () => {
      this.evidence.push('photo');
      this.missionStage = STAGE.MEET_ELENA;
      this.refreshObjective();
      this.persist();
    });
  }

  leaveApartment() {
    if (this.transitioningScene) return;
    this.transitioningScene = true;
    const saveData = writeSave({
      ...this.loadedSave,
      version: 2,
      scene: 'rome',
      chapter: chapterForStage(this.missionStage).number,
      location: 'Trastevere',
      missionStage: this.missionStage,
      evidence: this.evidence,
      playerX: this.streetX + 75,
      playerY: PLAYER_Y,
      streetX: this.streetX
    });
    this.cameras.main.fadeOut(240, 12, 10, 11);
    this.time.delayedCall(260, () => this.scene.start('rome', { saveData }));
  }

  refreshObjective() {
    this.objectiveText.setText(objectiveForStage(this.missionStage));
  }

  persist() {
    this.loadedSave = writeSave({
      ...this.loadedSave,
      version: 2,
      scene: 'apartment',
      chapter: chapterForStage(this.missionStage).number,
      location: 'Casa Bianchi',
      missionStage: this.missionStage,
      evidence: this.evidence,
      apartmentX: Math.round(this.player.x),
      streetX: this.streetX
    });
  }

  startDialogue(lines, onComplete) {
    this.dialogueOpen = true;
    this.player.setVelocityX(0);
    this.player.play('gianlico-idle', true);
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
}
