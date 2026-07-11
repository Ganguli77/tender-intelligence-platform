import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  Gauge,
  LineChart,
  Percent,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { getApiErrorMessage } from "../services/api";
import { getInsightsDashboard } from "../api/insightsApi";
import { getTenders } from "../api/tenders";
import IndiaMap from "../components/IndiaMap";
import "./TenderPages.css";

const riskColors = {
  "Low Risk": "#22c55e",
  "Medium Risk": "#f59e0b",
  "High Risk": "#ef4444",
};

const categoryColors = ["#9b5cff", "#5b6dff", "#40d96f", "#fb923c", "#ec4899"];
const recommendationIcons = [Cloud, Shield, Server];

const emptyInsights = {
  totalAnalyzed: 0,
  recommendedTendersCount: 0,
  averageOpportunityScore: 0,
  averageWinProbability: 0,
  highRiskTendersCount: 0,
  aiAnalysisUsageCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  categoryData: [],
  monthlyData: [],
  riskData: [],
  topRecommendations: [],
};

function GlassCard({ children, className = "" }) {
  return <article className={`nex-glass-card ${className}`}>{children}</article>;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export default function AIInsights() {
  const [insights, setInsights] = useState(emptyInsights);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [stateCounts, setStateCounts] = useState([]);
  const [activeState, setActiveState] = useState("Maharashtra");

  async function loadInsights({ background = false } = {}) {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const data = await getInsightsDashboard();
      setInsights({ ...emptyInsights, ...data });
      const tenders = await getTenders();
      setStateCounts(buildStateCounts(tenders));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load AI insights."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialInsights() {
      try {
        const data = await getInsightsDashboard();
        if (!ignore) {
          setInsights({ ...emptyInsights, ...data });
          getTenders()
            .then((tenders) => {
              if (!ignore) setStateCounts(buildStateCounts(tenders));
            })
            .catch(() => {
              if (!ignore) setStateCounts([]);
            });
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Unable to load AI insights."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialInsights();
    return () => {
      ignore = true;
    };
  }, []);

  const trendData = insights.monthlyData.length
    ? insights.monthlyData
    : [{ month: "No data", opportunities: 0 }];
  const currentTrend = trendData.at(-1)?.opportunities || 0;
  const lastTrend = trendData.at(-2)?.opportunities || 0;
  const trendDelta = lastTrend ? Math.round(((currentTrend - lastTrend) / lastTrend) * 100) : 0;
  const topCategory = insights.categoryData[0]?.name || "No category data";

  const kpis = useMemo(
    () => [
      { label: "AI Analyses", value: formatNumber(insights.totalAnalyzed), trend: `${formatNumber(insights.aiAnalysisUsageCount)} used`, tone: "violet", icon: BrainCircuit },
      { label: "High Matches", value: formatNumber(insights.recommendedTendersCount), trend: `${formatNumber(insights.cacheHits)} cache hits`, tone: "emerald", icon: Sparkles },
      { label: "Avg Opportunity Score", value: insights.averageOpportunityScore, trend: `${formatNumber(insights.cacheMisses)} cache misses`, tone: "amber", icon: Gauge },
      { label: "Win Probability", value: `${insights.averageWinProbability}%`, trend: `${formatNumber(insights.highRiskTendersCount)} high risk`, tone: "purple", icon: Percent },
    ],
    [insights],
  );

  const categoryData = insights.categoryData.map((category, index) => ({
    ...category,
    score: category.count,
    fill: categoryColors[index % categoryColors.length],
  }));

  const riskData = insights.riskData.map((risk) => ({
    ...risk,
    color: riskColors[risk.name] || "#7c3aed",
  }));

  const forecasts = [
    { title: `${topCategory} tender concentration`, label: "Current category leader", value: formatNumber(insights.categoryData[0]?.count || 0), tone: "green", icon: TrendingUp },
    { title: "Best win probability segment", label: "Average AI model signal", value: `${insights.averageWinProbability}%`, tone: "blue", icon: Target },
    { title: "High-risk tender alerts", label: "Monitor closely", value: formatNumber(insights.highRiskTendersCount), tone: "red", icon: AlertTriangle },
  ];

  const topStates = stateCounts.length ? stateCounts : [
    { state: "Maharashtra", count: 0 },
    { state: "Karnataka", count: 0 },
    { state: "Delhi", count: 0 },
    { state: "Tamil Nadu", count: 0 },
  ];

  return (
    <main className="nex-dashboard-main nex-layout-page">
      <div className="nex-glow nex-glow-one" />
      <div className="nex-glow nex-glow-two" />

      <section className="nex-content">
        <div className="nex-page-head">
          <div>
            <h1>AI Insights</h1>
            <p>AI-powered opportunity intelligence and predictive tender analytics</p>
          </div>
          <div className="nex-page-actions">
            <button className="nex-date-button" type="button">
              <CalendarDays size={17} />
              Live backend data
              <ChevronDown size={16} />
            </button>
            <button className="nex-export-button" type="button">
              <Download size={18} />
              Export Report
            </button>
            <button
              className="nex-date-button"
              type="button"
              onClick={() => loadInsights({ background: true })}
              disabled={refreshing}
            >
              <RefreshCw size={17} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <section className="dashboard-error">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button type="button" onClick={() => loadInsights({ background: true })}>Retry</button>
          </section>
        ) : null}

        <section className="nex-kpi-grid" aria-label="AI insight KPIs">
          {kpis.map(({ label, value, trend, icon: Icon, tone }) => (
            <GlassCard className={`nex-kpi-card ${tone}`} key={label}>
              <div className="nex-kpi-top">
                <span><Icon size={26} /></span>
                <div>
                  <p>{label}</p>
                  <strong>{loading ? "..." : value}</strong>
                </div>
              </div>
              <div className="nex-kpi-trend">
                <TrendingUp size={15} />
                <b>{loading ? "Loading" : trend}</b>
                <small>from backend</small>
              </div>
            </GlassCard>
          ))}
        </section>

        <section className="nex-chart-grid">
          <GlassCard className="nex-trend-panel">
            <div className="nex-panel-head">
              <h2><LineChart size={19} /> Opportunity Trend</h2>
              <button type="button">Monthly <ChevronDown size={15} /></button>
            </div>
            <p className="nex-panel-subtitle"><span /> Published opportunities over time</p>
            <div className="nex-chart-wrap">
              <ResponsiveContainer width="100%" height={310}>
                <AreaChart data={trendData} margin={{ top: 20, right: 18, left: -18, bottom: 8 }}>
                  <defs>
                    <linearGradient id="opportunityGlow" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.62} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0a1024", border: "1px solid rgba(124,58,237,.45)", borderRadius: 8, color: "#fff" }} />
                  <Area type="monotone" dataKey="opportunities" stroke="#9b5cff" strokeWidth={3} fill="url(#opportunityGlow)" dot={{ r: 3, fill: "#c084fc" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="nex-trend-summary">
              <span>Current <b>{formatNumber(currentTrend)}</b> <em>{trendDelta >= 0 ? "+" : ""}{trendDelta}% from previous</em></span>
              <span>Previous <b>{formatNumber(lastTrend)}</b></span>
            </div>
          </GlassCard>

          <GlassCard className="nex-risk-panel">
            <div className="nex-panel-head">
              <h2><Sparkles size={19} /> Risk Distribution</h2>
              <button type="button">Live <ChevronDown size={15} /></button>
            </div>
            <div className="nex-risk-body">
              <div className="nex-donut">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={riskData} dataKey="value" innerRadius={68} outerRadius={104} paddingAngle={1} stroke="none">
                      {riskData.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div>
                  <strong>{riskData[0]?.value || 0}%</strong>
                  <span>{riskData[0]?.name || "Low Risk"}</span>
                </div>
              </div>
              <div className="nex-risk-list">
                {riskData.map((item) => (
                  <div key={item.name}>
                    <span style={{ background: item.color }} />
                    <p>{item.name}</p>
                    <strong>{item.value}% ({formatNumber(item.count)})</strong>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="nex-map-grid">
          <GlassCard className="nex-map-panel">
            <div className="nex-panel-head compact">
              <h2><MapIcon /> State-wise Tender Heatmap</h2>
            </div>
            <div className="nex-map-shell">
              <IndiaMap activeState={activeState} onStateClick={setActiveState} onStateHover={setActiveState} />
            </div>
          </GlassCard>

          <GlassCard className="nex-map-panel">
            <div className="nex-panel-head compact">
              <h2><Target size={19} /> Market Opportunity Analysis</h2>
            </div>
            <div className="nex-state-list">
              {topStates.slice(0, 8).map((item) => (
                <button
                  type="button"
                  key={item.state}
                  className={activeState === item.state ? "is-active" : ""}
                  onClick={() => setActiveState(item.state)}
                >
                  <span>{item.state}</span>
                  <strong>{formatNumber(item.count)} tenders</strong>
                </button>
              ))}
            </div>
            <div className="nex-forecast-list" style={{ marginTop: 16 }}>
              <div className="blue">
                <span><Percent size={21} /></span>
                <i>
                  <strong>Bid success prediction</strong>
                  <small>{activeState} opportunity signal</small>
                </i>
                <b>{Math.min(92, 58 + (topStates.find((item) => item.state === activeState)?.count || 3) * 4)}%</b>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="nex-lower-grid">
          <GlassCard>
            <div className="nex-panel-head">
              <h2><BarChart3 size={19} /> Top AI Opportunity Categories</h2>
              <button type="button">Live <ChevronDown size={15} /></button>
            </div>
            <div className="nex-bar-chart">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 34, left: 64, bottom: 8 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tickLine={false} axisLine={false} width={105} />
                  <Tooltip cursor={{ fill: "rgba(124,58,237,.08)" }} contentStyle={{ background: "#0a1024", border: "1px solid rgba(124,58,237,.45)", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={12}>
                    {categoryData.map((entry) => <Cell fill={entry.fill} key={entry.name} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="nex-panel-head compact">
              <h2><Sparkles size={19} /> Top AI Recommendations</h2>
            </div>
            <div className="nex-rec-list">
              {insights.topRecommendations.length ? insights.topRecommendations.map(({ id, title, org, score }, index) => {
                const Icon = recommendationIcons[index % recommendationIcons.length];
                return (
                  <button type="button" key={id || title}>
                    <span><Icon size={20} /></span>
                    <i>
                      <strong>{title}</strong>
                      <small>{org}</small>
                    </i>
                    <b>{score}</b>
                    <ChevronRight size={17} />
                  </button>
                );
              }) : (
                <p className="dashboard-empty-text">No AI recommendations are available yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="nex-panel-head compact">
              <h2><LineChart size={19} /> Predictive Insights</h2>
            </div>
            <div className="nex-forecast-list">
              {forecasts.map(({ title, label, value, tone, icon: Icon }) => (
                <div className={tone} key={title}>
                  <span><Icon size={21} /></span>
                  <i>
                    <strong>{title}</strong>
                    <small>{label}</small>
                  </i>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </section>
    </main>
  );
}

function buildStateCounts(tenders) {
  const counts = new Map();
  tenders.forEach((tender) => {
    const state = String(tender.location || "Not specified")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
    if (state && state !== "Not specified") {
      counts.set(state, (counts.get(state) || 0) + 1);
    }
  });
  return Array.from(counts.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}

function MapIcon() {
  return <Server size={19} />;
}
