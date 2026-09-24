// Non-interactive sequences: the bus ride between locations and the ending.
import { GAME_W, GAME_H, FONT, HEX, DEPTH } from '../config.js';
import { audio } from '../core/audio.js';
import { Controls } from '../core/controls.js';
import { settings, saveSettings } from '../core/settings.js';
import { state, STOPS, formatTime } from '../core/state.js';
import { MEMENTO_IDS } from '../story.js';
import { PX } from '../gfx/textures.js';
import { Fx } from '../systems/fx.js';
import { CREDITS } from './menu.js';

export class TravelScene extends Phaser.Scene {
  constructor() { super('travel'); }

  init(data) {
    this.to = data?.to || 'trastevere';
  }

  create() {
    const stop = STOPS[this.to];
    this.controls = new Controls(this);
    this.controls.reset();
    this.fx = new Fx(this);
    this.cameras.main.setBackgroundColor('#141018');
    const coast = this.to === 'civitavecchia';
    audio.music(null);
    audio.setAmbience({ rain: coast ? 0.2 : 0.5, room: 0.3 });
    audio.sfx('bus');

    this.far = this.add.tileSprite(0, 470, GAME_W, 280, 'skyline').setOrigin(0, 1).setTileScale(PX).setTint(0x6a5a70);
    this.mid = this.add.tileSprite(0, 560, GAME_W, 340, 'midrow').setOrigin(0, 1).setTileScale(PX).setTint(0x8a7a8a);
    this.add.rectangle(0, 560, GAME_W, 160, 0x141214).setOrigin(0);
    this.road = this.add.tileSprite(0, 600, GAME_W, 80, 'tile-street').setOrigin(0).setTileScale(PX);
    this.lamps = [];
    for (let i = 0; i < 4; i++) {
      const lamp = this.add.image(i * 380, 600, 'lamp').setOrigin(0.5, 1).setScale(PX);
      const glow = this.fx.glow(i * 380 + 12, 460, 60, 0xffd890, 0.5, { cut: false });
      this.lamps.push({ lamp, glow });
    }
    this.bus = this.add.image(GAME_W / 2, 604, 'bus').setOrigin(0.5, 1).setScale(PX * 1.5);
    this.fx.glow(GAME_W / 2 + 140, 580, 90, 0xffe0a0, 0.35, { cut: false });
    this.fx.rain(coast ? 0.4 : 1);
    this.fx.groundY = 600;
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDisplaySize(GAME_W, GAME_H).setDepth(DEPTH.light + 1);

    this.add.text(GAME_W / 2, 120, 'ATAC  ·  LINEA NOTTURNA', {
      fontFamily: FONT, fontSize: '14px', color: HEX.gold, letterSpacing: 6
    }).setOrigin(0.5);
    const dest = this.add.text(GAME_W / 2, 170, '→  ' + stop.name.toUpperCase(), {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '40px', color: HEX.paper, letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: dest, alpha: 1, duration: 700 });
    this.tweens.add({ targets: this.bus, y: 606, duration: 180, yoyo: true, repeat: -1 });
    this.time.delayedCall(3200, () => this.arrive());
  }

  arrive() {
    if (this.leaving) return;
    this.leaving = true;
    const stop = STOPS[this.to];
    state.unlockStop(this.to);
    state.save(stop.scene, { x: null, entry: stop.entry });
    this.cameras.main.fadeOut(500, 10, 8, 8);
    this.time.delayedCall(520, () => this.scene.start(stop.scene, { entry: stop.entry }));
  }

  update(_t, delta) {
    this.controls.update();
    const speed = delta * 0.6;
    this.far.tilePositionX += speed * 0.05;
    this.mid.tilePositionX += speed * 0.18;
    this.road.tilePositionX += speed * 0.5;
    this.lamps.forEach(({ lamp, glow }) => {
      lamp.x -= speed * 1.0;
      if (lamp.x < -60) lamp.x += 380 * 4;
      glow.img.x = lamp.x + 12;
    });
    if (this.controls.pressed.confirm || this.controls.pressed.back) this.arrive();
  }
}

// ------------------------------------------------------------------ ending

const ENDINGS = {
  verita: {
    title: 'VERITÀ',
    music: 'dawn',
    cards: [
      ['PALAZZO DI GIUSTIZIA · APRILE 1980', 'Giudice Ruggero Ferri dosyayı açtı: kırmızı defter, sevkiyat dökümü,\nliman kaydı ve Paolo Bianchi’nin hiç dosyalanmamış ifadesi.'],
      ['MONTE MARIO', 'Monte Cranier kelepçelerle villasından çıkarıldı.\nFotoğrafçılar ona “Savior” diye bağırdı. Başını kaldırmadı.'],
      ['QUESTURA', 'Commissario Renzo Vitale görevden alındı ve tutuklandı.\nSorgusunda tek kelime etmedi. Etmesine gerek kalmadı.'],
      ['BAR ARISEL', 'Borge ertesi sabah kendi ifadesini verdi. “A.” imzası onundu.\nBarın anahtarını Tonino’ya bıraktı.']
    ],
    close: '“Oğlum öğrenirse kendi karar versin.”\n\nGianlico kararını verdi.'
  },
  sangue: {
    title: 'SANGUE',
    music: 'sorrow',
    cards: [
      ['MONTE MARIO · GECE', 'Tek bir el ateş. Yağmur sesi onu yuttu.\nGazeteler ertesi gün “hesaplaşma” yazdı.'],
      ['QUESTURA', 'Vitale’nin raporunda Gianlico’nun adı hiç geçmedi.\nKimse o gece villada olduğunu hatırlamadı.'],
      ['BAR ARISEL', 'Borge ona arka odadaki sandalyeyi gösterdi: “Artık bizden birisin.”\nGianlico oturdu. Babasının hep kaçtığı sandalyeye.'],
      ['TRASTEVERE', 'Roma’da kan kanı çağırır.\nBir gün biri de onun adını fısıldayacak.']
    ],
    close: '“Oğlum öğrenirse kendi karar versin.”\n\nGianlico kararını verdi.'
  }
};

export class EndingScene extends Phaser.Scene {
  constructor() { super('ending'); }

  init(data) {
    this.kind = data?.ending === 'sangue' ? 'sangue' : 'verita';
  }

  create() {
    const e = ENDINGS[this.kind];
    this.controls = new Controls(this);
    this.controls.reset();
    this.cameras.main.setBackgroundColor(this.kind === 'verita' ? '#15131a' : '#100606');
    audio.music(e.music);
    audio.setAmbience({ rain: this.kind === 'sangue' ? 0.8 : 0.2 });
    this.fx = new Fx(this);
    if (this.kind === 'sangue') { this.fx.rain(1.2); this.fx.groundY = GAME_H; }
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDisplaySize(GAME_W, GAME_H).setDepth(DEPTH.light + 1);

    state.data.ending = this.kind;
    state.save('rome', { x: null, entry: 'start' });
    settings.completed = true;
    saveSettings();

    this.pages = [
      { kicker: 'FINALE', title: e.title, body: '' },
      ...e.cards.map(([k, b]) => ({ kicker: k, title: '', body: b })),
      ...this.extraPages(),
      { kicker: '', title: '', body: e.close },
      { kicker: 'SANGUE', title: 'FINE', body: this.statsText(), stats: true },
      { kicker: '', title: '', body: CREDITS.join('\n'), credits: true }
    ];
    this.index = -1;
    this.kicker = this.add.text(GAME_W / 2, 200, '', { fontFamily: FONT, fontSize: '16px', color: HEX.gold, letterSpacing: 6 }).setOrigin(0.5).setDepth(DEPTH.card);
    this.title = this.add.text(GAME_W / 2, 280, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '72px', color: HEX.paper, letterSpacing: 10 })
      .setOrigin(0.5).setDepth(DEPTH.card).setShadow(3, 5, '#4d1719', 0, true, true);
    this.body = this.add.text(GAME_W / 2, 360, '', { fontFamily: FONT, fontSize: '21px', color: '#c9c0b4', align: 'center', lineSpacing: 12 })
      .setOrigin(0.5, 0.5).setDepth(DEPTH.card);
    this.add.text(GAME_W / 2, 680, 'SPACE / E  ·  devam', { fontFamily: FONT, fontSize: '13px', color: '#6f6661' }).setOrigin(0.5).setDepth(DEPTH.card);
    this.input.on('pointerdown', () => this.next());
    this.cameras.main.fadeIn(1200, 0, 0, 0);
    this.time.delayedCall(600, () => this.next());
  }

  extraPages() {
    const d = state.data;
    const pages = [];
    if (d.rep >= 70) pages.push({ kicker: 'TRASTEVERE', title: '', body: 'Mahallede Gianlico’nun adı saygıyla anılır oldu.\nTonino hesabını hiç yazmadı.' });
    else if (d.rep < 35) pages.push({ kicker: 'TRASTEVERE', title: '', body: 'Mahallede insanlar Gianlico’yu görünce kaldırımı değiştirir oldu.\nKorku da bir çeşit saygıdır. Ama yalnız bırakır.' });
    if (MEMENTO_IDS.every((id) => d.mementos.includes(id))) {
      pages.push({ kicker: 'PAOLO’NUN MEKTUBU', title: '', body: '“Gianlico,\nBu satırları okuyorsan sana söyleyemediğim her şeyi buldun demektir.\nBen hayatım boyunca susarak hayatta kaldım. Sen susma.\nAma kimsenin kanını benim için dökme.\n— Baban”' });
    }
    return pages;
  }

  statsText() {
    const d = state.data;
    const s = d.stats;
    return [
      `Süre  ${formatTime(s.time)}`,
      `Kanıtlar  ${d.evidence.length}/6   ·   Anılar  ${d.mementos.length}/${MEMENTO_IDS.length}`,
      `Etkisiz bırakılan  ${s.kos}   ·   Sessiz  ${s.takedowns}`,
      `Fark edilme  ${s.detections}   ·   Ölüm  ${s.deaths}`,
      `Rispetto  ${d.rep}`
    ].join('\n');
  }

  next() {
    if (this.transitioning) return;
    this.index++;
    if (this.index >= this.pages.length) { this.finish(); return; }
    const p = this.pages[this.index];
    this.transitioning = true;
    const targets = [this.kicker, this.title, this.body];
    this.tweens.add({
      targets, alpha: 0, duration: 250, onComplete: () => {
        this.kicker.setText(p.kicker);
        this.title.setText(p.title);
        this.body.setText(p.body).setY(p.title ? 420 : 360).setFontSize(p.credits ? 17 : 21);
        audio.sfx('typewriter');
        this.tweens.add({ targets, alpha: 1, duration: 800, onComplete: () => { this.transitioning = false; } });
      }
    });
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.time.delayedCall(1250, () => this.scene.start('menu'));
  }

  update() {
    this.controls.update();
    const c = this.controls;
    if (c.pressed.confirm || c.pressed.interact || c.pressed.attack) this.next();
  }
}
