import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaCalendarCheck,
  FaChartLine,
  FaChartPie,
  FaCheckCircle,
  FaChevronDown,
  FaDatabase,
  FaFilter,
  FaHeart,
  FaInbox,
  FaLightbulb,
  FaMapMarkedAlt,
  FaRegClock,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaSlidersH,
  FaMagic,
  FaTachometerAlt,
  FaUserCircle,
  FaWallet,
} from "react-icons/fa";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getTenderInsights,
  getTenderRecommendations,
  getTenders,
  normalizeTender,
  resolveTenderCollection,
} from "../api/tenders";
import { tenders as fallbackTenders } from "../data/tenders";
import "./Dashboard.css";

const RECENT_TENDER_VIEWS_KEY = "recentTenderViewIds";
const RECENT_SEARCHES_KEY = "recentTenderSearches";

function formatDate(date) {
  if (!date || date === "Not specified") return "Not specified";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function isActive(deadline) {
  if (!deadline || deadline === "Not specified") return true;
  return new Date(deadline) >= new Date();
}

function daysUntil(deadline) {
  if (!deadline || deadline === "Not specified") return 60;
  const today = new Date();
  const due = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

function getAiScore(tender) {
  const days = daysUntil(tender.deadline);
  const value = Number(tender.amountValue || 0);
  let score = 52;

  if (value >= 150000000) score += 18;
  else if (value >= 50000000) score += 12;
  else if (value > 0) score += 6;

  if (days >= 30) score += 12;
  else if (days >= 14) score += 8;
  else if (days >= 0) score -= 6;
  else score -= 20;

  if ((tender.documents || []).length <= 5) score += 4;
  if ((tender.eligibility || []).length >= 4) score -= 3;

  return Math.max(10, Math.min(98, score));
}

function getRecommendationLabel(tender) {
  const score = getAiScore(tender);
  const days = daysUntil(tender.deadline);

  if (!isActive(tender.deadline)) return "Archive";
  if (score >= 78 && days <= 21) return "Priority bid";
  if (score >= 62) return "Review";
  return "Watch";
}

function useAnimatedNumber(target, duration = 900) {
  const [value, setValue] = useState(0);
  const previousTarget = useRef(0);

  useEffect(() => {
    let frameId;
    const start = performance.now();
    const from = previousTarget.current;
    const delta = target - from;

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + delta * eased));
      if (progress < 1) frameId = requestAnimationFrame(step);
    };

    previousTarget.current = target;
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [duration, target]);

  return value;
}

const MetricCard = memo(function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  accent,
  sparkline,
  onClick,
}) {
  const animatedValue = useAnimatedNumber(Number(value) || 0);

  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
      type="button"
      className={`metric-card ${accent}`}
      onClick={onClick}
    >
      <span className="metric-card-glow" aria-hidden="true" />
      <div className="metric-card-top">
        <span className="metric-icon">
          <Icon />
        </span>
        <span className={`metric-trend ${trend.tone}`}>{trend.label}</span>
      </div>
      <div className="metric-card-body">
        <strong>{label.includes("Value") || label.includes("Budget") ? formatCurrency(animatedValue) : animatedValue.toLocaleString("en-IN")}</strong>
        <span>{label}</span>
      </div>
      <div className="sparkline-wrap" aria-hidden="true">
        <svg viewBox="0 0 120 40" className="sparkline">
          <path d={sparkline} className="sparkline-path" />
        </svg>
      </div>
    </motion.button>
  );
});

const InsightCard = memo(function InsightCard({ title, value, meta, icon: Icon, tone }) {
  return (
    <motion.article whileHover={{ y: -3, scale: 1.01 }} className={`insight-card ${tone}`}>
      <div className="insight-card-top">
        <span className="insight-icon">
          <Icon />
        </span>
        <span className="insight-label">{title}</span>
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </motion.article>
  );
});

function EmptyState({ title, description, actionLabel, onAction, icon: Icon = FaInbox }) {
  return (
    <div className="empty-state-card">
      <span className="empty-state-icon">
        <Icon />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function SkeletonCard() {
  return <div className="skeleton-card" aria-hidden="true" />;
}

function getRecentTenderViewIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_TENDER_VIEWS_KEY) || "[]");
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function loadRecentSearches() {
  try {
    const searches = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(searches) ? searches.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore storage errors while preserving dashboard functionality.
  }
}

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [quickSearch, setQuickSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [recommendedForYou, setRecommendedForYou] = useState([]);
  const [sampleMode, setSampleMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());

  useEffect(() => {
    let mounted = true;
    const viewedTenderIds = getRecentTenderViewIds();

    Promise.allSettled([
      getTenderInsights(),
      getTenders(),
      getTenderRecommendations({ viewedTenderIds, limit: 6 }),
    ]).then(([insightResult, tenderResult, recommendationResult]) => {
      if (!mounted) return;

      const insightFetched = insightResult.status === "fulfilled";
      const tenderFetched = tenderResult.status === "fulfilled";
      const recommendationFetched = recommendationResult.status === "fulfilled";
      const insightData = insightFetched ? insightResult.value : null;
      const tenderData = tenderFetched ? tenderResult.value : [];
      const resolvedTenders = resolveTenderCollection(
        tenderData,
        fallbackTenders.map(normalizeTender)
      );
      const fallbackRecommendations = [...resolvedTenders]
        .filter((tender) => isActive(tender.deadline))
        .sort((a, b) => getAiScore(b) - getAiScore(a))
        .slice(0, 6)
        .map((tender) => ({
          tender,
          matchPercentage: getAiScore(tender),
          reasonBadge: "Trending Tender",
          reasons: ["Trending Tender"],
        }));

      setInsights(insightData);
      setTenders(resolvedTenders);
      setRecommendedForYou(recommendationFetched ? recommendationResult.value : fallbackRecommendations);
      setSampleMode(!tenderFetched);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(quickSearch.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [quickSearch]);

  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(new Date()), 60000);

    return () => {
      window.clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    if (!debouncedSearch) {
      return;
    }

    navigate(`/tenders?q=${encodeURIComponent(debouncedSearch)}`);
  }, [debouncedSearch, navigate]);

  const savedIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("savedTenderIds") || "[]");
    } catch {
      return [];
    }
  }, []);

  const appliedIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("appliedTenderIds") || "[]");
    } catch {
      return [];
    }
  }, []);

  const activeTenders = useMemo(
    () => tenders.filter((tender) => isActive(tender.deadline)),
    [tenders]
  );

  const totalTenders = tenders.length;
  const activeCount = insights?.active ?? activeTenders.length;
  const expiredCount = insights?.expired ?? Math.max(totalTenders - activeCount, 0);
  const savedTenders = useMemo(
    () => tenders.filter((tender) => savedIds.includes(tender.id)),
    [savedIds, tenders]
  );

  const totalTenderValue = useMemo(
    () => tenders.reduce((sum, tender) => sum + Number(tender.amountValue || 0), 0),
    [tenders]
  );
  const averageTenderValue = totalTenderValue / Math.max(totalTenders, 1);
  const closingToday = useMemo(
    () => tenders.filter((tender) => daysUntil(tender.deadline) === 0),
    [tenders]
  );

  const closingSoon = useMemo(
    () =>
      [...tenders]
        .filter((tender) => {
          const days = daysUntil(tender.deadline);
          return days >= 0 && days <= 14;
        })
        .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
        .slice(0, 5),
    [tenders]
  );

  const recommended = useMemo(
    () =>
      [...activeTenders]
        .sort((a, b) => getAiScore(b) - getAiScore(a))
        .slice(0, 5),
    [activeTenders]
  );

  const recentTenders = useMemo(
    () =>
      [...tenders]
        .sort((a, b) => new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0))
        .slice(0, 38),
    [tenders]
  );

  const deadlineReminders = useMemo(
    () =>
      [...tenders]
        .filter((tender) => {
          const days = daysUntil(tender.deadline);
          return days >= 0 && days <= 10;
        })
        .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
        .slice(0, 4),
    [tenders]
  );

  const categories = useMemo(
    () =>
      Object.entries(insights?.byCategory || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [insights]
  );

  const stateDistribution = useMemo(() => {
    const counts = tenders.reduce((accumulator, tender) => {
      const state = tender.location || "Unknown";
      accumulator[state] = (accumulator[state] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [tenders]);

  const categoryBreakdown = useMemo(() => {
    return categories.map(([name, value]) => ({ name, value }));
  }, [categories]);

  const monthlyTrend = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = Array.from({ length: 6 }, (_, index) => {
      const monthIndex = (new Date().getMonth() - 5 + index + 12) % 12;
      const monthName = monthNames[monthIndex];
      const relevant = tenders.filter((tender) => {
        if (!tender.publishedDate) return false;
        const date = new Date(tender.publishedDate);
        return date.getMonth() === monthIndex;
      });
      return {
        name: monthName,
        tenders: relevant.length,
        value: relevant.reduce((sum, tender) => sum + Number(tender.amountValue || 0), 0) / 10000000,
      };
    });

    return counts;
  }, [tenders]);

  const budgetDistribution = useMemo(() => {
    const ranges = [
      { label: "< 10M", min: 0, max: 10000000 },
      { label: "10M-50M", min: 10000000, max: 50000000 },
      { label: "50M-100M", min: 50000000, max: 100000000 },
      { label: "> 100M", min: 100000000, max: Number.POSITIVE_INFINITY },
    ];

    return ranges.map((range) => ({
      name: range.label,
      value: tenders.filter((tender) => {
        const amount = Number(tender.amountValue || 0);
        return amount >= range.min && amount < range.max;
      }).length,
    }));
  }, [tenders]);

  const filteredRecent = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();

    return recentTenders.filter((tender) => {
      const matchesQuery =
        !query ||
        [tender.title, tender.organization, tender.location, tender.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive(tender.deadline)) ||
        (statusFilter === "closing" && daysUntil(tender.deadline) >= 0 && daysUntil(tender.deadline) <= 14) ||
        (statusFilter === "saved" && savedIds.includes(tender.id)) ||
        (statusFilter === "applied" && appliedIds.includes(tender.id));

      const matchesCategory =
        categoryFilter === "all" ||
        String(tender.category || "").toLowerCase() === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [appliedIds, categoryFilter, quickSearch, recentTenders, savedIds, statusFilter]);

  const liveRatio = totalTenders ? Math.round((activeCount / totalTenders) * 100) : 0;
  const trendLine = useMemo(
    () =>
      [
        { name: "Mon", active: Math.max(activeCount - 10, 0), total: Math.max(totalTenders - 12, 0) },
        { name: "Tue", active: Math.max(activeCount - 6, 0), total: Math.max(totalTenders - 9, 0) },
        { name: "Wed", active: Math.max(activeCount - 3, 0), total: Math.max(totalTenders - 5, 0) },
        { name: "Thu", active: Math.max(activeCount - 1, 0), total: Math.max(totalTenders - 2, 0) },
        { name: "Fri", active: activeCount, total: totalTenders },
      ],
    [activeCount, totalTenders]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Total Tenders",
        value: totalTenders,
        icon: FaDatabase,
        trend: { label: "+12% MoM", tone: "positive" },
        accent: "accent-cyan",
        sparkline: "M0 28 C18 18, 36 20, 54 24 S90 30, 120 10",
        onClick: () => navigate("/tenders"),
      },
      {
        label: "Open Tenders",
        value: activeCount,
        icon: FaShieldAlt,
        trend: { label: `${liveRatio}% live`, tone: "positive" },
        accent: "accent-blue",
        sparkline: "M0 24 C20 24, 38 14, 58 16 S94 24, 120 8",
        onClick: () => navigate("/tenders?status=ACTIVE"),
      },
      {
        label: "Closed Tenders",
        value: expiredCount,
        icon: FaCheckCircle,
        trend: { label: "Stable", tone: "neutral" },
        accent: "accent-indigo",
        sparkline: "M0 18 C12 20, 28 16, 44 20 S86 30, 120 14",
        onClick: () => navigate("/tenders"),
      },
      {
        label: "Closing Today",
        value: closingToday.length,
        icon: FaCalendarCheck,
        trend: { label: "Priority", tone: "warning" },
        accent: "accent-pink",
        sparkline: "M0 12 C20 18, 36 20, 54 12 S90 8, 120 16",
        onClick: () => navigate("/tenders?status=ACTIVE"),
      },
      {
        label: "Total Tender Value",
        value: totalTenderValue,
        icon: FaWallet,
        trend: { label: "+8.4%", tone: "positive" },
        accent: "accent-teal",
        sparkline: "M0 24 C18 20, 32 14, 48 16 S86 30, 120 10",
        onClick: () => navigate("/tenders"),
      },
      {
        label: "Average Tender Value",
        value: averageTenderValue,
        icon: FaTachometerAlt,
        trend: { label: "+3.1%", tone: "positive" },
        accent: "accent-violet",
        sparkline: "M0 16 C20 24, 40 20, 58 16 S92 10, 120 18",
        onClick: () => navigate("/tenders"),
      },
      {
        label: "AI Recommended",
        value: recommendedForYou.length || recommended.length,
        icon: FaRobot,
        trend: { label: "Smart picks", tone: "positive" },
        accent: "accent-cyan",
        sparkline: "M0 20 C18 14, 40 16, 62 20 S102 28, 120 10",
        onClick: () => navigate("/insights"),
      },
      {
        label: "Saved Tenders",
        value: savedTenders.length,
        icon: FaHeart,
        trend: { label: "Pinned", tone: "neutral" },
        accent: "accent-indigo",
        sparkline: "M0 14 C18 18, 40 24, 58 20 S90 12, 120 22",
        onClick: () => navigate("/dashboard"),
      },
    ],
    [
      activeCount,
      averageTenderValue,
      closingToday.length,
      expiredCount,
      liveRatio,
      navigate,
      recommended.length,
      recommendedForYou.length,
      savedTenders.length,
      totalTenderValue,
      totalTenders,
    ]
  );

  const quickActions = useMemo(
    () => [
      { label: "Add Tender", icon: FaBriefcase, href: "/add-tender", hint: "Create new opportunities" },
      { label: "Search Tender", icon: FaSearch, href: "/tenders", hint: "Find the right fit" },
      { label: "AI Recommendations", icon: FaRobot, href: "/insights", hint: "Review ranked opportunities" },
      { label: "Analytics", icon: FaChartLine, href: "/insights", hint: "Track momentum" },
      { label: "Watchlist", icon: FaHeart, href: "/dashboard", hint: "Monitor saved deals" },
      { label: "Reports", icon: FaChartPie, href: "/insights", hint: "Share with leaders" },
    ],
    []
  );

  const insightCards = useMemo(
    () => [
      {
        title: "Trending Categories",
        value: categories[0]?.[0] || "Construction",
        meta: `${categories[0]?.[1] || 0} active tenders in focus`,
        icon: FaMagic,
        tone: "tone-cyan",
      },
      {
        title: "Most Active Departments",
        value: stateDistribution[0]?.name || "Procurement",
        meta: `${stateDistribution[0]?.value || 0} live opportunities`,
        icon: FaBriefcase,
        tone: "tone-blue",
      },
      {
        title: "States with Highest Opportunities",
        value: stateDistribution[0]?.name || "Maharashtra",
        meta: `${stateDistribution[0]?.value || 0} tenders tracked`,
        icon: FaMapMarkedAlt,
        tone: "tone-indigo",
      },
      {
        title: "Average Budget",
        value: formatCurrency(averageTenderValue),
        meta: `Across ${totalTenders} tenders`,
        icon: FaWallet,
        tone: "tone-violet",
      },
      {
        title: "Closing Soon Alerts",
        value: `${closingSoon.length}`,
        meta: closingSoon[0]?.title || "No urgent items",
        icon: FaRegClock,
        tone: "tone-warning",
      },
      {
        title: "AI Recommendation Summary",
        value: `${recommendedForYou.length || recommended.length}`,
        meta: "Ranked by fit, deadline, and budget", 
        icon: FaRobot,
        tone: "tone-teal",
      },
    ],
    [averageTenderValue, categories, closingSoon, recommended.length, recommendedForYou.length, stateDistribution, totalTenders]
  );

  const recentUpdates = useMemo(
    () => [
      {
        label: "AI watchlist refreshed",
        detail: `${savedTenders.length} tenders pinned for follow-up`,
      },
      {
        label: "Deadline risk increased",
        detail: `${closingSoon.length} tenders need attention this week`,
      },
      {
        label: "Opportunity pipeline updated",
        detail: `${totalTenders} tenders are currently in motion`,
      },
    ],
    [closingSoon.length, savedTenders.length, totalTenders]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = quickSearch.trim();
    if (!query) {
      navigate("/tenders");
      return;
    }

    const nextSearches = [query, ...recentSearches.filter((entry) => entry !== query)].slice(0, 5);
    setRecentSearches(nextSearches);
    saveRecentSearches(nextSearches);
    navigate(`/tenders?q=${encodeURIComponent(query)}`);
  };

  const userName = useMemo(() => {
    if (typeof window === "undefined") return "Admin";
    try {
      const auth = JSON.parse(window.localStorage.getItem("tenderAuth") || "{}");
      return auth.username || "Admin";
    } catch {
      return "Admin";
    }
  }, []);

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">TI</span>
          <div>
            <strong>Tender Intelligence</strong>
            <small>AI analytics workspace</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <button type="button" className="sidebar-link active" onClick={() => navigate("/dashboard")}>
            <FaChartLine /> Overview
          </button>
          <button type="button" className="sidebar-link" onClick={() => navigate("/tenders")}>
            <FaBriefcase /> Tenders
          </button>
          <button type="button" className="sidebar-link" onClick={() => navigate("/insights")}>
            <FaLightbulb /> AI Insights
          </button>
          <button type="button" className="sidebar-link" onClick={() => navigate("/add-tender")}>
            <FaWallet /> Add Tender
          </button>
        </nav>

        <div className="sidebar-panel">
          <span className="sidebar-eyebrow">Live pulse</span>
          <strong>{liveRatio}% active</strong>
          <small>
            {savedTenders.length} saved and {deadlineReminders.length} near-deadline items tracked.
          </small>
        </div>
      </aside>

      <div className="dashboard-content">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dashboard-topbar">
          <div className="dashboard-welcome">
            <span className="dashboard-eyebrow">Enterprise procurement intelligence</span>
            <h1>
              {getGreeting(currentTime)}, {userName}
            </h1>
            <p>{currentTime.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p>
          </div>

          <div className="topbar-tools">
            <form className="global-search" onSubmit={handleSearchSubmit}>
              <FaSearch />
              <input
                placeholder="Search tenders, buyers, locations"
                value={quickSearch}
                onChange={(event) => setQuickSearch(event.target.value)}
              />
              <button type="submit">Search</button>
            </form>

            <div className="topbar-actions">
              <button type="button" className="icon-button" aria-label="Notifications">
                <FaBell />
              </button>
              <div className="profile-chip">
                <FaUserCircle />
                <div>
                  <strong>{userName}</strong>
                  <small>Operations lead</small>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {sampleMode ? (
          <div className="dashboard-banner">
            Showing sample tender intelligence because the backend is not available.
          </div>
        ) : null}

        <section className="dashboard-toolbar">
          <label>
            <FaFilter />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="closing">Closing soon</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
            </select>
            <FaChevronDown className="select-chevron" />
          </label>

          <label>
            <FaSlidersH />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map(([category]) => (
                <option key={category} value={String(category).toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
            <FaChevronDown className="select-chevron" />
          </label>

          <button type="button" onClick={() => navigate("/insights")}>
            <FaRobot /> Open AI Insights
          </button>
        </section>

        <section className="metric-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
            : metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="dashboard-eyebrow">AI insights</span>
              <h2>Command center overview</h2>
            </div>
            <button type="button" onClick={() => navigate("/insights")}>
              Explore insights <FaArrowRight />
            </button>
          </div>

          <div className="insight-grid">
            {insightCards.map((card) => (
              <InsightCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <div className="dashboard-main-grid">
          <div className="main-stack">
            <section className="dashboard-section analytics-section">
              <div className="section-heading">
                <div>
                  <span className="dashboard-eyebrow">Analytics</span>
                  <h2>Performance intelligence</h2>
                </div>
              </div>

              <div className="chart-grid">
                <motion.article whileHover={{ y: -3 }} className="chart-card">
                  <div className="chart-card-head">
                    <h3>Tender by State</h3>
                    <span>Regional demand</span>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stateDistribution}>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.article>

                <motion.article whileHover={{ y: -3 }} className="chart-card">
                  <div className="chart-card-head">
                    <h3>Tender by Category</h3>
                    <span>Portfolio mix</span>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={categoryBreakdown} dataKey="value" outerRadius={78} innerRadius={48} paddingAngle={3}>
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={entry.name} fill={index % 2 === 0 ? "#22d3ee" : "#2563eb"} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.article>

                <motion.article whileHover={{ y: -3 }} className="chart-card wide-card">
                  <div className="chart-card-head">
                    <h3>Monthly Tender Trend</h3>
                    <span>Momentum over time</span>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="tenders" stroke="#67e8f9" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.article>

                <motion.article whileHover={{ y: -3 }} className="chart-card">
                  <div className="chart-card-head">
                    <h3>Open vs Closed</h3>
                    <span>Current lifecycle</span>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={trendLine}>
                        <defs>
                          <linearGradient id="openClosedFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Area type="monotone" dataKey="active" stroke="#22d3ee" fill="url(#openClosedFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.article>

                <motion.article whileHover={{ y: -3 }} className="chart-card">
                  <div className="chart-card-head">
                    <h3>Budget Distribution</h3>
                    <span>Opportunity sizing</span>
                  </div>
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={budgetDistribution} dataKey="value" outerRadius={80} innerRadius={50} paddingAngle={3}>
                          {budgetDistribution.map((entry, index) => (
                            <Cell key={entry.name} fill={index === 0 ? "#22d3ee" : index === 1 ? "#38bdf8" : index === 2 ? "#2563eb" : "#0f172a"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.article>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <span className="dashboard-eyebrow">Quick actions</span>
                  <h2>Accelerate your workflow</h2>
                </div>
              </div>

              <div className="quick-action-grid">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.01 }}
                      key={action.label}
                      type="button"
                      className="quick-action"
                      onClick={() => navigate(action.href)}
                    >
                      <span className="quick-action-icon">
                        <Icon />
                      </span>
                      <div>
                        <strong>{action.label}</strong>
                        <small>{action.hint}</small>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-section table-section">
              <div className="section-heading">
                <div>
                  <span className="dashboard-eyebrow">Recent tenders</span>
                  <h2>Professional pipeline view</h2>
                </div>
              </div>

              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Department</th>
                      <th>State</th>
                      <th>Budget</th>
                      <th>Closing</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan="6">
                            <SkeletonCard />
                          </td>
                        </tr>
                      ))
                    ) : filteredRecent.length ? (
                      filteredRecent.map((tender) => (
                        <tr key={tender.id} onClick={() => navigate(`/tender/${tender.id}`)}>
                          <td>{tender.title}</td>
                          <td>{tender.organization}</td>
                          <td>{tender.location}</td>
                          <td>{formatCurrency(tender.amountValue || 0)}</td>
                          <td>{formatDate(tender.deadline)}</td>
                          <td>
                            <span className={`status-pill ${isActive(tender.deadline) ? "status-open" : "status-closed"}`}>
                              {isActive(tender.deadline) ? "Open" : "Closed"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          <EmptyState
                            title="No tenders match the current filters"
                            description="Clear the filters or search term to bring results back."
                            actionLabel="Reset filters"
                            onAction={() => {
                              setQuickSearch("");
                              setStatusFilter("all");
                              setCategoryFilter("all");
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="dashboard-rail">
            <motion.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rail-card sticky-card">
              <div className="section-heading compact">
                <div>
                  <span className="dashboard-eyebrow">Upcoming deadlines</span>
                  <h3>Priority watchlist</h3>
                </div>
              </div>
              <div className="timeline-list">
                {deadlineReminders.length ? (
                  deadlineReminders.map((tender) => (
                    <div key={tender.id} className="timeline-item">
                      <span className="timeline-dot" />
                      <div>
                        <strong>{tender.title}</strong>
                        <p>{tender.organization}</p>
                      </div>
                      <small>{daysUntil(tender.deadline)}d</small>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No urgent deadlines" description="Your attention list is clear." />
                )}
              </div>
            </motion.section>

            <section className="rail-card">
              <div className="section-heading compact">
                <div>
                  <span className="dashboard-eyebrow">Top organizations</span>
                  <h3>High-value buyers</h3>
                </div>
              </div>
              <div className="org-list">
                {stateDistribution.slice(0, 4).map((entry) => (
                  <div key={entry.name} className="org-row">
                    <span>{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="rail-card">
              <div className="section-heading compact">
                <div>
                  <span className="dashboard-eyebrow">Recent activity</span>
                  <h3>Live updates</h3>
                </div>
              </div>
              <div className="activity-list">
                {recentUpdates.map((item) => (
                  <div key={item.label} className="activity-row">
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rail-card">
              <div className="section-heading compact">
                <div>
                  <span className="dashboard-eyebrow">AI suggestions</span>
                  <h3>Recommended next steps</h3>
                </div>
              </div>
              <div className="suggestion-list">
                {recommended.slice(0, 3).map((tender) => (
                  <button key={tender.id} type="button" onClick={() => navigate(`/tender/${tender.id}`)}>
                    <strong>{tender.title}</strong>
                    <small>{getRecommendationLabel(tender)}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="rail-card">
              <div className="section-heading compact">
                <div>
                  <span className="dashboard-eyebrow">Recent searches</span>
                  <h3>Quick revisit</h3>
                </div>
              </div>
              <div className="search-list">
                {recentSearches.length ? (
                  recentSearches.map((entry) => (
                    <button key={entry} type="button" onClick={() => navigate(`/tenders?q=${encodeURIComponent(entry)}`)}>
                      {entry}
                    </button>
                  ))
                ) : (
                  <p className="muted">Searches will appear here after your next query.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
