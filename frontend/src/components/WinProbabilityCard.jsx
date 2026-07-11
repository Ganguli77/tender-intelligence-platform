import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";

export default function WinProbabilityCard({ probability = 0 }) {
  const target = Math.max(0, Math.min(100, Number(probability) || 0));
  const [value, setValue] = useState(0);
  const color = useMemo(() => {
    if (target >= 75) return "#55f0bd";
    if (target >= 50) return "#facc15";
    return "#fb7185";
  }, [target]);

  useEffect(() => {
    const resetFrame = window.setTimeout(() => setValue(0), 0);
    const fillFrame = window.setTimeout(() => setValue(target), 80);

    return () => {
      window.clearTimeout(resetFrame);
      window.clearTimeout(fillFrame);
    };
  }, [target]);

  return (
    <section className="ai-glass-card win-probability-card">
      <div className="ai-card-head">
        <span><Trophy size={18} /> Win Probability</span>
      </div>
      <div className="win-ring" style={{ "--win": value, "--win-color": color }}>
        <strong>{target}%</strong>
        <small>estimated</small>
      </div>
      <p>{target >= 75 ? "Strong bid fit" : target >= 50 ? "Competitive with review" : "Needs careful qualification"}</p>
    </section>
  );
}
