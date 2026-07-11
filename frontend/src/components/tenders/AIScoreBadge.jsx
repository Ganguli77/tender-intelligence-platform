import { motion } from "framer-motion";

function scoreTone(score) {
  if (score >= 80) return { color: "#22c55e", label: "High" };
  if (score >= 60) return { color: "#f59e0b", label: "Medium" };
  return { color: "#ef4444", label: "Low" };
}

export default function AIScoreBadge({ score = 0 }) {
  const normalized = Math.min(100, Math.max(0, Number(score) || 0));
  const tone = scoreTone(normalized);
  const circumference = 2 * Math.PI * 18;

  return (
    <div className="ai-score-badge" aria-label={`${normalized} AI score, ${tone.label} match`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="18" className="ai-score-track" />
        <motion.circle
          cx="22"
          cy="22"
          r="18"
          className="ai-score-progress"
          stroke={tone.color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (normalized / 100) * circumference }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <span style={{ color: tone.color }}>{Math.round(normalized)}</span>
    </div>
  );
}
