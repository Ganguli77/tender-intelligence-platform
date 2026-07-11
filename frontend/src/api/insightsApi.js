import api from "../services/api";

function toEntries(values = {}, nameKey = "name", valueKey = "value") {
  return Object.entries(values || {}).map(([name, value]) => ({
    [nameKey]: name,
    [valueKey]: Number(value || 0),
  }));
}

function normalizeRecommendation(analysis = {}) {
  const tender = analysis.tender || {};

  return {
    id: analysis.id || tender.id || tender.title,
    title: tender.title || "Recommended tender",
    org: tender.organization || "Not specified",
    score: Number(analysis.opportunityScore || 0),
    riskLevel: analysis.riskLevel || "Medium",
  };
}

export async function getInsightsDashboard() {
  const response = await api.get("/ai/dashboard");
  const data = response.data || {};
  const totalAnalyzed = Number(data.totalAnalyzed || 0);
  const recommendedTendersCount = Number(data.recommendedTendersCount || 0);
  const averageOpportunityScore = Number(data.averageOpportunityScore || 0);
  const averageWinProbability = Number(data.averageWinProbability || 0);
  const highRiskTendersCount = Number(data.highRiskTendersCount || 0);
  const categoryData = toEntries(data.categoryCounts, "name", "count")
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const monthlyData = toEntries(data.monthlyOpportunities, "month", "opportunities");
  const riskCounts = data.riskCounts || {};
  const riskTotal = Object.values(riskCounts).reduce((total, value) => total + Number(value || 0), 0) || totalAnalyzed || 1;
  const topRecommendations = Array.isArray(data.topRecommendations)
    ? data.topRecommendations.map(normalizeRecommendation).slice(0, 3)
    : [];

  return {
    totalAnalyzed,
    recommendedTendersCount,
    averageOpportunityScore,
    averageWinProbability,
    highRiskTendersCount,
    aiAnalysisUsageCount: Number(data.aiAnalysisUsageCount || 0),
    cacheHits: Number(data.cacheHits || 0),
    cacheMisses: Number(data.cacheMisses || 0),
    categoryData,
    monthlyData,
    riskData: ["Low", "Medium", "High"].map((risk) => {
      const count = Number(riskCounts[risk] || riskCounts[`${risk} Risk`] || (risk === "High" ? highRiskTendersCount : 0));
      return {
        name: `${risk} Risk`,
        value: Math.round((count / riskTotal) * 100),
        count,
      };
    }),
    topRecommendations,
  };
}
