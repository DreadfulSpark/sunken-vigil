// Meta progression persisted in localStorage. Every access is guarded: private windows
// and blocked storage simply fall back to a fresh profile.
const KEY = 'sunken-vigil-meta-v1';
const DEFAULT = { embers: 0, upgrades: {}, tutorialDone: false, runs: 0, wins: 0, bestDepth: 0, deaths: 0 };

export function loadMeta() {
  try {
    const raw = localStorage.getItem(KEY);
    return { ...DEFAULT, ...(raw ? JSON.parse(raw) : {}), upgrades: { ...(raw ? JSON.parse(raw).upgrades : {}) } };
  } catch {
    return { ...DEFAULT, upgrades: {} };
  }
}
export function saveMeta(meta) {
  try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch { /* storage unavailable */ }
}
export function resetMeta() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
