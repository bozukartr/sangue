// Runtime game state. Scenes read and mutate this single object; writing it
// to storage happens only at checkpoints so a death rolls everything back to
// the last save, pickups included.
import { STAGE, defaultSave, normalizeSave, readSave, writeSave, clearSave, chapterIndexForStage } from '../story.js';

export const ITEMS = Object.freeze({
  espresso: { name: 'Espresso', heal: 30, price: 1500, desc: 'Sert, sıcak ve acı. +30 can.' },
  panino: { name: 'Panino', heal: 60, price: 3000, desc: 'Tonino’nun mortadellalı panino’su. +60 can.' },
  ticket: { name: 'Otobüs bileti', heal: 0, price: 1000, desc: 'ATAC bileti. Keşfedilmiş duraklar arasında bir yolculuk.' }
});

export const EVIDENCE = Object.freeze({
  ledger: {
    name: 'Kırmızı hesap defteri',
    desc: 'Magazzino 17’den. Son sayfada babanın işaretiyle 31 numaralı bir teslimat: ödeme yok, yalnızca tarih.'
  },
  key31: {
    name: '31 numaralı anahtar',
    desc: 'Babanın paltosunun astarına dikilmiş. Pirinç etikette yalnızca 31 yazıyor.'
  },
  photo: {
    name: 'Eski fotoğraf',
    desc: 'Baban, Borge ve Cranier aynı masada. Arkasında: “Elena Bellini — Trastevere durağı”.'
  },
  manifest: {
    name: 'Civitavecchia sevkiyat dökümü',
    desc: '“Zeytinyağı, 40 varil.” Teslim alan imzalar A. ve C.; babanın adı ikisinin arasında çizilmiş.'
  },
  register: {
    name: 'Liman kayıt defteri',
    desc: '31 numaralı yük gümrüksüz geçmiş. Refakat aracı: koyu renk Alfa Romeo Alfetta, Questura plakası.'
  },
  statement: {
    name: 'Paolo Bianchi’nin ifadesi',
    desc: 'Babanın ölümünden bir gün önce Commissario Vitale’ye verdiği, hiç dosyalanmamış tanıklık. Alıcı: Giudice R. Ferri.'
  }
});

export const MEMENTOS = Object.freeze({
  lighter: { name: 'Babanın çakmağı', desc: 'Pirinç, ezik. “P.B. 1959”. Alçak geçidin altına düşmüş.' },
  tavla: { name: 'Tavla pulu', desc: 'Borge’un masasında tek bir siyah pul. Babam hep siyahla oynardı.' },
  report: { name: 'Okul karnesi', desc: 'Benim karnem, 1972. Kenarına babamın el yazısı: “Benden iyisi olacak.”' },
  seabook: { name: 'Gemici cüzdanı', desc: 'Paolo Bianchi, güverte tayfası, 1957. Civitavecchia’da, bir konteynerin üstünde unutulmuş.' },
  record68: { name: '1968 tutanağı', desc: 'Grev sırasında gözaltı. İmzalayan memur: R. Vitale. Birbirlerini çoktan tanıyorlarmış.' },
  wedding: { name: 'Düğün fotoğrafı', desc: 'Annemle babamın düğünü. Sağdıç Monte Cranier. Gülüyorlar.' }
});

export const STOPS = Object.freeze({
  trastevere: { name: 'Trastevere', scene: 'rome', entry: 'bus', x: 0.12, y: 0.62 },
  questura: { name: 'Questura Centrale', scene: 'questura', entry: 'start', x: 0.52, y: 0.4 },
  montemario: { name: 'Monte Mario', scene: 'villa', entry: 'start', x: 0.28, y: 0.18 },
  civitavecchia: { name: 'Civitavecchia', scene: 'port', entry: 'start', x: 0.86, y: 0.78 }
});

class GameState {
  constructor() {
    this.data = defaultSave();
    this.shownChapter = -1;
    this.sessionStart = Date.now();
  }

  newGame() {
    clearSave();
    this.data = defaultSave();
    this.shownChapter = -1;
    this.sessionStart = Date.now();
  }

  hasSave() {
    return Boolean(readSave());
  }

  loadFromStorage() {
    const save = readSave();
    this.data = save || defaultSave();
    this.shownChapter = -1;
    this.sessionStart = Date.now();
    return Boolean(save);
  }

  load(raw) {
    this.data = normalizeSave(raw) || defaultSave();
    this.sessionStart = Date.now();
  }

  save(scene, extra = {}) {
    this.flushTime();
    this.data = writeSave({ ...this.data, scene, ...extra });
    return this.data;
  }

  flushTime() {
    const now = Date.now();
    this.data.stats.time += Math.round((now - this.sessionStart) / 1000);
    this.sessionStart = now;
  }

  get stage() { return this.data.stage; }
  set stage(value) { this.data.stage = value; }

  chapterIndex() { return chapterIndexForStage(this.data.stage); }

  flag(name) { return Boolean(this.data.flags[name]); }
  setFlag(name, value = true) { this.data.flags[name] = value; }

  hasEvidence(id) { return this.data.evidence.includes(id); }
  addEvidence(id) {
    if (this.hasEvidence(id)) return false;
    this.data.evidence.push(id);
    return true;
  }

  hasMemento(id) { return this.data.mementos.includes(id); }
  addMemento(id) {
    if (this.hasMemento(id)) return false;
    this.data.mementos.push(id);
    return true;
  }

  addMoney(amount) {
    this.data.money = Math.max(0, this.data.money + Math.round(amount));
  }

  addRep(amount) {
    this.data.rep = Math.max(0, Math.min(100, this.data.rep + amount));
  }

  price(base) {
    // Neighbours who respect Gianlico give him the house price.
    return this.data.rep >= 70 ? Math.round(base * 0.8 / 100) * 100 : base;
  }

  itemCount(id) { return this.data.items[id] || 0; }
  addItem(id, count = 1) { this.data.items[id] = Math.max(0, this.itemCount(id) + count); }

  unlockStop(id) {
    if (!this.data.stops.includes(id)) this.data.stops.push(id);
  }

  // The destination the story currently needs; buses there are free.
  storyStop() {
    const stage = this.data.stage;
    if (stage === STAGE.TRAVEL_PORT) return 'civitavecchia';
    if (stage === STAGE.INFILTRATE_QUESTURA) return 'questura';
    if (stage === STAGE.TRAVEL_VILLA) return 'montemario';
    return null;
  }
}

export const state = new GameState();

export function formatLira(value) {
  return '₤ ' + Math.round(value).toLocaleString('it-IT');
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0');
}
