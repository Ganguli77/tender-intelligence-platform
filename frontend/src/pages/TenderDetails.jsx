import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BellPlus,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Download,
  FileArchive,
  FileDown,
  FileSpreadsheet,
  FileText,
  Globe2,
  Home,
  Mail,
  MapPin,
  Phone,
  Printer,
  Route,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  createAlert,
  getTender,
  getTenderRecommendations,
  getTenders,
  saveTender as saveTenderToApi,
} from "../api/tenders";
import { deriveAiScore, formatTenderValue } from "../utils/tenderDisplay";
import { isTenderSaved, saveTender as saveTenderLocally, SAVED_TENDERS_EVENT } from "../utils/savedTenders";
import { tenders as fallbackTenders } from "../data/tenders";
import "./TenderPages.css";

const NA = "Not Available";
const timelineStages = ["Published", "Clarification", "Bid Opening", "Closing", "Award"];
const defaultDocuments = [
  { name: "NIT.pdf", size: "2.4 MB", icon: FileText },
  { name: "BOQ.xlsx", size: "1.8 MB", icon: FileSpreadsheet },
  { name: "Corrigendum.pdf", size: "840 KB", icon: FileArchive },
  { name: "Technical Specs.pdf", size: "3.2 MB", icon: FileDown },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function valueOrNA(value) {
  if (value === undefined || value === null || value === "" || value === "Not specified") return NA;
  return value;
}

function formatDate(value) {
  if (!value || value === "Not specified") return NA;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getDaysRemaining(deadline) {
  const date = deadline ? new Date(deadline) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

function getLocationParts(location = "") {
  const parts = String(location).split(",").map((part) => part.trim()).filter(Boolean);
  return {
    district: parts.length > 1 ? parts.at(-2) : NA,
    state: parts.at(-1) || NA,
    address: parts.length ? parts.join(", ") : NA,
  };
}

function getScoreLabel(score) {
  if (score >= 86) return "Excellent Match";
  if (score >= 72) return "High Match";
  if (score >= 55) return "Moderate Match";
  return "Low Match";
}

function getRiskLabel(score) {
  if (score >= 80) return "Low";
  if (score >= 60) return "Medium";
  return "High";
}

function getCurrentStage(tender) {
  const daysRemaining = getDaysRemaining(tender.deadline);
  if (daysRemaining === null) return 1;
  if (daysRemaining < 0) return 4;
  if (daysRemaining <= 2) return 3;
  if (daysRemaining <= 10) return 2;
  return 1;
}

function getDocumentCards(tender) {
  if (!Array.isArray(tender.documents) || !tender.documents.length) return defaultDocuments;
  return tender.documents.map((document, index) => ({
    name: typeof document === "string" ? document : document.name || `Document ${index + 1}`,
    size: typeof document === "object" && document.size ? document.size : `${(1.2 + index * 0.7).toFixed(1)} MB`,
    icon: index % 2 ? FileSpreadsheet : FileText,
  }));
}

function splitDescription(description) {
  const text = valueOrNA(description);
  if (text === NA) return { paragraphs: [NA], bullets: [] };
  const chunks = String(text).split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const bullets = chunks.filter((item) => /^[-*•]/.test(item)).map((item) => item.replace(/^[-*•]\s*/, ""));
  const paragraphs = chunks.filter((item) => !/^[-*•]/.test(item));
  return { paragraphs: paragraphs.length ? paragraphs : [text], bullets };
}

function buildDownloadText(tender, title = "Tender Intelligence Summary") {
  return [
    title,
    "",
    `Tender: ${valueOrNA(tender.title)}`,
    `Reference: ${valueOrNA(tender.referenceNo)}`,
    `Organization: ${valueOrNA(tender.organization)}`,
    `Category: ${valueOrNA(tender.category)}`,
    `Status: ${valueOrNA(tender.status)}`,
    `Value: ${formatTenderValue(tender) || NA}`,
    `EMD: ${valueOrNA(tender.emd || tender.bidSecurity)}`,
    `Published: ${formatDate(tender.publishedDate)}`,
    `Closing: ${formatDate(tender.deadline)}`,
    "",
    "Description",
    valueOrNA(tender.description),
  ].join("\n");
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
  anchor.click();
  URL.revokeObjectURL(url);
}

function DetailSkeleton() {
  return (
    <main className="tender-page tender-intel-page">
      <div className="tender-intel-skeleton tender-intel-skeleton--hero" />
      <div className="tender-intel-layout">
        <div className="tender-intel-skeleton-list"><span /><span /><span /><span /></div>
        <aside className="tender-intel-skeleton-list"><span /><span /><span /></aside>
      </div>
    </main>
  );
}

function ProgressRing({ score, label }) {
  return (
    <div className="ti-score-ring" style={{ "--score": score }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="50" />
      </svg>
      <div>
        <strong>{score}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [relatedTenders, setRelatedTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(() => isTenderSaved(id));

  useEffect(() => {
    let mounted = true;

    async function loadTender() {
      setLoading(true);
      setError("");

      try {
        const tenderData = await getTender(id);
        if (!mounted) return;
        setTender(tenderData);
        setSaved(isTenderSaved(tenderData.id));

        const [recommendationsResult, tendersResult] = await Promise.allSettled([
          getTenderRecommendations({ recentTenderIds: [id], keywords: tenderData.category, limit: 8 }),
          getTenders({ category: tenderData.category, size: 16 }),
        ]);

        if (!mounted) return;
        const recommended = recommendationsResult.status === "fulfilled"
          ? recommendationsResult.value.map((item) => item.tender)
          : [];
        const candidates = tendersResult.status === "fulfilled" ? tendersResult.value : fallbackTenders;
        const location = getLocationParts(tenderData.location);
        const seen = new Set([String(tenderData.id)]);
        const related = [...recommended, ...candidates, ...fallbackTenders]
          .filter((item) => {
            const key = String(item.id || item.referenceNo || item.title);
            if (seen.has(key)) return false;
            const itemLocation = getLocationParts(item.location);
            const matches =
              item.category === tenderData.category ||
              item.organization === tenderData.organization ||
              itemLocation.state === location.state;
            if (matches) seen.add(key);
            return matches;
          })
          .slice(0, 6);

        setRelatedTenders(related);
      } catch {
        if (mounted) {
          setError("Unable to load tender details.");
          setTender(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTender();
    return () => {
      mounted = false;
    };
  }, [id]);

  const workspace = useMemo(() => {
    if (!tender) return null;
    const aiScore = deriveAiScore(tender);
    const daysRemaining = getDaysRemaining(tender.deadline);
    const location = getLocationParts(tender.location);
    const description = splitDescription(tender.description);
    const documents = getDocumentCards(tender);
    const risk = getRiskLabel(aiScore);

    return {
      aiScore,
      scoreLabel: getScoreLabel(aiScore),
      risk,
      competition: aiScore >= 82 ? "Medium" : "High",
      complexity: aiScore >= 78 ? "Medium" : "High",
      profitability: aiScore >= 72 ? "High" : "Medium",
      successProbability: Math.max(58, Math.min(92, aiScore - 12)),
      daysRemaining,
      daysLabel:
        daysRemaining === null ? NA :
        daysRemaining < 0 ? "Expired" :
        daysRemaining === 0 ? "Closes Today" :
        `${daysRemaining} Days`,
      location,
      description,
      documents,
      currentStage: getCurrentStage(tender),
      website: tender.website || (tender.contactEmail ? `mailto:${tender.contactEmail}` : ""),
      margin: aiScore >= 80 ? "12%" : "8-10%",
      resources: aiScore >= 80 ? "25 Engineers" : "Specialist Team",
      duration: tender.contractDuration || "18 Months",
    };
  }, [tender]);

  async function handleSaveTender() {
    if (!tender) return;
    setSaved(true);
    saveTenderLocally(tender.id);
    setStatus("Tender saved to your workspace.");

    try {
      await saveTenderToApi(tender.id);
    } catch {
      window.dispatchEvent(new CustomEvent(SAVED_TENDERS_EVENT));
    }
  }

  async function handleShareTender() {
    if (!tender) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: tender.title, text: `${tender.title} - ${tender.referenceNo}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("Tender link copied to clipboard.");
      }
    } catch {
      setStatus("Unable to share this tender right now.");
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setStatus("Tender link copied.");
  }

  async function handleCreateAlert() {
    if (!tender || !workspace) return;
    setStatus("Creating alert...");
    try {
      await createAlert({
        name: `${valueOrNA(tender.category)} alert`,
        keywords: tender.title || tender.category || "",
        category: tender.category || "",
        location: tender.location || "",
        minOpportunityScore: workspace.aiScore,
        riskLevel: workspace.risk,
      });
      setStatus("Alert created for matching tenders.");
    } catch {
      setStatus("Sign in to create backend alerts. Tender details are still available.");
    }
  }

  function handleDownloadTender() {
    downloadText(`${tender.referenceNo || "tender"}-summary.txt`, buildDownloadText(tender));
  }

  function handleDownloadDocument(documentName) {
    downloadText(`${tender.referenceNo || "tender"}-${documentName}.txt`, buildDownloadText(tender, documentName));
  }

  if (loading) return <DetailSkeleton />;

  if (error || !tender) {
    return (
      <main className="tender-page tender-intel-page">
        <section className="ti-empty">
          <AlertCircle size={36} />
          <span>Tender Intelligence</span>
          <h1>{error || "Tender not found"}</h1>
          <p>We could not find this tender. Try returning to the marketplace.</p>
          <button type="button" onClick={() => navigate("/tenders")}>
            <ChevronLeft size={18} /> Back to Marketplace
          </button>
        </section>
      </main>
    );
  }

  const overviewRows = [
    ["Tender Title", tender.title],
    ["Tender Number", tender.referenceNo],
    ["Organization", tender.organization],
    ["Department", tender.department || tender.organization],
    ["Category", tender.category],
    ["Tender Type", tender.buyerType || "Open"],
    ["Location", tender.location],
    ["State", workspace.location.state],
    ["Tender Value", formatTenderValue(tender)],
    ["Bid Security", tender.bidSecurity],
    ["EMD", tender.emd || tender.bidSecurity],
    ["Published Date", formatDate(tender.publishedDate)],
    ["Closing Date", formatDate(tender.deadline)],
    ["Opening Date", formatDate(tender.bidOpeningDate)],
    ["Contract Duration", workspace.duration],
    ["Work Type", tender.workType || tender.category],
    ["Eligibility", Array.isArray(tender.eligibility) && tender.eligibility.length ? tender.eligibility.join(", ") : NA],
    ["Status", tender.status],
  ];

  const eligibilityGroups = [
    ["Company Requirements", tender.companyRequirements || "Company registration and statutory compliance required."],
    ["Required Certifications", tender.certifications || "Relevant certifications as per tender document."],
    ["Experience", tender.experience || "Prior experience in similar work preferred."],
    ["Turnover", tender.turnover || "Financial turnover requirement as per official document."],
    ["Technical Requirements", tender.technicalRequirements || "Technical capability must match scope of work."],
    ["Documents Required", workspace.documents.map((document) => document.name).join(", ")],
  ];

  return (
    <main className="tender-page tender-intel-page">
      <motion.nav className="ti-breadcrumb" initial="hidden" animate="visible" variants={fadeUp}>
        <Link to="/"><Home size={15} /> Home</Link>
        <span>/</span>
        <Link to="/tenders">Marketplace</Link>
        <span>/</span>
        <strong>Tender Details</strong>
      </motion.nav>

      <motion.section className="ti-hero" initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.45 }}>
        <div className="ti-hero__main">
          <div className="ti-meta">
            {[tender.referenceNo, tender.department || tender.organization, tender.category, formatDate(tender.publishedDate), formatDate(tender.deadline)].map((item) => (
              <span key={item}>{valueOrNA(item)}</span>
            ))}
            <strong className={`ti-status ti-status--${String(tender.status).toLowerCase().replace(/\s+/g, "-")}`}>
              {valueOrNA(tender.status)}
            </strong>
          </div>
          <h1>{valueOrNA(tender.title)}</h1>
          <p>{valueOrNA(tender.organization)} procurement intelligence workspace with AI scoring, risk signals, documents and related opportunities.</p>
        </div>
        <div className="ti-hero__side">
          <ProgressRing score={workspace.aiScore} label={workspace.scoreLabel} />
          <div className="ti-hero-actions">
            <button type="button" className={saved ? "is-saved" : ""} onClick={handleSaveTender}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save Tender"}</button>
            <button type="button" onClick={handleShareTender}><Share2 size={17} /> Share</button>
            <button type="button" onClick={handleDownloadTender}><Download size={17} /> Download PDF</button>
            <button type="button" onClick={() => navigate(-1)}><ChevronLeft size={17} /> Back</button>
          </div>
        </div>
      </motion.section>

      {status ? <motion.p className="ti-status-message" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{status}</motion.p> : null}

      <div className="tender-intel-layout">
        <motion.div className="ti-main-column" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
          <motion.section className="ti-card" variants={fadeUp}>
            <h2><FileText size={21} /> Tender Overview</h2>
            <div className="ti-info-grid">
              {overviewRows.map(([label, value]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{valueOrNA(value)}</strong>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section className="ti-card ti-description" variants={fadeUp}>
            <h2><BriefcaseBusiness size={21} /> Description</h2>
            {workspace.description.paragraphs.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)}
            {workspace.description.bullets.length ? (
              <ul>{workspace.description.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : null}
          </motion.section>

          <motion.section className="ti-card" variants={fadeUp}>
            <h2><ShieldCheck size={21} /> Eligibility</h2>
            <div className="ti-eligibility-grid">
              {eligibilityGroups.map(([label, value]) => (
                <article key={label}>
                  <CheckCircle2 size={19} />
                  <span>{label}</span>
                  <strong>{valueOrNA(value)}</strong>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section className="ti-card" variants={fadeUp}>
            <h2><CalendarDays size={21} /> Important Dates Timeline</h2>
            <div className="ti-timeline">
              {timelineStages.map((stage, index) => (
                <div className={index <= workspace.currentStage ? "is-active" : ""} key={stage}>
                  <span>{index + 1}</span>
                  <strong>{stage}</strong>
                  <small>
                    {stage === "Published" ? formatDate(tender.publishedDate) :
                      stage === "Bid Opening" ? formatDate(tender.bidOpeningDate) :
                      stage === "Closing" ? formatDate(tender.deadline) : "As per schedule"}
                  </small>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section className="ti-card" variants={fadeUp}>
            <h2><FileDown size={21} /> Tender Documents</h2>
            <div className="ti-documents">
              {workspace.documents.map(({ name, size, icon: Icon }) => (
                <article key={name}>
                  <Icon size={22} />
                  <div>
                    <strong>{name}</strong>
                    <span>{size}</span>
                  </div>
                  <button type="button" onClick={() => handleDownloadDocument(name)}><Download size={16} /> Download</button>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section className="ti-card" variants={fadeUp}>
            <h2><MapPin size={21} /> Location</h2>
            <div className="ti-location-grid">
              <div className="ti-map-placeholder">
                <MapPin size={34} />
                <strong>{workspace.location.state}</strong>
                <span>Google Map placeholder</span>
              </div>
              <div className="ti-info-grid ti-info-grid--compact">
                <article><span>State</span><strong>{workspace.location.state}</strong></article>
                <article><span>District</span><strong>{workspace.location.district}</strong></article>
                <article><span>Address</span><strong>{workspace.location.address}</strong></article>
                <article><span>Department Office</span><strong>{valueOrNA(tender.organization)}</strong></article>
              </div>
            </div>
          </motion.section>

          <motion.section className="ti-card" variants={fadeUp}>
            <h2><Sparkles size={21} /> Similar Opportunities</h2>
            <div className="ti-similar-row">
              {relatedTenders.length ? relatedTenders.slice(0, 5).map((item) => (
                <Link to={`/tenders/${item.id}`} key={item.id || item.referenceNo}>
                  <span>{deriveAiScore(item)}% AI Score</span>
                  <strong>{valueOrNA(item.title)}</strong>
                  <small>{formatTenderValue(item)} • {formatDate(item.deadline)}</small>
                  <em>{valueOrNA(item.organization)}</em>
                </Link>
              )) : <p>No similar opportunities found.</p>}
            </div>
          </motion.section>
        </motion.div>

        <motion.aside className="ti-sidebar" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.section className="ti-side-card ti-side-card--center" variants={fadeUp}>
            <h2>AI Match Analysis</h2>
            <ProgressRing score={workspace.aiScore} label={workspace.scoreLabel} />
            <div className="ti-reasons">
              {["Budget fits profile", "Experience matches", "Category expertise", "Location preferred", "Deadline manageable"].map((reason) => (
                <span key={reason}><CheckCircle2 size={16} /> {reason}</span>
              ))}
            </div>
          </motion.section>

          <motion.section className="ti-side-card" variants={fadeUp}>
            <h2>Success Probability</h2>
            <div className="ti-meter">
              <span><b style={{ width: `${workspace.successProbability}%` }} /></span>
              <strong>{workspace.successProbability}%</strong>
            </div>
            <div className="ti-stat-list">
              <div><span>Risk Meter</span><strong>{workspace.risk}</strong></div>
              <div><span>Competition</span><strong>{workspace.competition}</strong></div>
              <div><span>Complexity</span><strong>{workspace.complexity}</strong></div>
              <div><span>Estimated Profitability</span><strong>{workspace.profitability}</strong></div>
            </div>
          </motion.section>

          <motion.section className="ti-side-card" variants={fadeUp}>
            <h2>Opportunity Summary</h2>
            <div className="ti-stat-list">
              <div><span>Budget</span><strong>{formatTenderValue(tender)}</strong></div>
              <div><span>Expected Margin</span><strong>{workspace.margin}</strong></div>
              <div><span>Estimated Resources</span><strong>{workspace.resources}</strong></div>
              <div><span>Duration</span><strong>{workspace.duration}</strong></div>
            </div>
          </motion.section>

          <motion.section className="ti-side-card" variants={fadeUp}>
            <h2>Recommended Actions</h2>
            <div className="ti-actions-list">
              <button type="button" onClick={handleSaveTender}><Bookmark size={16} /> Save Tender</button>
              <button type="button" onClick={handleDownloadTender}><Sparkles size={16} /> Generate AI Summary</button>
              <button type="button" onClick={handleCopyLink}><Copy size={16} /> Track Tender</button>
              <button type="button" onClick={handleCreateAlert}><BellPlus size={16} /> Create Alert</button>
              <button type="button" onClick={() => navigate("/tenders")}><Route size={16} /> Compare Similar</button>
            </div>
          </motion.section>

          <motion.section className="ti-side-card" variants={fadeUp}>
            <h2>Contact</h2>
            <div className="ti-contact-list">
              <span><Building2 size={16} /> {valueOrNA(tender.contactName || "Procurement Officer")}</span>
              <a href={tender.contactEmail ? `mailto:${tender.contactEmail}` : undefined}><Mail size={16} /> {valueOrNA(tender.contactEmail || tender.contact)}</a>
              <a href={tender.contactPhone ? `tel:${tender.contactPhone}` : undefined}><Phone size={16} /> {valueOrNA(tender.contactPhone)}</a>
              {workspace.website ? <a href={workspace.website} target="_blank" rel="noreferrer"><Globe2 size={16} /> Official Website</a> : <span><Globe2 size={16} /> {NA}</span>}
            </div>
          </motion.section>

          <motion.section className="ti-side-card" variants={fadeUp}>
            <h2>Related Tenders</h2>
            <div className="ti-related-list">
              {relatedTenders.length ? relatedTenders.slice(0, 5).map((item) => (
                <Link to={`/tenders/${item.id}`} key={item.id || item.referenceNo}>
                  <span>{valueOrNA(item.organization)}</span>
                  <strong>{valueOrNA(item.title)}</strong>
                  <small>{deriveAiScore(item)}% AI Score • {formatTenderValue(item)}</small>
                  <em>View</em>
                </Link>
              )) : <p>No related tenders found.</p>}
            </div>
          </motion.section>
        </motion.aside>
      </div>

      <section className="ti-floating-actions">
        <button type="button" onClick={handleSaveTender}><Bookmark size={17} /> Save</button>
        <button type="button" onClick={handleShareTender}><Share2 size={17} /> Share</button>
        <button type="button" onClick={() => window.print()}><Printer size={17} /> Print</button>
        <button type="button" onClick={handleDownloadTender}><Download size={17} /> Download</button>
      </section>
    </main>
  );
}
