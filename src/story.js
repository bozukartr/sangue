// Story progression, chapter boundaries and the save-data format.
//
// Stage numbers are persisted in player saves. Existing numbers never change
// meaning; new beats are appended. Stage 3 is intentionally unused (v1 saves
// used it for "ledger returned" and are migrated to GO_HOME).

export const SAVE_KEY = 'sangue-save-v1';
export const SAVE_VERSION = 3;

export const STAGE = Object.freeze({
  FIND_BORGE: 0,
  FIND_LEDGER: 1,
  RETURN_LEDGER: 2,
  GO_HOME: 4,
  SEARCH_COAT: 5,
  SEARCH_DESK: 6,
  MEET_ELENA: 7,
  QUESTION_BORGE: 8,
  OPEN_CABINET: 9,
  SHOW_MANIFEST: 10,
  TRAVEL_PORT: 11,
  INFILTRATE_PORT: 12,
  ASK_ELENA_CAR: 13,
  CONFRONT_BORGE: 14,
  INFILTRATE_QUESTURA: 15,
  ESCAPE_QUESTURA: 16,
  SHOW_STATEMENT: 17,
  TRAVEL_VILLA: 18,
  INFILTRATE_VILLA: 19,
  DEFEAT_VITALE: 20,
  CONFRONT_CRANIER: 21,
  COMPLETE: 22
});

const OBJECTIVES = {
  [STAGE.FIND_BORGE]: 'Borge’u bul · Bar Arisel',
  [STAGE.FIND_LEDGER]: 'Magazzino 17’den kırmızı defteri al',
  [STAGE.RETURN_LEDGER]: 'Defteri Borge’a götür · Bar Arisel',
  [STAGE.GO_HOME]: 'Bianchi dairesine dön',
  [STAGE.SEARCH_COAT]: 'Babanın paltosunu incele',
  [STAGE.SEARCH_DESK]: 'Çalışma masasını araştır',
  [STAGE.MEET_ELENA]: 'Elena’yı durakta bul',
  [STAGE.QUESTION_BORGE]: 'Borge’a o geceyi sor · Bar Arisel',
  [STAGE.OPEN_CABINET]: 'Magazzino 17’de 31 numaralı dolabı aç',
  [STAGE.SHOW_MANIFEST]: 'Sevkiyat dökümünü Borge’a göster',
  [STAGE.TRAVEL_PORT]: 'Elena’nın durağından Civitavecchia’ya git',
  [STAGE.INFILTRATE_PORT]: 'Liman ofisine sız · kayıt defterini bul',
  [STAGE.ASK_ELENA_CAR]: 'Elena’ya o geceki arabayı sor',
  [STAGE.CONFRONT_BORGE]: 'Borge’a Alfetta’nın sahibini sor',
  [STAGE.INFILTRATE_QUESTURA]: 'Questura arşivine gir · Vitale’nin ofisi',
  [STAGE.ESCAPE_QUESTURA]: 'Alarm! Yangın merdiveninden kaç',
  [STAGE.SHOW_STATEMENT]: 'İfadeyi Borge’a götür · Bar Arisel',
  [STAGE.TRAVEL_VILLA]: 'Duraktan Monte Mario’ya git',
  [STAGE.INFILTRATE_VILLA]: 'Villa Cranier’in bahçesinden geç',
  [STAGE.DEFEAT_VITALE]: 'Vitale’yi durdur',
  [STAGE.CONFRONT_CRANIER]: 'Cranier’in çalışma odasına gir',
  [STAGE.COMPLETE]: 'Son'
};

export const CHAPTERS = Object.freeze([
  { from: STAGE.FIND_BORGE, number: 'CAPITOLO I', title: 'IL PRIMO PASSO' },
  { from: STAGE.GO_HOME, number: 'CAPITOLO II', title: 'LA STANZA VUOTA' },
  { from: STAGE.OPEN_CABINET, number: 'CAPITOLO III', title: 'IL NUMERO 31' },
  { from: STAGE.TRAVEL_PORT, number: 'CAPITOLO IV', title: 'IL PORTO' },
  { from: STAGE.CONFRONT_BORGE, number: 'CAPITOLO V', title: 'IL COMMISSARIO' },
  { from: STAGE.TRAVEL_VILLA, number: 'CAPITOLO VI', title: 'SANGUE' }
]);

export function objectiveForStage(stage) {
  return OBJECTIVES[stage] || OBJECTIVES[STAGE.FIND_BORGE];
}

export function chapterIndexForStage(stage) {
  let index = 0;
  CHAPTERS.forEach((chapter, i) => { if (stage >= chapter.from) index = i; });
  return index;
}

export function chapterForStage(stage) {
  return CHAPTERS[chapterIndexForStage(stage)];
}

// Scenes that may be resumed directly from a save. Anything else (menus,
// cut-scenes) resumes on the Trastevere street.
const RESUMABLE = ['rome', 'apartment', 'bar', 'port', 'questura', 'villa'];

export const EVIDENCE_IDS = ['ledger', 'key31', 'photo', 'manifest', 'register', 'statement'];
export const MEMENTO_IDS = ['lighter', 'tavla', 'report', 'seabook', 'record68', 'wedding'];

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    stage: STAGE.FIND_BORGE,
    scene: 'rome',
    entry: 'start',
    x: null,
    health: 100,
    maxHealth: 100,
    money: 8000,
    rep: 50,
    items: { espresso: 1, panino: 0, ticket: 0 },
    evidence: [],
    mementos: [],
    flags: {},
    stops: ['trastevere'],
    stats: { time: 0, kos: 0, takedowns: 0, detections: 0, deaths: 0 },
    ending: null
  };
}

const clampInt = (value, min, max, fallback) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;

// Accepts v1 (Capitolo I), v2 (Capitolo II–III) and v3 saves.
export function normalizeSave(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const base = defaultSave();

  let stage;
  if (Number.isInteger(raw.stage)) stage = raw.stage;
  else if (Number.isInteger(raw.missionStage)) stage = raw.missionStage;
  else stage = STAGE.FIND_BORGE;
  // Stage 3 in v1 meant the ledger mission was complete. It now leads home.
  if (stage === 3) stage = STAGE.GO_HOME;
  stage = clampInt(stage, 0, STAGE.COMPLETE, 0);

  const evidence = new Set(Array.isArray(raw.evidence)
    ? raw.evidence.filter((id) => EVIDENCE_IDS.includes(id)) : []);
  if (raw.hasLedger || stage >= STAGE.RETURN_LEDGER) evidence.add('ledger');

  let scene = RESUMABLE.includes(raw.scene) ? raw.scene : 'rome';
  let x = Number.isFinite(raw.x) ? raw.x : null;
  if (raw.version !== SAVE_VERSION) {
    // v1/v2 stored the street position as playerX and the room position as
    // apartmentX. Older apartment saves outside the Capitolo II search loop
    // resume on the street, as they did before.
    const apartmentStage = stage >= STAGE.SEARCH_COAT && stage <= STAGE.MEET_ELENA;
    if (scene === 'apartment' && !apartmentStage) scene = 'rome';
    x = scene === 'apartment' ? raw.apartmentX : raw.playerX;
    if (!Number.isFinite(x)) x = null;
  }

  const items = { ...base.items };
  if (raw.items && typeof raw.items === 'object') {
    Object.keys(items).forEach((key) => { items[key] = clampInt(raw.items[key], 0, 99, items[key]); });
  }
  const stats = { ...base.stats };
  if (raw.stats && typeof raw.stats === 'object') {
    Object.keys(stats).forEach((key) => { stats[key] = Math.max(0, Number(raw.stats[key]) || 0); });
  }

  const maxHealth = clampInt(raw.maxHealth, 50, 200, base.maxHealth);
  return {
    ...base,
    stage,
    scene,
    entry: typeof raw.entry === 'string' ? raw.entry : 'resume',
    x,
    health: clampInt(raw.health, 1, maxHealth, maxHealth),
    maxHealth,
    money: clampInt(raw.money, 0, 9999999, base.money),
    rep: clampInt(raw.rep, 0, 100, base.rep),
    items,
    evidence: EVIDENCE_IDS.filter((id) => evidence.has(id)),
    mementos: Array.isArray(raw.mementos) ? MEMENTO_IDS.filter((id) => raw.mementos.includes(id)) : [],
    flags: raw.flags && typeof raw.flags === 'object' ? { ...raw.flags } : {},
    stops: Array.isArray(raw.stops) && raw.stops.length ? [...new Set(['trastevere', ...raw.stops])] : base.stops,
    stats,
    ending: raw.ending === 'sangue' || raw.ending === 'verita' ? raw.ending : null,
    savedAt: raw.savedAt || null
  };
}

export function readSave() {
  try {
    return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'));
  } catch {
    return null;
  }
}

export function writeSave(data) {
  const save = normalizeSave({ ...data, version: SAVE_VERSION });
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...save, savedAt: Date.now() }));
  } catch {
    // Private windows can reject storage; the session still plays through.
  }
  return save;
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* storage unavailable */ }
}
