// Questura Centrale at night (Capitolo V). Pure stealth: the night watch are
// police, and being seen means arrest. Fuse boxes cut a section's ceiling
// lights and pull the nearest officer away. After the statement is found,
// Vitale's men come through the window and the escape is a straight fight.
import { GAME_W, GAME_H, GROUND_TOP, DEPTH, HEX } from '../../config.js';
import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { STAGE } from '../../story.js';
import { PX } from '../../gfx/textures.js';
import { WorldScene } from '../world.js';

const ENTRY_X = 500;
const OFFICE_X = 3700;
const DESK_X = 3960;
const WINDOW_X = 4220;
const MEZZ_Y = GROUND_TOP - 150;

export class QuesturaScene extends WorldScene {
  constructor() { super('questura'); }

  levelConfig() {
    const escape = state.stage === STAGE.ESCAPE_QUESTURA;
    return {
      width: 4300,
      ground: 'tile-lino',
      background: '#15171a',
      music: escape ? 'combat' : 'stealth',
      ambience: { room: 0.5, rain: 0.3, alarm: escape ? 1 : 0 },
      darkness: 0.66,
      darkColor: 0x04050a,
      stealth: true,
      location: ['QUESTURA CENTRALE', 'VIA DI SAN VITALE · 02:30'],
      hint: 'Polisler seni görürse yakalanırsın · Sigorta kutuları: ışıkları kes · S çömel'
    };
  }

  spawnX() { return 120; }

  buildLevel() {
    this.escapeSpawned = false;
    this.lightGroups = { a: [], b: [], c: [], office: [] };
    this.fuses = {};
    this.buildCourtyard();
    this.buildInterior();
    this.buildSectionA();
    this.buildSectionB();
    this.buildSectionC();
    this.buildOffice();
    const s = state.stage;
    if (s === STAGE.ESCAPE_QUESTURA) this.startEscape(true);
    else if (s >= STAGE.INFILTRATE_QUESTURA) this.buildAgents();
  }

  buildCourtyard() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.sky);
    sky.fillGradientStyle(0x0c0e16, 0x0c0e16, 0x20242e, 0x20242e, 1);
    sky.fillRect(0, 0, GAME_W, GAME_H);
    this.facade(300, 'facade-questura', { tint: 0x9a9a9a, glows: false });
    this.add.image(230, GROUND_TOP + 2, 'alfetta').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
    this.add.image(80, GROUND_TOP, 'wall-lamp').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
    this.fx.glow(100, 500, 140, 0xe0c080, 0.3);
    this.add.rectangle(40, 560, 6, 160, 0x2a2a2c).setDepth(DEPTH.props);
    this.add.circle(40, 480, 16, 0xc46a22).setDepth(DEPTH.props);
    this.addInteract({
      x: 50, range: 50, label: 'Otobüs · hat haritası',
      action: () => this.openOverlay('map', { current: 'questura' })
    });
    this.addInteract({
      x: 230, range: 60, label: 'Alfetta’yı incele',
      action: () => this.say([['GIANLICO', 'Koyu mavi Alfetta. Ön camın arkasında sönük bir mavi lamba. Elena’nın gördüğü araba bu.']])
    });
  }

  buildInterior() {
    // Walls, wainscot and a dark ceiling from the entrance onward.
    this.add.rectangle((ENTRY_X + 4300) / 2, 330, 4300 - ENTRY_X, 660, 0x2e3231).setDepth(DEPTH.back - 1);
    this.add.rectangle((ENTRY_X + 4300) / 2, 560, 4300 - ENTRY_X, 170, 0x23312c).setDepth(DEPTH.back - 1);
    this.add.rectangle((ENTRY_X + 4300) / 2, 474, 4300 - ENTRY_X, 6, 0x4a4f4a).setDepth(DEPTH.back - 1);
    this.add.rectangle((ENTRY_X + 4300) / 2, 90, 4300 - ENTRY_X, 180, 0x121416).setDepth(DEPTH.back - 1);
    for (let x = ENTRY_X + 60; x < 4300; x += 260) {
      this.add.rectangle(x, 300, 70, 110, 0x151a24).setDepth(DEPTH.back);
      for (let y = 250; y < 355; y += 6) this.add.rectangle(x, y, 66, 2, 0x3a4048).setDepth(DEPTH.back);
    }
    this.add.rectangle(ENTRY_X, 400, 30, 480, 0x1a1c1e).setDepth(DEPTH.back + 1);
    this.add.rectangle(ENTRY_X, 470, 110, 16, 0x1a1c1e).setDepth(DEPTH.back + 1);
    this.sign(ENTRY_X + 120, 420, 'POLIZIA DI STATO · UFFICI', { size: '12px', color: '#d8d4c8', bg: '#1f2630' });
    [1540, 2700].forEach((x) => this.addTrigger({ x1: x, x2: x + 30, passive: true, action: () => this.checkpoint() }));
  }

  ceilingLight(x, group) {
    this.add.rectangle(x, 190, 4, 40, 0x1a1c1e).setDepth(DEPTH.back + 2);
    this.add.rectangle(x, 212, 40, 8, 0x3a3e40).setDepth(DEPTH.back + 2);
    const l = this.fx.glow(x, 470, 210, 0xe8f0e0, 0.22);
    this.lightGroups[group].push(l);
    return l;
  }

  fuse(x, group, label) {
    this.add.image(x, 540, 'fusebox').setScale(PX).setDepth(DEPTH.props);
    this.fuses[group] = false;
    this.addInteract({
      x, range: 45, label: () => this.fuses[group] ? 'Sigorta (kapalı)' : `Sigortayı at · ${label}`,
      action: () => this.cutFuse(group, x)
    });
  }

  desk(x) {
    this.addCoverProp(x, 'desk', { scale: PX * 1.1 });
    this.add.image(x + 30, GROUND_TOP - 46, 'typewriter').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.player + 3);
  }

  buildSectionA() {
    [700, 1100, 1420].forEach((x) => this.ceilingLight(x, 'a'));
    this.fuse(580, 'a', 'koridor');
    this.desk(860);
    this.desk(1260);
    this.add.image(1000, GROUND_TOP, 'filing').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props - 1);
    this.add.image(1150, GROUND_TOP, 'plant').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
  }

  buildSectionB() {
    [1800, 2150, 2500].forEach((x) => this.ceilingLight(x, 'b'));
    this.fuse(1600, 'b', 'arşiv');
    this.sign(2100, 250, 'ARCHIVIO', { size: '14px', color: '#d8d4c8', bg: '#1f2630' });
    for (let x = 1700; x < 2600; x += 76) this.add.image(x, 470, 'bookshelf').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.back + 1).setTint(0x9098a0);
    // Climbable filing cabinets up to the mezzanine walkway.
    this.addBlock(1690, GROUND_TOP, 'filing');
    this.addBlock(1722, GROUND_TOP, 'filing', { bodyH: 0.6 });
    this.addPlatform(2100, MEZZ_Y, 700, { color: 0x3a3e40 });
    for (let x = 1760; x <= 2440; x += 40) this.add.rectangle(x, MEZZ_Y - 14, 2, 26, 0x2a2e30).setDepth(DEPTH.props);
    this.add.rectangle(2100, MEZZ_Y - 26, 700, 2, 0x2a2e30).setDepth(DEPTH.props);
    this.addPickup({
      x: 2120, y: MEZZ_Y - 12, memento: 'record68',
      lines: [
        ['GIANLICO', 'Asma kattaki bir kutuda 1968 tarihli tutanaklar. Bir tanesi… Paolo Bianchi.'],
        ['GIANLICO', '“Grev sırasında kamu düzenini bozmak. Gözaltı: 1 gece.” İmza: Agente R. Vitale.'],
        ['GIANLICO', 'Birbirlerini on iki yıldır tanıyorlarmış. Babam ona bu yüzden güvenmiş.']
      ]
    });
    this.desk(1990);
    this.addBlock(2320, GROUND_TOP, 'filing');
    this.desk(2500);
  }

  buildSectionC() {
    [2860, 3250, 3560].forEach((x) => this.ceilingLight(x, 'c'));
    this.fuse(2760, 'c', 'ofisler');
    this.desk(3000);
    this.desk(3420);
    this.add.image(3200, GROUND_TOP, 'plant').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
  }

  buildOffice() {
    this.add.rectangle(OFFICE_X, 400, 24, 480, 0x1a1c1e).setDepth(DEPTH.back + 1);
    this.add.rectangle(4000, 330, 600, 660, 0x2e2622).setDepth(DEPTH.back - 1);
    this.add.rectangle(4000, 560, 600, 170, 0x3a2820).setDepth(DEPTH.back - 1);
    this.sign(OFFICE_X + 150, 420, 'COMMISSARIO R. VITALE', { size: '12px', color: '#e7ddca', bg: '#3a2820' });
    this.add.image(3850, 470, 'bookshelf').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.back + 1);
    this.add.image(4060, 270, 'painting').setScale(PX).setDepth(DEPTH.back + 1);
    this.add.image(DESK_X, GROUND_TOP, 'desk').setOrigin(0.5, 1).setScale(PX * 1.2).setDepth(DEPTH.props);
    this.add.image(DESK_X - 40, GROUND_TOP - 52, 'desk-lamp').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props + 1);
    this.lightGroups.office.push(this.fx.glow(DESK_X - 40, GROUND_TOP - 70, 170, 0x90c0a0, 0.35));
    // Fire-escape window.
    this.add.image(WINDOW_X, 560, 'window-night').setScale(PX * 1.4).setDepth(DEPTH.back + 1);
    this.addInteract({
      x: DESK_X, range: 80, label: 'Vitale’nin masasını ara',
      when: () => state.stage === STAGE.INFILTRATE_QUESTURA,
      action: () => this.searchDesk()
    });
    this.addInteract({
      x: WINDOW_X, range: 60, label: 'Yangın merdiveninden kaç',
      when: () => state.stage === STAGE.ESCAPE_QUESTURA,
      action: () => this.escape()
    });
    this.addTrigger({
      x1: OFFICE_X + 20, x2: OFFICE_X + 80,
      when: () => state.stage === STAGE.INFILTRATE_QUESTURA,
      action: () => this.say([['GIANLICO', 'Vitale’nin ofisi. Masa lambası açık bırakılmış; sanki birini bekliyor.']])
    });
  }

  buildAgents() {
    this.addEnemy({ type: 'agent', x: 900, patrol: [680, 1380], wait: 1600 });
    this.addEnemy({ type: 'agent', x: 1900, patrol: [1650, 2280], wait: 1500 });
    this.addEnemy({ type: 'agent', x: 2600, patrol: [2380, 2640], wait: 1800 });
    this.addEnemy({ type: 'agent', x: 3100, patrol: [2800, 3520], wait: 1300 });
  }

  cutFuse(group, x) {
    if (this.fuses[group]) {
      return this.say([['GIANLICO', 'Bu sigorta zaten atık.']]);
    }
    this.fuses[group] = true;
    audio.sfx('switch');
    this.fx.hitSpark(x, 540, 12);
    this.lightGroups[group].forEach((l) => { l.on = false; l.img.setVisible(false); });
    this.hud.toast('Işıklar söndü', HEX.gold);
    const agent = this.enemies
      .filter((e) => !e.down && !e.alerted && e.type.catcher)
      .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    if (agent && Math.abs(agent.x - x) < 900) {
      agent.say('Di nuovo la corrente…');
      agent.suspicion = 0.25;
      agent.investigate(x + 40);
    }
    return null;
  }

  async searchDesk() {
    await this.dialogue.run(async () => {
      await this.say([
        ['GIANLICO', 'Alt çekmece kilitli. …Değil. Vitale kimsenin cesaret edemeyeceğinden emin.'],
        ['GIANLICO', 'Mühürlü bir zarf. Üstünde tarih: 17 marzo 1980. Babamın öldüğü günden bir gün önce.'],
        ['NOT', '“Ben, Paolo Bianchi… Giudice Ruggero Ferri’ye iletilmek üzere…”'],
        ['GIANLICO', 'Babamın ifadesi. Hiç dosyalanmamış. Vitale onu çekmecesinde saklamış — koz olarak.']
      ]);
    });
    this.giveEvidence('statement');
    this.fx.shake(300, 0.004);
    audio.sfx('alarm');
    await this.say([['VITALE', '(telsizden) …Ufficio del commissario! Chiunque sia, non deve uscire vivo.']]);
    await this.setStage(STAGE.ESCAPE_QUESTURA, { save: false });
    this.startEscape(false);
    this.checkpoint(true);
  }

  startEscape(fromSave) {
    audio.setAmbience({ room: 0.5, rain: 0.3, alarm: 1 });
    this.baseMusic = 'combat';
    // Red alarm beacons in the office.
    [3800, 4120].forEach((x) => {
      this.add.image(x, 230, 'alarm-light').setScale(PX).setDepth(DEPTH.props);
      const l = this.fx.glow(x, 300, 220, 0xff2020, 0.35, { depth: DEPTH.light + 1, cut: true });
      this.tweens.add({ targets: l.img, alpha: 0.05, duration: 400, yoyo: true, repeat: -1 });
    });
    // Police in the corridors are busy with the alarm elsewhere; Vitale's
    // men come in through the fire escape.
    this.enemies.filter((e) => e.type.catcher).forEach((e) => e.retire());
    this.enemies = this.enemies.filter((e) => !e.type.catcher);
    const spawn = () => {
      const a = this.addEnemy({ type: 'thug2', x: WINDOW_X - 20, facing: -1 });
      const b = this.addEnemy({ type: 'thug', x: WINDOW_X - 60, facing: -1 });
      [a, b].forEach((e) => this.time.delayedCall(300, () => e.raiseAlarm(this.player, false)));
      a.say('Eccolo! Il ragazzo di Bianchi!');
      this.escapeSpawned = true;
    };
    if (fromSave) this.time.delayedCall(900, spawn);
    else this.time.delayedCall(700, spawn);
    this.hud?.refresh();
  }

  async escape() {
    const standing = this.enemies.filter((e) => !e.down).length;
    if (!this.escapeSpawned || standing > 0) {
      await this.say([['GIANLICO', 'Pencerenin önü tutulmuş. Önce bunları halletmeliyim.']]);
      return;
    }
    audio.sfx('door');
    await this.say([['GIANLICO', 'Yangın merdiveni. Aşağıda sokak, sonra gece hattı. İfade göğüs cebimde.']]);
    audio.setAmbience({ alarm: 0 });
    await this.setStage(STAGE.SHOW_STATEMENT, { save: false });
    this.goTo('rome', 'bus');
  }
}
