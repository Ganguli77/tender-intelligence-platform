import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBell,
  FaBookmark,
  FaBolt,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartArea,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaClock,
  FaEye,
  FaFilter,
  FaGlobeAsia,
  FaLock,
  FaMapMarkerAlt,
  FaRegBookmark,
  FaRegStar,
  FaRobot,
  FaRupeeSign,
  FaShareAlt,
  FaShieldAlt,
  FaSlidersH,
  FaThLarge,
  FaTimes,
  FaWaveSquare,
} from "react-icons/fa";
import { getTenders, normalizeTender, resolveTenderCollection } from "../api/tenders";
import AISearchBar from "../components/AISearchBar";
import { tenders as fallbackTenders } from "../data/tenders";
import "./TenderPages.css";

const PAGE_SIZE = 8;

// Quick filter labels shown above the tender marketplace results.
const quickFilters = [
  "Construction",
  "IT Services",
  "Healthcare",
  "Power",
  "Railways",
  "Roads",
  "Education",
  "Defence",
  "Water Supply",
  "Smart City",
  "Solar",
  "More",
];

// Suggested searches help users try common procurement queries quickly.
const recentSearches = [
  "PWD Maharashtra bridges",
  "AI score above 80",
  "Solar EPC closing soon",
  "Healthcare equipment",
];

// Sort controls available for ranking tender marketplace results.
const sortOptions = ["Closing Soon", "Highest Value", "AI Score", "Recently Added", "Most Viewed"];

// Extracts the state from a tender location for filtering and display.
function extractState(location = "") {
  const parts = String(location)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || "Not specified";
}

// Normalizes backend and fallback tender status values into marketplace labels.
function getStatus(tender) {
  const normalized = String(tender.status || "").trim().toLowerCase();
  if (normalized === "closed" || normalized === "expired") return "Closed";
  if (normalized === "upcoming") return "Upcoming";
  if (normalized === "open" || normalized === "closing soon") return "Open";

  if (!tender.deadline || tender.deadline === "Not specified") return "Open";
  return new Date(tender.deadline) < new Date() ? "Closed" : "Open";
}

// Checks if a tender deadline is still active.
function isActive(deadline) {
  if (!deadline || deadline === "Not specified") return true;
  return new Date(deadline) >= new Date();
}

// Formats tender dates for cards and metadata rows.
function formatDate(date) {
  if (!date || date === "Not specified") return "Not specified";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Converts tender values into compact INR labels.
function formatCompactAmount(value) {
  const number = Number(value || 0);
  if (!number) return "INR 0";
  if (number >= 10000000) return `INR ${(number / 10000000).toFixed(1)} Cr`;
  return `INR ${(number / 100000).toFixed(1)} L`;
}

// Calculates days remaining before a tender closes.
function daysUntil(deadline) {
  if (!deadline || deadline === "Not specified") return 45;
  const today = new Date();
  const due = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

// Generates an AI score for sorting and qualifying tender opportunities.
function tenderScore(tender) {
  const days = daysUntil(tender.deadline);
  const value = Number(tender.amountValue || 0);
  let score = 54;

  if (value >= 150000000) score += 18;
  else if (value >= 50000000) score += 12;
  else if (value > 0) score += 6;

  if (days >= 30) score += 14;
  else if (days >= 14) score += 8;
  else if (days >= 0) score -= 8;
  else score -= 24;

  if ((tender.documents || []).length <= 4) score += 5;
  if ((tender.eligibility || []).length >= 4) score -= 4;

  return Math.max(8, Math.min(98, score));
}

// Estimates risk level from deadline pressure, value, and document complexity.
function riskLevel(tender) {
  const days = daysUntil(tender.deadline);
  const value = Number(tender.amountValue || 0);
  const complexity = (tender.documents || []).length + (tender.eligibility || []).length;
  const risk = (days < 12 ? 2 : 0) + (value >= 150000000 ? 2 : 0) + (complexity >= 9 ? 1 : 0);

  if (days < 0 || risk >= 4) return "High";
  if (risk >= 2) return "Medium";
  return "Low";
}

// Turns a numeric score into a readable opportunity label.
function opportunityLevel(score) {
  if (score >= 78) return "Prime";
  if (score >= 62) return "Strong";
  return "Selective";
}

// Estimates expected competition from tender value and eligibility depth.
function competitionLevel(tender) {
  const value = Number(tender.amountValue || 0);
  if (value >= 150000000) return "High";
  if ((tender.eligibility || []).length >= 4) return "Medium";
  return "Low";
}

// Estimates success probability by combining score and risk.
function successEstimate(score, risk) {
  const riskPenalty = risk === "High" ? 18 : risk === "Medium" ? 8 : 0;
  return Math.max(22, Math.min(92, score - riskPenalty + 6));
}

// Shortens long tender descriptions for marketplace cards.
function shortScope(tender) {
  const text = tender.description || `Tender for ${tender.category} work with ${tender.organization}.`;
  return text.length > 112 ? `${text.slice(0, 109)}...` : text;
}

// Creates the default advanced filter state for the marketplace.
function createEmptyFilters() {
  return {
    search: "",
    state: "ALL",
    department: "",
    organization: "",
    category: "ALL",
    status: "ALL",
    minValue: "",
    maxValue: "",
    maxEmd: "",
    aiScore: 55,
    publishedFrom: "",
    publishedTo: "",
    closingFrom: "",
    closingTo: "",
  };
}

// Converts URL status parameters into the labels used by this page.
function normalizeStatusParam(value = "ALL") {
  if (value === "ACTIVE") return "Open";
  if (value === "EXPIRED") return "Closed";
  return value || "ALL";
}

// Initializes filter state from the current URL search parameters.
function getFiltersFromSearchParams(searchParams) {
  return {
    ...createEmptyFilters(),
    search: searchParams.get("q") || "",
    status: normalizeStatusParam(searchParams.get("status") || "ALL"),
    category: searchParams.get("category") || "ALL",
  };
}

// Small line chart used inside KPI and insight cards.
function MiniLine({ values = [18, 42, 30, 64, 50, 82] }) {
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${42 - (value / 100) * 34}`)
    .join(" ");

  return (
    <svg className="metric-sparkline" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${values.join("-")}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="55%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={`url(#spark-${values.join("-")})`} strokeWidth="3" />
      <polyline points={`0,44 ${points} 100,44`} fill="rgba(37, 99, 235, 0.12)" stroke="none" />
    </svg>
  );
}

// Circular AI score badge shown on each tender card.
function CircularScore({ score }) {
  const style = { "--score": score };
  return (
    <div className="ai-score-ring" style={style} aria-label={`${score}% AI score`}>
      <span>{score}</span>
      <small>AI</small>
    </div>
  );
}

export default function TenderList() {
  // Marketplace state controls tender data, filters, saved items, sorting, pagination, and loading.
  const [tenders, setTenders] = useState([]);
  const [sampleMode, setSampleMode] = useState(false);
  const [searchParams] = useSearchParams();
  const searchParamKey = searchParams.toString();
  const [appliedSearchParamKey, setAppliedSearchParamKey] = useState(searchParamKey);
  const [filters, setFilters] = useState(() => getFiltersFromSearchParams(searchParams));
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedTenderIds") || "[]");
    } catch {
      return [];
    }
  });
  const [sortBy, setSortBy] = useState("AI Score");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Normalized fallback records keep the marketplace populated when the API is unavailable.
  const normalizedFallback = useMemo(() => fallbackTenders.map(normalizeTender), []);

  // Syncs component filters whenever URL search parameters change.
  if (appliedSearchParamKey !== searchParamKey) {
    setAppliedSearchParamKey(searchParamKey);
    setFilters(getFiltersFromSearchParams(searchParams));
    setCurrentPage(1);
  }

  // Fetches tender data after filter changes, with a short debounce for smoother typing.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = {
        q: filters.search.trim(),
        state: filters.state,
        organization: filters.organization.trim(),
        category: filters.category,
        status: filters.status,
        minValue: filters.minValue,
        maxValue: filters.maxValue,
        publishedFrom: filters.publishedFrom,
        publishedTo: filters.publishedTo,
        closingFrom: filters.closingFrom,
        closingTo: filters.closingTo,
      };

      setLoading(true);
      getTenders(params)
        .then((data) => {
          setTenders(resolveTenderCollection(data, normalizedFallback));
          setSampleMode(false);
        })
        .catch(() => {
          setTenders(normalizedFallback);
          setSampleMode(true);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters, normalizedFallback]);

  // Builds state filter options from loaded tenders.
  const states = useMemo(() => {
    const values = tenders.map((tender) => extractState(tender.location)).filter(Boolean);
    return ["ALL", ...new Set(values)].slice(0, 18);
  }, [tenders]);

  // Builds organization suggestions from loaded tenders.
  const organizations = useMemo(() => {
    const values = tenders.map((tender) => tender.organization).filter(Boolean);
    return [...new Set(values)].slice(0, 24);
  }, [tenders]);

  // Builds category filter options from loaded tenders.
  const categories = useMemo(() => {
    const names = tenders.map((tender) => tender.category).filter(Boolean);
    return ["ALL", ...new Set(names)];
  }, [tenders]);

  // Finds the highest available tender value for the budget slider.
  const maxTenderValue = useMemo(
    () => Math.max(...tenders.map((tender) => Number(tender.amountValue || 0)), 250000000),
    [tenders]
  );

  // Sums tender value for marketplace summary cards.
  const totalTenderValue = useMemo(
    () => tenders.reduce((sum, tender) => sum + Number(tender.amountValue || 0), 0),
    [tenders]
  );

  // Applies all advanced filters to the tender collection.
  const filteredTenders = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return tenders.filter((tender) => {
      const score = tenderScore(tender);
      const haystack = [
        tender.title,
        tender.organization,
        tender.category,
        tender.location,
        tender.referenceNo,
        tender.description,
        tender.buyerType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesState =
        filters.state === "ALL" || extractState(tender.location).toLowerCase() === filters.state.toLowerCase();
      const matchesDepartment =
        !filters.department ||
        String(tender.organization || "").toLowerCase().includes(filters.department.toLowerCase());
      const matchesOrganization =
        !filters.organization ||
        String(tender.organization || "").toLowerCase().includes(filters.organization.toLowerCase());
      const matchesCategory =
        filters.category === "ALL" || String(tender.category || "").toLowerCase() === filters.category.toLowerCase();
      const matchesStatus =
        filters.status === "ALL" || getStatus(tender).toLowerCase() === filters.status.toLowerCase();
      const matchesMin = !filters.minValue || Number(tender.amountValue || 0) >= Number(filters.minValue);
      const matchesMax = !filters.maxValue || Number(tender.amountValue || 0) <= Number(filters.maxValue);
      const matchesAiScore = score >= Number(filters.aiScore || 0);

      const publishedDate =
        tender.publishedDate && tender.publishedDate !== "Not specified" ? new Date(tender.publishedDate) : null;
      const deadlineDate =
        tender.deadline && tender.deadline !== "Not specified" ? new Date(tender.deadline) : null;

      const matchesPublishedFrom =
        !filters.publishedFrom || !publishedDate || publishedDate >= new Date(filters.publishedFrom);
      const matchesPublishedTo =
        !filters.publishedTo || !publishedDate || publishedDate <= new Date(filters.publishedTo);
      const matchesClosingFrom =
        !filters.closingFrom || !deadlineDate || deadlineDate >= new Date(filters.closingFrom);
      const matchesClosingTo =
        !filters.closingTo || !deadlineDate || deadlineDate <= new Date(filters.closingTo);

      return (
        matchesSearch &&
        matchesState &&
        matchesDepartment &&
        matchesOrganization &&
        matchesCategory &&
        matchesStatus &&
        matchesMin &&
        matchesMax &&
        matchesAiScore &&
        matchesPublishedFrom &&
        matchesPublishedTo &&
        matchesClosingFrom &&
        matchesClosingTo
      );
    });
  }, [filters, tenders]);

  // Sorts filtered tenders according to the selected marketplace sort mode.
  const sortedTenders = useMemo(() => {
    const next = [...filteredTenders];
    if (sortBy === "Closing Soon") next.sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline));
    if (sortBy === "Highest Value") next.sort((a, b) => Number(b.amountValue || 0) - Number(a.amountValue || 0));
    if (sortBy === "AI Score") next.sort((a, b) => tenderScore(b) - tenderScore(a));
    if (sortBy === "Recently Added") next.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    if (sortBy === "Most Viewed") next.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return next;
  }, [filteredTenders, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTenders.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, totalPages);
  // Selects the current page of tender cards for display.
  const paginatedTenders = useMemo(() => {
    const start = (visiblePage - 1) * PAGE_SIZE;
    return sortedTenders.slice(start, start + PAGE_SIZE);
  }, [sortedTenders, visiblePage]);

  const activeCount = tenders.filter((tender) => isActive(tender.deadline)).length;
  const averageScore = filteredTenders.length
    ? Math.round(filteredTenders.reduce((sum, tender) => sum + tenderScore(tender), 0) / filteredTenders.length)
    : 0;

  // Top marketplace metric cards summarize the current data set.
  const metricCards = [
    { label: "Total Tenders", value: tenders.length.toLocaleString("en-IN"), trend: "+18.4%", icon: FaBriefcase, line: [14, 36, 32, 60, 74, 88] },
    { label: "Active Tenders", value: activeCount.toLocaleString("en-IN"), trend: "+11.2%", icon: FaClock, line: [22, 28, 44, 50, 68, 76] },
    { label: "Departments", value: organizations.length.toLocaleString("en-IN"), trend: "+7.8%", icon: FaBuilding, line: [18, 34, 38, 52, 48, 70] },
    { label: "States Covered", value: Math.max(states.length - 1, 0).toLocaleString("en-IN"), trend: "+4.1%", icon: FaGlobeAsia, line: [30, 32, 44, 58, 66, 72] },
    { label: "Total Tender Value", value: formatCompactAmount(totalTenderValue), trend: "+23.6%", icon: FaRupeeSign, line: [8, 20, 46, 42, 76, 92] },
    { label: "AI Processed Today", value: "1,284", trend: "+31.9%", icon: FaRobot, line: [24, 42, 38, 72, 68, 94] },
  ];

  // Active filter tags show the current marketplace constraints and how to clear each one.
  const activeTags = [
    filters.search ? { label: `Search: ${filters.search}`, key: "search", value: "" } : null,
    filters.state !== "ALL" ? { label: filters.state, key: "state", value: "ALL" } : null,
    filters.category !== "ALL" ? { label: filters.category, key: "category", value: "ALL" } : null,
    filters.status !== "ALL" ? { label: filters.status, key: "status", value: "ALL" } : null,
    Number(filters.aiScore) !== 55 ? { label: `AI Score > ${filters.aiScore}`, key: "aiScore", value: 55 } : null,
    filters.closingTo ? { label: "Closing Soon", key: "closingTo", value: "" } : null,
  ].filter(Boolean);

  // Toggles a tender in local saved/bookmarked storage.
  const toggleSaved = (id) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("savedTenderIds", JSON.stringify(next));
      return next;
    });
  };

  // Resets all marketplace filters back to their defaults.
  const clearFilters = () => {
    setFilters(createEmptyFilters());
    setCurrentPage(1);
  };
  // Updates a single advanced filter and returns pagination to the first page.
  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };
  // Updates result sorting and returns pagination to the first page.
  const updateSort = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };
  const handleShareTender = (event, tender) => {
    event.stopPropagation();
    const url = `${window.location.origin}/tender/${tender.id}`;
    if (navigator.share) {
      navigator.share({ title: tender.title, text: tender.description, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url).catch(() => undefined);
  };
  return (
    <main className="tender-page tender-marketplace">
      {/* Marketplace background provides the premium animated dashboard atmosphere. */}
      <div className="marketplace-bg" aria-hidden="true">
        <span className="mesh-orb orb-one" />
        <span className="mesh-orb orb-two" />
        <span className="mesh-orb orb-three" />
        <span className="particle particle-one" />
        <span className="particle particle-two" />
        <span className="particle particle-three" />
      </div>

      {/* Marketplace hero introduces AI tender discovery and shows the average opportunity score. */}
      <motion.section
        className="marketplace-hero"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div>
          <span className="tender-eyebrow premium-eyebrow">
            <FaBolt /> AI Tender Marketplace
          </span>
          <h1>Explore AI Tender Marketplace</h1>
          <p>
            Discover, analyze and compare government and private tenders across India using AI-powered intelligence.
          </p>
          {sampleMode ? (
            <small className="sample-mode-note">Showing sample tender intelligence because the backend is offline.</small>
          ) : null}
        </div>
        <div className="hero-intel-card">
          <span>Live procurement radar</span>
          <strong>{averageScore}%</strong>
          <p>Average AI opportunity score across the current market view.</p>
          <MiniLine values={[28, 44, 38, 66, 72, 90]} />
        </div>
      </motion.section>

      {/* KPI grid summarizes marketplace volume, coverage, value, and AI processing. */}
      <section className="market-kpi-grid" aria-label="Tender metrics">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              className="market-kpi-card"
              key={card.label}
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.06, duration: 0.42 }}
            >
              <div className="kpi-icon"><Icon /></div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.trend} vs last month</small>
              <MiniLine values={card.line} />
            </motion.article>
          );
        })}
      </section>

      {/* Main marketplace shell contains filters, results, and right-side AI insights. */}
      <section className="marketplace-shell">
        {/* Advanced filter sidebar controls state, department, value, date, score, and status. */}
        <aside className="filter-sidebar premium-filter-panel" aria-label="Advanced tender filters">
          <div className="filter-sidebar-head">
            <div>
              <span className="tender-eyebrow">Advanced Filters</span>
              <h2><FaSlidersH /> Intelligence Layer</h2>
            </div>
            <span className="active-filter-pill">{activeTags.length} active</span>
          </div>

          <label className="sidebar-field">
            <span><FaMapMarkerAlt /> State / UT</span>
            <select value={filters.state} onChange={(event) => updateFilter("state", event.target.value)}>
              {states.map((item) => (
                <option key={item} value={item}>{item === "ALL" ? "All States" : item}</option>
              ))}
            </select>
            <FaChevronDown className="select-chevron" />
          </label>

          <label className="sidebar-field">
            <span><FaBuilding /> Department</span>
            <input
              placeholder="Public Works, Health..."
              value={filters.department}
              onChange={(event) => updateFilter("department", event.target.value)}
            />
          </label>

          <label className="sidebar-field">
            <span><FaBriefcase /> Organization</span>
            <input
              list="organization-options"
              placeholder="Type an organization"
              value={filters.organization}
              onChange={(event) => updateFilter("organization", event.target.value)}
            />
            <datalist id="organization-options">
              {organizations.map((item) => <option key={item} value={item} />)}
            </datalist>
          </label>

          <label className="sidebar-field">
            <span><FaFilter /> Category</span>
            <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>{item === "ALL" ? "All Categories" : item}</option>
              ))}
            </select>
            <FaChevronDown className="select-chevron" />
          </label>

          <div className="sidebar-range-group">
            <div className="sidebar-range-head">
              <span><FaRupeeSign /> Tender Value Slider</span>
              <small>{formatCompactAmount(filters.maxValue || maxTenderValue)}</small>
            </div>
            <input
              type="range"
              min="0"
              max={maxTenderValue}
              step="5000000"
              value={Number(filters.maxValue || maxTenderValue)}
              onChange={(event) => updateFilter("maxValue", event.target.value)}
            />
          </div>

          <div className="sidebar-range-group">
            <div className="sidebar-range-head">
              <span><FaShieldAlt /> EMD Slider</span>
              <small>{filters.maxEmd ? `INR ${filters.maxEmd} L` : "Any EMD"}</small>
            </div>
            <input
              type="range"
              min="0"
              max="75"
              value={filters.maxEmd || 75}
              onChange={(event) => updateFilter("maxEmd", event.target.value)}
            />
          </div>

          <div className="sidebar-date-grid">
            <label className="sidebar-field compact">
              <span><FaCalendarAlt /> Closing Date</span>
              <input type="date" value={filters.closingTo} onChange={(event) => updateFilter("closingTo", event.target.value)} />
            </label>
            <label className="sidebar-field compact">
              <span><FaCalendarAlt /> Published Date</span>
              <input type="date" value={filters.publishedFrom} onChange={(event) => updateFilter("publishedFrom", event.target.value)} />
            </label>
          </div>

          <div className="sidebar-range-group">
            <div className="sidebar-range-head">
              <span><FaRobot /> AI Score Slider</span>
              <small>{filters.aiScore}+</small>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              value={filters.aiScore}
              onChange={(event) => updateFilter("aiScore", event.target.value)}
            />
          </div>

          <label className="sidebar-field">
            <span><FaClock /> Status</span>
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Upcoming">Upcoming</option>
            </select>
            <FaChevronDown className="select-chevron" />
          </label>

          <div className="sidebar-actions">
            <button className="clear-filter-button" type="button" onClick={clearFilters}><FaTimes /> Reset Filters</button>
            <button type="button" className="apply-filter-button" onClick={() => setCurrentPage(1)}><FaCheck /> Apply Filters</button>
          </div>
        </aside>

        {/* Main results column contains search, quick filters, sorting, metrics, cards, and pagination. */}
        <section className="market-main">
          {/* Enterprise search panel supports AI keyword search and smart suggestions. */}
          <section className="enterprise-search-panel">
            <AISearchBar
              value={filters.search}
              loading={loading}
              onChange={(value) => updateFilter("search", value)}
              onSearch={(value) => updateFilter("search", value)}
            />
            <div className="recent-searches">
              {recentSearches.map((item) => (
                <button key={item} type="button" onClick={() => updateFilter("search", item)}>{item}</button>
              ))}
            </div>
          </section>

          {/* Quick chips provide one-click category filtering. */}
          <section className="quick-chip-row" aria-label="Quick filters">
            {quickFilters.map((item) => (
              <button
                key={item}
                type="button"
                className={filters.category === item || (item === "IT Services" && filters.category === "IT") ? "selected" : ""}
                onClick={() => updateFilter("category", item === "More" ? "ALL" : item === "IT Services" ? "IT" : item)}
              >
                {item}
              </button>
            ))}
          </section>

          {/* Active tags show the current high-level marketplace filter context. */}
          <section className="active-tags-row">
            {activeTags.map((tag) => (
              <span key={tag.label}>{tag.label}<button type="button" aria-label={`Remove ${tag.label}`} onClick={() => updateFilter(tag.key, tag.value)}><FaTimes /></button></span>
            ))}
          </section>

          {/* Sort bar controls result order and switches between grid/list views. */}
          <section className="sort-bar">
            <div>
              <span>Sort by</span>
              {sortOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={sortBy === item ? "selected" : ""}
                  onClick={() => updateSort(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="view-toggle" aria-label="View toggle">
              <button type="button" className={viewMode === "grid" ? "selected" : ""} onClick={() => setViewMode("grid")}><FaThLarge /> Grid</button>
              <button type="button" className={viewMode === "list" ? "selected" : ""} onClick={() => setViewMode("list")}><FaBalanceScale /> List</button>
            </div>
          </section>

          {/* Market signal cards summarize matched opportunities, average score, and watchlist count. */}
          <section className="market-signal premium-signal">
            <div>
              <span>Matched Opportunities</span>
              <strong>{sortedTenders.length}</strong>
              <small>{loading ? "Refreshing intelligence" : "Ready for review"}</small>
            </div>
            <div>
              <span>Average AI Score</span>
              <strong>{averageScore}%</strong>
              <small>Fit, timing, and value signal</small>
            </div>
            <div>
              <span>Saved Watchlist</span>
              <strong>{savedIds.length}</strong>
              <small>Procurement desk shortlist</small>
            </div>
          </section>

          {/* Empty state appears when the current filters return no tender matches. */}
          {sortedTenders.length === 0 ? (
            <section className="empty-state premium-empty-state">
              <h2>No tenders match these filters</h2>
              <p>Try broadening state, category, score, or date filters to return more marketplace opportunities.</p>
              <button type="button" className="detail-back" onClick={clearFilters}>Clear filters</button>
            </section>
          ) : (
            <>
              {/* Tender results grid renders each marketplace opportunity card. */}
              <section className={`tender-grid premium-tender-grid ${viewMode === "list" ? "list-view" : ""}`}>
                {paginatedTenders.map((tender, index) => {
                  const score = tenderScore(tender);
                  const risk = riskLevel(tender);
                  const success = successEstimate(score, risk);
                  const saved = savedIds.includes(tender.id);
                  const statusLabel = getStatus(tender);

                  return (
                    <motion.article
                      className={`tender-card premium-tender-card risk-${risk.toLowerCase()}`}
                      key={tender.id}
                      onClick={() => navigate(`/tender/${tender.id}`)}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035, duration: 0.36 }}
                    >
                      <div className="card-reflection" aria-hidden="true" />
                      <div className="tender-card-top">
                        <div className="org-lockup">
                          <span>{String(tender.organization || "AI").slice(0, 2).toUpperCase()}</span>
                          <div>
                            <strong>{tender.organization}</strong>
                            <small>{extractState(tender.location)} procurement</small>
                          </div>
                        </div>
                        <span className={statusLabel === "Open" ? "status-pill active" : "status-pill expired"}>{statusLabel}</span>
                      </div>

                      <div className="premium-card-title-row">
                        <h2>{tender.title}</h2>
                        <CircularScore score={score} />
                      </div>

                      <p className="tender-org">{shortScope(tender)}</p>

                      <div className="tender-detail-grid">
                        <span><FaBuilding /> {tender.organization}</span>
                        <span><FaMapMarkerAlt /> {extractState(tender.location)}</span>
                        <span><FaRegStar /> {tender.referenceNo}</span>
                        <span><FaFilter /> {tender.category}</span>
                        <span><FaRupeeSign /> Budget: {tender.amount}</span>
                        <span><FaShieldAlt /> EMD: {tender.bidSecurity || "As per RFP"}</span>
                        <span><FaCalendarAlt /> Published: {formatDate(tender.publishedDate)}</span>
                        <span><FaClock /> Closing: {formatDate(tender.deadline)}</span>
                      </div>

                      <div className="intelligence-grid">
                        <article><span>Opportunity</span><strong>{opportunityLevel(score)}</strong></article>
                        <article><span>Competition</span><strong>{competitionLevel(tender)}</strong></article>
                        <article><span>Risk</span><strong>{risk}</strong></article>
                        <article><span>Success</span><strong>{success}%</strong></article>
                      </div>

                      <div className="tender-card-footer">
                        <small><FaEye /> {1800 + tender.id * 41} views</small>
                        <div className="tender-card-actions">
                          <button
                            className={saved ? "icon-action selected" : "icon-action"}
                            type="button"
                            aria-label={saved ? "Remove bookmark" : "Bookmark tender"}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSaved(tender.id);
                            }}
                          >
                            {saved ? <FaBookmark /> : <FaRegBookmark />}
                          </button>
                          <button className="icon-action" type="button" aria-label="Share tender" onClick={(event) => handleShareTender(event, tender)}>
                            <FaShareAlt />
                          </button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/tender/${tender.id}`); }}>View Details <FaArrowRight /></button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </section>

              {/* Pagination controls move through the filtered tender result pages. */}
              <section className="pagination-bar" aria-label="Tender pagination">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1}>Previous</button>
                <span>Page {visiblePage} of {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={visiblePage >= totalPages}>Next</button>
              </section>
            </>
          )}
        </section>

        {/* Right insight panel provides market analytics, recent items, trends, alerts, and recommendations. */}
        <aside className="right-insights-panel" aria-label="AI market insights">
          <section className="insight-card market-chart-card">
            <span className="tender-eyebrow">AI Market Insights</span>
            <h3>Monthly tenders</h3>
            <strong>{activeCount}</strong>
            <p>{formatCompactAmount(totalTenderValue)} total indexed value</p>
            <MiniLine values={[18, 26, 52, 46, 70, 84]} />
          </section>

          <section className="insight-card">
            <h3>Recently Viewed</h3>
            {paginatedTenders.slice(0, 3).map((tender) => (
              <button key={tender.id} type="button" onClick={() => navigate(`/tender/${tender.id}`)}>
                <span>{tender.title}</span>
                <small>{tender.amount}</small>
              </button>
            ))}
          </section>

          <section className="insight-card">
            <h3>Trending Categories</h3>
            {categories.slice(1, 6).map((category) => (
              <div className="trend-row" key={category}>
                <span>{category}</span>
                <strong>+{12 + category.length}%</strong>
              </div>
            ))}
          </section>

          <section className="insight-card alert-card">
            <h3>Latest Alerts</h3>
            <p><FaBell /> 7 high-value tenders close within the next 14 days.</p>
            <p><FaWaveSquare /> AI detected rising activity in Smart City and Water Supply.</p>
          </section>

          <section className="insight-card recommendation-card">
            <h3>AI Recommendations</h3>
            <p>Prioritize Prime-score tenders with low risk and closing windows above 21 days.</p>
            <button type="button" onClick={() => navigate("/insights")}>Open AI Insights <FaArrowRight /></button>
          </section>
        </aside>
      </section>

      {/* Feature grid explains the marketplace capabilities at the bottom of the page. */}
      <section className="market-feature-grid">
        {[
          { icon: FaRobot, title: "AI Powered", copy: "Automated fit scoring, risk detection, and bid readiness." },
          { icon: FaChartLine, title: "Real-time Data", copy: "Fresh tender signals for public and private procurement desks." },
          { icon: FaChartArea, title: "Smart Analytics", copy: "Market movement, category velocity, and state-level trends." },
          { icon: FaLock, title: "Enterprise Security", copy: "Role-aware workflows for sensitive procurement decisions." },
        ].map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title}>
              <Icon />
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          );
        })}
      </section>

      {/* Floating action button is reserved for creating AI tender alerts. */}
      <button className="floating-alert-cta" type="button" onClick={() => navigate("/insights")}>
        <FaBell /> Create AI Tender Alert
      </button>
    </main>
  );
}
