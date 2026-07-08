// Central API base so every screen talks to the same backend host.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

function getAuthHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  const auth = window.localStorage.getItem("tenderAuth");
  if (!auth) {
    return {};
  }

  try {
    const parsed = JSON.parse(auth);
    return parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {};
  } catch {
    return {};
  }
}

const TENDERS_URL = `${API_BASE_URL}/tenders`;
const INSIGHTS_URL = `${TENDERS_URL}/insights`;
const AI_INSIGHTS_URL = `${TENDERS_URL}/ai-insights`;
const RECOMMENDATIONS_URL = `${TENDERS_URL}/recommendations`;


// Normalize backend responses into a single frontend shape.
export function normalizeTender(tender = {}) {
  return {
    id: tender.id ?? tender._id,
    title: tender.title || tender.name || "Untitled Tender",
    organization: tender.organization || tender.org || "Not specified",
    buyerType: tender.buyerType || "Government",
    category: tender.category || "General",
    location: tender.location || "Not specified",
    status: tender.status || "Open",
    referenceNo: tender.referenceNo || `TND-${tender.id ?? tender._id}`,
    publishedDate: tender.publishedDate || "Not specified",
    deadline: tender.deadline || "Not specified",
    amountValue: tender.amountValue || tender.value || 0,
    amount: tender.amount || "Not specified",
    bidSecurity: tender.bidSecurity || "Not specified",
    contact: tender.contact || "Not specified",
    eligibility: tender.eligibility || [],
    documents: tender.documents || [],
    description: tender.description || "No description available.",
  };
}

export function normalizeTenderRecommendation(recommendation = {}) {
  return {
    tender: normalizeTender(recommendation.tender || recommendation),
    matchPercentage:
      recommendation.matchPercentage ??
      recommendation.score ??
      recommendation.aiScore ??
      0,
    reasonBadge:
      recommendation.reasonBadge ||
      recommendation.badge ||
      "Recommended",
    confidenceLabel:
      recommendation.confidenceLabel ||
      "Relevant",
    aiExplanation:
      recommendation.aiExplanation ||
      "Recommended based on current tender intelligence signals.",
    scoreBreakdown: Array.isArray(recommendation.scoreBreakdown)
      ? recommendation.scoreBreakdown
      : [],
    reasons: Array.isArray(recommendation.reasons)
      ? recommendation.reasons
      : [],
  };
}



// Convert failed HTTP responses into readable errors.
async function parseResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API Error ${response.status}: ${text || response.statusText}`
    );
  }

  return response.json();
}

function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "ALL") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

// Keep fallback handling in one place so dashboard/list/details all resolve the same way.
export function resolveTenderCollection(primary = [], fallback = []) {
  const normalizedPrimary = Array.isArray(primary) ? primary.map(normalizeTender) : [];
  const normalizedFallback = Array.isArray(fallback) ? fallback.map(normalizeTender) : [];

  if (!normalizedPrimary.length) {
    return normalizedFallback;
  }

  const merged = [];
  const seenKeys = new Set();

  const getTenderKey = (tender) => tender?.id ?? tender?.referenceNo ?? tender?.title;

  [...normalizedPrimary, ...normalizedFallback].forEach((tender) => {
    const key = getTenderKey(tender);
    if (!key || seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    merged.push(tender);
  });

  return merged;
}

export async function getTenders(params = {}) {
  try {
    const response = await fetch(buildUrl(TENDERS_URL, params), {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse(response);
    return Array.isArray(data) ? data.map(normalizeTender) : [];
  } catch (error) {
    console.error("getTenders failed:", error);
    throw error;
  }
}

export async function searchTenders(searchParams = {}) {
  return getTenders(searchParams);
}

export async function getTender(id) {
  try {
    const response = await fetch(`${TENDERS_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse(response);
    return normalizeTender(data);
  } catch (error) {
    console.error("getTender failed:", error);
    throw error;
  }
}

export async function getTenderAiSummary(id) {
  const response = await fetch(`${TENDERS_URL}/${id}/ai-summary`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
}

export async function createTender(tender) {
  const response = await fetch(TENDERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(tender),
  });

  const data = await parseResponse(response);
  return normalizeTender(data);
}

export async function getTenderInsights() {
  const response = await fetch(INSIGHTS_URL, {
    headers: getAuthHeaders(),
  });
  const data = await parseResponse(response);

  return {
    ...data,
    closingSoon: (data.closingSoon || []).map(normalizeTender),
    byCategory: data.byCategory || {},
    byStatus: data.byStatus || {},
  };
}

export async function getTenderAiInsights() {
  const response = await fetch(AI_INSIGHTS_URL, {
    headers: getAuthHeaders(),
  });
  const data = await parseResponse(response);

  return {
    ...data,
    closingSoon: data.closingSoon || data.closingSoonSummaries || [],
    closingSoonSummaries: data.closingSoonSummaries || data.closingSoon || [],
    topOpportunities: data.topOpportunities || [],
    recommendedActions: data.recommendedActions || [],
    byCategory: data.byCategory || {},
    byStatus: data.byStatus || {},
  };
}

export async function getTenderRecommendations(options = {}) {
  const recentTenderIds = Array.isArray(options)
    ? options
    : options.recentTenderIds || options.viewedTenderIds || [];
  const ids = Array.isArray(recentTenderIds)
    ? recentTenderIds.filter((id) => id !== undefined && id !== null && id !== "")
    : [];

  const response = await fetch(buildUrl(RECOMMENDATIONS_URL, {
    viewedTenderIds: ids.join(","),
    keywords: Array.isArray(options) ? undefined : options.keywords,
    limit: Array.isArray(options) ? undefined : options.limit,
  }), {
    headers: getAuthHeaders(),
  });
  const data = await parseResponse(response);

  return Array.isArray(data) ? data.map(normalizeTenderRecommendation) : [];
}



export async function updateTenderById(id, tender) {
  const response = await fetch(`${TENDERS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(tender),
  });

  const data = await parseResponse(response);
  return normalizeTender(data);
}

export async function deleteTenderById(id) {
  const response = await fetch(`${TENDERS_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text || response.statusText}`);
  }
}
