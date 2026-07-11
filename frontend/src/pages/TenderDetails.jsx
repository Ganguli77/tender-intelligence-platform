import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BellPlus, Bookmark, Building2, CalendarDays, ChevronLeft, Download, FileText, Mail, MapPin, Phone, Tags } from "lucide-react";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import RecommendationCard from "../components/RecommendationCard";
import {
  createAlert,
  getTender,
  getTenderAiAnalysis,
  getTenderAiSummary,
  getTenderRecommendations,
  saveTender,
} from "../api/tenders";
import "./TenderPages.css";

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTender() {
      try {
        const tenderData = await getTender(id);
        if (!mounted) return;
        setTender(tenderData);
        setError("");

        const [analysisResult, summaryResult, recommendationsResult] = await Promise.allSettled([
          getTenderAiAnalysis(id),
          getTenderAiSummary(id),
          getTenderRecommendations({ recentTenderIds: [id], keywords: tenderData.category, limit: 1 }),
        ]);

        if (!mounted) return;
        if (analysisResult.status === "fulfilled") setAnalysis(analysisResult.value);
        if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
        if (recommendationsResult.status === "fulfilled") setRecommendation(recommendationsResult.value[0]);
      } catch {
        if (mounted) {
          setError("Unable to load tender details.");
          setTender(null);
        }
      }
    }

    loadTender();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSaveTender = async () => {
    setStatus("Saving tender...");
    try {
      await saveTender(id);
      setStatus("Tender saved to your workspace.");
    } catch {
      setStatus("Unable to save this tender right now.");
    }
  };

  const handleCreateAlert = async () => {
    setStatus("Creating alert...");
    try {
      await createAlert({
        name: `${tender?.category || "Tender"} alert`,
        keywords: tender?.title || tender?.category || "",
        category: tender?.category || "",
        location: tender?.location || "",
        minOpportunityScore: analysis?.opportunityScore || summary?.opportunityScore || 70,
        riskLevel: analysis?.riskLevel || summary?.riskLevel || "",
      });
      setStatus("Alert created for matching tenders.");
    } catch {
      setStatus("Unable to create an alert right now.");
    }
  };

  const handleDownloadDocument = (documentName) => {
    const content = [
      `NexTender AI document request`,
      `Tender: ${tender.title}`,
      `Reference: ${tender.referenceNo}`,
      `Document: ${documentName}`,
      `Organization: ${tender.organization}`,
      `Contact: ${tender.contact || "Not specified"}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${tender.referenceNo || "tender"}-${documentName}`.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase() + ".txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!tender) {
    return (
      <main className="tender-page">
        <section className="empty-state">
          <span className="tender-eyebrow">Tender intelligence</span>
          <h1>{error || "Loading tender details..."}</h1>
          <button className="secondary-filter-button" type="button" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} /> Go Back
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="tender-page">
      <button className="secondary-filter-button detail-back-button" type="button" onClick={() => navigate(-1)}>
        <ChevronLeft size={18} /> Back
      </button>

      <section className="detail-hero">
        <div>
          <span className="tender-eyebrow">{tender.referenceNo}</span>
          <h1>{tender.title}</h1>
          <p>{tender.description}</p>
          <div className="tender-hero-actions">
            <button type="button" onClick={handleSaveTender}><Bookmark size={18} /> Save Tender</button>
            <button type="button" onClick={handleCreateAlert}><BellPlus size={18} /> Create Alert</button>
            <Link className="secondary-filter-button" to="/alerts">Manage Alerts</Link>
          </div>
          {status && <p className="phase6-status">{status}</p>}
        </div>
        <aside>
          <small>AI readiness</small>
          <strong>{analysis?.opportunityScore || summary?.opportunityScore || 0}%</strong>
          <small>{analysis?.recommendation || summary?.bidRecommendation || "AI assessment pending"}</small>
        </aside>
      </section>

      <section className="detail-facts">
        <article><Building2 size={18} /><span>Organization</span><strong>{tender.organization}</strong></article>
        <article><Tags size={18} /><span>Category</span><strong>{tender.category}</strong></article>
        <article><MapPin size={18} /><span>Location</span><strong>{tender.location}</strong></article>
        <article><CalendarDays size={18} /><span>Deadline</span><strong>{tender.deadline}</strong></article>
      </section>

      <div className="detail-content">
        <AIAnalysisPanel tender={tender} analysis={analysis} summary={summary} />

        <section className="detail-panel">
          <h2><FileText size={20} /> Tender Requirements</h2>
          <h3>Eligibility</h3>
          <ul>
            {(tender.eligibility.length ? tender.eligibility : ["No eligibility criteria listed."]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Documents</h3>
          <div className="document-list">
            {(tender.documents.length ? tender.documents : ["Bid document", "Technical specification", "Financial bid format"]).map((item) => (
              <button type="button" key={item} onClick={() => handleDownloadDocument(item)}>
                <span>{item}</span>
                <Download size={17} />
              </button>
            ))}
          </div>
          <div className="detail-info-grid">
            <article>
              <h3><Phone size={17} /> Contact</h3>
              <p>{tender.contact || "Procurement contact will be shared by the issuing organization."}</p>
            </article>
            <article>
              <h3><Mail size={17} /> Submission Desk</h3>
              <p>{tender.organization} procurement cell, {tender.location}</p>
            </article>
          </div>
        </section>

        <section className="detail-panel">
          <h2>AI Recommendation</h2>
          {recommendation ? (
            <RecommendationCard recommendation={recommendation} />
          ) : (
            <p>Recommendations are being calibrated from your recent tender activity.</p>
          )}
        </section>
      </div>
    </main>
  );
}
