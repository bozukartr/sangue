// Villa Cranier, Monte Mario (Capitolo VI). Garden stealth, the fight with
// Commissario Vitale on the greenhouse terrace, and the final choice in
// Cranier's study.
import { GAME_W, GAME_H, GROUND_TOP, CHAR_Y, CHAR_SCALE, DEPTH, HEX } from '../../config.js';
import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { STAGE } from '../../story.js';
import { PX } from '../../gfx/textures.js';
import { WorldScene } from '../world.js';

const GATE_X = 520;
const ARENA_L = 3100;
const ARENA_R = 4020;
const VILLA_X = 4330;
const STUDY_L = 4660;
const CRANIER_X = 4930;

export class VillaScene extends WorldScene {
  constructor() { super('villa'); }

  levelConfig() {
    return {
      width: 5000,
      ground: 'tile-gravel',
      background: '#0f1218',
      music: 'stealth',
      ambience: { crickets: 1, room: 0.2 },
      darkness: 0.58,
      darkColor: 0x05070c,
      stealth: true,
      location: ['VILLA CRANIER', 'MONTE MARIO · 03:15'],
      hint: 'Çitlerin arkasında çömel · arkadan J · Vitale: siperde çömel, şarjör değiştirirken saldır'
    };
  }

  spawnX() { return 140; }

  buildLevel() {
    const s = state.stage;
    this.bossActive = false;
    this.walls = null;
    this.vitale = null;
    this.cranier = null;
    this.buildBackdrop();
    this.buildRoad();
    this.buildGarden();
    this.buildTerrace();
    this.buildArena();
    this.buildVilla();
    if (s <= STAGE.INFILTRATE_VILLA) this.buildGuards();
    if (s <= STAGE.DEFEAT_VITALE) {
      this.vitale = this.addEnemy({ boss: true, x: 3860, facing: -1, hp: 180 });
    } else if (s === STAGE.CONFRONT_CRANIER) {
      const body = this.add.sprite(3700, CHAR_Y, 'vitale-sheet', 28).setScale(CHAR_SCALE).setDepth(DEPTH.npc);
      body.setFlipX(true);
    }
  }

  buildBackdrop() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.sky);
    sky.fillGradientStyle(0x080a12, 0x080a12, 0x242838, 0x242838, 1);
    sky.fillRect(0, 0, GAME_W, GAME_H);
    for (let i = 0; i < 80; i++) {
      const star = this.add.rectangle(Math.random() * GAME_W, Math.random() * 300, 2, 2, 0xe8e0d0, 0.2 + Math.random() * 0.5)
        .setScrollFactor(0.02).setDepth(DEPTH.sky);
      this.tweens.add({ targets: star, alpha: 0.05, duration: 800 + Math.random() * 2000, yoyo: true, repeat: -1 });
    }
    this.add.circle(980, 130, 46, 0xf0e8d0, 0.75).setScrollFactor(0.03).setDepth(DEPTH.sky);
    this.fx.glow(980, 130, 180, 0xd9d0c0, 0.16, { scrollFactor: 0.03, depth: DEPTH.sky, cut: false });
    // Rome's lights below the hill.
    this.parallax('skyline', 520, 0.06, { tint: 0x40384a, depth: DEPTH.far });
    for (let i = 0; i < 60; i++) {
      this.add.rectangle(Math.random() * GAME_W, 500 + Math.random() * 40, 2, 2, 0xe0b060, 0.5).setScrollFactor(0.06).setDepth(DEPTH.far);
    }
    for (let x = 0; x < 5000; x += 170) {
      this.add.image(x + (x % 3) * 20, 560, 'cypress').setOrigin(0.5, 1).setScale(PX * 1.6).setScrollFactor(0.5).setDepth(DEPTH.mid).setTint(0x3a4a40);
    }
    this.fx.fog(560, DEPTH.mid + 2, 0.4, 5, 0x8090a0);
  }

  buildRoad() {
    this.add.rectangle(40, 560, 6, 160, 0x2a2a2c).setDepth(DEPTH.props);
    this.add.circle(40, 480, 16, 0xc46a22).setDepth(DEPTH.props);
    this.addInteract({
      x: 50, range: 50, label: 'Otobüs · hat haritası',
      action: () => this.openOverlay('map', { current: 'montemario' })
    });
    this.lamp(200);
    // Gate.
    this.add.rectangle(GATE_X - 50, 540, 26, 200, 0x6c6a62).setDepth(DEPTH.props);
    this.add.rectangle(GATE_X + 50, 540, 26, 200, 0x6c6a62).setDepth(DEPTH.props);
    this.add.image(GATE_X - 50, 436, 'lantern').setScale(PX).setDepth(DEPTH.props);
    this.fx.glow(GATE_X - 50, 446, 120, 0xf3c47a, 0.4);
    for (let x = 560; x < 1900; x += 22) this.add.rectangle(x, 610, 3, 60, 0x1a1c1e).setDepth(DEPTH.back + 2);
    this.add.rectangle(1230, 582, 1340, 3, 0x1a1c1e).setDepth(DEPTH.back + 2);
    this.sign(GATE_X, 410, 'VILLA CRANIER', { size: '13px', color: '#d8c8a8', bg: '#1a1c1e' });

    if (state.flag('borgeHelp') && state.stage <= STAGE.INFILTRATE_VILLA) {
      this.add.image(320, GROUND_TOP + 2, 'alfetta').setOrigin(0.5, 1).setScale(PX).setTint(0x7a3a3a).setDepth(DEPTH.props);
      this.addNpc('thug2', 380, { facing: 1 }).sprite.setTint(0xa09090);
      this.addNpc('thug', 420, { facing: 1 }).sprite.setTint(0xa09090);
    }
  }

  buildGarden() {
    [760, 1330, 1780].forEach((x) => this.addCoverProp(x, 'hedge'));
    [900, 1560].forEach((x) => this.add.image(x, GROUND_TOP, 'statue').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props));
    [680, 1200, 1680].forEach((x) => {
      this.add.rectangle(x, 580, 4, 130, 0x1a1c1e).setDepth(DEPTH.props);
      this.add.image(x, 516, 'lantern').setScale(PX).setDepth(DEPTH.props);
      this.fx.glow(x, 540, 170, 0xf3c47a, 0.35, { flicker: x === 1200 });
    });
    // Gazebo bench with the wedding photo.
    this.add.rectangle(1050, 500, 150, 8, 0x8a877e).setDepth(DEPTH.back + 3);
    this.add.rectangle(985, 570, 8, 140, 0x8a877e).setDepth(DEPTH.back + 3);
    this.add.rectangle(1115, 570, 8, 140, 0x8a877e).setDepth(DEPTH.back + 3);
    this.add.rectangle(1050, 626, 80, 8, 0x6c6a62).setDepth(DEPTH.props);
    this.addPickup({
      x: 1050, y: GROUND_TOP - 26, memento: 'wedding',
      lines: [
        ['GIANLICO', 'Bankın üstünde, yağmurdan kabarmış bir çerçeve. Bir düğün fotoğrafı.'],
        ['GIANLICO', 'Annem… ve babam. Yanlarında genç bir Monte Cranier — sağdıç.'],
        ['GIANLICO', 'Gülüyorlar. Üçü de. Cranier bunu bahçesinde, herkesin görebileceği yerde tutmuş.']
      ]
    });
    this.addTrigger({ x1: 1900, x2: 1940, passive: true, action: () => this.checkpoint() });
  }

  buildTerrace() {
    for (let x = 1960; x < 3060; x += 30) this.add.rectangle(x, 604, 10, 36, 0xb8a888).setDepth(DEPTH.back + 3);
    this.add.rectangle(2510, 584, 1100, 8, 0xd8c8a8).setDepth(DEPTH.back + 3);
    this.add.image(2400, GROUND_TOP, 'fountain').setOrigin(0.5, 1).setScale(PX * 1.4).setDepth(DEPTH.props);
    this.fx.glow(2400, 600, 160, 0x80b0c0, 0.15);
    [2250, 2560].forEach((x) => this.addCoverProp(x, 'planter'));
    [2100, 2750].forEach((x) => {
      this.add.rectangle(x, 580, 4, 130, 0x1a1c1e).setDepth(DEPTH.props);
      this.add.image(x, 516, 'lantern').setScale(PX).setDepth(DEPTH.props);
      this.fx.glow(x, 540, 170, 0xf3c47a, 0.35);
    });
    this.addPickup({ x: 2900, money: 3000, flag: 'villa_cash' });
    this.addTrigger({ x1: 3020, x2: 3060, passive: true, action: () => this.checkpoint() });
  }

  buildArena() {
    this.add.image(3560, GROUND_TOP, 'greenhouse').setOrigin(0.5, 1).setScale(PX * 1.6).setDepth(DEPTH.back + 2);
    [3310, 3490, 3700, 3890].forEach((x) => this.addBlock(x, GROUND_TOP, 'planter', { opaque: false }));
    [3200, 3560, 3950].forEach((x) => this.fx.glow(x, 470, 200, 0xc0e0d0, 0.2));
    this.addTrigger({
      x1: 3180, x2: 3260,
      when: () => state.stage === STAGE.INFILTRATE_VILLA || state.stage === STAGE.DEFEAT_VITALE,
      action: () => this.startBoss()
    });
  }

  buildVilla() {
    this.facade(VILLA_X, 'facade-villa', { glows: true });
    [VILLA_X - 200, VILLA_X - 70, VILLA_X + 70, VILLA_X + 200].forEach((x) => {
      this.add.image(x, GROUND_TOP, 'column').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.back + 2);
    });
    this.add.rectangle(VILLA_X, 582, 90, 120, 0x1a1210).setDepth(DEPTH.back + 3);
    this.add.rectangle(VILLA_X, 585, 76, 114, 0x5a3a2c).setDepth(DEPTH.back + 3);
    this.fx.glow(VILLA_X, 560, 140, 0xf0c070, 0.3);
    this.addSolid(STUDY_L - 20, 400, 40, 480, { color: 0x1a1210 });

    // Study interior.
    this.add.rectangle((STUDY_L + 5000) / 2, 360, 5000 - STUDY_L, 720, 0x3a2622).setDepth(DEPTH.back - 1);
    this.add.rectangle((STUDY_L + 5000) / 2, 560, 5000 - STUDY_L, 170, 0x2a1a16).setDepth(DEPTH.back - 1);
    this.add.image(4760, 470, 'bookshelf').setOrigin(0.5, 1).setScale(PX * 1.2).setDepth(DEPTH.back);
    this.add.image(4960, 470, 'bookshelf').setOrigin(0.5, 1).setScale(PX * 1.2).setDepth(DEPTH.back);
    this.add.image(4860, 300, 'painting').setScale(PX * 1.5).setDepth(DEPTH.back);
    this.add.image(4840, 190, 'chandelier').setScale(PX).setDepth(DEPTH.back + 1);
    this.fx.glow(4840, 260, 280, 0xf0c070, 0.35);
    this.add.image(4840, GROUND_TOP + 4, 'persian-rug').setOrigin(0.5, 1).setScale(PX * 1.4).setDepth(DEPTH.back + 6);
    this.add.image(CRANIER_X - 50, GROUND_TOP, 'desk').setOrigin(0.5, 1).setScale(PX * 1.2).setDepth(DEPTH.npc + 2);
    this.add.image(CRANIER_X - 80, GROUND_TOP - 52, 'desk-lamp').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.npc + 3);
    if (state.stage < STAGE.COMPLETE) {
      this.cranier = this.addNpc('cranier', CRANIER_X, { facing: -1 });
      this.cranier.facePlayer = false;
    }

    this.addInteract({
      x: VILLA_X, range: 60,
      label: () => state.stage === STAGE.CONFRONT_CRANIER ? 'Villaya gir' : 'Villa kapısı',
      action: async () => {
        if (state.stage === STAGE.CONFRONT_CRANIER) { await this.finale(); return; }
        if (state.stage >= STAGE.COMPLETE) {
          await this.say([['GIANLICO', 'Villa mühürlenmiş. Kapıda bir polis bandı, rüzgârda sallanıyor.']]);
          return;
        }
        await this.say([['GIANLICO', 'Kapının önünde Vitale’nin sesi… Önce serayı geçmem lazım.']]);
      }
    });
  }

  buildGuards() {
    const help = state.flag('borgeHelp');
    if (!help) this.addEnemy({ type: 'guard', x: 800, patrol: [640, 1120], wait: 1500 });
    this.addEnemy({ type: 'guard', x: 1470, facing: -1, turn: 3800 });
    if (!help) this.addEnemy({ type: 'thug', x: 1500, patrol: [1260, 1760], wait: 1300 });
    if (!help) this.addEnemy({ type: 'guard', x: 2300, patrol: [2150, 2660], wait: 1400 });
    this.addEnemy({ type: 'thug2', x: 2860, facing: -1, turn: 3000 });
  }

  onReady() {
    if (state.stage === STAGE.TRAVEL_VILLA) {
      state.stage = STAGE.INFILTRATE_VILLA;
      this.hud.refresh();
      this.checkpoint(true);
      if (state.flag('borgeHelp')) {
        this.time.delayedCall(1800, async () => {
          audio.sfx('bus');
          this.fx.banner('BORGE’UN ADAMLARI ÖN KAPIDA', HEX.gold);
          await this.say([['GIANLICO', 'Borge’un adamları korna çalıp bağırıyor. Bahçedeki nöbetçilerin çoğu ön kapıya koştu.']]);
        });
      }
    }
    this.events.on('boss-defeated', () => this.bossDefeated());
    this.events.on('boss-phase', () => {
      this.fx.shake(300, 0.01);
      this.hud.toast('Vitale öfkelendi: daha hızlı nişan alıyor', '#e0393d');
    });
  }

  levelUpdate() {
    if (this.bossActive && this.vitale) this.hud.setBoss(this.vitale.hp / this.vitale.maxHp);
  }

  async startBoss() {
    if (!this.vitale || this.bossActive) return;
    this.walls = [
      this.addSolid(ARENA_L, 400, 20, 480, { opaque: false }),
      this.addSolid(ARENA_R, 400, 20, 480, { opaque: false })
    ];
    this.musicOverride = 'boss';
    this.cameras.main.pan(3560, GAME_H / 2, 700, 'Sine.easeInOut');
    await this.wait(700);
    if (state.stage === STAGE.INFILTRATE_VILLA) {
      await this.say([
        ['VITALE', 'Bianchi. İfadeyi sen aldın, değil mi? Baban da kâğıtlara güvenirdi.'],
        ['GIANLICO', 'Onu Alfetta’na bindirdin. “Eve bırakacağız” dedin.'],
        ['VITALE', 'Ben polisim, ragazzo. İnsanları eve bırakırım. Bazıları eve varamaz.'],
        ['VITALE', 'O zarfı bana ver. Belki sen varırsın.'],
        ['GIANLICO', 'Hayır.']
      ]);
      await this.setStage(STAGE.DEFEAT_VITALE);
    } else {
      await this.say([['VITALE', 'Geri mi geldin? İnatçı bir aile.']]);
    }
    this.cameras.main.pan(this.player.x, GAME_H / 2, 400, 'Sine.easeInOut');
    await this.wait(400);
    this.hud.showBoss('COMMISSARIO RENZO VITALE');
    this.hud.toast('Kırmızı lazer: çömel (siper) ya da SHIFT ile kaç', HEX.cream);
    this.bossActive = true;
    this.vitale.activate();
  }

  async bossDefeated() {
    this.bossActive = false;
    this.hud.hideBoss();
    this.musicOverride = 'sorrow';
    this.fx.hitStop(200);
    this.fx.shake(300, 0.012);
    this.walls?.forEach((w) => w.destroy());
    this.walls = null;
    await this.wait(900);
    await this.runBusy(async () => {
      await this.say([
        ['VITALE', 'Emri… Cranier verdi. Ben sadece… arabayı sürdüm…'],
        ['GIANLICO', 'Babamın son gördüğü yüz seninkiydi.'],
        ['VITALE', 'Sen de onun gibi… kâğıtlara mı güveneceksin? Bu şehirde kâğıt yanar.'],
        ['GIANLICO', 'Tabancanı alıyorum, Commissario. Kâğıtları da.']
      ]);
      state.setFlag('pistol');
      this.hud.toast('Vitale’nin tabancası', HEX.cream, 'icon-pistol');
      this.musicOverride = null;
      this.baseMusic = 'sorrow';
      await this.setStage(STAGE.CONFRONT_CRANIER);
    });
  }

  async finale() {
    this.ending = true;
    audio.sfx('door');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    await this.wait(350);
    this.player.setPosition(STUDY_L + 80, CHAR_Y);
    this.player.face(1);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.musicOverride = 'sorrow';
    audio.setAmbience({ rain: 0.2, room: 0.4 });
    await this.wait(400);
    await this.player.walkTo(CRANIER_X - 180, 110);

    const pick = await this.dialogue.run(async () => {
      await this.say([
        ['CRANIER', 'Paolo’nun oğlu. Gel. Otur. Ayakta ölmeye gerek yok.'],
        ['GIANLICO', 'Vitale serada yatıyor. Tabancası bende.'],
        ['CRANIER', 'Renzo hep gürültücüydü. Polisler öyledir.'],
        ['CRANIER', 'Baban bir muhasebeciydi. “Rakamlar yalan söylemez” derdi. Otuz yıl benim rakamlarımı tuttu.'],
        ['GIANLICO', 'Sonra varillerin dibinde ne olduğunu öğrendi.'],
        ['CRANIER', 'Sonra vicdan buldu. Elli yaşından sonra vicdan pahalıdır, Gianlico. Hesabını hep başkaları öder.'],
        ['CRANIER', 'Renzo’ya “sessizce hallet” dedim. Onu öldürmesini söylemedim. Ama söylemediğim için kendimi masum da saymıyorum.']
      ]);
      if (state.hasMemento('wedding')) {
        await this.say([
          ['GIANLICO', 'Düğünlerinde sağdıçtın. Fotoğraf bahçende duruyor.'],
          ['CRANIER', '…Evet. O gün de yağmur yağıyordu. Paolo “uğurdur” demişti.']
        ]);
      }
      await this.say([
        ['CRANIER', 'Bu onun saati. Arabada kalmış. Renzo getirdi. Atamadım.'],
        ['CRANIER', 'Şimdi. Ya tetiği çekersin ve Borge gibi olursun — bu şehirde herkes gibi.'],
        ['CRANIER', 'Ya da o kâğıtları bir hâkime götürürsün ve ben avukatlarımla on yıl satranç oynarım. Seç.']
      ]);
      return this.choose('GIANLICO', 'Tabanca elinde ağır. Saat masada, hâlâ işliyor.', [
        'Tetiği çek.',
        'Silahı indir. Dosyayı Giudice Ferri’ye götür.'
      ]);
    });

    if (pick === 0) {
      await this.say([['GIANLICO', 'Bu, babam için.']]);
      this.cameras.main.flash(120, 255, 240, 200);
      audio.sfx('gun');
      this.fx.shake(300, 0.02);
      this.cranier?.sprite.setFrame(28);
      this.time.delayedCall(250, () => this.cranier?.sprite.setFrame(29));
      await this.wait(1600);
      await this.say([['GIANLICO', '…Yağmur hâlâ yağıyor.']]);
      this.finish('sangue');
    } else {
      await this.say([
        ['GIANLICO', 'Babam konuşmayı seçti. Ben onun sesini taşıyacağım.'],
        ['CRANIER', 'Pişman olacaksın.'],
        ['GIANLICO', 'Belki. Ama senin gibi değil.']
      ]);
      audio.sfx('alarm');
      for (let i = 0; i < 6; i++) {
        this.time.delayedCall(i * 350, () => this.cameras.main.flash(180, i % 2 ? 60 : 200, 80, i % 2 ? 220 : 60));
      }
      await this.wait(1600);
      await this.say([['CRANIER', '…Siren sesi. Ferri’yi önceden aradın, değil mi? Paolo’nun oğlu.']]);
      this.finish('verita');
    }
  }

  finish(ending) {
    state.stage = STAGE.COMPLETE;
    state.data.ending = ending;
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.time.delayedCall(1550, () => this.scene.start('ending', { ending }));
  }
}
