import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function EligibilityChecklist({ requirements = [] }) {
  const normalizedRequirements = useMemo(
    () => (requirements.length ? requirements : ["Verify eligibility criteria before preparing the bid."]),
    [requirements],
  );
  const [completed, setCompleted] = useState({});
  const completedCount = normalizedRequirements.filter((item) => completed[item]).length;

  return (
    <section className="ai-glass-card ai-check-card">
      <div className="ai-card-head">
        <span><CheckCircle2 size={18} /> Key Eligibility</span>
        <strong>{completedCount}/{normalizedRequirements.length}</strong>
      </div>
      <div className="ai-check-list">
        {normalizedRequirements.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={Boolean(completed[item])}
              onChange={(event) => setCompleted((current) => ({ ...current, [item]: event.target.checked }))}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
