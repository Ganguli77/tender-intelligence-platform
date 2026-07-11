import { motion } from "framer-motion";
import {
  Building2,
  ChevronRight,
  Cloud,
  Database,
  Eye,
  Factory,
  Landmark,
  MapPin,
  Shield,
  Bookmark,
} from "lucide-react";

import AIScoreBadge from "./tenders/AIScoreBadge";

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function calculateDaysLeft(tender) {
  const date = parseDate(tender?.deadline || tender?.closingDate);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

export function isExpiredTender(tender) {
  const daysLeft = calculateDaysLeft(tender);
  return daysLeft !== null && daysLeft < 0;
}

export function isClosingSoon(tender) {
  const daysLeft = calculateDaysLeft(tender);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= 10;
}

export function deriveAiScore(tender = {}) {
  const explicit = Number(tender.aiScore ?? tender.matchScore ?? tender.score);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(100, Math.max(0, Math.round(explicit)));

  const value = Number(tender.amountValue || tender.value || 0);
  const daysLeft = calculateDaysLeft(tender);
  let score = 58;
  if (value >= 200000000) score += 18;
  else if (value >= 80000000) score += 12;
  else if (value >= 25000000) score += 7;
  if (daysLeft === null) score += 4;
  else if (daysLeft >= 20) score += 15;
  else if (daysLeft >= 7) score += 9;
  else if (daysLeft >= 0) score += 1;
  else score -= 24;
  score += String(tender.category || "").length % 8;
  return Math.min(96, Math.max(42, score));
}

export function getMatchLabel(score) {
  if (score >= 80) return "High Match";
  if (score >= 60) return "Medium Match";
  return "Low Match";
}

export function formatTenderValue(tender = {}) {
  if (tender.amount && tender.amount !== "Not specified") return tender.amount.replace("INR", "₹");
  const value = Number(tender.amountValue || tender.value || 0);
  if (!value) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCrore(tender = {}) {
  const value = Number(tender.amountValue || tender.value || 0);
  if (!value) return "";
  return `${(value / 10000000).toFixed(2)} Cr`;
}

function formatClosingDate(value) {
  const date = parseDate(value);
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

function getIcon(tender) {
  const text = `${tender.category || ""} ${tender.title || ""}`.toLowerCase();
  if (text.includes("cloud") || text.includes("it") || text.includes("software")) return Cloud;
  if (text.includes("data")) return Database;
  if (text.includes("security") || text.includes("cyber")) return Shield;
  if (text.includes("construction") || text.includes("road")) return Landmark;
  if (text.includes("manufacturing") || text.includes("equipment")) return Factory;
  return Building2;
}

function tenderType(tender) {
  const text = `${tender.tenderType || ""} ${tender.buyerType || ""} ${tender.title || ""}`.toLowerCase();
  if (text.includes("limited")) return "Limited Tender";
  if (text.includes("eoi") || text.includes("expression")) return "EOI";
  return "Open Tender";
}

export default function TenderCard({ tender, index = 0, isSaved = false, onView, onToggleSaved }) {
  const Icon = getIcon(tender);
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
          <Icon size={23} />
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
