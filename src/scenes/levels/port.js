// Civitavecchia harbour at night (Capitolo IV). A stealth level: container
// stacks form an upper route, crane lights can be cut from a fuse box to
// pull a guard away, and Nico's key opens a side door past the card players.
import { GAME_W, GAME_H, GROUND_TOP, CHAR_Y, DEPTH, HEX } from '../../config.js';
import { state, formatLira } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { STAGE } from '../../story.js';
import { PX } from '../../gfx/textures.js';
import { WorldScene } from '../world.js';

const STOP_X = 110;
const NICO_X = 430;
const FUSE_X = 1880;
const SIDE_DOOR_X = 3060;
const OFFICE_X = 4760;
const CONTAINER_H = 56;

export class PortScene extends WorldScene {
  constructor() { super('port'); }

  levelConfig() {
    return {
      width: 5200,
      ground: 'tile-quay',
      background: '#0d1018',
      music: 'stealth',
      ambience: { sea: 1, rain: 0.2 },
      rain: 0.35,
      darkness: 0.64,
      darkColor: 0x03060d,
      stealth: true,
      location: ['CIVITAVECCHIA', 'PORTO · 01:10'],
      hint: 'S çömel: karanlıkta gizlen · arkadan J: etkisiz bırak · konteynerlerin üstünden geç'
    };
  }

  spawnX(entry) {
    return entry === 'resume' ? STOP_X + 60 : STOP_X + 60;
  }

  buildLevel() {
    this.lightsOff = false;
    const active = state.stage === STAGE.INFILTRATE_PORT || state.stage === STAGE.TRAVEL_PORT;
    this.buildBackdrop();
    this.buildEntrance();
    this.buildContainers();
    this.buildCranes();
    this.buildWarehouse();
    this.buildOffice();
    if (active) this.buildGuards();
  }

  buildBackdrop() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.sky);
    sky.fillGradientStyle(0x070a14, 0x070a14, 0x1c2438, 0x1c2438, 1);
    sky.fillRect(0, 0, GAME_W, GAME_H);
    this.add.circle(1060, 120, 34, 0xe8e0c8, 0.7).setScrollFactor(0.03).setDepth(DEPTH.sky);
    this.fx.glow(1060, 120, 140, 0xc8d0e0, 0.14, { scrollFactor: 0.03, depth: DEPTH.sky, cut: false });

    // Sea with moonlight.
    this.add.rectangle(0, 455, GAME_W, 130, 0x0e1826).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.far);
    for (let i = 0; i < 40; i++) {
      const shimmer = this.add.rectangle(960 + Math.random() * 220, 462 + Math.random() * 110, 8 + Math.random() * 24, 2, 0xc8d0e0, 0.3)
        .setScrollFactor(0).setDepth(DEPTH.far);
      this.tweens.add({ targets: shimmer, alpha: 0.02, duration: 600 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 1000 });
    }
    const ship = this.add.image(900, 470, 'ship').setOrigin(0.5, 1).setScale(PX).setScrollFactor(0.15).setDepth(DEPTH.far + 1).setTint(0x8090a8);
    this.add.image(2200, 480, 'ship').setOrigin(0.5, 1).setScale(PX * 1.4).setScrollFactor(0.25).setDepth(DEPTH.far + 1).setFlipX(true).setTint(0x6a7890);
    this.tweens.add({ targets: ship, y: 473, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const lh = this.add.image(1500, 470, 'lighthouse').setOrigin(0.5, 1).setScale(PX).setScrollFactor(0.12).setDepth(DEPTH.far + 1);
    const beam = this.add.image(1500, 300, 'cone').setOrigin(0, 0.5).setScrollFactor(0.12).setDepth(DEPTH.far + 2)
      .setDisplaySize(700, 90).setTint(0xfff0c0).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    beam.y = lh.y - lh.displayHeight + 22;
    this.tweens.add({ targets: beam, scaleX: { from: beam.scaleX, to: -beam.scaleX }, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.fx.glow(1500, beam.y, 50, 0xfff0c0, 0.6, { scrollFactor: 0.12, depth: DEPTH.far + 2, cut: false });

    this.parallax('midrow', 470, 0.2, { tint: 0x2a3040, depth: DEPTH.far, alpha: 0.6 });
    [600, 2400, 3900].forEach((x) => this.add.image(x, 520, 'crane').setOrigin(0.5, 1).setScale(PX).setScrollFactor(0.5).setDepth(DEPTH.mid).setTint(0x3a4050));
    this.fx.fog(560, DEPTH.mid + 2, 0.5, 14, 0x8090a8);
    this.fx.fog(620, DEPTH.front, 0.25, 22, 0x8090a8);
  }

  buildEntrance() {
    this.add.rectangle(STOP_X, 560, 6, 160, 0x2a2a2c).setDepth(DEPTH.props);
    this.add.circle(STOP_X, 480, 16, 0xc46a22).setDepth(DEPTH.props);
    this.add.text(STOP_X, 480, 'BUS', { fontFamily: 'monospace', fontSize: '10px', color: '#fff' }).setOrigin(0.5).setDepth(DEPTH.props);
    this.sign(STOP_X + 110, 470, 'CIVITAVECCHIA · PORTO', { size: '12px', color: '#d8d0c0', bg: '#1d2430' });
    this.lamp(250);
    this.addInteract({
      x: STOP_X, range: 55, label: 'Otobüs · hat haritası',
      action: () => this.openOverlay('map', { current: 'civitavecchia' })
    });

    // Nico's fire barrel.
    this.add.image(NICO_X - 60, GROUND_TOP, 'firebarrel').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
    this.fx.glow(NICO_X - 60, GROUND_TOP - 40, 130, 0xff9040, 0.45, { flicker: true });
    const sparks = this.add.particles(NICO_X - 60, GROUND_TOP - 34, 'px', {
      speedY: { min: -80, max: -40 }, speedX: { min: -10, max: 10 }, lifespan: 900, frequency: 120,
      scale: { start: 0.6, end: 0 }, tint: [0xffb347, 0xff7a2a]
    }).setDepth(DEPTH.props + 1);
    sparks.setDepth(DEPTH.light + 1);
    this.nico = this.addNpc('nico', NICO_X, { name: 'NICO', color: '#8fb0d0', facing: -1 });
    this.addInteract({ x: NICO_X, range: 80, label: 'Nico ile konuş', action: () => this.talkNico() });

    // Gate and guard booth.
    for (let x = 640; x < 1000; x += 24) this.add.rectangle(x, 560, 3, 150, 0x1d2024).setDepth(DEPTH.back + 2);
    this.add.rectangle(820, 488, 380, 4, 0x1d2024).setDepth(DEPTH.back + 2);
    this.add.rectangle(1035, 580, 90, 124, 0x2a2e34).setDepth(DEPTH.back + 3);
    this.add.rectangle(1035, 560, 50, 36, 0xd9a55a, 0.7).setDepth(DEPTH.back + 4);
    this.fx.glow(1035, 560, 110, 0xe0b060, 0.35, { depth: DEPTH.back + 5 });
    this.addBlock(720, GROUND_TOP, 'crate');
    this.addBlock(752, GROUND_TOP, 'crate');
    this.addBlock(736, GROUND_TOP - 32, 'crate');
    this.addCover(680, 800);
  }

  container(x, level, color) {
    const bottom = GROUND_TOP - level * CONTAINER_H;
    return this.addBlock(x, bottom, `container-${color}`, { depth: DEPTH.props - 1, opaque: true });
  }

  buildContainers() {
    this.container(1150, 0, 'red');
    this.container(1330, 0, 'blue');
    this.container(1330, 1, 'rust');
    this.container(1510, 0, 'green');
    this.container(1510, 1, 'red');
    this.container(1690, 0, 'rust');
    this.container(1690, 1, 'blue');
    this.container(1690, 2, 'green');
    this.addPickup({
      x: 1690, y: GROUND_TOP - 3 * CONTAINER_H - 10, memento: 'seabook',
      lines: [
        ['GIANLICO', 'Konteynerin üstünde, bir ip yığınının arasında eski bir cüzdan. Gemici cüzdanı.'],
        ['GIANLICO', '“Paolo Bianchi, güverte tayfası, 1957.” Fotoğrafta benden gençmiş.'],
        ['GIANLICO', 'Nico bunu yıllarca saklamış olmalı. Buraya bırakmış; bulayım diye mi?']
      ]
    });
    this.addPickup({ x: 1330, y: GROUND_TOP - 2 * CONTAINER_H - 10, money: 2000, flag: 'port_cash' });
    // A light on the yard mast makes the top of the stack risky.
    this.add.rectangle(1420, 540, 6, 200, 0x1d2024).setDepth(DEPTH.props - 2);
    this.add.rectangle(1420, 438, 24, 8, 0x2a2e34).setDepth(DEPTH.props - 2);
    this.yardLight = this.fx.glow(1420, 450, 160, 0xd0e0ff, 0.3);
  }

  buildCranes() {
    this.add.image(2250, GROUND_TOP, 'crane').setOrigin(0.5, 1).setScale(PX * 1.1).setDepth(DEPTH.back);
    this.add.image(2700, GROUND_TOP, 'crane').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.back).setFlipX(true);
    this.craneLights = [2060, 2560].map((x) => {
      this.add.rectangle(x, 470, 6, 340, 0x1d2024).setDepth(DEPTH.props - 2);
      this.add.rectangle(x + 10, 330, 26, 10, 0x2a2e34).setDepth(DEPTH.props - 2);
      return this.fx.glow(x + 10, 470, 190, 0xd0e0ff, 0.28);
    });
    this.add.rectangle(FUSE_X, 560, 5, 160, 0x1d2024).setDepth(DEPTH.props - 2);
    this.add.image(FUSE_X, 540, 'fusebox').setScale(PX).setDepth(DEPTH.props);
    this.addInteract({
      x: FUSE_X, range: 50, label: () => this.lightsOff ? 'Sigorta kutusu (kapalı)' : 'Vinç ışıklarını kes',
      action: () => this.cutLights()
    });
    this.addCoverProp(2330, 'crate');
    this.addCoverProp(2362, 'crate', { pad: 10 });
    this.addCoverProp(2640, 'barrel');
    this.addCoverProp(2664, 'barrel', { pad: 10 });
    [1820, 3000].forEach((x) => this.addTrigger({ x1: x, x2: x + 40, passive: true, action: () => this.checkpoint() }));
  }

  buildWarehouse() {
    this.add.rectangle(3650, 380, 1200, 180, 0x16181c).setDepth(DEPTH.back);
    this.add.rectangle(3650, 470, 1200, 10, 0x2a2e34).setDepth(DEPTH.back + 1);
    for (let x = 3080; x < 4240; x += 80) this.add.rectangle(x, 555, 8, 170, 0x1d2024).setDepth(DEPTH.back + 1);
    this.add.rectangle(3650, 560, 1200, 160, 0x101216, 0.6).setDepth(DEPTH.back);
    this.sign(3650, 440, 'DEPOSITO · SAVIOR IMPORT S.R.L.', { size: '13px', color: '#c8b8a0', bg: '#16181c' });

    // Card table with a lantern.
    this.add.image(3550, GROUND_TOP, 'table').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
    this.add.image(3550, GROUND_TOP - 34, 'lantern').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props + 1);
    this.fx.glow(3550, GROUND_TOP - 50, 170, 0xf3c47a, 0.4, { flicker: true });
    [3290, 3314, 3860, 3884].forEach((x) => this.addCoverProp(x, 'barrel'));
    [4040, 4072].forEach((x) => this.addCoverProp(x, 'crate'));

    // Side door (Nico's key) skips past the card table.
    this.add.rectangle(SIDE_DOOR_X, 578, 60, 120, 0x2a2420).setDepth(DEPTH.back + 2);
    this.add.rectangle(SIDE_DOOR_X, 578, 50, 112, 0x4a3a2c).setDepth(DEPTH.back + 3);
    this.add.rectangle(SIDE_DOOR_X + 16, 582, 4, 4, 0xb99a58).setDepth(DEPTH.back + 4);
    this.addInteract({
      x: SIDE_DOOR_X, range: 50, label: () => state.flag('nicoKey') ? 'Yan kapı · Nico’nun anahtarı' : 'Yan kapı (kilitli)',
      action: async () => {
        if (!state.flag('nicoKey')) {
          await this.say([['GIANLICO', 'Kilitli. Sağlam bir kilit; zorlarsam herkes duyar.']]);
          return;
        }
        audio.sfx('door');
        this.cameras.main.fadeOut(250, 0, 0, 0);
        await this.wait(300);
        this.player.setPosition(4330, CHAR_Y);
        this.cameras.main.fadeIn(350, 0, 0, 0);
        await this.say([['GIANLICO', 'Deponun arka koridoru. Kartçıların sesini arkada bıraktım.']]);
        this.checkpoint(true);
      }
    });
  }

  buildOffice() {
    this.add.image(OFFICE_X, GROUND_TOP, 'office').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.back + 1);
    this.sign(OFFICE_X, 368, 'CAPITANERIA DI PORTO', { size: '12px', color: '#e7ddca', bg: '#6b1f22' });
    this.fx.glow(OFFICE_X - 110, 500, 90, 0xe0b060, 0.4);
    this.lamp(4480);
    this.addBlock(4380, GROUND_TOP, 'crate');
    this.addCover(4340, 4420);
    this.addInteract({
      x: OFFICE_X, range: 70, label: 'Liman ofisine gir',
      when: () => state.stage === STAGE.INFILTRATE_PORT,
      action: () => this.readRegister()
    });
    this.addInteract({
      x: OFFICE_X, range: 70, label: 'Liman ofisi (kilitli)',
      when: () => state.stage !== STAGE.INFILTRATE_PORT,
      action: () => this.say([['GIANLICO', 'Ofis kilitli. Aradığımı zaten aldım.']])
    });
  }

  buildGuards() {
    this.gate = this.addEnemy({ type: 'guard', x: 985, facing: -1, turn: 5200 });
    this.addEnemy({ type: 'guard', x: 1900, patrol: [1800, 2120], wait: 1500 });
    this.fuseGuard = this.addEnemy({ type: 'guard', x: 2300, patrol: [2150, 2480], wait: 1200 });
    this.addEnemy({ type: 'guard', x: 2780, facing: -1, turn: 3600 });
    this.addEnemy({ type: 'thug', x: 3500, facing: 1 });
    this.addEnemy({ type: 'thug2', x: 3610, facing: -1 });
    this.addEnemy({ type: 'thug', x: 4100, patrol: [3950, 4200], wait: 1400 });
    this.addEnemy({ type: 'guard', x: 4500, patrol: [4440, 4660], wait: 1600 });
  }

  onReady() {
    if (state.stage === STAGE.TRAVEL_PORT) {
      state.stage = STAGE.INFILTRATE_PORT;
      this.hud.refresh();
      this.checkpoint(true);
    }
  }

  async cutLights() {
    if (this.lightsOff) {
      await this.say([['GIANLICO', 'Sigortalar zaten atık. Bir daha dokunursam kıvılcım görürler.']]);
      return;
    }
    this.lightsOff = true;
    audio.sfx('switch');
    this.fx.hitSpark(FUSE_X, 540, 14);
    this.craneLights.forEach((l) => { l.on = false; l.img.setVisible(false); });
    this.hud.toast('Vinç ışıkları söndü', HEX.gold);
    // The nearest guard comes to check the fuse box.
    const guard = this.enemies.find((e) => !e.down && !e.alerted && Math.abs(e.x - FUSE_X) < 700 && e !== this.gate);
    if (guard) {
      guard.say('Ma che…? Luce!');
      guard.suspicion = 0.3;
      guard.investigate(FUSE_X + 40);
    }
  }

  async talkNico() {
    const d = state.data;
    if (state.stage !== STAGE.INFILTRATE_PORT) {
      await this.say([['NICO', state.stage > STAGE.INFILTRATE_PORT
        ? 'Tekne hâlâ burada, ragazzo. Denize bakınca babanı hatırlıyorum.'
        : 'Gece vardiyası. Başka bir şey yok burada.']]);
      return;
    }
    if (state.flag('metNico')) {
      await this.say([['NICO', state.flag('nicoKey')
        ? 'Yan kapı deponun sol tarafında. Sigorta kutusunu unutma — ışık keserse bekçiler bakmaya gider.'
        : 'Ofis rıhtımın sonunda. Konteynerlerin üstünden git; bekçiler yukarı bakmaz.']]);
      return;
    }
    state.setFlag('metNico');
    await this.dialogue.run(async () => {
      await this.say([
        ['NICO', 'Bianchi’nin oğlu… Aynı çene. Aynı inat.'],
        ['NICO', 'Baban ’57’de benimle aynı gemide tayfaydı. Sonra Roma’ya gitti, başkalarının hesabını tutmaya.'],
        ['GIANLICO', '31 numaralı sevkiyat. Liman ofisinin kaydını görmem gerek.'],
        ['NICO', 'Ofis rıhtımın sonunda. Arada liman bekçileri ve Cranier’in depo köpekleri var.'],
        ['NICO', 'Vinçlerin ışığı bir sigorta kutusundan gelir. Keserseniz bekçiler meraktan bakmaya gider.']
      ]);
      const price = 3000;
      const options = [
        { label: '“Babam senden hep bahsederdi.”', disabled: d.rep < 55 },
        { label: `Bilgi için öde (${formatLira(price)})`, disabled: d.money < price },
        'Tehdit et: “Bildiğin her şeyi söyle.”',
        '“Gerisini ben hallederim.”'
      ];
      const pick = await this.choose('GIANLICO', d.rep < 55 ? 'Nico seni tartıyor. (Rispetto 55+ gerekir: ilk seçenek)' : 'Nico seni tartıyor.', options);
      if (pick === 0) {
        await this.say([['NICO', 'Bahsederdi, ha? …Al şunu. Deponun yan kapısının anahtarı. Kart oynayan iki herifin önünden geçmezsin.']]);
        state.setFlag('nicoKey');
        this.addRep(2);
      } else if (pick === 1) {
        this.addMoney(-price);
        await this.say([['NICO', 'Para paradır. Anahtar deponun yan kapısını açar. Söylemedim, duymadın.']]);
        state.setFlag('nicoKey');
      } else if (pick === 2) {
        this.addRep(-8);
        await this.say([
          ['NICO', '…Baban asla böyle konuşmazdı.'],
          ['NICO', 'Al anahtarını. Yan kapı. Ve bir daha gelme.']
        ]);
        state.setFlag('nicoKey');
      } else {
        await this.say([['NICO', 'İnatçı. Aynı baban. Konteynerlerin üstünden git; bekçiler yukarı bakmaz.']]);
      }
    });
    if (state.flag('nicoKey')) this.hud.toast('Depo yan kapı anahtarı', HEX.gold, 'ev-key31');
  }

  async readRegister() {
    this.player.lock(true);
    audio.sfx('door');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    await this.wait(350);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    await this.dialogue.run(async () => {
      await this.say([
        ['GIANLICO', 'Ofis boş. Masada liman kayıt defteri. Mart 1980…'],
        ['NOT', '“Registro portuale, 12 marzo 1980. Carico n. 31 — olio d’oliva, 40 barili. Destinatario: Savior Import S.r.l.”'],
        ['NOT', '“Ispezione doganale: ESENTE. Scorta: autovettura Alfa Romeo Alfetta, targa Polizia di Stato.”'],
        ['GIANLICO', 'Gümrüksüz. Polis eskortuyla. Zeytinyağı için kimse polis çağırmaz.'],
        ['GIANLICO', 'Alfetta… Elena o gece bir araba gördü. Rengini, şeklini sormam lazım.']
      ]);
      this.giveEvidence('register');
      audio.sfx('alert');
      await this.say([
        ['GUARDIA', 'Chi c’è là dentro?! Fermo!'],
        ['NICO', 'Psst! Arka pencere! Tekne hazır — Roma’ya kadar sahilden götürürüm!']
      ]);
    });
    await this.setStage(STAGE.ASK_ELENA_CAR, { save: false });
    state.unlockStop('civitavecchia');
    this.goTo('rome', 'bus');
  }
}
