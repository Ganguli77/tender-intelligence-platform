const SAVED_TENDERS_KEY = "nextender-saved-tenders";
const SAVED_TENDERS_EVENT = "saved-tenders:changed";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeId(id) {
  return String(id ?? "").trim();
}

export function getSavedTenderIds() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const storedIds = JSON.parse(window.localStorage.getItem(SAVED_TENDERS_KEY) || "[]");
    return Array.isArray(storedIds) ? storedIds.map(normalizeId).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isTenderSaved(id) {
  const tenderId = normalizeId(id);
  return tenderId ? getSavedTenderIds().includes(tenderId) : false;
}

export function saveTender(id) {
  const tenderId = normalizeId(id);
  if (!canUseStorage() || !tenderId) {
    return getSavedTenderIds();
  }

  const nextIds = Array.from(new Set([...getSavedTenderIds(), tenderId]));
  window.localStorage.setItem(SAVED_TENDERS_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new CustomEvent(SAVED_TENDERS_EVENT, { detail: nextIds }));
  return nextIds;
}

export function removeSavedTender(id) {
  const tenderId = normalizeId(id);
  if (!canUseStorage() || !tenderId) {
    return getSavedTenderIds();
  }

  const nextIds = getSavedTenderIds().filter((savedId) => savedId !== tenderId);
  window.localStorage.setItem(SAVED_TENDERS_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new CustomEvent(SAVED_TENDERS_EVENT, { detail: nextIds }));
  return nextIds;
}

export function toggleSavedTender(id) {
  return isTenderSaved(id) ? removeSavedTender(id) : saveTender(id);
}

export { SAVED_TENDERS_EVENT };
