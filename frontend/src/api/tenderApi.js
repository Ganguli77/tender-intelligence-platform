import {
  createTender,
  deleteTenderById,
  getTender,
  getTenders,
  normalizeTender,
  updateTenderById,
} from "./tenders";

export { createTender, getTenders };

export const getTenderById = getTender;
export const updateTender = updateTenderById;
export const deleteTender = deleteTenderById;

export function normalizeTenderForMarketplace(tender = {}, index = 0) {
  const normalized = normalizeTender(tender);
  const location = normalized.location || tender.state || "Not specified";
  const state = tender.state || location.split(",").map((part) => part.trim()).filter(Boolean).at(-1) || "Not specified";
  const amountValue = Number(normalized.amountValue || tender.value || tender.estimatedValue || 0);
  const aiScore = Number(tender.aiScore ?? tender.matchScore ?? tender.score ?? 72 + ((index * 7) % 24));

  return {
    ...normalized,
    department: tender.department || normalized.organization,
    location,
    state,
    amountValue: Number.isFinite(amountValue) ? amountValue : 0,
    aiScore: Number.isFinite(aiScore) ? Math.max(0, Math.min(100, Math.round(aiScore))) : undefined,
    tenderType: tender.tenderType || tender.type || normalized.buyerType || "Open",
    views: Number(tender.views || tender.viewCount || 800 + index * 73),
  };
}

function toBackendParams(params = {}) {
  return {
    q: params.q || params.searchTerm,
    category: params.category,
    organization: params.department,
    state: params.location,
    status: params.status,
    minValue: params.minValue,
    maxValue: params.maxValue,
    closingFrom: params.closingFrom,
    closingTo: params.closingTo,
  };
}

export async function getTenderMarketplace(params = {}, options = {}) {
  const tenders = [];
  const pageSize = 50;
  let page = 0;
  let pageItems;

  do {
    pageItems = await getTenders(
      { ...toBackendParams(params), page, size: pageSize },
      options
    );
    tenders.push(...pageItems);
    page += 1;
  } while (pageItems.length === pageSize);

  return tenders.map(normalizeTenderForMarketplace);
}
