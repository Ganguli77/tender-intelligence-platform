import { useMemo } from "react";

export default function OpportunityScore({ score = 0, label = "Opportunity Score" }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = useMemo(() => {
    if (normalizedScore >= 75) return "#55f0bd";
    if (normalizedScore >= 50) return "#facc15";
    return "#fb7185";
  }, [normalizedScore]);

  return (
    <div className="opportunity-score" style={{ "--score": normalizedScore, "--score-color": tone }}>
      <div className="opportunity-score__ring">
        <strong>{normalizedScore}</strong>
        <span>/100</span>
      </div>
      <p>{label}</p>
    </div>
  );
}
