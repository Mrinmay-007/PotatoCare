import api from "./api";

// The original app fired one GET /translate/ request per string, per render, with
// no caching - the Weather / Treatment screens easily produced 50+ calls. This
// version caches every result (memory + localStorage), de-duplicates in-flight
// requests, skips strings that contain no letters, and limits concurrency.

const STORAGE_KEY = "translations:v1";
const MAX_CONCURRENT = 6;
const MAX_STORED = 1500;

const memory = new Map();
const inflight = new Map();
const queue = [];
let active = 0;
let persistTimer = null;

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  Object.entries(saved).forEach(([k, v]) => memory.set(k, v));
} catch {
  /* ignore corrupt cache */
}

const keyFor = (text, language) => `${language}::${text}`;
const hasLetters = (text) => /\p{L}/u.test(text);

function persistSoon() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const entries = Array.from(memory.entries()).slice(-MAX_STORED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      /* storage full / unavailable */
    }
  }, 800);
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const job = queue.shift();
    active += 1;
    job().finally(() => {
      active -= 1;
      pump();
    });
  }
}

function enqueue(task) {
  return new Promise((resolve) => {
    queue.push(() => task().then(resolve, resolve));
    pump();
  });
}

export function needsTranslation(text, language) {
  return !!text && language !== "english" && hasLetters(text);
}

/** Synchronous cache lookup. Returns undefined when nothing is cached yet. */
export function getCachedTranslation(text, language) {
  if (!needsTranslation(text, language)) return text;
  return memory.get(keyFor(text, language));
}

export async function translate(text, language) {
  if (!needsTranslation(text, language)) return text;

  const key = keyFor(text, language);
  if (memory.has(key)) return memory.get(key);
  if (inflight.has(key)) return inflight.get(key);

  // Same backend route as before: GET /translate/?text=...&target_language=...
  const promise = enqueue(async () => {
    try {
      const res = await api.get("/translate/", {
        params: { text, target_language: language },
      });
      const translated = res.data?.translated_text || text;
      memory.set(key, translated);
      persistSoon();
      return translated;
    } catch {
      return text; // fall back to the original text, never throw into the UI
    } finally {
      inflight.delete(key);
    }
  });

  inflight.set(key, promise);
  return promise;
}
