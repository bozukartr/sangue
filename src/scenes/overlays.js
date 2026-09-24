// Overlay scenes launched on top of a paused world scene: pause menu,
// journal, bus map and the game-over screen.
import { GAME_W, GAME_H, FONT, HEX } from '../config.js';
import { audio } from '../core/audio.js';
import { Controls } from '../core/controls.js';
import { state, EVIDENCE, MEMENTOS, ITEMS, STOPS, formatLira, formatTime } from '../core/state.js';
import { STAGE, EVIDENCE_IDS, MEMENTO_IDS, chapterForStage, objectiveForStage } from '../story.js';
import { MenuList, SettingsPanel, panel, dim, CONTROLS_TEXT } from './ui.js';

class Overlay extends Phaser.Scene {
  init(data) {
    this.from = data?.from;
    this.data0 = data || {};
  }

  baseCreate() {
    this.controls = new Controls(this);
    this.controls.reset();
  }

  close(after) {
    audio.sfx('ui_back');
    const parent = this.scene.get(this.from);
    this.scene.resume(this.from);
    parent?.onResumeFromOverlay?.();
    this.scene.stop();
    after?.(parent);
  }
}

// ---------------------------------------------------------------- pause

export class PauseScene extends Overlay {
  constructor() { super('pause'); }

  create() {
    this.baseCreate();
    dim(this, 0.78);
    this.add.text(GAME_W / 2, 150, 'PAUSA', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '52px', color: HEX.paper, letterSpacing: 10
    }).setOrigin(0.5).setShadow(3, 4, '#4d1719', 0, true, true);
    const ch = chapterForStage(state.stage);
    this.add.text(GAME_W / 2, 205, `${ch.number} · ${ch.title}`, {
      fontFamily: FONT, fontSize: '14px', color: HEX.gold, letterSpacing: 3
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 232, objectiveForStage(state.stage), {
      fontFamily: FONT, fontSize: '15px', color: HEX.mute
    }).setOrigin(0.5);

    this.menu = new MenuList(this, GAME_W / 2, 310, [
      { label: 'DEVAM', action: () => this.close() },
      { label: 'GÜNLÜK', action: () => { this.scene.stop(); this.scene.launch('journal', { from: this.from }); } },
      { label: 'AYARLAR', action: () => this.openSettings() },
      { label: 'KONTROLLER', action: () => this.openControls() },
      { label: 'SON KAYDA DÖN', action: () => this.reloadCheckpoint() },
      { label: 'ANA MENÜ', action: () => this.toMenu() }
    ], { align: 'center', spacing: 54, size: '22px' });
    this.sub = null;
  }

  openSettings() {
    this.menu.setVisible(false);
    this.subBg = panel(this, GAME_W / 2, 470, 700, 400, 15);
    this.sub = new SettingsPanel(this, GAME_W / 2 - 300, 320, 20);
  }

  openControls() {
    this.menu.setVisible(false);
    this.subBg = panel(this, GAME_W / 2, 470, 860, 470, 15);
    this.subTexts = CONTROLS_TEXT.map(([k, v], i) => [
      this.add.text(GAME_W / 2 - 390, 272 + i * 36, k, { fontFamily: FONT, fontStyle: 'bold', fontSize: '16px', color: HEX.gold }).setDepth(20),
      this.add.text(GAME_W / 2 - 130, 272 + i * 36, v, { fontFamily: FONT, fontSize: '16px', color: HEX.cream }).setDepth(20)
    ]).flat();
    this.sub = { update: () => {}, destroy: () => this.subTexts.forEach((t) => t.destroy()) };
  }

  closeSub() {
    this.sub.destroy();
    this.subBg.destroy();
    this.sub = null;
    this.menu.setVisible(true);
    this.menu.refresh();
    audio.sfx('ui_back');
  }

  reloadCheckpoint() {
    this.scene.stop(this.from);
    state.loadFromStorage();
    audio.muffle(false);
    this.scene.start(state.data.scene, { entry: state.data.entry || 'resume' });
  }

  toMenu() {
    this.scene.stop(this.from);
    audio.muffle(false);
    this.scene.start('menu');
  }

  update() {
    this.controls.update();
    const c = this.controls;
    if (this.sub) {
      if (c.pressed.back || c.pressed.pause) { this.closeSub(); return; }
      this.sub.update(c);
      return;
    }
    if (c.pressed.back || c.pressed.pause) { this.close(); return; }
    this.menu.update(c);
  }
}

// ---------------------------------------------------------------- journal

const PEOPLE = [
  {
    id: 'paolo', name: 'Paolo Bianchi', role: 'Babam',
    notes: [
      [0, '1931–1980. Kayıtlarda ölümü “kaza” diye geçiyor. Kimse buna inanmıyor.'],
      [STAGE.MEET_ELENA, 'Borge ve Cranier ile eskiden aynı masada otururmuş.'],
      [STAGE.SHOW_MANIFEST, 'Adı Civitavecchia sevkiyatında, iki imzanın arasında çizilmiş. Bir şeyi reddetmiş.'],
      [STAGE.SHOW_STATEMENT, 'Ölümünden bir gün önce polise gitmiş. Konuşmaya karar vermiş.']
    ]
  },
  {
    id: 'borge', name: 'Leonard “Borge” Arisel', role: 'Bar Arisel',
    notes: [
      [0, 'Babamın en eski dostu. Cenazede Cranier’ın adını söylemeyen tek kişi.'],
      [STAGE.OPEN_CABINET, 'O gece babamın yanındaydı ve bana yalan söyledi.'],
      [STAGE.TRAVEL_PORT, 'Sevkiyattaki “A.” imzası onun. İçinde ne olduğunu sormamış.'],
      [STAGE.INFILTRATE_QUESTURA, 'Vitale’nin adını verdi. Suçluluk mu, sadakat mı — hâlâ bilmiyorum.']
    ]
  },
  {
    id: 'elena', name: 'Elena Bellini', role: 'Trastevere durağı', from: STAGE.MEET_ELENA,
    notes: [
      [STAGE.MEET_ELENA, 'Durakta bilet satıyor. Babamı son görenlerden.'],
      [STAGE.QUESTION_BORGE, 'Borge’u o gece babamla görmüş. Arabayı görmüş, plakayı görmemiş.'],
      [STAGE.CONFRONT_BORGE, 'Arabayı hatırladı: koyu renk bir Alfetta, ön camda mavi bir ışık.']
    ]
  },
  {
    id: 'cranier', name: 'Monte “Savior” Cranier', role: 'Monte Mario',
    notes: [
      [0, 'Herkesin fısıldadığı isim. Kimse yüksek sesle söylemiyor.'],
      [STAGE.GO_HOME, 'Fotoğrafta babam ve Borge ile aynı masada.'],
      [STAGE.TRAVEL_PORT, 'Sevkiyattaki “C.” imzası. Yükün alıcısı.'],
      [STAGE.TRAVEL_VILLA, 'Emri o verdi. Ya da öyle olmasını istedi.']
    ]
  },
  {
    id: 'vitale', name: 'Commissario Renzo Vitale', role: 'Questura', from: STAGE.CONFRONT_BORGE,
    notes: [
      [STAGE.CONFRONT_BORGE, 'Alfetta onun. Sevkiyata polis eskortu sağlamış.'],
      [STAGE.SHOW_STATEMENT, 'Babamın ifadesini aldı ve hiç dosyalamadı. Ertesi gece babam öldü.']
    ]
  },
  {
    id: 'nico', name: 'Nico Ferraro', role: 'Civitavecchia', flag: 'metNico',
    notes: [[0, 'Liman işçisi. Babamla 1957’de aynı gemide tayfaymış.']]
  },
  {
    id: 'tonino', name: 'Tonino', role: 'Bar Arisel',
    notes: [[0, 'Barmen. Espresso 1.500, panino 3.000 lira. Borç defteri kalın.']]
  }
];

export class JournalScene extends Overlay {
  constructor() { super('journal'); }

  create() {
    this.baseCreate();
    dim(this, 0.85);
    panel(this, GAME_W / 2, GAME_H / 2, 1140, 620, 1);
    this.tabs = ['DOSYA', 'ANILAR', 'ÇANTA', 'KİŞİLER'];
    this.tab = 0;
    this.index = 0;
    this.tabTexts = this.tabs.map((name, i) => this.add.text(120 + i * 180, 70, name, {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '18px', color: HEX.mute, padding: { x: 10, y: 6 }
    }).setDepth(5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.tab = i; this.index = 0; this.render(); }));
    this.add.text(GAME_W - 100, 74, 'Q/E sekme · ↑/↓ seç · ENTER kullan · ESC kapat', {
      fontFamily: FONT, fontSize: '12px', color: HEX.dim
    }).setOrigin(1, 0).setDepth(5);
    this.add.rectangle(GAME_W / 2, 112, 1080, 2, 0x6b1f22).setDepth(5);
    const d = state.data;
    this.add.text(120, 640, `${formatLira(d.money)}   ·   Rispetto ${d.rep}   ·   Süre ${formatTime(d.stats.time + (Date.now() - state.sessionStart) / 1000)}   ·   Etkisiz ${d.stats.kos}   ·   Fark edilme ${d.stats.detections}`, {
      fontFamily: FONT, fontSize: '13px', color: HEX.mute
    }).setDepth(5);
    this.content = [];
    this.render();
  }

  entries() {
    const d = state.data;
    if (this.tab === 0) {
      return EVIDENCE_IDS.map((id) => d.evidence.includes(id)
        ? { icon: `ev-${id}`, title: EVIDENCE[id].name, body: EVIDENCE[id].desc }
        : { icon: null, title: '— — —', body: 'Henüz bulunmadı.', locked: true });
    }
    if (this.tab === 1) {
      return MEMENTO_IDS.map((id) => d.mementos.includes(id)
        ? { icon: 'icon-memento', title: MEMENTOS[id].name, body: MEMENTOS[id].desc }
        : { icon: null, title: '— — —', body: 'Babanın izlerinden biri. Yeni yerlerde gözünü dört aç; parıltılara dikkat.', locked: true });
    }
    if (this.tab === 2) {
      return ['espresso', 'panino', 'ticket'].map((id) => ({
        icon: `icon-${id}`, title: `${ITEMS[id].name}  ×${d.items[id] || 0}`, body: ITEMS[id].desc,
        use: ITEMS[id].heal && d.items[id] > 0 ? id : null, locked: !(d.items[id] > 0)
      }));
    }
    return PEOPLE.filter((p) => (p.from === undefined || d.stage >= p.from) && (!p.flag || d.flags[p.flag]))
      .map((p) => ({
        icon: null, portrait: `portrait-${p.id}`, title: p.name, sub: p.role,
        body: p.notes.filter(([s]) => d.stage >= s).map(([, n]) => '• ' + n).join('\n\n')
      }));
  }

  render() {
    this.content.forEach((o) => o.destroy());
    this.content = [];
    this.tabTexts.forEach((t, i) => {
      t.setColor(i === this.tab ? HEX.paper : HEX.mute).setBackgroundColor(i === this.tab ? '#2b171a' : '#00000000');
    });
    const list = this.entries();
    this.index = Phaser.Math.Clamp(this.index, 0, Math.max(0, list.length - 1));
    list.forEach((e, i) => {
      const y = 150 + i * 56;
      const sel = i === this.index;
      const bg = this.add.rectangle(110, y, 440, 48, sel ? 0x2b171a : 0x151112, 0.95).setOrigin(0, 0.5).setDepth(5)
        .setStrokeStyle(1, sel ? 0xb99a58 : 0x2a2224);
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.index = i; this.render(); });
      this.content.push(bg);
      if (e.icon) this.content.push(this.add.image(136, y, e.icon).setScale(2.5).setDepth(6));
      this.content.push(this.add.text(e.icon ? 162 : 130, y, e.title, {
        fontFamily: FONT, fontStyle: 'bold', fontSize: '15px', color: e.locked ? '#5d5550' : sel ? HEX.paper : HEX.cream
      }).setOrigin(0, 0.5).setDepth(6));
    });
    const e = list[this.index];
    if (!e) return;
    const x = 600;
    if (e.portrait && this.textures.exists(e.portrait)) {
      this.content.push(this.add.rectangle(x + 64, 214, 136, 136, 0x1c1618).setStrokeStyle(2, 0x3a2e2a).setDepth(5));
      this.content.push(this.add.image(x + 64, 214, e.portrait).setScale(2).setDepth(6));
    } else if (e.icon) {
      this.content.push(this.add.image(x + 64, 214, e.icon).setScale(8).setDepth(6).setAlpha(e.locked ? 0.3 : 1));
    }
    this.content.push(this.add.text(x + 160, 160, e.title, {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '22px', color: HEX.paper, wordWrap: { width: 380 }
    }).setDepth(6));
    if (e.sub) this.content.push(this.add.text(x + 160, 196, e.sub, { fontFamily: FONT, fontSize: '14px', color: HEX.gold }).setDepth(6));
    this.content.push(this.add.text(x, 310, e.body, {
      fontFamily: FONT, fontSize: '17px', color: HEX.cream, wordWrap: { width: 540 }, lineSpacing: 8
    }).setDepth(6));
    if (e.use) {
      this.content.push(this.add.text(x, 580, `ENTER · kullan (+${ITEMS[e.use].heal} can, şu an ${Math.ceil(state.data.health)}/${state.data.maxHealth})`, {
        fontFamily: FONT, fontSize: '14px', color: HEX.gold
      }).setDepth(6));
    }
  }

  update() {
    this.controls.update();
    const c = this.controls;
    if (c.pressed.back || c.pressed.pause || c.pressed.journal) { this.close(); return; }
    const count = this.entries().length;
    if (c.pressed.heal || c.pressed.left) { this.tab = (this.tab + this.tabs.length - 1) % this.tabs.length; this.index = 0; audio.sfx('ui_move'); this.render(); }
    if (c.pressed.interact || c.pressed.right) { this.tab = (this.tab + 1) % this.tabs.length; this.index = 0; audio.sfx('ui_move'); this.render(); }
    if (c.pressed.up && count) { this.index = (this.index + count - 1) % count; audio.sfx('ui_move'); this.render(); }
    if (c.pressed.down && count) { this.index = (this.index + 1) % count; audio.sfx('ui_move'); this.render(); }
    if (this.controls.keys.ENTER.isDown && c.pressed.confirm) {
      const e = this.entries()[this.index];
      if (e?.use) {
        const d = state.data;
        if (d.health >= d.maxHealth) { audio.sfx('ui_error'); return; }
        d.items[e.use]--;
        d.health = Math.min(d.maxHealth, d.health + ITEMS[e.use].heal);
        audio.sfx('heal');
        this.render();
      }
    }
  }
}

// ---------------------------------------------------------------- bus map

export class MapScene extends Overlay {
  constructor() { super('map'); }

  create() {
    this.baseCreate();
    dim(this, 0.85);
    this.add.image(GAME_W / 2, GAME_H / 2 + 10, 'map').setScale(2);
    this.add.text(GAME_W / 2, 40, 'ATAC · HATLAR', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '24px', color: HEX.paper, letterSpacing: 6
    }).setOrigin(0.5);
    this.current = this.data0.current || 'trastevere';
    this.ids = Object.keys(STOPS).filter((id) => state.data.stops.includes(id));
    this.index = Math.max(0, this.ids.indexOf(state.storyStop() || this.current));
    this.markers = this.ids.map((id) => {
      const s = STOPS[id];
      const x = GAME_W / 2 - 400 + s.x * 800;
      const y = GAME_H / 2 + 10 - 250 + s.y * 500;
      const dot = this.add.circle(x, y, 9, 0x6b1f22).setStrokeStyle(3, 0x100d0d);
      const label = this.add.text(x, y - 26, s.name, {
        fontFamily: FONT, fontStyle: 'bold', fontSize: '15px', color: '#2a1a14', backgroundColor: '#e8dcc0', padding: { x: 5, y: 2 }
      }).setOrigin(0.5);
      dot.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.index = this.ids.indexOf(id); this.render(); this.confirm(); });
      return { id, dot, label };
    });
    this.info = this.add.text(GAME_W / 2, GAME_H - 44, '', {
      fontFamily: FONT, fontSize: '16px', color: HEX.cream, backgroundColor: '#0d0a0bee', padding: { x: 14, y: 8 }, align: 'center'
    }).setOrigin(0.5);
    this.render();
  }

  cost(id) {
    if (id === this.current) return null;
    // Story trips and the way home are free; nobody gets stranded.
    if (state.storyStop() === id || id === 'trastevere') return 0;
    return 1;
  }

  render() {
    this.markers.forEach((m, i) => {
      const sel = i === this.index;
      m.dot.setRadius(sel ? 13 : 9).setFillStyle(m.id === this.current ? 0x3a70c0 : sel ? 0xc0393d : 0x6b1f22);
      m.label.setScale(sel ? 1.15 : 1);
    });
    const id = this.ids[this.index];
    const c = this.cost(id);
    const story = state.storyStop() === id ? '  ·  HEDEF' : '';
    let msg;
    if (c === null) msg = `${STOPS[id].name} — buradasın`;
    else if (c === 0) msg = `${STOPS[id].name}${story}  ·  ${story ? 'Elena’nın kartıyla' : 'dönüş'} ücretsiz  ·  ENTER`;
    else msg = `${STOPS[id].name}  ·  1 bilet (elinde ${state.itemCount('ticket')})  ·  ENTER`;
    this.info.setText(msg + '\n←/→ durak seç  ·  ESC kapat');
  }

  confirm() {
    const id = this.ids[this.index];
    const c = this.cost(id);
    if (c === null) { audio.sfx('ui_error'); return; }
    if (c > 0) {
      if (state.itemCount('ticket') <= 0) {
        audio.sfx('ui_error');
        this.info.setText('Biletin yok. Elena’nın kulübesinden ' + formatLira(state.price(1000)) + '’ya alabilirsin.\nESC kapat');
        return;
      }
      state.addItem('ticket', -1);
    }
    audio.sfx('ui_ok');
    this.close((parent) => parent?.travel(id));
  }

  update() {
    this.controls.update();
    const c = this.controls;
    if (c.pressed.back || c.pressed.pause) { this.close(); return; }
    if (c.pressed.left || c.pressed.up) { this.index = (this.index + this.ids.length - 1) % this.ids.length; audio.sfx('ui_move'); this.render(); }
    if (c.pressed.right || c.pressed.down) { this.index = (this.index + 1) % this.ids.length; audio.sfx('ui_move'); this.render(); }
    if (c.pressed.confirm) this.confirm();
  }
}

// ---------------------------------------------------------------- game over

const EPITAPHS = [
  '“Roma’da ölüler bile borçlarını öder.”',
  '“İntikam istiyorsan önce hayatta kalmayı öğren.” — Borge',
  '“Kan, kanı çağırır.”',
  '“Baban da acele ederdi.” — Borge'
];

export class GameOverScene extends Overlay {
  constructor() { super('gameover'); }

  create() {
    this.baseCreate();
    const caught = this.data0.reason === 'caught';
    const bg = dim(this, 0);
    this.tweens.add({ targets: bg, alpha: 0.9, duration: 700 });
    bg.setFillStyle(caught ? 0x0a0a14 : 0x140606);
    const title = this.add.text(GAME_W / 2, 250, caught ? 'YAKALANDIN' : 'SEI MORTO', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '64px', color: caught ? '#8fa0c0' : '#c0393d', letterSpacing: 10
    }).setOrigin(0.5).setAlpha(0).setShadow(3, 5, '#000', 0, true, true);
    const sub = this.add.text(GAME_W / 2, 320, caught
      ? 'Vitale’nin adamları seni hücreye attı. Sabaha ifade yok, dosya yok.'
      : Phaser.Utils.Array.GetRandom(EPITAPHS), {
      fontFamily: FONT, fontSize: '17px', color: HEX.mute
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [title, sub], alpha: 1, duration: 800, delay: 300 });
    this.menu = new MenuList(this, GAME_W / 2, 420, [
      { label: 'SON KAYITTAN DEVAM', action: () => this.retry() },
      { label: 'ANA MENÜ', action: () => this.toMenu() }
    ], { align: 'center', size: '22px' });
    this.menu.setVisible(false);
    this.time.delayedCall(900, () => { this.menu.setVisible(true); this.ready = true; this.controls.reset(); });
  }

  retry() {
    this.scene.stop(this.from);
    state.loadFromStorage();
    state.data.stats.deaths++;
    // Never leave the player at a sliver of health after a checkpoint reload.
    state.data.health = Math.max(state.data.health, Math.round(state.data.maxHealth * 0.6));
    audio.muffle(false);
    this.scene.start(state.data.scene, { entry: state.data.entry || 'resume' });
  }

  toMenu() {
    this.scene.stop(this.from);
    audio.muffle(false);
    this.scene.start('menu');
  }

  update() {
    this.controls.update();
    if (this.ready) this.menu.update(this.controls);
  }
}
