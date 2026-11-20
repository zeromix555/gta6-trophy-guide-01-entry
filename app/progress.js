// progress.js — saved tracker state for the GTA 6 trophy guide.
// Everything lives in localStorage under one key, so the guide works offline
// and progress survives a reload. Export/import moves the same JSON between browsers.
const STORE_KEY = 'vice-city-platinum-progress-v1';

export const DEFAULT_STATE = {
  earned: [],
  notes: {},
  spoiler: false,
  theme: 'light',
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((x) => typeof x === 'string') : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoiler: Boolean(parsed.spoiler),
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function setEarned(state, trophyId, earned) {
  const next = new Set(state.earned);
  if (earned) next.add(trophyId);
  else next.delete(trophyId);
  state.earned = [...next];
  saveState(state);
}

export function setNote(state, trophyId, text) {
  if (text.trim()) state.notes[trophyId] = text;
  else delete state.notes[trophyId];
  saveState(state);
}

export function exportFile(state) {
  const payload = { app: 'vice-city-platinum', version: 1, exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function importFile(file) {
  const parsed = JSON.parse(await file.text());
  const state = {
    earned: Array.isArray(parsed.earned) ? parsed.earned.filter((x) => typeof x === 'string') : [],
    notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    spoiler: Boolean(parsed.spoiler),
    theme: parsed.theme === 'dark' ? 'dark' : 'light',
  };
  saveState(state);
  return state;
}

// Sample progress for trying the tracker: a plausible early-game set
// (opening missions + first activities), so the progress bar and Next-up move.
export const SAMPLE_EARNED = [
  'just-like-paradise',
  'paradise-lost',
  'trust',
  'baited-my-tackle',
  'stick-fiddler',
  'lets-go-bowling',
  'in-the-beginning',
  'whip-it-good',
];
