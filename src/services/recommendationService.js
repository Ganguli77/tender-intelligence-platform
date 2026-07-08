const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
const RECOMMENDATIONS_PATH = "/api/tenders/recommendations";

function buildRecommendationUrl(viewedTenderIds = [], keywords = "", limit = 6) {
  const baseUrl = API_BASE_URL
    ? `${API_BASE_URL}/tenders/recommendations`
    : RECOMMENDATIONS_PATH;
  const url = new URL(baseUrl, window.location.origin);
  const ids = Array.isArray(viewedTenderIds)
    ? viewedTenderIds.filter((id) => id !== undefined && id !== null && id !== "")
    : [];

  if (ids.length) {
    url.searchParams.set("viewedTenderIds", ids.join(","));
  }
  if (keywords.trim()) {
    url.searchParams.set("keywords", keywords.trim());
  }
  if (limit) {
    url.searchParams.set("limit", String(limit));
  }

  return url.toString();
}

async function parseResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Recommendation API failed (${response.status}): ${message || response.statusText}`);
  }

  return response.json();
}

export async function getRecommendations(viewedTenderIds = [], keywords = "", limit = 6) {
  const response = await fetch(buildRecommendationUrl(viewedTenderIds, keywords, limit), {
    headers: {
      Accept: "application/json",
    },
  });

  return parseResponse(response);
}

