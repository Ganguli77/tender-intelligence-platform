import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, BookmarkCheck, BriefcaseBusiness, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import DashboardRegionalMap from "../components/dashboard/DashboardRegionalMap";
import OpportunityBarChart from "../components/dashboard/OpportunityBarChart";
import RecentTendersCard from "../components/dashboard/RecentTendersCard";
import StatsCard from "../components/dashboard/StatsCard";
import StatusPieChart from "../components/dashboard/StatusPieChart";
import { getDashboardData } from "../api/dashboardApi";
import { useAuth } from "../context/useAuth";
import "./Dashboard.css";

const emptyDashboard = {
  stats: null,
  status: null,
  regions: [],
  regionsError: "",
  opportunities: [],
  recentTenders: [],
  activity: [],
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function getDashboardDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7);
  const format = (date) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  return `${format(start)} - ${format(end)}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const data = await getDashboardData();
      setDashboard({ ...emptyDashboard, ...data });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialDashboard() {
      try {
        const data = await getDashboardData();
        if (!ignore) {
          setDashboard({ ...emptyDashboard, ...data });
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.message || err?.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const stats = dashboard.stats || {};
  const cards = [
    {
      title: "Total Tenders",
      value: formatNumber(stats.totalTenders),
      trend: stats.totalTrend || "+12%",
      icon: BriefcaseBusiness,
      accent: "cyan",
    },
    {
      title: "Active Bids",
      value: formatNumber(stats.activeTenders),
      trend: stats.activeTrend || "+8%",
      icon: BarChart3,
      accent: "green",
    },
    {
      title: "Saved / Watchlisted",
      value: formatNumber(stats.savedTenders),
      trend: stats.savedTrend || "+3 today",
      icon: BookmarkCheck,
      accent: "yellow",
    },
    {
      title: "AI Opportunities",
      value: formatNumber(stats.aiMatches),
      trend: stats.aiMatchesTrend || "Strong fit",
      icon: Sparkles,
      accent: "blue",
    },
  ];

  return (
    <main className="dashboard-v2-page">
      <motion.section
        className="dashboard-v2-hero"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42 }}
      >
        <div>
          <h1>AI Tender Intelligence Dashboard</h1>
          <p>
            Welcome back, {user?.name || "there"}. Here&apos;s what&apos;s happening with your tender opportunities today.
          </p>
        </div>
        <div className="dashboard-v2-hero-actions">
          <span><CalendarDays size={16} /> {getDashboardDateRange()}</span>
          <button
            className={refreshing ? "is-refreshing" : ""}
            type="button"
            onClick={() => loadDashboard({ background: true })}
            aria-label="Refresh dashboard"
            disabled={refreshing}
          >
            <RefreshCw size={17} />
            <small>{refreshing ? "Refreshing" : "Refresh"}</small>
          </button>
        </div>
      </motion.section>

      {error && (
        <section className="dashboard-error">
          <AlertTriangle size={19} />
          <span>{error}</span>
          <button type="button" onClick={() => loadDashboard({ background: true })}>Retry</button>
        </section>
      )}

      <section className="dashboard-v2-stats">
        {cards.map((card, index) => (
          <StatsCard key={card.title} {...card} delay={index * 0.06} />
        ))}
      </section>

      <section className="dashboard-v2-analysis">
        <DashboardRegionalMap regions={dashboard.regions} error={dashboard.regionsError} />
        <div className="dashboard-v2-chart-stack">
          <StatusPieChart status={dashboard.status} />
          <OpportunityBarChart data={dashboard.opportunities} />
        </div>
        <RecentTendersCard tenders={dashboard.recentTenders} />
      </section>
    </main>
  );
}
