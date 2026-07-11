import { AlertTriangle, CalendarClock, Sparkles } from "lucide-react";
import AISummaryCard from "./AISummaryCard";
import EligibilityChecklist from "./EligibilityChecklist";
import RequiredDocumentsCard from "./RequiredDocumentsCard";
import TenderChatBot from "./TenderChatBot";
import WinProbabilityCard from "./WinProbabilityCard";
import RiskBadge from "./RiskBadge";

export default function AIAnalysisPanel({ tender, analysis, summary }) {
  const source = analysis || summary || {};
  const eligibility = source.eligibilityRequirements || source.keyRequirements || tender?.eligibility || [];
  const documents = source.requiredDocuments || tender?.documents || [];
  const deadlines = source.importantDeadlines || [
    tender?.deadline ? `Submission deadline: ${tender.deadline}` : "Confirm submission deadline with the buyer.",
  ];

  return (
    <section className="ai-analysis-panel">
      <div className="ai-analysis-panel__head">
        <div>
          <span className="tender-eyebrow">LLM tender analysis</span>
          <h2>AI Analysis</h2>
        </div>
        <div className="ai-analysis-meta">
          <RiskBadge level={source.riskLevel} />
          <strong>{source.opportunityScore || 0}% Opportunity</strong>
        </div>
      </div>

      <AISummaryCard analysis={analysis} summary={summary} />

      <div className="ai-analysis-grid">
        <WinProbabilityCard probability={source.winProbability || source.opportunityScore || 0} />
        <EligibilityChecklist requirements={eligibility} />
        <RequiredDocumentsCard documents={documents} />
      </div>

      <div className="ai-analysis-grid ai-analysis-grid--wide">
        <section className="ai-glass-card">
          <div className="ai-card-head">
            <span><Sparkles size={18} /> Recommendation</span>
          </div>
          <p className="ai-panel-copy">
            {source.recommendation || source.bidRecommendation || "Review scope, documents, and pricing before bid commitment."}
          </p>
          {source.fallbackUsed && (
            <p className="ai-provider-note">
              Fallback used: {source.errorMessage || "Live AI provider unavailable."}
            </p>
          )}
        </section>

        <section className="ai-glass-card">
          <div className="ai-card-head">
            <span><CalendarClock size={18} /> Important Deadlines</span>
          </div>
          <ul className="ai-deadline-list">
            {deadlines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ai-glass-card">
          <div className="ai-card-head">
            <span><AlertTriangle size={18} /> Risk Factors</span>
          </div>
          <ul className="ai-deadline-list">
            {(source.riskFactors?.length ? source.riskFactors : ["No major risks were detected from the available data."]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <TenderChatBot tenderId={tender?.id} />
    </section>
  );
}
