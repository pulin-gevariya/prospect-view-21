// Local persistence of candidate timestamps (not stored in Google Sheets)
// Uses localStorage and a stable key: "Name|email"

const STORAGE_KEY = "candidate_ts_map";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function makeKey(name: string, email: string) {
  const n = (name || "").trim();
  const e = (email || "").trim().toLowerCase();
  return `${n}|${e}`;
}

function readMap(): Record<string, string> {
  const ls = safeStorage();
  if (!ls) return {};
  try {
    const raw = ls.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  const ls = safeStorage();
  if (!ls) return;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getLocalTimestamp(name: string, email: string): string | undefined {
  const map = readMap();
  return map[makeKey(name, email)];
}

export function setLocalTimestamp(name: string, email: string, timestamp: string) {
  const map = readMap();
  const key = makeKey(name, email);
  // Do not overwrite existing timestamps
  if (!map[key]) {
    map[key] = timestamp;
    writeMap(map);
  }
}

export function removeLocalTimestamp(name: string, email: string) {
  const map = readMap();
  const key = makeKey(name, email);
  if (key in map) {
    delete map[key];
    writeMap(map);
  }
}

export function migrateLocalTimestamp(
  oldName: string,
  oldEmail: string,
  newName: string,
  newEmail: string
) {
  const map = readMap();
  const oldKey = makeKey(oldName, oldEmail);
  const newKey = makeKey(newName, newEmail);
  if (oldKey === newKey) return;
  if (map[oldKey] && !map[newKey]) {
    map[newKey] = map[oldKey];
  }
  if (map[oldKey]) {
    delete map[oldKey];
  }
  writeMap(map);
}

export function overwriteLocalTimestamp(name: string, email: string, timestamp: string) {
  const map = readMap();
  map[makeKey(name, email)] = timestamp;
  writeMap(map);
}
