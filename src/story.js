export const SAVE_KEY = 'sangue-save-v1';

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
  CURRENT_END: 10
});

const OBJECTIVES = {
  [STAGE.FIND_BORGE]: 'Borge’u bul · Bar Arisel',
  [STAGE.FIND_LEDGER]: 'Magazzino 17’den defteri al',
  [STAGE.RETURN_LEDGER]: 'Defteri Borge’a götür',
  [STAGE.GO_HOME]: 'Bianchi dairesine dön',
  [STAGE.SEARCH_COAT]: 'Babanın paltosunu incele',
  [STAGE.SEARCH_DESK]: 'Çalışma masasını araştır',
  [STAGE.MEET_ELENA]: 'Elena’yı durakta bul',
  [STAGE.QUESTION_BORGE]: 'Borge’a o geceyi sor',
  [STAGE.OPEN_CABINET]: '31 numaralı dolabı bul',
  [STAGE.CURRENT_END]: 'Civitavecchia izi · devam edecek'
};

export function objectiveForStage(stage) {
  return OBJECTIVES[stage] || OBJECTIVES[STAGE.FIND_BORGE];
}

export function chapterForStage(stage) {
  if (stage >= STAGE.OPEN_CABINET) return { number: 'CAPITOLO III', title: 'IL NUMERO 31' };
  if (stage >= STAGE.GO_HOME) return { number: 'CAPITOLO II', title: 'LA STANZA VUOTA' };
  return { number: 'CAPITOLO I', title: 'IL PRIMO PASSO' };
}

export function normalizeSave(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const oldStage = Number.isInteger(raw.missionStage) ? raw.missionStage : STAGE.FIND_BORGE;
  // Stage 3 in v1 meant the ledger mission was complete. It now leads home.
  const missionStage = oldStage === 3 ? STAGE.GO_HOME : oldStage;
  const apartmentStage = missionStage >= STAGE.SEARCH_COAT && missionStage <= STAGE.MEET_ELENA;
  return {
    ...raw,
    version: 2,
    missionStage,
    scene: raw.scene === 'apartment' && apartmentStage ? 'apartment' : 'rome',
    hasLedger: Boolean(raw.hasLedger),
    evidence: Array.isArray(raw.evidence) ? raw.evidence.filter((item) =>
      item === 'key31' || item === 'photo' || item === 'manifest') : []
  };
}

export function writeSave(data) {
  const save = normalizeSave(data);
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...save, savedAt: Date.now() }));
  return save;
}
