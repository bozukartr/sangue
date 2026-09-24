// Heads-up display: objective, health with a damage trail, lira, rispetto,
// quick item, stealth eye, toasts, interaction prompt and boss bar.
import { GAME_W, GAME_H, DEPTH, FONT, HEX } from '../config.js';
import { state, formatLira, ITEMS } from '../core/state.js';
import { chapterForStage, objectiveForStage } from '../story.js';
import { touch } from '../core/touch.js';

export class Hud {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.toasts = [];
    this.opts = opts;
    this.build();
    this.refresh(true);
  }

  add(obj) {
    if (this.collecting) this.core.push(obj);
    return obj.setScrollFactor(0).setDepth(DEPTH.hud + (obj.depthOffset || 0));
  }

  build() {
    const s = this.scene;
    // Everything added until the stealth eye is the "core" HUD that hides
    // during cut-scenes.
    this.core = [];
    this.collecting = true;
    const t = (x, y, value, style) => this.add(s.add.text(x, y, value, { fontFamily: FONT, ...style }));

    this.panel = this.add(s.add.rectangle(24, 22, 452, 72, 0x0d0a0b, 0.82).setOrigin(0));
    this.panel.setStrokeStyle(2, 0x6b1f22, 0.9);
    this.panelAccent = this.add(s.add.rectangle(24, 22, 5, 72, 0x9c2b2f).setOrigin(0));
    this.chapter = t(42, 32, '', { fontStyle: 'bold', fontSize: '13px', color: HEX.gold });
    this.objective = t(42, 56, '', { fontSize: '17px', color: HEX.cream, wordWrap: { width: 420 } });

    // Health bar with a lagging white trail.
    const y = 106;
    this.add(s.add.rectangle(24, y, 250, 16, 0x0d0a0b, 0.85).setOrigin(0).setStrokeStyle(1, 0x3a2e2a));
    this.hpTrail = this.add(s.add.rectangle(27, y + 3, 244, 10, 0xe7ddca, 0.7).setOrigin(0));
    this.hpFill = this.add(s.add.rectangle(27, y + 3, 244, 10, 0xb3262b).setOrigin(0));
    this.hpShine = this.add(s.add.rectangle(27, y + 3, 244, 2, 0xff8a7a, 0.45).setOrigin(0));
    this.hpText = t(282, y - 1, '', { fontSize: '13px', color: HEX.mute });

    this.money = t(24, y + 26, '', { fontStyle: 'bold', fontSize: '15px', color: '#b8c8a0' });
    this.repLabel = t(160, y + 28, 'RISPETTO', { fontSize: '11px', color: HEX.dim });
    this.add(s.add.rectangle(232, y + 31, 104, 8, 0x0d0a0b, 0.85).setOrigin(0).setStrokeStyle(1, 0x3a2e2a));
    this.repFill = this.add(s.add.rectangle(234, y + 33, 100, 4, 0xb99a58).setOrigin(0));

    this.itemIcon = this.add(s.add.image(36, y + 64, 'icon-espresso').setScale(2));
    this.itemText = t(54, y + 56, '', { fontSize: '13px', color: HEX.mute });

    this.collecting = false;
    this.eye = this.add(s.add.image(GAME_W - 48, GAME_H - 44, 'icon-eye').setScale(3).setVisible(false));
    this.eyeText = t(GAME_W - 70, GAME_H - 52, '', { fontSize: '12px', color: HEX.mute }).setOrigin(1, 0).setVisible(false);

    this.hint = t(GAME_W - 24, 24, '', {
      fontSize: '12px', color: '#b3a89d', backgroundColor: '#0d0a0bcc', padding: { x: 10, y: 7 }, align: 'right'
    }).setOrigin(1, 0);

    // Interaction prompt.
    this.promptBox = this.add(s.add.container(GAME_W / 2, GAME_H - 96));
    this.promptBg = s.add.rectangle(0, 0, 300, 38, 0x0d0a0b, 0.92).setStrokeStyle(1, 0xb99a58, 0.6);
    this.promptKey = s.add.rectangle(0, 0, 28, 24, 0xb99a58);
    this.promptKeyText = s.add.text(0, 0, 'E', { fontFamily: FONT, fontStyle: 'bold', fontSize: '15px', color: HEX.ink }).setOrigin(0.5);
    this.promptText = s.add.text(0, 0, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '15px', color: HEX.cream }).setOrigin(0, 0.5);
    this.promptBox.add([this.promptBg, this.promptKey, this.promptKeyText, this.promptText]);
    this.promptBox.setScrollFactor(0, 0, true).setDepth(DEPTH.prompt).setVisible(false);
    this.promptLabel = null;

    // Boss bar.
    this.boss = this.add(s.add.container(0, 0)).setVisible(false);
    this.bossName = s.add.text(GAME_W / 2, GAME_H - 58, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '14px', color: HEX.gold }).setOrigin(0.5);
    const bossBg = s.add.rectangle(GAME_W / 2, GAME_H - 34, 604, 14, 0x0d0a0b, 0.9).setStrokeStyle(1, 0x6b1f22);
    this.bossFill = s.add.rectangle(GAME_W / 2 - 300, GAME_H - 34, 600, 10, 0x9c2b2f).setOrigin(0, 0.5);
    this.boss.add([bossBg, this.bossFill, this.bossName]);
    this.boss.setScrollFactor(0, 0, true);

    // Hurt and low-health vignette.
    this.hurt = this.add(s.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setDisplaySize(GAME_W, GAME_H)
      .setTint(0xb3262b).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
    this.hurt.setDepth(DEPTH.hud - 1);

    this.shownHp = state.data.health;
    this.shownMoney = state.data.money;
  }

  setHint(value) {
    // Keyboard hints make no sense next to on-screen buttons.
    if (touch.enabled) value = '';
    this.hint.setText(value).setAlpha(1).setVisible(Boolean(value));
    this.scene.tweens.killTweensOf(this.hint);
    if (value) this.scene.tweens.add({ targets: this.hint, alpha: 0.35, delay: 9000, duration: 1200 });
  }

  refresh(instant = false) {
    const d = state.data;
    const chapter = chapterForStage(d.stage);
    this.chapter.setText(`${chapter.number}  ·  OBIETTIVO`);
    const objective = objectiveForStage(d.stage);
    if (objective !== this.objective.text) {
      this.objective.setText(objective);
      if (!instant) {
        this.scene.tweens.add({ targets: [this.panel, this.panelAccent], alpha: { from: 0.3, to: 1 }, duration: 160, yoyo: true, repeat: 2 });
        this.objective.setColor('#ffffff');
        this.scene.time.delayedCall(900, () => this.objective.setColor(HEX.cream));
      }
    }
    if (instant) {
      this.shownHp = d.health;
      this.shownMoney = d.money;
    }
    this.repFill.width = Math.max(1, d.rep);
    this.repFill.setFillStyle(d.rep >= 70 ? 0xd4b25a : d.rep < 35 ? 0x8a4a3a : 0xb99a58);

    const item = d.items.panino > 0 && d.health < d.maxHealth - 45 ? 'panino' : d.items.espresso > 0 ? 'espresso' : d.items.panino > 0 ? 'panino' : 'espresso';
    this.itemIcon.setTexture(`icon-${item}`);
    const count = d.items[item] || 0;
    this.itemText.setText(`Q  ${ITEMS[item].name} ×${count}`);
    this.itemIcon.setAlpha(count ? 1 : 0.35);
    this.itemText.setAlpha(count ? 1 : 0.45);
  }

  update(delta, player) {
    const d = state.data;
    // Health: fill snaps, the trail catches up after a short delay.
    const ratio = Math.max(0, d.health / d.maxHealth);
    this.hpFill.width = 244 * ratio;
    this.hpShine.width = 244 * ratio;
    if (this.shownHp > d.health) {
      this.trailDelay = (this.trailDelay ?? 400) - delta;
      if (this.trailDelay <= 0) this.shownHp = Math.max(d.health, this.shownHp - delta * 0.08);
    } else {
      this.shownHp = d.health;
      this.trailDelay = 400;
    }
    this.hpTrail.width = 244 * Math.max(0, this.shownHp / d.maxHealth);
    this.hpText.setText(`${Math.ceil(d.health)}`);
    if (ratio < 0.3 && d.health > 0) {
      this.hurt.setAlpha(Math.max(this.hurt.alpha, 0.18 + Math.sin(this.scene.time.now / 220) * 0.1));
      this.hpFill.setFillStyle(Math.floor(this.scene.time.now / 250) % 2 ? 0xd43a3a : 0xb3262b);
    } else {
      this.hpFill.setFillStyle(0xb3262b);
    }

    if (Math.abs(this.shownMoney - d.money) > 1) {
      this.shownMoney += (d.money - this.shownMoney) * Math.min(1, delta / 120);
    } else this.shownMoney = d.money;
    this.money.setText(formatLira(this.shownMoney));

    if (this.hurt.alpha > 0) this.hurt.setAlpha(Math.max(0, this.hurt.alpha - delta / 700));

    if (this.opts.stealth && player) {
      const hidden = player.hidden;
      this.eye.setVisible(true).setTexture(hidden ? 'icon-hidden' : 'icon-eye').setAlpha(hidden ? 0.8 : 1);
      this.eyeText.setVisible(true).setText(hidden ? 'GİZLİ' : player.inLight ? 'IŞIKTA' : 'GÖRÜNÜR')
        .setColor(hidden ? HEX.mute : player.inLight ? '#e8c14a' : HEX.cream);
    }
  }

  flashHurt(amount = 0.55) {
    this.hurt.setAlpha(amount);
  }

  prompt(label, key = 'E') {
    if (!label) {
      if (this.promptLabel !== null) this.promptBox.setVisible(false);
      this.promptLabel = null;
      return;
    }
    if (label === this.promptLabel) return;
    this.promptLabel = label;
    this.promptText.setText(label);
    this.promptKeyText.setText(key);
    const width = this.promptText.width + 70;
    this.promptBg.width = width;
    this.promptBg.setOrigin(0.5);
    this.promptKey.setPosition(-width / 2 + 24, 0);
    this.promptKeyText.setPosition(-width / 2 + 24, 0);
    this.promptText.setPosition(-width / 2 + 46, 0);
    this.promptBox.setVisible(true).setAlpha(0);
    this.promptBox.y = GAME_H - 88;
    this.scene.tweens.add({ targets: this.promptBox, alpha: 1, y: GAME_H - 96, duration: 140 });
  }

  toast(message, color = HEX.cream, icon = null) {
    const s = this.scene;
    const y = 180 + this.toasts.length * 42;
    const c = s.add.container(GAME_W + 10, y);
    const text = s.add.text(icon ? 40 : 16, 0, message, { fontFamily: FONT, fontSize: '14px', color }).setOrigin(0, 0.5);
    const w = text.width + (icon ? 56 : 32);
    const bg = s.add.rectangle(0, 0, w, 34, 0x0d0a0b, 0.9).setOrigin(0, 0.5).setStrokeStyle(1, 0xb99a58, 0.4);
    c.add([bg, text]);
    if (icon) c.add(s.add.image(20, 0, icon).setScale(2));
    c.setScrollFactor(0, 0, true).setDepth(DEPTH.hud + 5);
    this.toasts.push(c);
    s.tweens.add({ targets: c, x: GAME_W - w - 24, duration: 220, ease: 'Back.out' });
    s.tweens.add({
      targets: c, alpha: 0, x: GAME_W + 10, delay: 2800, duration: 300,
      onComplete: () => {
        c.destroy();
        this.toasts = this.toasts.filter((item) => item !== c);
        this.toasts.forEach((item, i) => s.tweens.add({ targets: item, y: 180 + i * 42, duration: 150 }));
      }
    });
  }

  showBoss(name) {
    this.bossName.setText(name);
    this.boss.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.boss, alpha: 1, duration: 400 });
  }

  setBoss(ratio) {
    this.bossFill.width = 600 * Math.max(0, ratio);
  }

  hideBoss() {
    this.scene.tweens.add({ targets: this.boss, alpha: 0, duration: 400, onComplete: () => this.boss.setVisible(false) });
  }

  setVisible(on) {
    this.scene.tweens.killTweensOf(this.core);
    this.scene.tweens.add({ targets: this.core, alpha: on ? 1 : 0, duration: 200 });
  }
}
