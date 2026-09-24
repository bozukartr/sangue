// Trastevere: the hub street. Casa Bianchi, Bar Arisel, the piazza fountain,
// the low archway, Elena's bus stop and Magazzino 17.
import { GAME_W, GAME_H, GROUND_TOP, CHAR_Y, DEPTH, HEX } from '../../config.js';
import { state, formatLira } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { STAGE } from '../../story.js';
import { PX } from '../../gfx/textures.js';
import { WorldScene } from '../world.js';

const DOOR_HOME = 400;
const DOOR_BAR = 1165;
const STOP_X = 3190;
const ELENA_X = 3290;
const LEDGER_X = 3730;
const CABINET_X = 3910;
const PASSAGE_X = 2230;

export class RomeScene extends WorldScene {
  constructor() { super('rome'); }

  levelConfig() {
    const stage = state.stage;
    return {
      width: 4800,
      ground: 'tile-street',
      music: 'street',
      ambience: { rain: 1 },
      rain: stage >= STAGE.TRAVEL_VILLA ? 0.5 : 1,
      lightning: true,
      location: ['TRASTEVERE', 'ROMA · 1980 · 23:40'],
      stealth: stage === STAGE.FIND_LEDGER || stage === STAGE.SHOW_STATEMENT
    };
  }

  spawnX(entry) {
    return { start: 170, home: DOOR_HOME + 60, bar: DOOR_BAR + 70, bus: STOP_X + 40 }[entry] ?? 170;
  }

  spawnFacing(entry) {
    return entry === 'bus' ? -1 : 1;
  }

  buildLevel() {
    this.buildSky();
    this.buildStreet();
    this.buildTraversal();
    this.buildStop();
    this.buildMagazzino();
    this.buildPeople();
    this.buildEncounters();
  }

  buildSky() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.sky);
    sky.fillGradientStyle(0x1a1520, 0x1a1520, 0x3a2c38, 0x3a2c38, 1);
    sky.fillRect(0, 0, GAME_W, GAME_H);
    this.add.circle(1020, 110, 42, 0xe0d0b0, 0.5).setScrollFactor(0.04).setDepth(DEPTH.sky);
    this.fx.glow(1020, 110, 150, 0xd9c7a7, 0.12, { scrollFactor: 0.04, depth: DEPTH.sky, cut: false });
    this.parallax('skyline', 470, 0.08, { tint: 0x7a6a80, depth: DEPTH.far });
    this.parallax('midrow', 560, 0.32, { tint: 0x9a8a98, depth: DEPTH.mid });
    this.fx.fog(520, DEPTH.mid + 2, 0.35, 6);
  }

  buildStreet() {
    this.facade(150, 'facade-cream');
    this.facade(430, 'facade-ochre');
    this.facade(720, 'facade-terra');
    this.facade(DOOR_BAR, 'facade-rose');
    this.facade(1500, 'facade-ochre', { tint: 0xd8c8c0 });
    this.facade(PASSAGE_X, 'facade-terra', { tint: 0xc8b8b0 });
    this.facade(2500, 'facade-cream', { tint: 0xd0c0b8 });
    this.facade(2850, 'facade-rose', { tint: 0xc0b0b0 });
    this.facade(4200, 'facade-terra');
    this.facade(4510, 'facade-ochre', { tint: 0xb8a8a0 });
    this.facade(4760, 'facade-cream', { tint: 0x9a8a88 });

    // Casa Bianchi door.
    this.add.rectangle(DOOR_HOME, 583, 84, 118, 0x1d181a).setDepth(DEPTH.back + 2);
    this.add.rectangle(DOOR_HOME, 586, 70, 110, 0x4b3431).setDepth(DEPTH.back + 3);
    this.add.rectangle(DOOR_HOME, 586, 2, 110, 0x2a1d1a).setDepth(DEPTH.back + 3);
    this.add.rectangle(DOOR_HOME + 26, 592, 5, 5, 0xb99a58).setDepth(DEPTH.back + 4);
    this.sign(DOOR_HOME, 506, 'CASA BIANCHI', { size: '12px' });
    this.add.image(DOOR_HOME - 58, 520, 'wall-lamp').setScale(PX).setDepth(DEPTH.back + 3);
    this.fx.glow(DOOR_HOME - 52, 526, 70, 0xf3c47a, 0.4, { depth: DEPTH.back + 4 });

    // Bar Arisel: warm doorway, awning, neon.
    this.add.rectangle(DOOR_BAR, 577, 150, 130, 0x1d171b).setDepth(DEPTH.back + 2);
    this.add.rectangle(DOOR_BAR, 580, 124, 122, 0x5a3a2c).setDepth(DEPTH.back + 3);
    this.add.rectangle(DOOR_BAR, 570, 100, 70, 0xd9a55a, 0.55).setDepth(DEPTH.back + 4);
    this.add.rectangle(DOOR_BAR, 570, 2, 70, 0x3a2820).setDepth(DEPTH.back + 4);
    this.add.image(DOOR_BAR, 506, 'awning').setScale(PX * 1.2).setDepth(DEPTH.back + 5);
    const neon = this.sign(DOOR_BAR, 458, 'BAR ARISEL', { color: '#e0b060', size: '17px', bg: '#1d1214' });
    this.tweens.add({ targets: neon, alpha: { from: 0.55, to: 1 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.fx.glow(DOOR_BAR, 470, 120, 0xe0a050, 0.25, { depth: DEPTH.back + 4, flicker: true });
    this.fx.glow(DOOR_BAR, 590, 170, 0xe0a050, 0.3, { depth: DEPTH.back + 6 });
    this.add.image(DOOR_BAR + 110, GROUND_TOP, 'table').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props - 1);
    this.add.image(DOOR_BAR + 80, GROUND_TOP, 'chair').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props - 1);
    this.add.image(DOOR_BAR + 140, GROUND_TOP, 'chair').setOrigin(0.5, 1).setScale(PX).setFlipX(true).setDepth(DEPTH.props - 1);

    [250, 830, 1600, 2030, 2600, 3450, 4050, 4400].forEach((x, i) => this.lamp(x, { flicker: i === 3 || i === 6 }));

    // Piazza.
    this.add.image(1880, GROUND_TOP, 'fountain').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props - 1);
    this.fx.glow(1880, 610, 120, 0x80b0c0, 0.12, { depth: DEPTH.props });
    this.add.image(1730, GROUND_TOP, 'vespa').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
    this.addInteract({
      x: 1880, range: 70,
      label: () => state.flag('fountainWish') ? 'Çeşmeye bak' : 'Çeşmeye bozuk para at (₤100)',
      action: async () => {
        if (state.flag('fountainWish') || state.data.money < 100) {
          await this.say([['GIANLICO', 'Trevi değil ama su aynı su. Babam buraya bozuk para atardı; dilek tutmazdı ama.']]);
          return;
        }
        state.setFlag('fountainWish');
        this.addMoney(-100);
        audio.sfx('coin');
        await this.say([['GIANLICO', 'Bir dilek. Birinin cezasını çekmesi için mi, yoksa artık uyuyabilmek için mi, bilmiyorum.']]);
        this.addRep(2);
      }
    });

    // Dead-end wall.
    this.addSolid(4790, 520, 20, 260, { color: 0x2a2426 });
    this.addPickup({ x: 4600, money: 1500, flag: 'rome_wallet' });

    // A police Alfetta idles near the arch once Vitale is in the story.
    if (state.stage >= STAGE.CONFRONT_BORGE && state.stage <= STAGE.SHOW_STATEMENT) {
      this.add.image(4300, GROUND_TOP + 2, 'alfetta').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
      const beacon = this.fx.glow(4300, GROUND_TOP - 40, 40, 0x3a70c0, 0.4, { depth: DEPTH.props + 1 });
      this.tweens.add({ targets: beacon.img, alpha: 0.05, duration: 500, yoyo: true, repeat: -1 });
      this.addInteract({
        x: 4300, range: 70, label: 'Alfetta’yı incele',
        action: () => this.say([['GIANLICO', 'Koyu mavi Alfetta. Torpidoda Questura damgalı bir ceza defteri. Birisi beni izliyor.']])
      });
    }

    this.addExit(DOOR_HOME, 'Casa Bianchi’ye gir', 'apartment', 'street');
    this.addExit(DOOR_BAR, 'Bar Arisel’e gir', 'bar', 'street');
  }

  buildTraversal() {
    // Street crates.
    [720, 752, 2060].forEach((x) => this.addBlock(x, GROUND_TOP, 'crate'));
    [3010, 3042].forEach((x) => this.addCoverProp(x, 'crate', { pad: 14 }));

    // The low archway: a lintel you crouch beneath.
    this.add.rectangle(PASSAGE_X, 600, 250, 84, 0x0e0b0c).setDepth(DEPTH.back + 1);
    this.addSolid(PASSAGE_X, 577, 250, 34, { color: 0x302b28, depth: DEPTH.back + 4, opaque: false });
    this.add.rectangle(PASSAGE_X, 560, 250, 4, 0x5b4a40).setDepth(DEPTH.back + 5);
    this.add.rectangle(PASSAGE_X, 592, 250, 3, 0x171313).setDepth(DEPTH.back + 5);
    [PASSAGE_X - 134, PASSAGE_X + 134].forEach((x) => this.add.rectangle(x, 590, 18, 120, 0x3d3632).setDepth(DEPTH.back + 3));
    this.addPickup({
      x: PASSAGE_X, memento: 'lighter',
      lines: [
        ['GIANLICO', 'Kemerin altında bir şey parlıyor. Pirinç bir çakmak… “P.B. 1959”.'],
        ['GIANLICO', 'Babamınki. Bu geçitten eve kestirme yapardı. Kaybettiğini hiç söylemedi.']
      ]
    });
    this.addTrigger({
      x1: PASSAGE_X - 380, x2: PASSAGE_X - 200, passive: true,
      action: () => this.hud.toast('ALÇAK GEÇİT  ·  S / ↓ ile çömel', HEX.cream)
    });

    // Steps up to a terrace.
    [[2620, 626, 80, 32], [2690, 618, 80, 48], [2760, 610, 80, 64], [2880, 610, 160, 64]].forEach(([x, y, w, h]) => {
      this.addSolid(x, y, w, h, { color: 0x4d4540, depth: DEPTH.props - 1, opaque: false });
      this.add.rectangle(x, y - h / 2 + 2, w, 4, 0x6d6257).setDepth(DEPTH.props - 1);
    });
    this.addPickup({ x: 2900, y: 568, item: 'espresso', label: 'Espresso', texture: 'icon-espresso', flag: 'rome_espresso' });
  }

  buildStop() {
    // Bus shelter and Elena's kiosk.
    this.add.rectangle(STOP_X, 522, 260, 8, 0x4a4947).setDepth(DEPTH.props - 2);
    this.add.rectangle(STOP_X - 110, 578, 7, 120, 0x3e3b3a).setDepth(DEPTH.props - 2);
    this.add.rectangle(STOP_X + 110, 578, 7, 120, 0x3e3b3a).setDepth(DEPTH.props - 2);
    this.add.rectangle(STOP_X, 565, 204, 62, 0x71807a, 0.13).setDepth(DEPTH.props - 3);
    this.add.rectangle(STOP_X, 629, 110, 16, 0x4b3c32).setDepth(DEPTH.props - 2);
    this.sign(STOP_X, 536, 'FERMATA TRASTEVERE', { size: '12px', color: '#e4d8c3', bg: '#292b2a', bold: false });
    this.add.rectangle(STOP_X - 150, 560, 6, 160, 0x2a2a2c).setDepth(DEPTH.props - 2);
    this.add.circle(STOP_X - 150, 480, 16, 0xc46a22).setDepth(DEPTH.props - 2);
    this.add.text(STOP_X - 150, 480, 'BUS', { fontFamily: 'monospace', fontSize: '10px', color: '#fff' }).setOrigin(0.5).setDepth(DEPTH.props - 2);
    this.add.image(ELENA_X + 60, GROUND_TOP, 'newsstand').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props - 2);
    this.fx.glow(ELENA_X + 60, 560, 110, 0xe0b060, 0.28, { depth: DEPTH.props - 1 });

    this.addInteract({
      x: STOP_X - 60, range: 55, label: 'Otobüs · hat haritası',
      action: async () => {
        if (state.data.stops.length <= 1 && !state.storyStop()) {
          await this.say([['GIANLICO', 'Gece hattı. Şimdilik gidecek bir yerim yok.']]);
          return;
        }
        this.openOverlay('map', { current: 'trastevere' });
      }
    });
  }

  buildMagazzino() {
    this.facade(3720, 'facade-grey');
    this.add.rectangle(3720, 575, 300, 134, 0x141416).setDepth(DEPTH.back + 2);
    for (let y = 510; y < 545; y += 7) this.add.rectangle(3720, y, 296, 3, 0x3a3a3c).setDepth(DEPTH.back + 3);
    this.sign(3560, 452, 'MAGAZZINO 17', { color: '#d8c6ab', size: '16px' });
    this.fx.glow(3720, 520, 90, 0xb0c0d0, 0.18, { depth: DEPTH.back + 4, flicker: true });
    this.addCoverProp(3600, 'barrel');
    this.addCoverProp(3625, 'barrel', { pad: 10 });

    // Ledger stand.
    this.add.rectangle(LEDGER_X, 625, 88, 34, 0x55443a).setDepth(DEPTH.props);
    this.add.rectangle(LEDGER_X, 608, 92, 5, 0x927155).setDepth(DEPTH.props);
    if (!state.hasEvidence('ledger')) {
      this.ledger = this.add.image(LEDGER_X, 596, 'ledger').setScale(PX).setDepth(DEPTH.props + 1);
      this.ledgerGlint = this.add.image(LEDGER_X, 590, 'sparkle').setScale(1.4).setDepth(DEPTH.props + 2).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: this.ledgerGlint, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 });
    }
    this.addInteract({
      x: LEDGER_X, range: 70, label: 'Kırmızı defteri al',
      when: () => state.stage === STAGE.FIND_LEDGER,
      action: () => this.takeLedger()
    });

    // Cabinet 31.
    this.add.rectangle(CABINET_X, 587, 62, 110, 0x342e2d).setDepth(DEPTH.props);
    this.cabinetDoor = this.add.rectangle(CABINET_X, 587, 51, 100, state.hasEvidence('manifest') ? 0x1a1819 : 0x51413a).setDepth(DEPTH.props + 1);
    this.add.text(CABINET_X, 560, '31', { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '16px', color: '#c6ac78' })
      .setOrigin(0.5).setDepth(DEPTH.props + 2);
    this.addInteract({
      x: CABINET_X, range: 60, label: '31 numaralı dolabı aç',
      when: () => state.stage === STAGE.OPEN_CABINET,
      action: () => this.openCabinet()
    });
  }

  buildPeople() {
    this.elena = this.addNpc('elena', ELENA_X, { name: 'ELENA', color: '#9fc0a8', facing: -1 });
    this.addInteract({ x: ELENA_X, range: 75, label: 'Elena ile konuş', action: () => this.talkElena() });

    this.smoker = this.addNpc('patron', DOOR_BAR + 190, { facing: -1 });
    const ember = this.fx.glow(DOOR_BAR + 205, CHAR_Y - 12, 10, 0xff7a2a, 0.8, { depth: DEPTH.npc + 1, cut: false });
    this.tweens.add({ targets: ember.img, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
    this.addInteract({
      x: DOOR_BAR + 190, range: 60, label: 'Konuş',
      action: () => this.say([Phaser.Utils.Array.GetRandom([
        ['PATRON', 'Baban iyi adamdı. İyi adamlar bu mahallede erken ölür.'],
        ['PATRON', 'Tonino’nun panino’su hâlâ Roma’nın en iyisi. Borge’un kahvesi değil.'],
        ['PATRON', 'Yağmur dinerse Roma da susar. O yüzden hiç dinmiyor.'],
        ['PATRON', 'Cranier’in adamları Magazzino’nun önünde dolaşıyor. Ben olsam ışıklardan uzak dururdum.']
      ])])
    });
  }

  buildEncounters() {
    const stage = state.stage;
    if (stage === STAGE.FIND_LEDGER) {
      this.addEnemy({ type: 'thug', x: 3470, facing: 1, turn: 4200 });
      this.addEnemy({ type: 'thug2', x: 3800, patrol: [3780, 4000], wait: 1600 });
      this.addTrigger({
        x1: 3050, x2: 3150,
        action: async () => {
          await this.say([
            ['GIANLICO', 'Magazzino’nun önünde Cranier’in adamları var.'],
            ['GIANLICO', 'Çömelip varillerin arkasından yaklaşırsam fark etmezler. Arkalarından yakalarsam ses çıkmaz.']
          ]);
          this.hud.toast('Çömel (S): koninin dışında gizlen', HEX.cream);
          this.time.delayedCall(1200, () => this.hud.toast('Arkadan J: sessizce etkisiz bırak', HEX.cream));
          this.time.delayedCall(2400, () => this.hud.toast('Kavga: J kombo · SHIFT kaçın', HEX.cream));
        }
      });
    }
    if (stage === STAGE.SHOW_STATEMENT) {
      this.addEnemy({ type: 'thug2', x: 2560, patrol: [2380, 2600], wait: 1200 });
      this.addEnemy({ type: 'thug', x: 1950, facing: 1, turn: 3600 });
      this.addEnemy({ type: 'thug2', x: 1500, patrol: [1380, 1680], wait: 1500 });
      this.addTrigger({
        x1: 2800, x2: 3000,
        action: () => this.say([['GIANLICO', 'Vitale’nin adamları sokağı tutmuş. Bara ulaşmam lazım — ifade üzerimde.']])
      });
    }
  }

  onReady() {
    // Coming back from Civitavecchia: Elena is right there.
    if (this.entry === 'bus' && state.stage === STAGE.ASK_ELENA_CAR) {
      this.time.delayedCall(900, () => this.hud.toast('Elena kulübesinde', HEX.gold));
    }
  }

  // ------------------------------------------------------------ story beats

  async takeLedger() {
    this.ledger?.destroy();
    this.ledgerGlint?.destroy();
    this.cameras.main.flash(180, 183, 154, 88, false);
    await this.say([
      ['GIANLICO', 'Kırmızı defter. Rakamlar babamın el yazısı — o hep böyle düzgün yazardı.'],
      ['GIANLICO', 'Son sayfa: “31 — teslim edildi.” Ödeme sütunu boş. Ölümünden iki gün önce.']
    ]);
    this.giveEvidence('ledger');
    await this.setStage(STAGE.RETURN_LEDGER);
  }

  async openCabinet() {
    await this.say([
      ['GIANLICO', 'Anahtar uydu. İçeride katlanmış bir sevkiyat dökümü var.'],
      ['GIANLICO', 'Civitavecchia. “Zeytinyağı, 40 varil.” Teslim alan iki imza: A. ve C.'],
      ['GIANLICO', 'Babamın adı ikisinin arasında yazılmış… ve üstü çizilmiş. Bir şeye “hayır” demiş.'],
      ['GIANLICO', 'A. — Arisel. C. — Cranier. Borge bunu biliyordu.']
    ]);
    this.cabinetDoor.setFillStyle(0x1a1819);
    this.giveEvidence('manifest');
    await this.setStage(STAGE.SHOW_MANIFEST);
  }

  async talkElena() {
    const stage = state.stage;
    const d = state.data;
    await this.dialogue.run(async () => {
      if (stage < STAGE.MEET_ELENA) {
        await this.say([['ELENA', 'Gece hattı yarım saatte bir. Bilet mi, gazete mi?']]);
      } else if (stage === STAGE.MEET_ELENA) {
        await this.say([
          ['GIANLICO', 'Elena Bellini? Babamın masasındaki fotoğrafın arkasında adın vardı.'],
          ['ELENA', 'Paolo’nun oğlusun. Gözlerin onunki.'],
          ['GIANLICO', 'Ölmeden önce seninle görüşmüş mü?'],
          ['ELENA', 'O gece burada bilet sordu. Saat on biri geçmişti. Yanında Arisel vardı.'],
          ['GIANLICO', 'Borge bana onu o hafta görmediğini söyledi.'],
          ['ELENA', 'Tartışıyorlardı. Sonra bir araba geldi. Baban bindi. Plakayı seçemedim.'],
          ['ELENA', 'Binmeden önce bana döndü: “Oğlum öğrenirse kendi karar versin.” dedi.'],
          ['GIANLICO', 'Neyi öğrenmem gerektiğini söylemedi mi?'],
          ['ELENA', 'Hayır. Korkuyordu. Arisel ise hiçbir şey söylemedi. Sadece arabanın arkasından baktı.']
        ]);
        const pick = await this.choose('GIANLICO', 'Elena sana yardım etti.', [
          { label: `Teşekkür et ve bir şey bırak (${formatLira(1000)})`, disabled: d.money < 1000 },
          'Sadece teşekkür et'
        ]);
        if (pick === 0) {
          this.addMoney(-1000);
          await this.say([['ELENA', 'Buna gerek yoktu. Ama… sağ ol. Baban da hep fazlasını bırakırdı.']]);
          this.addRep(4);
        } else {
          await this.say([['ELENA', 'Kendine dikkat et, Gianlico.']]);
        }
        await this.setStage(STAGE.QUESTION_BORGE);
      } else if (stage === STAGE.QUESTION_BORGE) {
        await this.say([['ELENA', 'Arisel’e sor. Ama cevabını sen tart; ben sadece gördüğümü söyledim.']]);
      } else if (stage < STAGE.TRAVEL_PORT) {
        await this.say([['ELENA', 'Yüzün bembeyaz. Ne bulduysan, önce Arisel’e göster.']]);
      } else if (stage === STAGE.TRAVEL_PORT) {
        if (!state.flag('elenaPass')) {
          state.setFlag('elenaPass');
          await this.say([
            ['GIANLICO', 'Civitavecchia’ya gitmem gerek. Bu gece.'],
            ['ELENA', 'Gece hattı 23:55’te kalkar. Al — babanın aylık kartı. Hâlâ geçerli.'],
            ['ELENA', 'Bir de şu biletler. Döndüğünde bana ne gördüğünü anlat.']
          ]);
          state.addItem('ticket', 2);
          this.hud.toast('Otobüs bileti ×2', HEX.cream, 'icon-ticket');
          this.hud.refresh();
        } else {
          await this.say([['ELENA', 'Durak hemen şurada. Hat haritasına bak.']]);
        }
      } else if (stage === STAGE.INFILTRATE_PORT) {
        await this.say([['ELENA', 'Civitavecchia’da ne varsa orada, Gianlico. Burada değil.']]);
      } else if (stage === STAGE.ASK_ELENA_CAR) {
        await this.say([
          ['GIANLICO', 'O gece gelen araba… Bir Alfetta mıydı? Koyu renk?'],
          ['ELENA', '…Evet. Şimdi hatırlıyorum. Uzun, koyu mavi bir araba.'],
          ['ELENA', 'Ön camın arkasında bir lamba vardı. Mavi. Yanmıyordu ama… polis lambası gibiydi.'],
          ['GIANLICO', 'Bunu kimseye söyledin mi?'],
          ['ELENA', 'Kime söyleyecektim, Gianlico? Polise mi?']
        ]);
        await this.setStage(STAGE.CONFRONT_BORGE);
        await this.say([['GIANLICO', 'Liman kaydındaki Questura plakası. Borge bu arabayı tanıyor olmalı.']]);
      } else if (stage === STAGE.CONFRONT_BORGE) {
        await this.say([['ELENA', 'Borge’a git. Ve Gianlico… o lambayı bir daha görürsen koş.']]);
      } else if (stage === STAGE.INFILTRATE_QUESTURA) {
        await this.say([['ELENA', 'Questura’ya gece hattıyla yirmi dakika. Arka avluda nöbetçi az olur, derler. Işıkları da idareten yakarlar.']]);
      } else if (stage === STAGE.SHOW_STATEMENT) {
        await this.say([['ELENA', 'Peşindeler! İki Alfetta geçti az önce. Bara git, çabuk.']]);
      } else if (stage < STAGE.COMPLETE) {
        await this.say([['ELENA', 'Monte Mario… Oraya gidenler pek dönmez. Sen dön, olur mu?']]);
      } else {
        await this.say([[
          'ELENA', d.ending === 'verita'
            ? 'Gazeteler babanın adını yazdı. Doğru yazdılar bu sefer.'
            : 'Mahallede artık adını fısıldıyorlar, Gianlico. Babanın adını fısıldadıkları gibi.'
        ]]);
      }

      // Tickets are always on sale at the kiosk.
      if (stage >= STAGE.TRAVEL_PORT) {
        const price = state.price(1000);
        const pick = await this.choose('ELENA', 'Bir şey lazım mı?', [
          { label: `Otobüs bileti al (${formatLira(price)})`, disabled: d.money < price },
          'Hayır, sağ ol'
        ]);
        if (pick === 0) {
          this.addMoney(-price);
          state.addItem('ticket', 1);
          this.hud.refresh();
        }
      }
    });
  }
}
