const RECENTLY_VIEWED_KEY = "recentlyViewedTenders";
const MAX_RECENT_TENDERS = 10;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeId(id) {
  if (id === undefined || id === null || id === "") {
    return null;
  }

  const numericId = Number(id);
  return Number.isFinite(numericId) ? numericId : String(id);
}

export function getViewedTenderIds() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.map(normalizeId).filter((id) => id !== null)
      : [];
  } catch {
    return [];
  }
}

export function addViewedTender(id) {
  const tenderId = normalizeId(id);
  if (!canUseStorage() || tenderId === null) {
    return;
  }

  const next = [
    tenderId,
    ...getViewedTenderIds().filter((item) => String(item) !== String(tenderId)),
  ].slice(0, MAX_RECENT_TENDERS);

  window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
}

export function clearViewedTenders() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(RECENTLY_VIEWED_KEY);
}
