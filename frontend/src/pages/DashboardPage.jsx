import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, BookmarkCheck, BriefcaseBusiness, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import OpportunityBarChart from "../components/dashboard/OpportunityBarChart";
import RecentTendersCard from "../components/dashboard/RecentTendersCard";
import StatsCard from "../components/dashboard/StatsCard";
import StatusPieChart from "../components/dashboard/StatusPieChart";
import { getDashboardData } from "../api/dashboardApi";
import "./Dashboard.css";

const emptyDashboard = {
  stats: null,
  status: null,
  opportunities: [],
  recentTenders: [],
  activity: [],
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export default function DashboardPage() {
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
      title: "Active",
      value: formatNumber(stats.activeTenders),
      trend: stats.activeTrend || "+8%",
      icon: BarChart3,
      accent: "green",
    },
    {
      title: "Saved",
      value: formatNumber(stats.savedTenders),
      trend: stats.savedTrend || "+3 today",
      icon: BookmarkCheck,
      accent: "yellow",
    },
    {
      title: "AI Matches",
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42 }}
      >
        <div>
          <h1>AI Tender Intelligence Dashboard</h1>
          <p>
            Welcome back. Here&apos;s what&apos;s happening with your tender opportunities today.
          </p>
        </div>
        <div className="dashboard-v2-hero-actions">
          <span><CalendarDays size={16} /> 14 May 2025 - 21 May 2025</span>
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

      <section className="dashboard-v2-middle">
        <StatusPieChart status={dashboard.status} />
        <OpportunityBarChart data={dashboard.opportunities} />
      </section>

      <section className="dashboard-v2-bottom">
        <RecentTendersCard tenders={dashboard.recentTenders} />
        <ActivityFeed activity={dashboard.activity} />
      </section>
    </main>
  );
}
