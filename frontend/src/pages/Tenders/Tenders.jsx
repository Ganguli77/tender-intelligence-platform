import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  BookmarkCheck,
  Calendar,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { getSavedTenders as getBackendSavedTenders, getTenders, removeSavedTender, saveTender } from "../../api/tenders";
import TenderCard from "../../components/cards/TenderCard";
import Pagination from "../../components/common/Pagination";
import { tenders as fallbackTenders } from "../../data/tenders";
import {
  getSavedTenderIds,
  removeSavedTender as removeLocalSavedTender,
  saveTender as saveLocalTender,
  SAVED_TENDERS_EVENT,
  toggleSavedTender,
} from "../../utils/savedTenders";
import "./Tenders.css";

const ITEMS_PER_PAGE = 12;

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

const sortOptions = [
  { value: "closingSoon", label: "Closing Soon" },
  { value: "highestValue", label: "Highest Value" },
  { value: "aiScore", label: "AI Score" },
  { value: "recentlyAdded", label: "Recently Added" },
  { value: "mostViewed", label: "Most Viewed" },
];

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

  return sorted.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
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

function SkeletonGrid() {
  return (
    <div className="tenders-grid" aria-label="Loading tenders">
      {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
        <article className="tender-skeleton" key={index}>
          <span />
          <strong />
          <p />
          <p />
          <div />
        </article>
      ))}
    </div>
  );
}

export default function Tenders() {
  const [allTenders, setAllTenders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState("closingSoon");
  const [currentPage, setCurrentPage] = useState(1);
  const [savedTenderIds, setSavedTenderIds] = useState(getSavedTenderIds);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTabletFilterOpen, setIsTabletFilterOpen] = useState(true);

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
        }
      }
    }

    loadTenders();

    return () => {
      isMounted = false;
    };
  }, []);

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

      return (
        matchesText(tender, searchQuery) &&
        (!filters.state || tender.state === filters.state) &&
        (!filters.category || tender.category === filters.category) &&
        (!filters.organization || tender.organization === filters.organization) &&
        (!filters.status || tender.status === filters.status) &&
        valueMatches &&
        scoreMatches &&
        isAfterOrSame(tender.publishedDate, filters.publishedDate) &&
        isBeforeOrSame(tender.deadline, filters.deadlineDate)
      );
    });

    return applySort(results, sortBy);
  }, [allTenders, filters, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTenders.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedTenders = filteredTenders.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  function handleSearchChange(value) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
    setCurrentPage(1);
  }

  function handleSortChange(value) {
    setSortBy(value);
    setCurrentPage(1);
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setSearchQuery("");
    setCurrentPage(1);
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
    <section className="tenders-page">
      <div className="tenders-shell">
        <header className="tenders-hero">
          <div>
            <span className="tenders-eyebrow">Tender Marketplace</span>
            <h1>Find high-fit procurement opportunities faster.</h1>
            <p>
              Search live tenders, compare AI match signals, and narrow large procurement pipelines into
              actionable opportunities.
            </p>
          </div>

          <div className="tenders-hero__stats" aria-label="Marketplace summary">
            <article>
              <strong>{allTenders.length}</strong>
              <span>Total tenders</span>
            </article>
            <article>
              <strong>{filteredTenders.length}</strong>
              <span>Matching results</span>
            </article>
            <article>
              <strong>{savedTenderIds.length}</strong>
              <span>Saved tenders</span>
            </article>
          </div>
        </header>

        <div className="tenders-toolbar">
          <label className="tenders-search" htmlFor="tender-search">
            <Search size={19} />
            <input
              id="tender-search"
              type="search"
              placeholder="Search by title, organization, or keyword"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </label>

          <div className="tenders-toolbar__actions">
            <button className="tenders-filter-toggle" type="button" onClick={() => setIsFilterOpen(true)}>
              <SlidersHorizontal size={18} />
              Filters
            </button>
            <button
              className="tenders-tablet-toggle"
              type="button"
              onClick={() => setIsTabletFilterOpen((isOpen) => !isOpen)}
            >
              <Filter size={18} />
              {isTabletFilterOpen ? "Hide filters" : "Show filters"}
            </button>

            <label className="tenders-sort" htmlFor="tender-sort">
              <ArrowDownUp size={17} />
              <select id="tender-sort" value={sortBy} onChange={(event) => handleSortChange(event.target.value)}>
                {sortOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error ? (
          <div className="tenders-alert" role="status">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : null}
        {saveStatus ? (
          <div className="tenders-alert" role="status">
            <BookmarkCheck size={18} />
            {saveStatus}
          </div>
        ) : null}

        <div className="tenders-layout">
          <div className={isTabletFilterOpen ? "tenders-sidebar" : "tenders-sidebar tenders-sidebar--collapsed"}>
            <FilterPanel
              filters={filters}
              options={options}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>

          <main className="tenders-results">
            <div className="tenders-results__head">
              <div>
                <span>
                  <Calendar size={16} />
                  12 per page
                </span>
                <strong>
                  Showing {paginatedTenders.length ? (activePage - 1) * ITEMS_PER_PAGE + 1 : 0}-
                  {Math.min(activePage * ITEMS_PER_PAGE, filteredTenders.length)} of {filteredTenders.length}
                </strong>
              </div>
            </div>

            {isLoading ? <SkeletonGrid /> : null}

            {!isLoading && paginatedTenders.length ? (
              <div className="tenders-grid">
                {paginatedTenders.map((tender) => (
                  <TenderCard
                    tender={tender}
                    key={tender.id}
                    isSaved={savedTenderIds.includes(String(tender.id))}
                    onToggleSaved={handleToggleSaved}
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && !paginatedTenders.length ? (
              <div className="tenders-empty">
                <Search size={34} />
                <h2>No tenders match these filters</h2>
                <p>Try a broader keyword, remove a date constraint, or reset filters to restart discovery.</p>
                <button className="tenders-reset tenders-reset--center" type="button" onClick={handleResetFilters}>
                  <RotateCcw size={16} />
                  Reset filters
                </button>
              </div>
            ) : null}

            <Pagination currentPage={activePage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </main>
        </div>
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
    </section>
  );
}
