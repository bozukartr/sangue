// Shared base for every playable location. A level subclass supplies
// `levelConfig()`, `buildLevel()` and `spawnX(entry)`, and uses the helpers
// here for solids, interactables, triggers, enemies, pickups, NPCs and
// cut-scenes. Story state lives in `state`; a level only decides what to show.
import { GAME_W, GAME_H, GROUND_TOP, CHAR_Y, CHAR_SCALE, DEPTH, FONT, HEX } from '../config.js';
import { state, EVIDENCE, MEMENTOS, formatLira } from '../core/state.js';
import { audio } from '../core/audio.js';
import { Controls } from '../core/controls.js';
import { chapterForStage, MEMENTO_IDS } from '../story.js';
import { Player } from '../systems/player.js';
import { Enemy, Vitale } from '../systems/enemy.js';
import { Hud } from '../systems/hud.js';
import { Dialogue } from '../systems/dialogue.js';
import { Fx } from '../systems/fx.js';
import { PX, FACADE_LIGHTS } from '../gfx/textures.js';

const CUSTOM_EVENTS = ['player-dead', 'player-caught', 'dialogue-open', 'dialogue-close',
  'enemy-alert', 'enemy-calm', 'enemy-down', 'boss-defeated', 'boss-phase'];

export class WorldScene extends Phaser.Scene {
  init(data) {
    this.entry = data?.entry || 'start';
  }

  // ------------------------------------------------------------ lifecycle

  create() {
    // Scene instances are reused on restart: clear per-run state and any
    // custom listeners registered by the previous run.
    this.player = null;
    this.hud = null;
    this.dialogue = null;
    this.leaving = false;
    this.caught = false;
    this.parallaxLayers = [];
    CUSTOM_EVENTS.forEach((name) => this.events.removeAllListeners(name));
    const cfg = this.levelConfig();
    this.cfg = cfg;
    this.worldWidth = cfg.width;
    this.physics.world.setBounds(0, 0, cfg.width, GAME_H);
    this.cameras.main.setBounds(0, 0, cfg.width, GAME_H);
    this.cameras.main.setBackgroundColor(cfg.background || '#18141b');

    this.solids = this.physics.add.staticGroup();
    this.oneWays = this.physics.add.staticGroup();
    this.opaque = [];
    this.blockers = [];
    this.covers = [];
    this.interactables = [];
    this.triggers = [];
    this.enemies = [];
    this.pickups = [];
    this.npcs = [];
    this.busy = false;
    this.ending = false;

    this.fx = new Fx(this);
    this.buildLevel();
    this.buildGround(cfg.ground || 'tile-street');

    const x = this.entry === 'resume' && Number.isFinite(state.data.x)
      ? Phaser.Math.Clamp(state.data.x, 40, cfg.width - 40)
      : this.spawnX(this.entry);
    this.player = new Player(this, x, CHAR_Y);
    this.player.face(this.spawnFacing?.(this.entry) ?? 1);
    this.physics.add.collider(this.player.sprite, this.solids);
    this.physics.add.collider(this.player.sprite, this.oneWays, (sprite) => {
      this.player.onOneWayAt = this.time.now;
    }, (sprite, plat) => this.oneWayCheck(sprite, plat, this.player.dropThroughUntil));
    this.enemies.forEach((e) => this.hookEnemy(e));

    this.fx.groundY = GROUND_TOP;
    if (cfg.rain) this.fx.rain(cfg.rain);
    if (cfg.lightning) this.fx.lightning();
    if (cfg.darkness) this.fx.enableDarkness(cfg.darkness, cfg.darkColor);
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDisplaySize(GAME_W, GAME_H)
      .setScrollFactor(0).setDepth(DEPTH.light + 1).setAlpha(cfg.vignette ?? 0.75);

    this.hud = new Hud(this, { stealth: cfg.stealth });
    this.hud.setHint(cfg.hint || 'A/D yürü · SPACE zıpla · S çömel · J vur · SHIFT kaç · E etkileşim · Q iyileş · TAB günlük · ESC durdur');
    this.dialogue = new Dialogue(this);
    this.controls = new Controls(this);

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.12, 0.12, 0, 40);
    cam.roundPixels = true;
    this.lookahead = 0;

    this.baseMusic = cfg.music || 'street';
    this.musicOverride = null;
    audio.music(this.baseMusic);
    audio.setAmbience(cfg.ambience || {});
    audio.muffle(false);

    this.events.on('player-dead', () => this.onPlayerDead());
    this.events.on('player-caught', (enemy) => this.onPlayerCaught(enemy));
    this.events.on('dialogue-open', () => this.hud.setVisible(false));
    this.events.on('dialogue-close', () => this.hud.setVisible(true));
    this.events.once('shutdown', () => this.onShutdown());

    this.cameras.main.fadeIn(500, 10, 8, 8);
    this.controls.reset();

    const chapterIndex = state.chapterIndex();
    this.time.delayedCall(450, async () => {
      if (state.shownChapter !== chapterIndex) {
        state.shownChapter = chapterIndex;
        const ch = chapterForStage(state.stage);
        await this.fx.chapterCard(ch.number, ch.title);
      }
      if (cfg.location) this.fx.locationCard(cfg.location[0], cfg.location[1]);
    });
    this.onReady?.();
  }

  onShutdown() {
    this.enemies.forEach((e) => e.laser?.destroy());
  }

  buildGround(texture) {
    this.add.tileSprite(0, GROUND_TOP - 2, this.worldWidth, GAME_H - GROUND_TOP + 4, texture)
      .setOrigin(0).setTileScale(PX).setDepth(DEPTH.back + 5);
    const ground = this.add.rectangle(this.worldWidth / 2, GROUND_TOP + 20, this.worldWidth, 40, 0, 0);
    this.solids.add(ground);
  }

  oneWayCheck(sprite, plat, dropUntil) {
    if (this.time.now < dropUntil) return false;
    const body = sprite.body;
    return body.velocity.y >= 0 && body.prev.y + body.height <= plat.body.top + 6;
  }

  update(time, delta) {
    if (!this.player) return;
    this.controls.update();
    const c = this.controls;

    if (!this.ending && !this.player.dead) {
      if (c.pressed.pause) { this.openOverlay('pause'); return; }
      if (c.pressed.journal && !this.dialogue.active) { this.openOverlay('journal'); return; }
    }

    if (this.dialogue.active) this.dialogue.update(delta, c);
    this.player.lock(this.busy || this.dialogue.active || this.ending);
    this.player.update(time, delta, c);
    this.updateStealth();
    this.enemies.forEach((e) => e.update(time, delta, this.player));
    this.updatePickups();
    if (!this.busy && !this.dialogue.active && !this.player.dead) {
      this.updateTriggers();
      this.updateInteractables();
    } else {
      this.hud.prompt(null);
    }
    this.updateNpcs();
    this.updateMusic(delta);
    this.levelUpdate?.(time, delta);
    this.hud.update(delta, this.player);

    // Keep the player readable in dark levels.
    if (this.fx.darkness) this.fx.cut(this.player.x, this.player.y - 6, 120, 0.55);
    this.fx.update();

    const cam = this.cameras.main;
    this.parallaxLayers.forEach((t) => { t.tilePositionX = cam.scrollX * t.parallax; });
    this.lookahead = Phaser.Math.Linear(this.lookahead, -this.player.facing * 110, 0.03);
    cam.setFollowOffset(this.lookahead, 40);
  }

  // ------------------------------------------------------------ building

  addSolid(x, y, w, h, opts = {}) {
    const r = this.add.rectangle(x, y, w, h, opts.color ?? 0x000000, opts.color === undefined ? 0 : (opts.alpha ?? 1));
    if (opts.depth !== undefined) r.setDepth(opts.depth);
    this.solids.add(r);
    const rect = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
    this.blockers.push(rect);
    if (opts.opaque !== false) this.opaque.push(rect);
    return r;
  }

  // Image prop that is also solid (crates, containers, desks).
  addBlock(x, bottom, texture, opts = {}) {
    const img = this.add.image(x, bottom, texture).setOrigin(0.5, 1).setScale(opts.scale ?? PX)
      .setDepth(opts.depth ?? DEPTH.props);
    if (opts.flip) img.setFlipX(true);
    const w = img.displayWidth * (opts.bodyW ?? 1);
    const h = img.displayHeight * (opts.bodyH ?? 1);
    this.addSolid(x, bottom - h / 2, w, h, { opaque: opts.opaque ?? h > 70 });
    if (opts.cover) this.addCover(x - w / 2 - 34, x + w / 2 + 34);
    return img;
  }

  // Low cover you crouch behind. Drawn in front of characters and not solid,
  // so patrols walk past it and a crouching player disappears behind it.
  addCoverProp(x, texture, opts = {}) {
    const img = this.add.image(x, GROUND_TOP + 2, texture).setOrigin(0.5, 1).setScale(opts.scale ?? PX)
      .setDepth(DEPTH.player + 2);
    if (opts.tint) img.setTint(opts.tint);
    const half = img.displayWidth / 2;
    this.addCover(x - half - (opts.pad ?? 26), x + half + (opts.pad ?? 26));
    return img;
  }

  addPlatform(x, y, w, opts = {}) {
    const r = this.add.rectangle(x, y + 3, w, 6, opts.color ?? 0x2a2426, opts.color === undefined && opts.invisible ? 0 : 1)
      .setDepth(opts.depth ?? DEPTH.props);
    this.oneWays.add(r);
    return r;
  }

  addCover(x1, x2) {
    this.covers.push([x1, x2]);
  }

  facade(x, key, opts = {}) {
    const img = this.add.image(x, opts.bottom ?? GROUND_TOP, key).setOrigin(0.5, 1).setScale(PX)
      .setDepth(opts.depth ?? DEPTH.back).setScrollFactor(opts.scroll ?? 1);
    if (opts.tint) img.setTint(opts.tint);
    const lights = FACADE_LIGHTS[key] || [];
    if (opts.glows !== false) {
      lights.forEach((l) => {
        const lx = img.x - img.displayWidth / 2 + l.x * PX;
        const ly = img.y - img.displayHeight + l.y * PX;
        this.fx.glow(lx, ly, 46, 0xf0b060, 0.2, { depth: (opts.depth ?? DEPTH.back) + 1, cut: false });
      });
    }
    return img;
  }

  lamp(x, opts = {}) {
    this.add.image(x, GROUND_TOP, 'lamp').setOrigin(0.5, 1).setScale(PX).setDepth(opts.depth ?? DEPTH.props - 2);
    const lx = x + 12;
    const ly = GROUND_TOP - 140;
    this.fx.glow(lx, ly, 60, 0xffd890, 0.55, { depth: DEPTH.props - 1, cut: false, flicker: opts.flicker });
    const pool = this.fx.glow(lx, GROUND_TOP - 30, opts.radius ?? 170, 0xf3b060, 0.16, { depth: DEPTH.back + 6, flicker: opts.flicker });
    // Light pool on wet stone.
    this.add.ellipse(lx, GROUND_TOP + 4, 150, 14, 0xf3c47a, 0.1).setDepth(DEPTH.back + 6).setBlendMode(Phaser.BlendModes.ADD);
    return pool;
  }

  parallax(key, y, scroll, opts = {}) {
    const t = this.add.tileSprite(0, y, GAME_W, this.textures.get(key).getSourceImage().height * (opts.scale ?? PX), key)
      .setOrigin(0, 1).setScrollFactor(0).setDepth(opts.depth ?? DEPTH.far).setTileScale(opts.scale ?? PX);
    if (opts.tint) t.setTint(opts.tint);
    if (opts.alpha) t.setAlpha(opts.alpha);
    t.parallax = scroll / (opts.scale ?? PX);
    this.parallaxLayers.push(t);
    return t;
  }

  sign(x, y, label, opts = {}) {
    return this.add.text(x, y, label, {
      fontFamily: FONT, fontStyle: opts.bold === false ? 'normal' : 'bold', fontSize: opts.size || '14px',
      color: opts.color || '#d8c6ab', backgroundColor: opts.bg || '#24191b', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(opts.depth ?? DEPTH.back + 3);
  }

  addNpc(look, x, opts = {}) {
    const sprite = this.add.sprite(x, opts.y ?? CHAR_Y, `${look}-sheet`, 0).setScale(CHAR_SCALE).setDepth(DEPTH.npc);
    sprite.play(`${look}-idle`);
    if (opts.facing) sprite.setFlipX(opts.facing < 0);
    const shadow = this.add.ellipse(x, (opts.y ?? CHAR_Y) + 34, 42, 8, 0x0b090a, 0.4).setDepth(DEPTH.npc - 1);
    const label = opts.name ? this.add.text(x, (opts.y ?? CHAR_Y) - 58, opts.name, {
      fontFamily: FONT, fontSize: '12px', color: opts.color || HEX.gold, backgroundColor: '#171313cc', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(DEPTH.npc + 1).setAlpha(0.85) : null;
    const npc = { sprite, shadow, label, look, facePlayer: opts.facePlayer !== false };
    this.npcs.push(npc);
    return npc;
  }

  updateNpcs() {
    this.npcs.forEach((n) => {
      if (!n.sprite.active) return;
      n.shadow.x = n.sprite.x;
      if (n.label) n.label.x = n.sprite.x;
      if (n.facePlayer && Math.abs(this.player.x - n.sprite.x) < 220) n.sprite.setFlipX(this.player.x < n.sprite.x);
    });
  }

  addEnemy(cfg) {
    const enemy = cfg.boss ? new Vitale(this, { y: CHAR_Y, ...cfg }) : new Enemy(this, { y: CHAR_Y, ...cfg });
    this.enemies.push(enemy);
    if (this.player) this.hookEnemy(enemy);
    return enemy;
  }

  hookEnemy(enemy) {
    this.physics.add.collider(enemy.sprite, this.solids);
    this.physics.add.collider(enemy.sprite, this.oneWays, null, (s, p) => this.oneWayCheck(s, p, 0));
    // Vision cones and alert marks read over darkness.
    enemy.cone.setDepth(DEPTH.light + 1);
    enemy.mark.setDepth(DEPTH.light + 3);
    enemy.meter.setDepth(DEPTH.light + 3);
  }

  // ------------------------------------------------------------ interaction

  addInteract(opts) {
    const it = { range: 80, key: 'E', y: CHAR_Y, ...opts };
    this.interactables.push(it);
    return it;
  }

  addTrigger(opts) {
    const t = { once: true, done: false, ...opts };
    this.triggers.push(t);
    return t;
  }

  addExit(x, label, scene, entry, opts = {}) {
    return this.addInteract({
      x, range: opts.range ?? 70, label, when: opts.when,
      action: async () => {
        if (opts.before && (await opts.before()) === false) return;
        audio.sfx('door');
        this.goTo(scene, entry);
      }
    });
  }

  updateInteractables() {
    let best = null;
    let bestDist = Infinity;
    this.interactables.forEach((it) => {
      if (it.when && !it.when()) return;
      const dx = Math.abs(this.player.x - it.x);
      const dy = Math.abs(this.player.y - it.y);
      if (dx < it.range && dy < 90 && dx < bestDist) { best = it; bestDist = dx; }
    });
    if (!best) { this.hud.prompt(null); return; }
    const label = typeof best.label === 'function' ? best.label() : best.label;
    this.hud.prompt(label, best.key);
    if (this.controls.pressed.interact) this.runBusy(() => best.action());
  }

  updateTriggers() {
    this.triggers.forEach((t) => {
      if (t.done) return;
      if (t.when && !t.when()) return;
      if (this.player.x < t.x1 || this.player.x > t.x2) return;
      if (t.once) t.done = true;
      this.runBusy(() => t.action(), t.passive);
    });
  }

  async runBusy(fn, passive = false) {
    if (!passive) {
      if (this.busy) return;
      this.busy = true;
      this.hud.prompt(null);
    }
    try {
      await fn();
    } catch (err) {
      console.error(err);
    } finally {
      if (!passive) {
        this.busy = false;
        this.controls.reset();
      }
    }
  }

  // ------------------------------------------------------------ combat

  lineOfSight(x1, y1, x2, y2) {
    const line = new Phaser.Geom.Line(x1, y1, x2, y2);
    return !this.opaque.some((r) => Phaser.Geom.Intersects.LineToRectangle(line, r) && !(r.contains(x1, y1)));
  }

  firstBlock(x1, y1, x2, y2) {
    const line = new Phaser.Geom.Line(x1, y1, x2, y2);
    let best = null;
    this.blockers.forEach((r) => {
      if (r.y > GROUND_TOP - 2) return; // the street itself
      const pts = Phaser.Geom.Intersects.GetLineToRectangle(line, r);
      pts.forEach((p) => {
        const dist = Math.hypot(p.x - x1, p.y - y1);
        if (dist > 4 && (!best || dist < best.dist)) best = { point: p, dist };
      });
    });
    return best;
  }

  meleeHit(player, box) {
    const rect = new Phaser.Geom.Rectangle(box.x - box.w / 2, box.y - box.h / 2, box.w, box.h);
    let hits = 0;
    this.enemies.forEach((e) => {
      if (e.down) return;
      const b = e.sprite.body;
      const er = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, er)) return;
      if (e.takeHit(box, player)) {
        hits++;
        this.fx.hitSpark(e.x - box.dir * 10, e.y - 14, box.heavy ? 14 : 8);
        this.fx.bleed(e.x, e.y - 14, box.heavy ? 5 : 2);
        audio.sfx(box.heavy ? 'heavy' : 'hit');
      }
    });
    if (hits) {
      this.fx.hitStop(box.heavy ? 90 : 55);
      this.fx.shake(box.heavy ? 140 : 80, box.heavy ? 0.008 : 0.004);
    }
    return hits;
  }

  findTakedownTarget(player) {
    return this.enemies.find((e) => e.canBeTakenDown(player)) || null;
  }

  alertNearby(source, player, radius) {
    this.enemies.forEach((e) => {
      if (e !== source && !e.down && !e.alerted && Math.abs(e.x - source.x) < radius && e.mode !== 'dormant') {
        this.time.delayedCall(300 + Math.random() * 400, () => e.raiseAlarm(player, false));
      }
    });
  }

  updateStealth() {
    const p = this.player;
    p.inLight = this.fx.darkness ? this.fx.isLit(p.x, p.y) : false;
    const inCover = this.covers.some(([a, b]) => p.x > a && p.x < b);
    p.inCover = p.isCrouching && inCover;
    p.hidden = p.isCrouching && (inCover || (Boolean(this.fx.darkness) && !p.inLight));
  }

  anyAlerted() {
    return this.enemies.some((e) => e.alerted && !e.down && e.mode !== 'dormant');
  }

  updateMusic(delta) {
    if (this.musicOverride) { audio.music(this.musicOverride); return; }
    const alerted = this.anyAlerted();
    if (alerted) {
      this.calmTimer = 0;
      audio.music(this.cfg.combatMusic || 'combat');
    } else {
      this.calmTimer = (this.calmTimer || 0) + delta;
      if (this.calmTimer > 2500) audio.music(this.baseMusic);
    }
  }

  // ------------------------------------------------------------ pickups

  addPickup(opts) {
    if (opts.flag && state.flag(opts.flag)) return null;
    if (opts.memento && state.hasMemento(opts.memento)) return null;
    const y = opts.y ?? GROUND_TOP - 10;
    const texture = opts.texture || (opts.memento ? 'sparkle' : 'wallet');
    const img = this.add.image(opts.x, y, texture).setScale(opts.scale ?? PX).setDepth(DEPTH.props + 2);
    const glint = this.add.image(opts.x, y - 6, 'sparkle').setScale(1.5).setDepth(DEPTH.props + 3)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
    this.tweens.add({ targets: glint, alpha: 0.1, scale: 0.8, duration: 700, yoyo: true, repeat: -1 });
    if (!opts.memento) this.tweens.add({ targets: img, y: y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const pickup = { ...opts, img, glint, y, taken: false };
    if (opts.memento) {
      pickup.interact = this.addInteract({
        x: opts.x, y: CHAR_Y, range: 60, label: 'İncele', when: () => !pickup.taken,
        action: async () => {
          pickup.taken = true;
          img.destroy();
          glint.destroy();
          await this.giveMemento(opts.memento, opts.lines);
        }
      });
    } else {
      this.pickups.push(pickup);
    }
    return pickup;
  }

  spawnMoney(x, y, amount) {
    if (amount <= 0) return;
    const img = this.add.image(x, y - 20, 'icon-lira').setScale(PX).setDepth(DEPTH.props + 2);
    this.tweens.add({ targets: img, y: GROUND_TOP - 10, duration: 420, ease: 'Bounce.out' });
    this.pickups.push({ x, y: GROUND_TOP - 10, img, money: amount, taken: false, dropped: true });
  }

  updatePickups() {
    this.pickups.forEach((p) => {
      if (p.taken) return;
      if (Math.abs(this.player.x - p.x) > 34 || Math.abs(this.player.sprite.body.bottom - (p.y + 10)) > 70) return;
      p.taken = true;
      this.tweens.add({ targets: [p.img, p.glint].filter(Boolean), y: '-=30', alpha: 0, duration: 300, onComplete: () => { p.img.destroy(); p.glint?.destroy(); } });
      if (p.flag) state.setFlag(p.flag);
      if (p.money) this.addMoney(p.money);
      if (p.item) {
        state.addItem(p.item, p.count || 1);
        audio.sfx('pickup');
        this.hud.toast(`${p.label || p.item} alındı`, HEX.cream, `icon-${p.item}`);
        this.hud.refresh();
      }
    });
  }

  // ------------------------------------------------------------ story

  async setStage(stage, opts = {}) {
    const before = state.chapterIndex();
    state.stage = stage;
    this.hud.refresh();
    if (!opts.silent) {
      audio.sfx('objective');
      this.hud.toast('YENİ HEDEF', HEX.gold);
    }
    const after = state.chapterIndex();
    if (after !== before) {
      state.shownChapter = after;
      const ch = chapterForStage(stage);
      await this.fx.chapterCard(ch.number, ch.title);
    }
    if (opts.save !== false) this.checkpoint(true);
  }

  giveEvidence(id) {
    if (!state.addEvidence(id)) return;
    audio.sfx('evidence');
    this.fx.banner('KANIT  ·  ' + EVIDENCE[id].name.toUpperCase(), HEX.gold);
    this.hud.toast(EVIDENCE[id].name, HEX.gold, `ev-${id}`);
  }

  async giveMemento(id, lines) {
    if (lines) await this.say(lines);
    if (!state.addMemento(id)) return;
    audio.sfx('memento');
    const count = state.data.mementos.length;
    this.hud.toast(`ANI  ${count}/${MEMENTO_IDS.length}  ·  ${MEMENTOS[id].name}`, '#e8d8a0', 'icon-memento');
    this.checkpoint(true);
  }

  addMoney(amount) {
    state.addMoney(amount);
    audio.sfx('coin');
    this.hud.toast((amount >= 0 ? '+' : '−') + formatLira(Math.abs(amount)), amount >= 0 ? '#b8c8a0' : '#c07a70', 'icon-lira');
  }

  addRep(amount) {
    if (!amount) return;
    state.addRep(amount);
    this.hud.refresh();
    this.hud.toast(`Rispetto ${amount > 0 ? '+' : '−'}${Math.abs(amount)}`, amount > 0 ? '#d4b25a' : '#c07a70');
  }

  checkpoint(silent = false) {
    state.save(this.scene.key, { x: Math.round(this.player?.x ?? 0), entry: 'resume' });
    if (!silent) this.hud.toast('KAYDEDİLDİ', HEX.mute);
    else this.saveIcon();
  }

  saveIcon() {
    const t = this.add.text(GAME_W - 24, GAME_H - 24, '● kaydediliyor', {
      fontFamily: FONT, fontSize: '11px', color: HEX.dim
    }).setOrigin(1).setScrollFactor(0).setDepth(DEPTH.hud);
    this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  say(lines) {
    return this.dialogue.play(lines);
  }

  choose(speaker, prompt, options) {
    return this.dialogue.choose(speaker, prompt, options);
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  // Moves an NPC or enemy sprite at walking pace and resolves on arrival.
  walkTo(sprite, x, speed = 120, look = null) {
    return new Promise((resolve) => {
      const dist = Math.abs(sprite.x - x);
      if (dist < 2) { resolve(); return; }
      sprite.setFlipX(x < sprite.x);
      if (look) sprite.play(`${look}-walk`, true);
      this.tweens.add({
        targets: sprite, x, duration: (dist / speed) * 1000,
        onComplete: () => { if (look) sprite.play(`${look}-idle`, true); resolve(); }
      });
    });
  }

  goTo(sceneKey, entry = 'start') {
    if (this.leaving) return;
    this.leaving = true;
    this.busy = true;
    state.save(sceneKey, { x: null, entry });
    this.cameras.main.fadeOut(320, 10, 8, 8);
    this.time.delayedCall(340, () => this.scene.start(sceneKey, { entry }));
  }

  travel(stopId) {
    if (this.leaving) return;
    this.leaving = true;
    this.busy = true;
    this.cameras.main.fadeOut(320, 10, 8, 8);
    this.time.delayedCall(340, () => this.scene.start('travel', { to: stopId }));
  }

  openOverlay(key, data = {}) {
    audio.sfx('ui_ok');
    audio.muffle(true);
    this.hud.prompt(null);
    this.scene.launch(key, { from: this.scene.key, ...data });
    this.scene.pause();
  }

  // Called by overlays when they close.
  onResumeFromOverlay() {
    audio.muffle(false);
    this.controls.reset();
    this.hud.refresh(true);
  }

  onPlayerDead() {
    this.busy = true;
    this.hud.prompt(null);
    this.musicOverride = 'sorrow';
    this.time.delayedCall(1500, () => {
      this.scene.launch('gameover', { from: this.scene.key, reason: 'dead' });
      this.scene.pause();
    });
  }

  onPlayerCaught() {
    if (this.caught) return;
    this.caught = true;
    this.busy = true;
    this.player.lock(true);
    audio.sfx('caught');
    this.fx.banner('YAKALANDIN', HEX.red);
    this.time.delayedCall(1400, () => {
      this.scene.launch('gameover', { from: this.scene.key, reason: 'caught' });
      this.scene.pause();
    });
  }
}
