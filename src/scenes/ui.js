// Shared UI pieces for menus and overlays.
import { GAME_W, GAME_H, FONT, HEX } from '../config.js';
import { audio } from '../core/audio.js';
import { settings, saveSettings, TEXT_SPEEDS } from '../core/settings.js';

// Vertical list of options driven by Controls. Items: { label, action, disabled, detail }.
export class MenuList {
  constructor(scene, x, y, items, opts = {}) {
    this.scene = scene;
    this.items = items;
    this.index = items.findIndex((i) => !i.disabled);
    if (this.index < 0) this.index = 0;
    this.spacing = opts.spacing ?? 56;
    this.size = opts.size ?? '24px';
    this.x = x;
    this.y = y;
    this.depth = opts.depth ?? 10;
    this.align = opts.align ?? 'left';
    this.texts = items.map((item, i) => {
      const t = scene.add.text(x, y + i * this.spacing, item.label, {
        fontFamily: FONT, fontStyle: 'bold', fontSize: this.size, color: HEX.mute,
        padding: { x: 12, y: 7 }
      }).setOrigin(this.align === 'center' ? 0.5 : 0, 0.5).setDepth(this.depth).setScrollFactor(0);
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (!item.disabled && this.index !== i) { this.index = i; audio.sfx('ui_move'); this.refresh(); } });
      t.on('pointerdown', () => { if (!item.disabled) { this.index = i; this.activate(); } });
      return t;
    });
    this.cursor = scene.add.text(0, 0, '›', {
      fontFamily: FONT, fontStyle: 'bold', fontSize: this.size, color: '#c0393d'
    }).setOrigin(0.5).setDepth(this.depth).setScrollFactor(0);
    this.refresh();
  }

  refresh() {
    this.texts.forEach((t, i) => {
      const item = this.items[i];
      const selected = i === this.index;
      t.setText(item.label);
      t.setColor(item.disabled ? '#4f4846' : selected ? HEX.paper : HEX.mute);
      t.setBackgroundColor(selected && !item.disabled ? '#2b171acc' : '#00000000');
    });
    const t = this.texts[this.index];
    if (t) {
      const left = this.align === 'center' ? t.x - t.width / 2 : t.x;
      this.cursor.setPosition(left - 14, t.y).setVisible(!this.items[this.index].disabled);
    }
  }

  move(dir) {
    let next = this.index;
    for (let n = 0; n < this.items.length; n++) {
      next = (next + dir + this.items.length) % this.items.length;
      if (!this.items[next].disabled) break;
    }
    if (next !== this.index) {
      this.index = next;
      audio.sfx('ui_move');
      this.refresh();
    }
  }

  activate() {
    const item = this.items[this.index];
    if (!item || item.disabled) { audio.sfx('ui_error'); return; }
    audio.sfx('ui_ok');
    item.action?.();
  }

  update(controls) {
    if (controls.pressed.up) this.move(-1);
    if (controls.pressed.down) this.move(1);
    if (controls.pressed.confirm) this.activate();
  }

  setVisible(on) {
    this.texts.forEach((t) => t.setVisible(on));
    this.cursor.setVisible(on && !this.items[this.index]?.disabled);
  }

  destroy() {
    this.texts.forEach((t) => t.destroy());
    this.cursor.destroy();
  }
}

export function panel(scene, x, y, w, h, depth = 5) {
  const r = scene.add.rectangle(x, y, w, h, 0x0d0a0b, 0.96).setDepth(depth).setScrollFactor(0);
  r.setStrokeStyle(2, 0x6b1f22, 0.9);
  return r;
}

export function dim(scene, alpha = 0.72, depth = 0) {
  return scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x070505, alpha).setOrigin(0).setDepth(depth).setScrollFactor(0);
}

// Settings editor: up/down selects a row, left/right changes it.
export class SettingsPanel {
  constructor(scene, x, y, depth = 20) {
    this.scene = scene;
    this.rows = [
      { label: 'Ana ses', key: 'master', type: 'volume' },
      { label: 'Müzik', key: 'music', type: 'volume' },
      { label: 'Efektler', key: 'sfx', type: 'volume' },
      { label: 'Metin hızı', key: 'textSpeed', type: 'speed' },
      { label: 'Yağmur', key: 'rain', type: 'bool' },
      { label: 'Scanline', key: 'scanlines', type: 'bool' },
      { label: 'Ekran sarsıntısı', key: 'shake', type: 'bool' }
    ];
    this.index = 0;
    this.objects = [];
    this.labels = this.rows.map((row, i) => {
      const l = scene.add.text(x, y + i * 44, row.label, { fontFamily: FONT, fontSize: '18px', color: HEX.mute })
        .setOrigin(0, 0.5).setDepth(depth).setScrollFactor(0);
      const v = scene.add.text(x + 300, y + i * 44, '', { fontFamily: FONT, fontStyle: 'bold', fontSize: '18px', color: HEX.cream })
        .setOrigin(0, 0.5).setDepth(depth).setScrollFactor(0);
      l.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.index = i; this.change(1); });
      v.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.index = i; this.change(1); });
      this.objects.push(l, v);
      return { l, v };
    });
    this.help = scene.add.text(x, y + this.rows.length * 44 + 16, '↑/↓ seç  ·  ←/→ değiştir  ·  ESC geri', {
      fontFamily: FONT, fontSize: '12px', color: HEX.dim
    }).setDepth(depth).setScrollFactor(0);
    this.objects.push(this.help);
    this.refresh();
  }

  value(row) {
    const v = settings[row.key];
    if (row.type === 'volume') return '█'.repeat(Math.round(v * 10)).padEnd(10, '░') + '  ' + Math.round(v * 100) + '%';
    if (row.type === 'speed') return '‹ ' + TEXT_SPEEDS[v] + ' ›';
    return v ? 'AÇIK' : 'KAPALI';
  }

  refresh() {
    this.labels.forEach(({ l, v }, i) => {
      const selected = i === this.index;
      l.setColor(selected ? HEX.paper : HEX.mute).setText((selected ? '› ' : '  ') + this.rows[i].label);
      v.setText(this.value(this.rows[i])).setColor(selected ? HEX.gold : HEX.cream);
    });
  }

  change(dir) {
    const row = this.rows[this.index];
    if (row.type === 'volume') settings[row.key] = Math.round(Phaser.Math.Clamp(settings[row.key] + dir * 0.1, 0, 1) * 10) / 10;
    else if (row.type === 'speed') settings[row.key] = (settings[row.key] + dir + TEXT_SPEEDS.length) % TEXT_SPEEDS.length;
    else settings[row.key] = !settings[row.key];
    saveSettings();
    audio.sfx('ui_move');
    this.refresh();
  }

  update(controls) {
    if (controls.pressed.up) { this.index = (this.index + this.rows.length - 1) % this.rows.length; audio.sfx('ui_move'); this.refresh(); }
    if (controls.pressed.down) { this.index = (this.index + 1) % this.rows.length; audio.sfx('ui_move'); this.refresh(); }
    if (controls.pressed.left) this.change(-1);
    if (controls.pressed.right) this.change(1);
    if (controls.pressed.interact || (controls.pressed.confirm && !controls.pressed.jump)) this.change(1);
  }

  destroy() {
    this.objects.forEach((o) => o.destroy());
  }
}

export const CONTROLS_TEXT = [
  ['A / D  ·  ← / →', 'Yürü'],
  ['SPACE / W', 'Zıpla (basılı tut: daha yükseğe)'],
  ['S / ↓', 'Çömel · gizlen · alçak geçitler'],
  ['S + SPACE', 'İnce platformdan aşağı in'],
  ['J / F', 'Yumruk (3’lü kombo) · arkadan: sessiz etkisiz bırak'],
  ['SHIFT / K', 'Kaçın (anlık dokunulmazlık)'],
  ['E', 'Etkileşim · konuş · incele'],
  ['Q', 'Espresso / panino ile iyileş'],
  ['TAB / I', 'Günlük: kanıtlar, anılar, çanta, kişiler'],
  ['ESC / P', 'Duraklat'],
  ['Gamepad', 'A zıpla · X vur · B kaç · Y etkileşim · LB iyileş']
];
