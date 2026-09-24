// Procedural audio: every sound effect, ambience bed and music cue is
// synthesised with WebAudio at runtime, so the game ships with no audio files.
//
// Music is an adaptive step sequencer. Each cue is a short loop of chords,
// bass, a lead line and percussion; changing cue crossfades between loops, and
// world scenes switch cues when enemies become alert.
import { settings, onSettingsChange } from './settings.js';

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

function midi(name) {
  const match = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!match) return 60;
  return 12 * (Number(match[2]) + 1) + NOTE[match[1]];
}

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Chords are root + intervals; bass plays the root an octave down.
const CHORD = {
  m: [0, 3, 7, 10],
  M: [0, 4, 7, 11],
  d7: [0, 4, 7, 10],
  dim: [0, 3, 6, 9],
  sus: [0, 5, 7, 10]
};

function chord(root, type) {
  return { root: midi(root), notes: CHORD[type].map((i) => midi(root) + i) };
}

// Each cue: bpm, 16-step bars, chord per bar, patterns (step arrays of
// scale-degree offsets relative to the chord, null = rest).
const CUES = {
  menu: {
    bpm: 66,
    chords: [chord('D3', 'm'), chord('A#2', 'M'), chord('G2', 'm'), chord('A2', 'd7')],
    pad: 0.07, bass: [0, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null],
    lead: [2, null, null, 1, null, null, 3, null, null, null, 2, null, null, 1, null, null],
    leadOctave: 2, leadWave: 'triangle', mandolin: true, drums: null
  },
  street: {
    bpm: 84,
    chords: [chord('A2', 'm'), chord('F2', 'M'), chord('D3', 'm'), chord('E2', 'd7')],
    pad: 0.045,
    bass: [0, null, 2, null, 1, null, 2, null, 0, null, 2, null, 3, null, 2, null],
    lead: [null, null, null, null, 3, null, 2, null, null, null, null, 1, null, null, null, null],
    leadOctave: 2, leadWave: 'triangle', drums: 'brush'
  },
  interior: {
    bpm: 72,
    chords: [chord('F2', 'M'), chord('D3', 'm'), chord('A#2', 'M'), chord('C3', 'd7')],
    pad: 0.05,
    bass: [0, null, null, null, 2, null, null, null, 0, null, null, null, 2, null, 1, null],
    lead: [1, null, 2, null, 3, null, null, null, 2, null, 1, null, null, null, null, null],
    leadOctave: 2, leadWave: 'sine', mandolin: true, drums: null
  },
  stealth: {
    bpm: 96,
    chords: [chord('E2', 'm'), chord('E2', 'm'), chord('C3', 'M'), chord('B2', 'dim')],
    pad: 0.04,
    bass: [0, null, null, 0, null, null, 0, null, 0, null, null, 0, null, null, 1, null],
    lead: [null, null, null, null, null, null, null, null, 3, null, null, null, null, null, null, null],
    leadOctave: 3, leadWave: 'sine', drums: 'tick'
  },
  combat: {
    bpm: 138,
    chords: [chord('E2', 'm'), chord('C3', 'M'), chord('D3', 'M'), chord('B2', 'd7')],
    pad: 0.035,
    bass: [0, 0, null, 0, 2, null, 0, 1, 0, 0, null, 0, 3, null, 2, 1],
    lead: [0, null, 1, null, 2, null, 1, null, 3, null, 2, null, 1, null, 0, null],
    leadOctave: 2, leadWave: 'square', drums: 'drive'
  },
  boss: {
    bpm: 150,
    chords: [chord('D3', 'm'), chord('A#2', 'M'), chord('C#3', 'dim'), chord('A2', 'd7')],
    pad: 0.04,
    bass: [0, 0, 0, null, 0, 0, 2, null, 0, 0, 0, null, 3, 2, 1, null],
    lead: [3, null, 2, null, 3, null, 1, null, 2, null, 1, null, 0, null, 1, null],
    leadOctave: 2, leadWave: 'sawtooth', drums: 'drive'
  },
  sorrow: {
    bpm: 60,
    chords: [chord('A2', 'm'), chord('F2', 'M'), chord('C3', 'M'), chord('G2', 'M')],
    pad: 0.07, bass: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    lead: [2, null, null, null, 1, null, null, null, 3, null, null, 2, null, null, null, null],
    leadOctave: 2, leadWave: 'triangle', mandolin: true, drums: null
  },
  dawn: {
    bpm: 70,
    chords: [chord('F2', 'M'), chord('C3', 'M'), chord('D3', 'm'), chord('A#2', 'M')],
    pad: 0.07, bass: [0, null, null, null, null, null, null, null, 2, null, null, null, null, null, null, null],
    lead: [0, null, 1, null, 2, null, 3, null, 2, null, null, null, 1, null, null, null],
    leadOctave: 2, leadWave: 'triangle', mandolin: true, drums: null
  }
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.cue = null;
    this.pendingCue = null;
    this.ambience = new Map();
    this.step = 0;
    this.nextStepTime = 0;
    this.timer = null;
    this.muffled = false;
    onSettingsChange(() => this.applyVolumes());
  }

  // Browsers only allow audio after a user gesture; the first key or click
  // anywhere unlocks the context.
  installUnlock() {
    const unlock = () => {
      this.ensure();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    };
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('gamepadconnected', unlock, { passive: true });
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 4;
    this.master.connect(this.comp).connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 18000;
    this.musicBus.connect(this.musicFilter).connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.ambBus = ctx.createGain();
    this.ambBus.connect(this.master);

    // A short feedback delay gives the lead instruments a wet, late-night room.
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = 0.32;
    this.delayGain = ctx.createGain();
    this.delayGain.gain.value = 0.28;
    this.delay.connect(this.delayGain).connect(this.delay);
    this.delayGain.connect(this.musicBus);

    this.noiseBuffer = this.makeNoise(2);
    this.applyVolumes();

    this.timer = setInterval(() => this.schedule(), 25);
    if (this.pendingCue) {
      const cue = this.pendingCue;
      this.pendingCue = null;
      this.music(cue);
    }
    this.ambience.forEach((entry, name) => { if (!entry.node) this.startAmbience(name, entry.level); });
    return ctx;
  }

  makeNoise(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(settings.master, t, 0.05);
    this.musicBus.gain.setTargetAtTime(settings.music * 0.9, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(settings.sfx, t, 0.05);
    this.ambBus.gain.setTargetAtTime(settings.sfx * 0.8, t, 0.05);
  }

  // Pause menus and dialogue dull the music instead of stopping it.
  muffle(on) {
    this.muffled = on;
    if (!this.ctx) return;
    this.musicFilter.frequency.setTargetAtTime(on ? 900 : 18000, this.ctx.currentTime, 0.12);
  }

  // ---------------------------------------------------------------- music

  music(name) {
    if (!CUES[name] && name !== null) return;
    if (!this.ctx) { this.pendingCue = name; return; }
    if (this.cue && this.cue.name === name) return;
    const t = this.ctx.currentTime;
    if (this.cue) {
      const old = this.cue.gain;
      old.gain.cancelScheduledValues(t);
      old.gain.setValueAtTime(old.gain.value, t);
      old.gain.linearRampToValueAtTime(0, t + 1.2);
      setTimeout(() => old.disconnect(), 1500);
    }
    if (!name) { this.cue = null; return; }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 1.2);
    gain.connect(this.musicBus);
    this.cue = { name, def: CUES[name], gain };
    this.step = 0;
    this.nextStepTime = t + 0.05;
  }

  schedule() {
    if (!this.ctx || !this.cue || this.ctx.state !== 'running') return;
    const { def } = this.cue;
    const stepDur = 60 / def.bpm / 4;
    // After a long tab switch, skip ahead instead of firing a burst of notes.
    if (this.nextStepTime < this.ctx.currentTime - 0.2) this.nextStepTime = this.ctx.currentTime + 0.05;
    while (this.nextStepTime < this.ctx.currentTime + 0.12) {
      this.playStep(def, this.step, this.nextStepTime, stepDur);
      this.step = (this.step + 1) % (16 * def.chords.length);
      this.nextStepTime += stepDur;
    }
  }

  playStep(def, step, time, stepDur) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const ch = def.chords[bar % def.chords.length];
    const out = this.cue.gain;

    if (s === 0) {
      ch.notes.forEach((n, i) => this.pad(freq(n + 12), time, stepDur * 16, def.pad, out, i));
    }
    const b = def.bass[s];
    if (b !== null && b !== undefined) {
      this.pluck(freq(ch.notes[b % ch.notes.length] - 12), time, stepDur * 1.8, 0.16, out, 'triangle', 900);
    }
    const l = def.lead[s];
    if (l !== null && l !== undefined) {
      const f = freq(ch.notes[l % ch.notes.length] + 12 * (def.leadOctave - 1));
      if (def.mandolin) this.mandolin(f, time, stepDur * 3, out);
      else this.pluck(f, time, stepDur * 2.5, def.leadWave === 'square' || def.leadWave === 'sawtooth' ? 0.035 : 0.07,
        out, def.leadWave, 2600, true);
    }

    if (def.drums === 'brush') {
      if (s % 4 === 2) this.noiseHit(time, 0.09, 0.035, 5000, 'highpass', out);
      if (s === 0 || s === 8) this.kick(time, 0.25, out);
    } else if (def.drums === 'tick') {
      if (s % 2 === 0) this.noiseHit(time, 0.03, 0.03, 8000, 'highpass', out);
      if (s === 0) this.kick(time, 0.3, out);
    } else if (def.drums === 'drive') {
      if (s % 4 === 0) this.kick(time, 0.45, out);
      if (s % 8 === 4) this.noiseHit(time, 0.14, 0.12, 1800, 'bandpass', out);
      if (s % 2 === 1) this.noiseHit(time, 0.03, 0.04, 9000, 'highpass', out);
    }
  }

  pad(f, time, dur, level, out, i) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(level, time + dur * 0.3);
    g.gain.linearRampToValueAtTime(level * 0.6, time + dur * 0.85);
    g.gain.linearRampToValueAtTime(0, time + dur);
    filter.connect(g).connect(out);
    [-6, 6].forEach((detune) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = detune + i;
      o.connect(filter);
      o.start(time);
      o.stop(time + dur + 0.05);
    });
  }

  pluck(f, time, dur, level, out, wave = 'triangle', cutoff = 2000, send = false) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    o.type = wave;
    o.frequency.value = f;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff * 0.25), time + dur);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(level, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(filter).connect(g).connect(out);
    if (send) g.connect(this.delay);
    o.start(time);
    o.stop(time + dur + 0.05);
  }

  // Tremolo-picked plucks: a quick nod to the Roman mandolin.
  mandolin(f, time, dur, out) {
    const hits = Math.max(2, Math.floor(dur / 0.07));
    for (let i = 0; i < hits; i++) {
      const t = time + i * 0.07;
      const level = 0.055 * (1 - i / hits * 0.6);
      this.pluck(f, t, 0.12, level, out, 'triangle', 3200, i === 0);
    }
  }

  kick(time, level, out) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    o.connect(g).connect(out);
    o.start(time);
    o.stop(time + 0.25);
  }

  noiseHit(time, dur, level, cutoff, type, out) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter).connect(g).connect(out);
    src.start(time, Math.random() * 1.5);
    src.stop(time + dur + 0.02);
  }

  tone(f, dur, level, wave = 'sine', slideTo = null, delay = 0) {
    const ctx = this.ctx;
    const time = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f, time);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, time + dur);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(level, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g).connect(this.sfxBus);
    o.start(time);
    o.stop(time + dur + 0.05);
  }

  noise(dur, level, cutoff, type = 'lowpass', delay = 0, sweepTo = null) {
    const ctx = this.ctx;
    const time = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(cutoff, time);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, time + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter).connect(g).connect(this.sfxBus);
    src.start(time, Math.random() * 1.5);
    src.stop(time + dur + 0.05);
  }

  // ---------------------------------------------------------------- sfx

  sfx(name, opts = {}) {
    if (!this.ensure() || this.ctx.state !== 'running') return;
    const r = () => 0.92 + Math.random() * 0.16;
    switch (name) {
      case 'step': this.noise(0.05, 0.08 * (opts.level ?? 1), 700 * r(), 'lowpass'); break;
      case 'jump': this.noise(0.12, 0.08, 1200, 'bandpass', 0, 2600); break;
      case 'land': this.noise(0.1, 0.16, 500, 'lowpass'); this.tone(90, 0.08, 0.1, 'sine', 50); break;
      case 'whoosh': this.noise(0.14, 0.11, 900 * r(), 'bandpass', 0, 3500); break;
      case 'dash': this.noise(0.22, 0.12, 600, 'bandpass', 0, 4000); break;
      case 'hit':
        this.tone(160 * r(), 0.12, 0.35, 'sine', 50);
        this.noise(0.09, 0.3, 2200, 'lowpass');
        break;
      case 'heavy':
        this.tone(110, 0.2, 0.45, 'sine', 35);
        this.noise(0.16, 0.35, 1600, 'lowpass');
        break;
      case 'hurt':
        this.tone(220, 0.18, 0.18, 'sawtooth', 110);
        this.noise(0.12, 0.25, 1400, 'lowpass');
        break;
      case 'ko': this.tone(180, 0.4, 0.2, 'triangle', 60); this.noise(0.25, 0.25, 400, 'lowpass', 0.12); break;
      case 'takedown':
        this.noise(0.08, 0.3, 1200, 'lowpass');
        this.tone(95, 0.3, 0.4, 'sine', 40, 0.05);
        break;
      case 'block': this.tone(900, 0.06, 0.1, 'square', 400); break;
      case 'pickup':
        this.tone(660, 0.12, 0.12, 'triangle');
        this.tone(990, 0.2, 0.1, 'triangle', null, 0.08);
        break;
      case 'coin':
        this.tone(1320, 0.08, 0.08, 'square');
        this.tone(1760, 0.18, 0.07, 'square', null, 0.06);
        break;
      case 'evidence':
        [0, 3, 7, 12].forEach((n, i) => this.tone(freq(57 + n), 0.9, 0.07, 'triangle', null, i * 0.07));
        break;
      case 'memento':
        [0, 4, 7, 11, 14].forEach((n, i) => this.tone(freq(62 + n), 1.2, 0.06, 'sine', null, i * 0.11));
        break;
      case 'objective':
        this.tone(freq(69), 0.25, 0.08, 'triangle');
        this.tone(freq(76), 0.4, 0.08, 'triangle', null, 0.12);
        break;
      case 'ui_move': this.tone(520, 0.05, 0.06, 'square', 480); break;
      case 'ui_ok': this.tone(660, 0.07, 0.08, 'square'); this.tone(880, 0.1, 0.07, 'square', null, 0.05); break;
      case 'ui_back': this.tone(440, 0.09, 0.07, 'square', 300); break;
      case 'ui_error': this.tone(140, 0.2, 0.12, 'square'); break;
      case 'blip': this.tone((opts.pitch || 320) * r(), 0.035, 0.035, 'square'); break;
      case 'door':
        this.noise(0.25, 0.15, 400, 'lowpass');
        this.tone(70, 0.3, 0.2, 'sine', 45, 0.1);
        break;
      case 'alert':
        this.tone(880, 0.12, 0.14, 'square');
        this.tone(1320, 0.25, 0.12, 'square', null, 0.1);
        break;
      case 'suspicious': this.tone(440, 0.15, 0.06, 'triangle', 620); break;
      case 'caught': [0, -1, -5].forEach((n, i) => this.tone(freq(52 + n), 0.5, 0.12, 'sawtooth', null, i * 0.16)); break;
      case 'gun':
        this.noise(0.3, 0.5, 3000, 'lowpass', 0, 200);
        this.tone(120, 0.2, 0.4, 'square', 40);
        break;
      case 'aim': this.tone(1800, 0.08, 0.03, 'sine'); break;
      case 'reload':
        this.tone(1200, 0.03, 0.08, 'square');
        this.tone(700, 0.04, 0.08, 'square', null, 0.15);
        break;
      case 'thunder':
        this.noise(2.6, 0.45, 180, 'lowpass', 0, 60);
        this.noise(0.6, 0.25, 900, 'lowpass', 0.05, 120);
        break;
      case 'bus':
        this.tone(55, 1.6, 0.18, 'sawtooth', 70);
        this.noise(1.6, 0.12, 300, 'lowpass');
        break;
      case 'switch': this.tone(300, 0.05, 0.12, 'square'); this.noise(0.05, 0.12, 3000, 'highpass', 0.02); break;
      case 'alarm':
        for (let i = 0; i < 4; i++) this.tone(i % 2 ? 660 : 880, 0.28, 0.07, 'square', null, i * 0.3);
        break;
      case 'heal':
        this.tone(freq(64), 0.2, 0.08, 'sine');
        this.tone(freq(71), 0.35, 0.08, 'sine', null, 0.1);
        break;
      case 'death':
        [0, -3, -7, -12].forEach((n, i) => this.tone(freq(45 + n), 0.8, 0.12, 'triangle', null, i * 0.22));
        break;
      case 'typewriter': this.noise(0.03, 0.2, 3000, 'bandpass'); break;
      default: break;
    }
  }

  // ------------------------------------------------------------ ambience

  setAmbience(levels) {
    // levels: { rain: 0..1, room: 0..1, sea: 0..1, crickets: 0..1 }
    const names = ['rain', 'room', 'sea', 'crickets', 'alarm'];
    names.forEach((name) => {
      const level = levels[name] || 0;
      const entry = this.ambience.get(name);
      if (!entry && level > 0) {
        this.ambience.set(name, { level, node: null });
        if (this.ctx) this.startAmbience(name, level);
      } else if (entry) {
        entry.level = level;
        if (entry.node && this.ctx) entry.node.gain.gain.setTargetAtTime(level * entry.node.scale, this.ctx.currentTime, 0.6);
      }
    });
  }

  startAmbience(name, level) {
    const ctx = this.ctx;
    const entry = this.ambience.get(name);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.ambBus);
    let scale = 1;
    const sources = [];

    if (name === 'rain' || name === 'room' || name === 'sea') {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      if (name === 'rain') { filter.type = 'highpass'; filter.frequency.value = 1400; scale = 0.09; }
      if (name === 'room') { filter.type = 'lowpass'; filter.frequency.value = 220; scale = 0.12; }
      if (name === 'sea') { filter.type = 'lowpass'; filter.frequency.value = 500; scale = 0.16; }
      src.connect(filter).connect(gain);
      if (name === 'sea') {
        // Slow swell for waves against the quay.
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.12;
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain).connect(filter.frequency);
        lfo.start();
        sources.push(lfo);
      }
      src.start();
      sources.push(src);
    } else if (name === 'crickets') {
      scale = 0.02;
      const o = ctx.createOscillator();
      o.frequency.value = 4200;
      const am = ctx.createGain();
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 14;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;
      am.gain.value = 0.5;
      lfo.connect(lfoGain).connect(am.gain);
      o.connect(am).connect(gain);
      o.start();
      lfo.start();
      sources.push(o, lfo);
    } else if (name === 'alarm') {
      scale = 0.05;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = 740;
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain).connect(o.frequency);
      o.connect(gain);
      o.start();
      lfo.start();
      sources.push(o, lfo);
    }
    gain.gain.setTargetAtTime(level * scale, ctx.currentTime, 0.8);
    entry.node = { gain, scale, sources };
  }

  get currentCue() { return this.cue ? this.cue.name : this.pendingCue; }
}

export const audio = new AudioEngine();
