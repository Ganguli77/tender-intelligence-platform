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

export async function getRecentHighScoreTenders() {
  const response = await api.get("/dashboard/recent");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getDashboardActivity() {
  const response = await api.get("/dashboard/activity");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getDashboardData() {
  const [stats, status, opportunities, recentTenders, activity] = await Promise.all([
    getDashboardStats(),
    getTenderStatus(),
    getOpportunityDistribution(),
    getRecentHighScoreTenders(),
    getDashboardActivity(),
  ]);

  return {
    stats,
    status,
    opportunities,
    recentTenders,
    activity,
  };
}
