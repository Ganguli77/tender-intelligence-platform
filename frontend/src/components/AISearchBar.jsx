import { useId, useMemo, useRef, useState } from "react";
import { FaBolt, FaHistory, FaRobot, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";

const SEARCH_HISTORY_KEY = "aiTenderSearchHistory";
const MAX_HISTORY_ITEMS = 5;

const SMART_SUGGESTIONS = [
  "Road Construction",
  "Road Repair",
  "Railway",
  "Electrical",
  "Solar",
  "IT Services",
  "Civil Works",
  "Healthcare",
  "Mining",
  "Supply",
];

const SEARCH_CHIPS = [
  "Road",
  "Construction",
  "IT",
  "Railway",
  "Electrical",
  "Solar",
  "Medical",
  "Supply",
  "Consultancy",
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readSearchHistory() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function writeSearchHistory(history) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
}

function normalizeQuery(query) {
  return String(query || "").trim();
}

export default function AISearchBar({
  value,
  defaultValue = "",
  loading = false,
  onChange,
  onSearch,
  className = "",
}) {
  const searchId = useId();
  const inputRef = useRef(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [history, setHistory] = useState(() => readSearchHistory());
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const query = isControlled ? value : internalValue;
  const trimmedQuery = normalizeQuery(query);

  const filteredSuggestions = useMemo(() => {
    const loweredQuery = trimmedQuery.toLowerCase();
    if (!loweredQuery) {
      return SMART_SUGGESTIONS.slice(0, 6);
    }

    return SMART_SUGGESTIONS
      .filter((item) => item.toLowerCase().includes(loweredQuery))
      .slice(0, 6);
  }, [trimmedQuery]);

  const suggestionItems = suggestionsOpen
    ? filteredSuggestions.map((label) => ({ label, type: "suggestion" }))
    : [];

  const setQuery = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  const saveSearch = (searchTerm) => {
    const normalized = normalizeQuery(searchTerm);
    if (!normalized) {
      return;
    }

    const nextHistory = [
      normalized,
      ...history.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, MAX_HISTORY_ITEMS);

    setHistory(nextHistory);
    writeSearchHistory(nextHistory);
  };

  const runSearch = (searchTerm = query) => {
    const normalized = normalizeQuery(searchTerm);
    if (!normalized || loading) {
      return;
    }

    setQuery(normalized);
    saveSearch(normalized);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    onSearch?.(normalized);
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setSuggestionsOpen(true);
    setActiveSuggestionIndex(-1);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const handleSuggestionSelect = (suggestion) => {
    runSearch(suggestion);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestionsOpen && activeSuggestionIndex >= 0 && suggestionItems[activeSuggestionIndex]) {
        handleSuggestionSelect(suggestionItems[activeSuggestionIndex].label);
        return;
      }
      runSearch();
      return;
    }

    if (!suggestionsOpen || suggestionItems.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestionItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (
        current <= 0 ? suggestionItems.length - 1 : current - 1
      ));
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  return (
    <section className={`ai-search-shell ${className}`}>
      <style>{`
        .ai-search-shell {
          position: relative;
          width: min(100%, 980px);
          color: #fff;
        }

        .ai-search-panel {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(85, 240, 189, 0.18);
          border-radius: 24px;
          background:
            radial-gradient(circle at 12% 0%, rgba(24, 168, 255, 0.14), transparent 30%),
            linear-gradient(145deg, rgba(5, 17, 38, 0.96), rgba(2, 8, 25, 0.98));
          box-shadow: 0 26px 80px rgba(2, 8, 25, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(22px);
        }

        .ai-search-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 36%, rgba(255, 255, 255, 0.08), transparent 64%);
          transform: translateX(-120%);
          animation: aiSearchSheen 4.8s ease-in-out infinite;
          pointer-events: none;
        }

        .ai-search-form {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          gap: 14px;
          min-height: 74px;
          padding: 12px 14px 12px 20px;
        }

        .ai-search-icon,
        .ai-search-clear,
        .ai-search-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .ai-search-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          color: #55f0bd;
          background: rgba(8, 30, 62, 0.72);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .ai-search-input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          color: #fff;
          background: transparent;
          font: inherit;
          font-size: clamp(1rem, 1.5vw, 1.18rem);
          font-weight: 750;
          letter-spacing: 0;
        }

        .ai-search-input::placeholder {
          color: #94a3b8;
          font-weight: 700;
        }

        .ai-search-clear {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 12px;
          color: #cbd5e1;
          background: rgba(15, 23, 42, 0.58);
          cursor: pointer;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .ai-search-clear:hover {
          color: #fff;
          border-color: rgba(85, 240, 189, 0.44);
          background: rgba(8, 30, 62, 0.72);
        }

        .ai-search-button {
          gap: 9px;
          min-height: 46px;
          padding: 0 18px;
          border: 0;
          border-radius: 14px;
          color: #ffffff;
          background: linear-gradient(135deg, #1769ff, #0bc5ea);
          box-shadow: 0 14px 34px rgba(24, 168, 255, 0.18);
          font-weight: 950;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .ai-search-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 46px rgba(85, 240, 189, 0.16);
        }

        .ai-search-button:disabled {
          cursor: not-allowed;
          opacity: 0.58;
          transform: none;
        }

        .ai-search-button .is-spinning {
          animation: aiSearchSpin 0.9s linear infinite;
        }

        .ai-search-badge {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 18px 16px;
          min-height: 32px;
          padding: 0 12px;
          border: 1px solid rgba(85, 240, 189, 0.22);
          border-radius: 999px;
          color: #dbeafe;
          background: rgba(8, 30, 62, 0.58);
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .ai-search-dropdown {
          position: absolute;
          z-index: 20;
          inset: calc(100% + 10px) 0 auto;
          display: grid;
          gap: 10px;
          padding: 14px;
          border: 1px solid rgba(85, 240, 189, 0.18);
          border-radius: 18px;
          background: rgba(2, 8, 20, 0.96);
          box-shadow: 0 24px 70px rgba(2, 8, 25, 0.42), 0 0 34px rgba(24, 168, 255, 0.14);
          backdrop-filter: blur(18px);
        }

        .ai-search-dropdown-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .ai-search-suggestions {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .ai-search-suggestion {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 12px;
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.52);
          font: inherit;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .ai-search-suggestion:hover,
        .ai-search-suggestion.is-active {
          color: #dbeafe;
          border-color: rgba(85, 240, 189, 0.42);
          background: rgba(8, 30, 62, 0.72);
        }

        .ai-search-history,
        .ai-search-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .ai-search-history {
          margin-top: 14px;
        }

        .ai-search-chip,
        .ai-search-history-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid rgba(85, 240, 189, 0.18);
          border-radius: 999px;
          color: #dbeafe;
          background: rgba(8, 30, 62, 0.58);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 850;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .ai-search-chip:hover,
        .ai-search-history-button:hover {
          transform: translateY(-2px);
          border-color: rgba(85, 240, 189, 0.48);
          background: rgba(8, 30, 62, 0.72);
        }

        .ai-search-chips {
          margin-top: 16px;
        }

        .ai-search-loading {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          color: #dbeafe;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .ai-search-loading::before {
          content: "";
          width: 86px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(9, 28, 62, 0.9), rgba(85, 240, 189, 0.72), rgba(9, 28, 62, 0.9));
          background-size: 220% 100%;
          animation: aiSearchLoading 1s ease-in-out infinite;
        }

        @keyframes aiSearchSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes aiSearchSheen {
          0%, 55% { transform: translateX(-120%); opacity: 0; }
          70% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }

        @keyframes aiSearchLoading {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }

        @media (max-width: 720px) {
          .ai-search-panel {
            border-radius: 18px;
          }

          .ai-search-form {
            grid-template-columns: auto 1fr auto;
            gap: 10px;
            min-height: auto;
            padding: 14px;
          }

          .ai-search-button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .ai-search-badge {
            margin: 0 14px 14px;
          }
        }
      `}</style>

      <div className="ai-search-panel">
        <form
          className="ai-search-form"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
        >
          <span className="ai-search-icon" aria-hidden="true">
            <FaSearch />
          </span>
          <input
            ref={inputRef}
            id={`${searchId}-input`}
            className="ai-search-input"
            type="search"
            value={query}
            placeholder="Ask AI to find tenders..."
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen}
            aria-controls={`${searchId}-suggestions`}
            aria-activedescendant={
              activeSuggestionIndex >= 0 ? `${searchId}-suggestion-${activeSuggestionIndex}` : undefined
            }
            onChange={handleInputChange}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {trimmedQuery && (
            <button className="ai-search-clear" type="button" aria-label="Clear AI search" onClick={handleClear}>
              <FaTimes />
            </button>
          )}
          <button className="ai-search-button" type="submit" disabled={!trimmedQuery || loading}>
            {loading ? <FaSpinner className="is-spinning" /> : <FaBolt />}
            Search
          </button>
        </form>

        <span className="ai-search-badge">
          <FaRobot /> AI Smart Search
        </span>
      </div>

      {suggestionsOpen && suggestionItems.length > 0 && (
        <div className="ai-search-dropdown">
          <span className="ai-search-dropdown-title">
            <FaRobot /> Smart suggestions
          </span>
          <ul id={`${searchId}-suggestions`} className="ai-search-suggestions" role="listbox">
            {suggestionItems.map((item, index) => (
              <li key={item.label} role="presentation">
                <button
                  id={`${searchId}-suggestion-${index}`}
                  className={`ai-search-suggestion ${index === activeSuggestionIndex ? "is-active" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionSelect(item.label)}
                >
                  {item.label}
                  <FaSearch aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="ai-search-loading">
          AI is searching tenders...
        </div>
      )}

      {history.length > 0 && (
        <div className="ai-search-history" aria-label="Recent AI searches">
          {history.map((item) => (
            <button className="ai-search-history-button" type="button" key={item} onClick={() => runSearch(item)}>
              <FaHistory /> {item}
            </button>
          ))}
        </div>
      )}

      <div className="ai-search-chips" aria-label="Quick AI search chips">
        {SEARCH_CHIPS.map((chip) => (
          <button className="ai-search-chip" type="button" key={chip} onClick={() => runSearch(chip)}>
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}
