import { BrainCircuit, CheckCircle2, FileText, ShieldAlert } from "lucide-react";
import OpportunityScore from "./OpportunityScore";
import RiskBadge from "./RiskBadge";

export default function AISummaryCard({ analysis, summary }) {
  const source = analysis || summary || {};
  const eligibility = source.eligibilityRequirements || source.keyRequirements || [];
  const risks = source.riskFactors || [];
  const actions = source.recommendedActions || [];

  return (
    <section className="ai-summary-card">
      <div className="ai-summary-card__head">
        <span><BrainCircuit size={18} /> AI Tender Intelligence</span>
        <RiskBadge level={source.riskLevel} />
      </div>

      <div className="ai-summary-card__body">
        <OpportunityScore score={source.opportunityScore} />
        <div>
          <h2>AI Summary</h2>
          <p>{source.summary || "AI summary is being generated for this tender."}</p>
          <strong>{source.recommendation || source.bidRecommendation || "Review scope, eligibility, and deadline before bidding."}</strong>
        </div>
      </div>

      <div className="ai-summary-columns">
        <article>
          <h3><CheckCircle2 size={16} /> Eligibility extracted</h3>
          <ul>
            {(eligibility.length ? eligibility : ["Verify buyer eligibility criteria before bid preparation."]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3><ShieldAlert size={16} /> Risk analysis</h3>
          <ul>
            {(risks.length ? risks : ["No major risks are obvious from the available data."]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3><FileText size={16} /> Next actions</h3>
          <ul>
            {(actions.length ? actions : ["Map every requirement to a supporting document."]).slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
