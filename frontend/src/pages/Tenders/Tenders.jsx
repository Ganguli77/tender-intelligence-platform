import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  BookmarkCheck,
  CalendarDays,
  Check,
  Clock3,
  Leaf,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Settings2,
  Zap,
  X,
} from "lucide-react";

import { getSavedTenders as getBackendSavedTenders, getTenders, removeSavedTender, saveTender } from "../../api/tenders";
import { tenders as fallbackTenders } from "../../data/tenders";
import {
  getSavedTenderIds,
  removeSavedTender as removeLocalSavedTender,
  saveTender as saveLocalTender,
  SAVED_TENDERS_EVENT,
  toggleSavedTender,
} from "../../utils/savedTenders";
import "./Tenders.css";

const FEED_LIMIT = 5;

const initialFilters = {
  state: "",
  category: "",
  organization: "",
  status: "",
  minValue: "",
  maxValue: "",
  publishedDate: "",
  deadlineDate: "",
  minAiScore: "",
  maxAiScore: "",
};

function normalizeForMarketplace(tender, index) {
  const source = tender || {};
  const location = source.location || "Not specified";
  const state = source.state || location.split(",").map((part) => part.trim()).filter(Boolean).at(-1) || "Not specified";
  const amountValue = Number(source.amountValue ?? source.value ?? 0);
  const aiScore = Number(source.aiScore ?? source.matchScore ?? 72 + ((index * 7) % 24));
  const views = Number(source.views ?? source.viewCount ?? 120 + ((index + 3) * 47) % 1600);

  return {
    ...source,
    id: source.id ?? source._id ?? source.referenceNo ?? `tender-${index}`,
    title: source.title || source.name || "Untitled Tender",
    organization: source.organization || source.org || "Not specified",
    category: source.category || "General",
    location,
    state,
    status: source.status || "Open",
    amountValue: Number.isFinite(amountValue) ? amountValue : 0,
    publishedDate: source.publishedDate || source.createdAt || "",
    deadline: source.deadline || source.deadlineDate || "",
    aiScore: Math.min(100, Math.max(0, Number.isFinite(aiScore) ? aiScore : 0)),
    views: Number.isFinite(views) ? views : 0,
    description: source.description || "Procurement opportunity with eligibility, document, and submission requirements.",
  };
}

function uniqueSorted(items, key) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function matchesText(tender, query) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [
    tender.title,
    tender.organization,
    tender.category,
    tender.location,
    tender.description,
    tender.referenceNo,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

function isAfterOrSame(value, selectedDate) {
  if (!selectedDate) {
    return true;
  }

  return parseDate(value) >= parseDate(selectedDate);
}

function isBeforeOrSame(value, selectedDate) {
  if (!selectedDate) {
    return true;
  }

  return parseDate(value) <= parseDate(selectedDate);
}

function daysUntil(value) {
  const deadline = value ? new Date(value) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) return null;
  return Math.ceil((deadline.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

function formatValue(tender) {
  const amount = Number(tender.amountValue);
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount > 0) return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
  return tender.amount || "Value undisclosed";
}

function formatClosingDate(value) {
  const days = daysUntil(value);
  if (days !== null && days >= 0) return `${days} Days Left`;
  if (days !== null) return "Closed";
  if (!value || value === "Not specified") return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getMarketplaceStatus(tender) {
  const days = daysUntil(tender.deadline);
  if (days !== null && days < 0) return "Closed";
  if (days !== null && days <= 30) return "Closing Soon";
  return tender.status || (days === null ? "New" : "Active");
}

function formatMarketplaceDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const format = (date) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  return `${format(start)} - ${format(end)}`;
}

function applySort(tenders, sortBy) {
  const sorted = [...tenders];

  if (sortBy === "highestValue") {
    return sorted.sort((a, b) => b.amountValue - a.amountValue);
  }

  if (sortBy === "aiScore") {
    return sorted.sort((a, b) => b.aiScore - a.aiScore);
  }

  if (sortBy === "recentlyAdded") {
    return sorted.sort((a, b) => parseDate(b.publishedDate) - parseDate(a.publishedDate));
  }

  if (sortBy === "mostViewed") {
    return sorted.sort((a, b) => b.views - a.views);
  }

  return sorted.sort((a, b) => {
    const aDays = daysUntil(a.deadline);
    const bDays = daysUntil(b.deadline);
    return (aDays === null || aDays < 0 ? Number.MAX_SAFE_INTEGER : aDays)
      - (bDays === null || bDays < 0 ? Number.MAX_SAFE_INTEGER : bDays);
  });
}

function FilterPanel({ filters, options, onFilterChange, onReset, onClose }) {
  return (
    <aside className="tenders-filters" aria-label="Tender filters">
      <div className="tenders-filters__header">
        <div>
          <span>Refine Results</span>
          <strong>Advanced filters</strong>
        </div>
        <button className="tenders-filters__close" type="button" onClick={onClose} aria-label="Close filters">
          <X size={18} />
        </button>
      </div>

      <div className="tenders-filter-group">
        <label htmlFor="filter-state">State</label>
        <select id="filter-state" value={filters.state} onChange={(event) => onFilterChange("state", event.target.value)}>
          <option value="">All states</option>
          {options.states.map((state) => (
            <option value={state} key={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="tenders-filter-group">
        <label htmlFor="filter-category">Category</label>
        <select id="filter-category" value={filters.category} onChange={(event) => onFilterChange("category", event.target.value)}>
          <option value="">All categories</option>
          {options.categories.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="tenders-filter-group">
        <label htmlFor="filter-organization">Organization</label>
        <select
          id="filter-organization"
          value={filters.organization}
          onChange={(event) => onFilterChange("organization", event.target.value)}
        >
          <option value="">All organizations</option>
          {options.organizations.map((organization) => (
            <option value={organization} key={organization}>
              {organization}
            </option>
          ))}
        </select>
      </div>

      <div className="tenders-filter-group">
        <label htmlFor="filter-status">Status</label>
        <select id="filter-status" value={filters.status} onChange={(event) => onFilterChange("status", event.target.value)}>
          <option value="">All statuses</option>
          {options.statuses.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="tenders-filter-grid">
        <div className="tenders-filter-group">
          <label htmlFor="filter-min-value">Minimum value</label>
          <input
            id="filter-min-value"
            type="number"
            min="0"
            placeholder="INR"
            value={filters.minValue}
            onChange={(event) => onFilterChange("minValue", event.target.value)}
          />
        </div>
        <div className="tenders-filter-group">
          <label htmlFor="filter-max-value">Maximum value</label>
          <input
            id="filter-max-value"
            type="number"
            min="0"
            placeholder="INR"
            value={filters.maxValue}
            onChange={(event) => onFilterChange("maxValue", event.target.value)}
          />
        </div>
      </div>

      <div className="tenders-filter-grid">
        <div className="tenders-filter-group">
          <label htmlFor="filter-published">Published after</label>
          <input
            id="filter-published"
            type="date"
            value={filters.publishedDate}
            onChange={(event) => onFilterChange("publishedDate", event.target.value)}
          />
        </div>
        <div className="tenders-filter-group">
          <label htmlFor="filter-deadline">Deadline before</label>
          <input
            id="filter-deadline"
            type="date"
            value={filters.deadlineDate}
            onChange={(event) => onFilterChange("deadlineDate", event.target.value)}
          />
        </div>
      </div>

      <div className="tenders-filter-grid">
        <div className="tenders-filter-group">
          <label htmlFor="filter-min-score">Minimum AI score</label>
          <input
            id="filter-min-score"
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={filters.minAiScore}
            onChange={(event) => onFilterChange("minAiScore", event.target.value)}
          />
        </div>
        <div className="tenders-filter-group">
          <label htmlFor="filter-max-score">Maximum AI score</label>
          <input
            id="filter-max-score"
            type="number"
            min="0"
            max="100"
            placeholder="100"
            value={filters.maxAiScore}
            onChange={(event) => onFilterChange("maxAiScore", event.target.value)}
          />
        </div>
      </div>

      <button className="tenders-reset" type="button" onClick={onReset}>
        <RotateCcw size={16} />
        Reset filters
      </button>
    </aside>
  );
}

export default function Tenders() {
  const [allTenders, setAllTenders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [savedTenderIds, setSavedTenderIds] = useState(getSavedTenderIds);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [valueBand, setValueBand] = useState("");
  const [quickFilters, setQuickFilters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadTenders() {
      setIsLoading(true);
      setError("");

      try {
        const apiTenders = await getTenders();
        if (isMounted) {
          const source = apiTenders.length ? apiTenders : fallbackTenders;
          setAllTenders(source.map(normalizeForMarketplace));
        }
      } catch (loadError) {
        if (isMounted) {
          setAllTenders(fallbackTenders.map(normalizeForMarketplace));
          setError("Live tender API is unavailable. Showing the bundled marketplace sample.");
          console.error("Tender marketplace fallback:", loadError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadTenders();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedTenderIds() {
      try {
        const saved = await getBackendSavedTenders();
        if (isMounted) {
          setSavedTenderIds(saved.map((item) => String(item.tender?.id)).filter(Boolean));
        }
      } catch {
        if (isMounted) {
          setSavedTenderIds(getSavedTenderIds());
        }
      }
    }

    loadSavedTenderIds();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function syncSavedTenders(event) {
      setSavedTenderIds(Array.isArray(event.detail) ? event.detail : getSavedTenderIds());
    }

    window.addEventListener(SAVED_TENDERS_EVENT, syncSavedTenders);
    window.addEventListener("storage", syncSavedTenders);

    return () => {
      window.removeEventListener(SAVED_TENDERS_EVENT, syncSavedTenders);
      window.removeEventListener("storage", syncSavedTenders);
    };
  }, []);

  const options = useMemo(
    () => ({
      states: uniqueSorted(allTenders, "state"),
      categories: uniqueSorted(allTenders, "category"),
      organizations: uniqueSorted(allTenders, "organization"),
      statuses: uniqueSorted(allTenders, "status"),
    }),
    [allTenders]
  );

  const filteredTenders = useMemo(() => {
    const minValue = Number(filters.minValue);
    const maxValue = Number(filters.maxValue);
    const minAiScore = Number(filters.minAiScore);
    const maxAiScore = Number(filters.maxAiScore);

    const results = allTenders.filter((tender) => {
      const valueMatches =
        (!filters.minValue || tender.amountValue >= minValue) &&
        (!filters.maxValue || tender.amountValue <= maxValue);
      const scoreMatches =
        (!filters.minAiScore || tender.aiScore >= minAiScore) &&
        (!filters.maxAiScore || tender.aiScore <= maxAiScore);
      const daysLeft = daysUntil(tender.deadline);
      const quickFiltersMatch =
        (!quickFilters.includes("ai") || tender.aiScore >= 80) &&
        (!quickFilters.includes("closing") || (daysLeft !== null && daysLeft >= 0 && daysLeft <= 30)) &&
        (!quickFilters.includes("green") || /solar|renewable|energy|green|sustain/i.test(`${tender.category} ${tender.title}`));
      const amountMatches =
        (!valueBand || (valueBand === "under10" && tender.amountValue < 100000000)) &&
        (valueBand !== "10to50" || (tender.amountValue >= 100000000 && tender.amountValue <= 500000000)) &&
        (valueBand !== "over50" || tender.amountValue > 500000000);

      return (
        matchesText(tender, searchQuery) &&
        (!filters.state || tender.state === filters.state) &&
        (!filters.category || tender.category === filters.category) &&
        (!filters.organization || tender.organization === filters.organization) &&
        (!filters.status ||
          (filters.status === "Closing Soon"
            ? daysLeft !== null && daysLeft >= 0 && daysLeft <= 30
            : tender.status === filters.status)) &&
        valueMatches &&
        amountMatches &&
        scoreMatches &&
        quickFiltersMatch &&
        isAfterOrSame(tender.publishedDate, filters.publishedDate) &&
        isBeforeOrSame(tender.deadline, filters.deadlineDate)
      );
    });

    return applySort(results, "closingSoon");
  }, [allTenders, filters, quickFilters, searchQuery, valueBand]);

  const recommendedTenders = filteredTenders.slice(0, 2);
  const feedTenders = filteredTenders.slice(0, FEED_LIMIT);

  function handleSearchChange(value) {
    setSearchQuery(value);
  }

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setSearchQuery("");
    setValueBand("");
    setQuickFilters([]);
  }

  function toggleQuickFilter(filter) {
    setQuickFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current, filter]);
  }

  function refreshMarketplace() {
    setRefreshing(true);
    setRefreshKey((current) => current + 1);
  }

  async function handleToggleSaved(id) {
    const tenderId = String(id);
    const wasSaved = savedTenderIds.includes(tenderId);
    const optimistic = wasSaved
      ? savedTenderIds.filter((savedId) => savedId !== tenderId)
      : Array.from(new Set([...savedTenderIds, tenderId]));

    setSavedTenderIds(optimistic);
    setSaveStatus("");

    try {
      if (wasSaved) {
        await removeSavedTender(tenderId);
        removeLocalSavedTender(tenderId);
      } else {
        await saveTender(tenderId);
        saveLocalTender(tenderId);
      }
      setSaveStatus(wasSaved ? "Tender removed from saved list." : "Tender saved to your workspace.");
    } catch {
      setSavedTenderIds(toggleSavedTender(tenderId));
      setSaveStatus("Backend save failed. Saved locally for this browser.");
    }
  }

  return (
    <main className="marketplace-hud">
      <div className="marketplace-hud__shell">
        <header className="marketplace-hud__heading">
          <h1>Marketplace Dashboard</h1>
          <div className="marketplace-hud__date-actions">
            <span><CalendarDays size={14} /> {formatMarketplaceDateRange()}</span>
            <button type="button" onClick={refreshMarketplace} disabled={refreshing} aria-label="Refresh marketplace tenders">
              <RefreshCw size={14} className={refreshing ? "is-spinning" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </header>

        <section className="marketplace-hud__filters" aria-label="Marketplace filters">
          <label className="marketplace-hud__search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search by title, agency..."
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              aria-label="Search by title or agency"
            />
          </label>
          <label>
            <span className="marketplace-hud__sr-only">Sector</span>
            <select value={filters.category} onChange={(event) => handleFilterChange("category", event.target.value)}>
              <option value="">Sector</option>
              {options.categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span className="marketplace-hud__sr-only">Value</span>
            <select value={valueBand} onChange={(event) => setValueBand(event.target.value)}>
              <option value="">Value</option>
              <option value="under10">Under ₹10 Cr</option>
              <option value="10to50">₹10–50 Cr</option>
              <option value="over50">Over ₹50 Cr</option>
            </select>
          </label>
          <label>
            <span className="marketplace-hud__sr-only">Status</span>
            <select value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)}>
              <option value="">Status</option>
              {options.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              {!options.statuses.includes("Closing Soon") && <option value="Closing Soon">Closing Soon</option>}
            </select>
          </label>
          <button
            className={`marketplace-hud__toggle${filters.minAiScore === "80" ? " is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={filters.minAiScore === "80"}
            onClick={() => handleFilterChange("minAiScore", filters.minAiScore === "80" ? "" : "80")}
          >
            AI Match Score <i />
          </button>
          <button className="marketplace-hud__advanced" type="button" onClick={() => setIsFilterOpen(true)}>
            <Settings2 size={14} /> Advanced Filters
          </button>
          <div className="marketplace-hud__quick-filters">
            <button type="button" className={quickFilters.includes("ai") ? "is-active" : ""} onClick={() => toggleQuickFilter("ai")}>
              <Zap size={12} /> AI Recommended
            </button>
            <button type="button" className={quickFilters.includes("closing") ? "is-active" : ""} onClick={() => toggleQuickFilter("closing")}>
              <Clock3 size={12} /> Closing Soon
            </button>
            <button type="button" className={quickFilters.includes("green") ? "is-active" : ""} onClick={() => toggleQuickFilter("green")}>
              <Leaf size={12} /> Green Energy
            </button>
          </div>
        </section>

        {(error || saveStatus) && (
          <div className={`marketplace-hud__notice${error ? " is-error" : ""}`} role="status">
            <AlertCircle size={14} /> {error || saveStatus}
          </div>
        )}

        <section className="marketplace-hud__recommendations">
          <div className="marketplace-hud__section-title">
            <h2>Recommended For You</h2>
            <span>{filteredTenders.length} matching tenders</span>
          </div>
          {isLoading ? (
            <div className="marketplace-hud__loading">Loading live tender recommendations…</div>
          ) : recommendedTenders.length ? (
            <div className="marketplace-hud__recommendation-grid">
              {recommendedTenders.map((tender, index) => {
                const score = Math.round(tender.aiScore || 0);
                const remaining = daysUntil(tender.deadline);
                const isSaved = savedTenderIds.includes(String(tender.id));
                return (
                  <article className={`marketplace-recommendation${index === 0 ? " is-featured" : ""}`} key={tender.id}>
                    <div className="marketplace-recommendation__main">
                      {index === 0 ? (
                        <div className="marketplace-recommendation__score-ring" style={{ "--match-score": `${score}%` }}>
                          <strong>{score}%</strong><small>Match</small>
                        </div>
                      ) : (
                        <div className="marketplace-recommendation__score-ring is-secondary" style={{ "--match-score": `${score}%` }}>
                          <strong>{score}%</strong><small>Match</small>
                        </div>
                      )}
                      <div className="marketplace-recommendation__details">
                        <div className="marketplace-recommendation__title-row">
                          <h3>{tender.title}</h3>
                          <span className={`marketplace-status is-${getMarketplaceStatus(tender).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{getMarketplaceStatus(tender)}</span>
                        </div>
                        <p>{formatValue(tender)} <i /> {tender.organization} <i /> {tender.location}</p>
                        <div className="marketplace-recommendation__chips">
                          <span>{tender.category}</span>
                          <span>{tender.buyerType || "Government"}</span>
                          <span>{tender.referenceNo}</span>
                        </div>
                        <div className="marketplace-recommendation__metrics">
                          <span><strong>{score}%</strong> Match Score</span>
                          <span><strong>{Array.isArray(tender.eligibility) ? tender.eligibility.length : 0}</strong> Eligibility Criteria</span>
                          <span><strong>{remaining === null ? "—" : remaining < 0 ? "Closed" : `${remaining} Days`}</strong> to Close</span>
                        </div>
                      </div>
                    </div>
                    <div className="marketplace-recommendation__timeline">
                      <i style={{ "--timeline-progress": `${Math.max(6, Math.min(100, remaining === null || remaining < 0 ? 18 : 100 - remaining))}%` }} />
                    </div>
                    <div className="marketplace-recommendation__footer">
                      <span><Check size={12} /> {tender.eligibility?.length ? "Eligibility criteria listed" : "Review eligibility details"}</span>
                      <span><Clock3 size={12} /> {formatClosingDate(tender.deadline)}</span>
                      <button
                        type="button"
                        className={isSaved ? "is-saved" : ""}
                        aria-label={isSaved ? "Remove saved tender" : "Save tender"}
                        onClick={() => handleToggleSaved(tender.id)}
                      >
                        <BookmarkCheck size={13} />
                      </button>
                      <Link to={`/tenders/${tender.id}`} className={index === 0 ? "marketplace-action is-primary" : "marketplace-action"}>
                        {index === 0 ? "Analyze with AI" : "Prepare Bid"} <ArrowUpRight size={13} />
                      </Link>
                    </div>
                    {index === 0 && (
                      <div className="marketplace-recommendation__hover">
                        <span><Check size={13} /> Eligibility requirements</span>
                        <span><Clock3 size={13} /> {formatClosingDate(tender.deadline)}</span>
                        <span><Sparkles size={13} /> AI match score {score}%</span>
                        <Link to={`/tenders/${tender.id}`} className="marketplace-action is-primary">
                          Analyze with AI <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="marketplace-hud__empty">No live tenders match these filters. Adjust the filters or reset them.</div>
          )}
        </section>

        <section className="marketplace-hud__feed">
          <div className="marketplace-hud__section-title">
            <div><h2>Active Tenders Feed</h2><p>Live opportunities ranked by fit and closing timeline</p></div>
            <strong>{filteredTenders.length} results</strong>
          </div>
          <div className="marketplace-feed-table-wrap">
            <table className="marketplace-feed-table">
              <thead>
                <tr>
                  <th>Tender Name / ID</th>
                  <th>Authority</th>
                  <th>Value</th>
                  <th>Closing Date</th>
                  <th>AI Match Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && feedTenders.map((tender) => {
                  const score = Math.round(tender.aiScore || 0);
                  const remaining = daysUntil(tender.deadline);
                  const statusLabel = getMarketplaceStatus(tender);
                  const statusClass = statusLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  return (
                    <tr key={tender.id}>
                      <td>
                        <Link to={`/tenders/${tender.id}`} className="marketplace-feed-table__name">{tender.title}</Link>
                        <small>TID: {tender.referenceNo}</small>
                      </td>
                      <td><span className={`marketplace-status is-${statusClass}`}>{statusLabel}</span></td>
                      <td>{formatValue(tender)}</td>
                      <td>
                        <div className={`marketplace-deadline${remaining !== null && remaining <= 7 ? " is-urgent" : ""}`}>
                          <span>{formatClosingDate(tender.deadline)}</span>
                          <i style={{ "--timeline-progress": `${Math.max(5, Math.min(100, remaining === null || remaining < 0 ? 10 : 100 - remaining))}%` }} />
                        </div>
                      </td>
                      <td><span className={`marketplace-score-pill score-${score >= 85 ? "high" : score >= 70 ? "medium" : "low"}`}>{score}%</span></td>
                      <td><Link className="marketplace-fast-action" to={`/tenders/${tender.id}`}>Fast AI Analysis <ArrowUpRight size={12} /></Link></td>
                    </tr>
                  );
                })}
                {isLoading && <tr><td colSpan="6" className="marketplace-feed-table__empty">Loading live tenders…</td></tr>}
                {!isLoading && !feedTenders.length && <tr><td colSpan="6" className="marketplace-feed-table__empty">No tenders found. Try changing your search or filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="marketplace-hud__feed-footer">
            <span>Showing {feedTenders.length} of {filteredTenders.length} matching tenders</span>
            <button type="button" onClick={handleResetFilters}><RotateCcw size={12} /> Reset Filters</button>
          </div>
        </section>
      </div>

      <div className={`tenders-drawer${isFilterOpen ? " tenders-drawer--open" : ""}`} aria-hidden={!isFilterOpen}>
        <button className="tenders-drawer__backdrop" type="button" onClick={() => setIsFilterOpen(false)} aria-label="Close filters" />
        <div className="tenders-drawer__panel">
          <FilterPanel
            filters={filters}
            options={options}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            onClose={() => setIsFilterOpen(false)}
          />
        </div>
      </div>
    </main>
  );
}
