import { motion } from "framer-motion";
import {
  Building2,
  Bookmark,
  ChevronRight,
  Cloud,
  Database,
  Eye,
  Factory,
  Landmark,
  MapPin,
  Shield,
} from "lucide-react";

import { calculateDaysLeft, deriveAiScore, formatTenderValue, getMatchLabel, parseTenderDate } from "../utils/tenderDisplay";
import AIScoreBadge from "./tenders/AIScoreBadge";

function formatCrore(tender = {}) {
  const value = Number(tender.amountValue || tender.value || 0);
  if (!value) return "";
  return `${(value / 10000000).toFixed(2)} Cr`;
}

function formatClosingDate(value) {
  const date = parseTenderDate(value);
  if (!date) return "Not specified";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDaysLeft(tender) {
  const daysLeft = calculateDaysLeft(tender);
  if (daysLeft === null) return "Date pending";
  if (daysLeft < 0) return "Expired";
  if (daysLeft === 0) return "Closes today";
  return `${daysLeft} days left`;
}

function TenderCategoryIcon({ tender }) {
  const text = `${tender.category || ""} ${tender.title || ""}`.toLowerCase();
  if (text.includes("cloud") || text.includes("it") || text.includes("software")) return <Cloud size={23} />;
  if (text.includes("data")) return <Database size={23} />;
  if (text.includes("security") || text.includes("cyber")) return <Shield size={23} />;
  if (text.includes("construction") || text.includes("road")) return <Landmark size={23} />;
  if (text.includes("manufacturing") || text.includes("equipment")) return <Factory size={23} />;
  return <Building2 size={23} />;
}

function tenderType(tender) {
  const text = `${tender.tenderType || ""} ${tender.buyerType || ""} ${tender.title || ""}`.toLowerCase();
  if (text.includes("limited")) return "Limited Tender";
  if (text.includes("eoi") || text.includes("expression")) return "EOI";
  return "Open Tender";
}

export default function TenderCard({ tender, index = 0, isSaved = false, onView, onToggleSaved }) {
  const score = deriveAiScore(tender);
  const id = tender.id || tender.referenceNo;

  return (
    <motion.article
      className="premium-tender-row"
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, delay: index * 0.025 }}
      whileHover={{ y: -3 }}
    >
      <div className="premium-tender-details">
        <span className="premium-category-icon">
          <TenderCategoryIcon tender={tender} />
        </span>
        <div>
          <div className="premium-title-line">
            <h2>{tender.title || "Untitled tender"}</h2>
            {index < 3 ? <span className="premium-new-pill">New</span> : null}
          </div>
          <p>TID: {tender.referenceNo || `TND-${id}`}</p>
          <div className="premium-tag-row">
            <span>{tender.category || "General"}</span>
            <span>{tenderType(tender)}</span>
          </div>
        </div>
      </div>

      <div className="premium-department-cell">
        <strong>{tender.organization || tender.department || "Department not specified"}</strong>
        <span>
          <MapPin size={15} />
          {tender.location || "Location not specified"}
        </span>
      </div>

      <div className="premium-value-cell">
        <strong>{formatTenderValue(tender)}</strong>
        <span>{formatCrore(tender)}</span>
      </div>

      <div className="premium-date-cell">
        <strong>{formatClosingDate(tender.deadline || tender.closingDate)}</strong>
        <span>{formatDaysLeft(tender)}</span>
      </div>

      <div className="premium-score-cell">
        <AIScoreBadge score={score} />
        <span>{getMatchLabel(score)}</span>
      </div>

      <div className="premium-action-cell">
        <button type="button" aria-label="View tender" title="View" onClick={() => onView?.(id)}>
          <Eye size={18} />
        </button>
        <button
          type="button"
          className={isSaved ? "is-saved" : ""}
          aria-label={isSaved ? "Remove saved tender" : "Save tender"}
          title={isSaved ? "Saved" : "Save"}
          onClick={() => onToggleSaved?.(id)}
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <button type="button" aria-label="Open tender details" title="Details" onClick={() => onView?.(id)}>
          <ChevronRight size={19} />
        </button>
      </div>
    </motion.article>
  );
}
