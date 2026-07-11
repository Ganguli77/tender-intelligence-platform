import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Bookmark,
  Bot,
  CalendarDays,
  Crown,
  FileText,
  Grid2X2,
  LayoutDashboard,
  List,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { getTenderMarketplace, normalizeTenderForMarketplace } from "../api/tenderApi";
import TenderCard, {
  deriveAiScore,
  formatTenderValue,
  getMatchLabel,
  isClosingSoon,
  isExpiredTender,
} from "../components/TenderCard";
import EmptyState from "../components/tenders/EmptyState";
import TenderFilters from "../components/tenders/TenderFilters";
import TenderPagination from "../components/tenders/TenderPagination";
import TenderSkeleton from "../components/tenders/TenderSkeleton";
import TenderTabs from "../components/tenders/TenderTabs";
import { useAuth } from "../context/useAuth";
import { tenders as fallbackTenders } from "../data/tenders";
import "./TenderPages.css";

const initialFilters = {
  searchTerm: "",
  category: "",
  department: "",
  location: "",
  minValue: "",
  maxValue: "",
  closingFrom: "",
  closingTo: "",
  tenderType: "",
  sortBy: "closingDate",
};

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Tenders", icon: CalendarDays, path: "/tenders", active: true },
  { label: "AI Opportunities", icon: Sparkles, path: "/insights" },
  { label: "Saved Tenders", icon: Bookmark, path: "/saved-tenders" },
  { label: "Alerts", icon: Bell, path: "/alerts" },
  { label: "AI Chatbot", icon: Bot, path: "/insights" },
  { label: "Analytics", icon: BarChart3, path: "/dashboard" },
  { label: "Reports", icon: FileText, path: "/dashboard" },
  { label: "Profile", icon: User, path: "/dashboard" },
  { label: "Settings", icon: Settings, path: "/dashboard" },
];

function uniqueOptions(items, resolver) {
  return Array.from(new Set(items.map(resolver).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function getLocationState(tender) {
  return String(tender.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
}

function getTenderType(tender) {
  const text = `${tender.tenderType || ""} ${tender.buyerType || ""} ${tender.category || ""} ${tender.title || ""}`.toLowerCase();
  if (text.includes("limited")) return "Limited";
  if (text.includes("eoi") || text.includes("expression")) return "EOI";
  return "Open";
}

function getDeadlineTime(tender) {
  const value = tender.deadline || tender.closingDate;
  const time = value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function tenderMatchesTab(tender, tab) {
  if (tab === "active") return !isExpiredTender(tender);
  if (tab === "closingSoon") return !isExpiredTender(tender) && isClosingSoon(tender);
  if (tab === "expired") return isExpiredTender(tender);
  if (tab === "matches") return deriveAiScore(tender) >= 80;
  return true;
}

function filterTenders(tenders, filters, statusTab) {
  const query = filters.searchTerm.trim().toLowerCase();
  const minValue = Number(filters.minValue);
  const maxValue = Number(filters.maxValue);
  const closingFrom = filters.closingFrom ? new Date(filters.closingFrom).getTime() : null;
  const closingTo = filters.closingTo ? new Date(filters.closingTo).getTime() : null;

  return tenders.filter((tender) => {
    const haystack = [
      tender.title,
      tender.organization,
      tender.department,
      tender.category,
      tender.location,
      tender.referenceNo,
      tender.description,
    ]
      .join(" ")
      .toLowerCase();
    const value = Number(tender.amountValue || tender.value || 0);
    const deadlineTime = getDeadlineTime(tender);

    return (
      (!query || haystack.includes(query)) &&
      (!filters.category || tender.category === filters.category) &&
      (!filters.department || (tender.organization || tender.department) === filters.department) &&
      (!filters.location || getLocationState(tender) === filters.location) &&
      (!filters.tenderType || getTenderType(tender) === filters.tenderType) &&
      (!filters.minValue || value >= minValue) &&
      (!filters.maxValue || value <= maxValue) &&
      (!closingFrom || deadlineTime >= closingFrom) &&
      (!closingTo || deadlineTime <= closingTo) &&
      tenderMatchesTab(tender, statusTab)
    );
  });
}

function sortTenders(tenders, sortBy) {
  const sorted = [...tenders];

  if (sortBy === "aiScore") {
    return sorted.sort((a, b) => deriveAiScore(b) - deriveAiScore(a));
  }

  if (sortBy === "value") {
    return sorted.sort((a, b) => Number(b.amountValue || 0) - Number(a.amountValue || 0));
  }

  return sorted.sort((a, b) => getDeadlineTime(a) - getDeadlineTime(b));
}

function exportTenders(tenders) {
  const headers = ["Tender ID", "Title", "Department", "Location", "Value", "Closing Date", "AI Score", "Match"];
  const rows = tenders.map((tender) => [
    tender.referenceNo || tender.id,
    tender.title,
    tender.organization || tender.department,
    tender.location,
    formatTenderValue(tender),
    tender.deadline || tender.closingDate || "",
    deriveAiScore(tender),
    getMatchLabel(deriveAiScore(tender)),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nextender-tenders.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TenderList() {
  const navigate = useNavigate();
  const { user, username } = useAuth();
  const [allTenders, setAllTenders] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [statusTab, setStatusTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nextenderSavedTenderIds") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const controller = new AbortController();
      async function loadTenders() {
        setLoading(true);
        setError("");

        try {
          const tenders = await getTenderMarketplace(
            {
              q: filters.searchTerm,
              category: filters.category,
              department: filters.department,
              location: filters.location,
              minValue: filters.minValue,
              maxValue: filters.maxValue,
              closingFrom: filters.closingFrom,
              closingTo: filters.closingTo,
              tenderType: filters.tenderType,
              sortBy: filters.sortBy,
            },
            { signal: controller.signal }
          );
          setAllTenders(tenders.map(normalizeTenderForMarketplace));
        } catch (loadError) {
          if (loadError.name !== "AbortError") {
            setAllTenders(fallbackTenders.map(normalizeTenderForMarketplace));
            setError("Live tender API is unavailable. Showing the bundled tender marketplace sample.");
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }

      loadTenders();
      return () => controller.abort();
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [
    filters.searchTerm,
    filters.category,
    filters.department,
    filters.location,
    filters.minValue,
    filters.maxValue,
    filters.closingFrom,
    filters.closingTo,
    filters.tenderType,
    filters.sortBy,
  ]);

  const options = useMemo(
    () => ({
      categories: uniqueOptions(allTenders, (tender) => tender.category),
      departments: uniqueOptions(allTenders, (tender) => tender.organization || tender.department),
      locations: uniqueOptions(allTenders, getLocationState),
    }),
    [allTenders]
  );

  const tabCounts = useMemo(
    () => ({
      all: allTenders.length,
      active: allTenders.filter((tender) => !isExpiredTender(tender)).length,
      closingSoon: allTenders.filter((tender) => !isExpiredTender(tender) && isClosingSoon(tender)).length,
      expired: allTenders.filter(isExpiredTender).length,
      matches: allTenders.filter((tender) => deriveAiScore(tender) >= 80).length,
    }),
    [allTenders]
  );

  const filteredTenders = useMemo(
    () => sortTenders(filterTenders(allTenders, filters, statusTab), filters.sortBy),
    [allTenders, filters, statusTab]
  );

  const totalPages = Math.max(1, Math.ceil(filteredTenders.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedTenders = filteredTenders.slice((activePage - 1) * pageSize, activePage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, statusTab, pageSize]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setStatusTab("all");
  }

  function toggleSaved(tenderId) {
    setSavedIds((current) => {
      const id = String(tenderId);
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("nextenderSavedTenderIds", JSON.stringify(next));
      return next;
    });
  }

  function saveSearch() {
    localStorage.setItem("nextenderSavedSearch", JSON.stringify({ filters, statusTab, savedAt: new Date().toISOString() }));
  }

  const displayName = user?.name || username || "NexTender User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="premium-dashboard-shell">
      <aside className="premium-sidebar">
        <button className="premium-brand" type="button" onClick={() => navigate("/dashboard")}>
          <span>N</span>
          <strong>NexTender <b>AI</b></strong>
        </button>

        <nav aria-label="Dashboard navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={item.active ? "is-active" : ""}
                onClick={() => navigate(item.path)}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="premium-upgrade-card">
          <Crown size={19} />
          <strong>Upgrade to Pro</strong>
          <p>Unlock advanced AI insight, unlimited search, and personalized alerts.</p>
          <button type="button">Upgrade Now</button>
        </div>

        <button className="premium-support-card" type="button">
          <span>Need Help?</span>
          <strong>Contact Support</strong>
        </button>
      </aside>

      <div className="premium-dashboard-main">
        <header className="premium-topbar">
          <button type="button" aria-label="Menu" className="premium-top-icon">
            <Menu size={22} />
          </button>
          <label className="premium-command-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search tenders, departments, keywords..."
              value={filters.searchTerm}
              onChange={(event) => updateFilter("searchTerm", event.target.value)}
            />
            <span>Ctrl + K</span>
          </label>
          <div className="premium-top-actions">
            <button type="button" className="premium-top-icon notification-dot" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button type="button" className="premium-top-icon" aria-label="Theme">
              <Moon size={20} />
            </button>
            <button type="button" className="premium-profile-button">
              <span>{user?.picture ? <img src={user.picture} alt="" /> : initials}</span>
              <i>
                <strong>{displayName}</strong>
                <small>Premium Plan</small>
              </i>
            </button>
          </div>
        </header>

        <motion.main
          className="premium-tender-page"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
      <header className="premium-tender-header">
        <div>
          <span className="premium-kicker">
            <Sparkles size={15} />
            AI-powered marketplace
          </span>
          <h1>Tenders</h1>
          <p>Find and analyze the best government and private tenders</p>
        </div>

        <div className="premium-header-actions">
          <button type="button" className="premium-outline-button" onClick={saveSearch}>
            <Bookmark size={18} />
            Save Search
          </button>
          <button type="button" className="premium-primary-button" onClick={() => navigate("/alerts")}>
            <Bell size={18} />
            Create Alert
          </button>
        </div>
      </header>

      <TenderFilters
        filters={filters}
        options={options}
        loading={loading}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        onSearch={() => setCurrentPage(1)}
        onExport={() => exportTenders(filteredTenders)}
      />

      {error ? (
        <div className="premium-tender-alert" role="status">
          <RefreshCw size={16} />
          {error}
        </div>
      ) : null}

      <section className="premium-results-panel">
        <TenderTabs activeTab={statusTab} counts={tabCounts} onChange={setStatusTab} />

        <div className="premium-results-meta">
          <span>Total Results: {filteredTenders.length.toLocaleString("en-IN")}</span>
          <div className="premium-view-toggle" aria-label="Tender view mode">
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List size={17} />
            </button>
            <button
              type="button"
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid2X2 size={17} />
            </button>
          </div>
        </div>

        <div className={`premium-table premium-table-${viewMode}`}>
          <div className="premium-table-head">
            <span>Tender Details</span>
            <span>Department</span>
            <span>Value</span>
            <span>Closing Date</span>
            <span>AI Score</span>
            <span>Action</span>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <TenderSkeleton rows={pageSize} key="skeleton" />
            ) : paginatedTenders.length ? (
              paginatedTenders.map((tender, index) => (
                <TenderCard
                  key={tender.id || tender.referenceNo}
                  tender={tender}
                  index={index}
                  isSaved={savedIds.includes(String(tender.id))}
                  onView={(id) => navigate(`/tenders/${id}`)}
                  onToggleSaved={toggleSaved}
                />
              ))
            ) : (
              <EmptyState key="empty" onClearFilters={resetFilters} icon={Search} />
            )}
          </AnimatePresence>
        </div>

        <TenderPagination
          currentPage={activePage}
          pageSize={pageSize}
          totalItems={filteredTenders.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>
        </motion.main>
      </div>
    </div>
  );
}
