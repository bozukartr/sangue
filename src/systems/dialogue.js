// Cinematic dialogue: letterbox bars, portrait, typewriter text with per-
// speaker voice blips, and branching choices. Scripts are awaited:
//
//   await dialogue.play([['BORGE', 'line'], ['GIANLICO', 'line']]);
//   const pick = await dialogue.choose('GIANLICO', 'prompt', ['A', 'B']);
import { GAME_W, GAME_H, DEPTH, FONT, HEX } from '../config.js';
import { audio } from '../core/audio.js';
import { settings, TEXT_CPS } from '../core/settings.js';

export const SPEAKERS = {
  GIANLICO: { portrait: 'gianlico', color: '#d8c6ab', pitch: 300 },
  BORGE: { portrait: 'borge', color: '#b99a58', pitch: 180 },
  ELENA: { portrait: 'elena', color: '#9fc0a8', pitch: 420 },
  CRANIER: { portrait: 'cranier', color: '#e8e0d0', pitch: 160 },
  VITALE: { portrait: 'vitale', color: '#c8a070', pitch: 200 },
  NICO: { portrait: 'nico', color: '#8fb0d0', pitch: 230 },
  TONINO: { portrait: 'tonino', color: '#e0b080', pitch: 260 },
  SCAGNOZZO: { portrait: 'thug', color: '#c07a70', pitch: 190 },
  GUARDIA: { portrait: 'guard', color: '#8fa0c0', pitch: 210 },
  AGENTE: { portrait: 'agent', color: '#8fa0c0', pitch: 220 },
  RADYO: { portrait: null, color: '#8e8378', pitch: 520 },
  NOT: { portrait: null, color: '#b99a58', pitch: 600 }
};

export class Dialogue {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.queue = [];
    this.build();
  }

  build() {
    const s = this.scene;
    const d = DEPTH.dialogue;
    this.barTop = s.add.rectangle(0, 0, GAME_W, 70, 0x000000, 1).setOrigin(0).setScrollFactor(0).setDepth(d - 2);
    this.barBottom = s.add.rectangle(0, GAME_H, GAME_W, 70, 0x000000, 1).setOrigin(0, 1).setScrollFactor(0).setDepth(d - 2);
    this.barTop.y = -70;
    this.barBottom.y = GAME_H + 70;

    this.box = s.add.container(0, 0).setScrollFactor(0).setDepth(d).setVisible(false);
    const panel = s.add.rectangle(70, 486, GAME_W - 140, 184, 0x0d0a0b, 0.95).setOrigin(0);
    panel.setStrokeStyle(2, 0xb99a58, 0.45);
    const accent = s.add.rectangle(70, 486, 6, 184, 0x6b1f22).setOrigin(0);
    this.portraitFrame = s.add.rectangle(96, 508, 140, 140, 0x1c1618).setOrigin(0).setStrokeStyle(2, 0x3a2e2a);
    this.portrait = s.add.image(166, 578, 'portrait-gianlico').setScale(2);
    this.name = s.add.text(262, 506, '', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '17px', color: HEX.gold, letterSpacing: 2
    });
    this.text = s.add.text(262, 540, '', {
      fontFamily: FONT, fontSize: '20px', color: HEX.cream,
      wordWrap: { width: GAME_W - 380 }, lineSpacing: 9
    });
    this.more = s.add.text(GAME_W - 96, 646, '▼', {
      fontFamily: FONT, fontSize: '16px', color: HEX.gold
    }).setOrigin(1);
    this.hint = s.add.text(GAME_W - 124, 646, 'E', {
      fontFamily: FONT, fontSize: '12px', color: HEX.dim
    }).setOrigin(1);
    this.box.add([panel, accent, this.portraitFrame, this.portrait, this.name, this.text, this.more, this.hint]);
    // Children of a container render with their own scroll factor.
    this.box.setScrollFactor(0, 0, true);
    s.tweens.add({ targets: this.more, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });

    this.choiceBox = s.add.container(0, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false);
  }

  letterbox(on) {
    const s = this.scene;
    s.tweens.killTweensOf([this.barTop, this.barBottom]);
    s.tweens.add({ targets: this.barTop, y: on ? 0 : -70, duration: 260, ease: 'Quad.out' });
    s.tweens.add({ targets: this.barBottom, y: on ? GAME_H : GAME_H + 70, duration: 260, ease: 'Quad.out' });
  }

  open() {
    if (this.active) return;
    this.active = true;
    this.box.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.box, alpha: 1, duration: 160 });
    this.letterbox(true);
    this.scene.events.emit('dialogue-open');
  }

  close() {
    this.active = false;
    this.box.setVisible(false);
    this.choiceBox.setVisible(false);
    this.letterbox(false);
    this.scene.events.emit('dialogue-close');
  }

  setSpeaker(speaker) {
    const meta = SPEAKERS[speaker] || { portrait: null, color: HEX.gold, pitch: 300 };
    this.voice = meta.pitch;
    this.name.setText(speaker).setColor(meta.color);
    const hasPortrait = meta.portrait && this.scene.textures.exists(`portrait-${meta.portrait}`);
    this.portrait.setVisible(Boolean(hasPortrait));
    this.portraitFrame.setVisible(Boolean(hasPortrait));
    if (hasPortrait) this.portrait.setTexture(`portrait-${meta.portrait}`);
    const x = hasPortrait ? 262 : 110;
    this.name.setX(x);
    this.text.setX(x).setWordWrapWidth(GAME_W - x - 120);
    this.text.setFontStyle(speaker === 'NOT' || speaker === 'RADYO' ? 'italic' : 'normal');
  }

  // Keeps the letterbox open across several play/choose calls.
  async run(fn) {
    this.keepOpen = true;
    try {
      return await fn();
    } finally {
      this.keepOpen = false;
      this.close();
    }
  }

  // Plays lines in order. Lines are [speaker, text] pairs.
  play(lines) {
    return new Promise((resolve) => {
      this.open();
      this.lines = lines.slice();
      this.index = -1;
      this.resolve = resolve;
      this.next();
    });
  }

  next() {
    this.index++;
    if (this.index >= this.lines.length) {
      const done = this.resolve;
      this.resolve = null;
      this.lines = null;
      if (!this.keepOpen) this.close();
      done?.();
      return;
    }
    const [speaker, line] = this.lines[this.index];
    this.setSpeaker(speaker);
    this.full = line;
    this.shown = 0;
    this.text.setText('');
    this.more.setVisible(false);
    this.typing = true;
    this.elapsed = 0;
  }

  // Multiple-choice prompt. Resolves to the chosen index.
  choose(speaker, prompt, options) {
    return new Promise((resolve) => {
      this.open();
      this.setSpeaker(speaker);
      this.text.setText(prompt);
      this.typing = false;
      this.more.setVisible(false);
      this.options = options;
      this.choiceIndex = 0;
      this.choiceResolve = resolve;
      this.renderChoices();
    });
  }

  renderChoices() {
    const s = this.scene;
    this.choiceBox.removeAll(true);
    const width = 520;
    const x = GAME_W - 70 - width;
    const top = 470 - this.options.length * 46;
    this.options.forEach((opt, i) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      const disabled = typeof opt === 'object' && opt.disabled;
      const selected = i === this.choiceIndex;
      const bg = s.add.rectangle(x, top + i * 46, width, 40, selected ? 0x2b171a : 0x0d0a0b, 0.95).setOrigin(0);
      bg.setStrokeStyle(selected ? 2 : 1, selected ? 0xb99a58 : 0x3a2e2a, selected ? 0.9 : 0.8);
      const t = s.add.text(x + 20, top + i * 46 + 20, (selected ? '›  ' : '   ') + label, {
        fontFamily: FONT, fontSize: '17px', color: disabled ? '#5d5550' : selected ? HEX.paper : HEX.mute
      }).setOrigin(0, 0.5);
      bg.setScrollFactor(0);
      t.setScrollFactor(0);
      bg.setInteractive({ useHandCursor: !disabled });
      bg.on('pointerover', () => { if (this.choiceIndex !== i) { this.choiceIndex = i; this.renderChoices(); } });
      bg.on('pointerdown', () => this.pickChoice(i));
      this.choiceBox.add([bg, t]);
    });
    this.choiceBox.setVisible(true);
  }

  pickChoice(i) {
    const opt = this.options?.[i];
    if (!opt) return;
    if (typeof opt === 'object' && opt.disabled) {
      audio.sfx('ui_error');
      return;
    }
    audio.sfx('ui_ok');
    const resolve = this.choiceResolve;
    this.choiceResolve = null;
    this.options = null;
    this.choiceBox.setVisible(false);
    this.choiceBox.removeAll(true);
    if (!this.keepOpen) this.close();
    resolve(i);
  }

  update(delta, controls) {
    if (!this.active) return;
    if (this.options) {
      if (controls.pressed.up) { this.choiceIndex = (this.choiceIndex + this.options.length - 1) % this.options.length; audio.sfx('ui_move'); this.renderChoices(); }
      if (controls.pressed.down) { this.choiceIndex = (this.choiceIndex + 1) % this.options.length; audio.sfx('ui_move'); this.renderChoices(); }
      if (controls.pressed.interact || controls.pressed.confirm || controls.pressed.attack) this.pickChoice(this.choiceIndex);
      return;
    }
    if (!this.lines) return;
    const advance = controls.pressed.interact || controls.pressed.confirm || controls.pressed.attack;
    if (this.typing) {
      const cps = TEXT_CPS[settings.textSpeed] ?? 52;
      this.elapsed += delta;
      const target = cps === Infinity ? this.full.length : Math.floor(this.elapsed / 1000 * cps);
      if (advance || target >= this.full.length) {
        this.shown = this.full.length;
        this.typing = false;
        this.more.setVisible(true);
      } else if (target > this.shown) {
        if (Math.floor(target / 2) !== Math.floor(this.shown / 2) && this.full[target - 1] !== ' ') {
          audio.sfx('blip', { pitch: this.voice });
        }
        this.shown = target;
      }
      this.text.setText(this.full.slice(0, this.shown));
      return;
    }
    if (advance) this.next();
  }
}
