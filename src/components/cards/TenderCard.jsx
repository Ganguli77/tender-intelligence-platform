import { Bookmark, Building2, CalendarClock, IndianRupee, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import "./TenderCard.css";

function formatCurrency(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback || "Value undisclosed";
  }

  if (numericValue >= 10000000) {
    return `INR ${(numericValue / 10000000).toFixed(2)} Cr`;
  }

  if (numericValue >= 100000) {
    return `INR ${(numericValue / 100000).toFixed(2)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDate(value) {
  if (!value || value === "Not specified") {
    return "Not specified";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusClass(status) {
  return String(status || "open")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function TenderCard({ tender, isSaved, onToggleSaved }) {
  const score = Math.round(Number(tender.aiScore ?? tender.matchScore ?? 0));
  const safeScore = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
  const statusClass = getStatusClass(tender.status);

  return (
    <article className="tender-card">
      <div className="tender-card__header">
        <div className="tender-card__category">{tender.category || "General"}</div>
        <button
          className={`tender-card__bookmark${isSaved ? " tender-card__bookmark--saved" : ""}`}
          type="button"
          aria-label={isSaved ? "Remove saved tender" : "Save tender"}
          aria-pressed={isSaved}
          onClick={() => onToggleSaved(tender.id)}
          title={isSaved ? "Remove saved tender" : "Save tender"}
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="tender-card__body">
        <h3>{tender.title}</h3>
        <p className="tender-card__description">{tender.description}</p>
      </div>

      <dl className="tender-card__meta" aria-label="Tender summary">
        <div>
          <dt>
            <Building2 size={15} />
            Organization
          </dt>
          <dd>{tender.organization || "Not specified"}</dd>
        </div>
        <div>
          <dt>
            <MapPin size={15} />
            Location
          </dt>
          <dd>{tender.location || "Not specified"}</dd>
        </div>
        <div>
          <dt>
            <IndianRupee size={15} />
            Value
          </dt>
          <dd>{formatCurrency(tender.amountValue ?? tender.value, tender.amount)}</dd>
        </div>
        <div>
          <dt>
            <CalendarClock size={15} />
            Deadline
          </dt>
          <dd>{formatDate(tender.deadline)}</dd>
        </div>
      </dl>

      <div className="tender-card__signals">
        <span className={`tender-card__status tender-card__status--${statusClass}`}>
          {tender.status || "Open"}
        </span>
        <div className="tender-card__score" aria-label={`AI match score ${safeScore}%`}>
          <span>
            <Sparkles size={15} />
            AI Match
          </span>
          <strong>{safeScore}%</strong>
          <progress value={safeScore} max="100" />
        </div>
      </div>

      <Link className="tender-card__action" to={`/tenders/${tender.id}`}>
        View Details
      </Link>
    </article>
  );
}
