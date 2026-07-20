export function parseTenderDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function calculateDaysLeft(tender) {
  const date = parseTenderDate(tender?.deadline || tender?.closingDate);
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
  if (tender.amount && tender.amount !== "Not specified") return tender.amount.replace("INR", "Rs.");
  const value = Number(tender.amountValue || tender.value || 0);
  if (!value) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
