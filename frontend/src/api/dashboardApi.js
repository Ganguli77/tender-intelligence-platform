import api from "../services/api";

export async function getDashboardStats() {
  const response = await api.get("/dashboard/stats");
  return response.data;
}

export async function getTenderStatus() {
  const response = await api.get("/dashboard/status");
  return response.data;
}

export async function getOpportunityDistribution() {
  const response = await api.get("/dashboard/opportunities");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getRegionalTenderActivity() {
  const response = await api.get("/dashboard/regions");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getRecentHighScoreTenders() {
  const response = await api.get("/dashboard/recent");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getDashboardActivity() {
  const response = await api.get("/dashboard/activity");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getDashboardData() {
  const regionalRequest = getRegionalTenderActivity()
    .then((regions) => ({ regions, regionsError: "" }))
    .catch((error) => {
      const status = error?.response?.status;
      const regionsError = status
        ? `Regional activity request failed (HTTP ${status}). Check the backend and refresh.`
        : error?.message || "Regional tender activity is unavailable.";
      return { regions: [], regionsError };
    });
  const [[stats, status, opportunities, recentTenders, activity], regionalData] = await Promise.all([
    Promise.all([
      getDashboardStats(),
      getTenderStatus(),
      getOpportunityDistribution(),
      getRecentHighScoreTenders(),
      getDashboardActivity(),
    ]),
    regionalRequest,
  ]);

  return {
    stats,
    status,
    opportunities,
    ...regionalData,
    recentTenders,
    activity,
  };
}
