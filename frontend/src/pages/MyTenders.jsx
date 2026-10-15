import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, BellRing, BriefcaseBusiness, FileDown, FilePlus2, Inbox } from "lucide-react";
import { downloadBidDocument, getMyTenders, getTenderSubmissions } from "../api/tenders";
import "./TenderPublishing.css";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No deadline";
}

export default function MyTenders() {
  const location = useLocation();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTenderId, setOpenTenderId] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      setLoading(true);
      setError("");
      try {
        const ownTenders = await getMyTenders();
        const withSubmissions = await Promise.all(ownTenders.map(async (tender) => {
          if (tender.submissionMode !== "PLATFORM") return { ...tender, submissions: [] };
          try {
            return { ...tender, submissions: await getTenderSubmissions(tender.id) };
          } catch {
            return { ...tender, submissions: [] };
          }
        }));
        if (active) setTenders(withSubmissions);
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load your tenders.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadWorkspace();
    return () => { active = false; };
  }, []);

  const handleDownload = async (tenderId, submission, document) => {
    setDownloadError("");
    try {
      await downloadBidDocument(tenderId, submission.id, document.id, document.fileName);
    } catch (error) {
      setDownloadError(error.message || "Unable to download the document.");
    }
  };

  return (
    <main className="tender-publishing-page organizer-workspace">
      <header className="publishing-heading organizer-heading">
        <span>ORGANIZER WORKSPACE</span>
        <h1>My tenders</h1>
        <p>Manage the opportunities you publish and review supplier responses.</p>
        {location.state?.notice ? <p className="workspace-notice" role="status">{location.state.notice}</p> : null}
      </header>

      <div className="workspace-toolbar"><span><BriefcaseBusiness size={17} /> {tenders.length} published {tenders.length === 1 ? "tender" : "tenders"}</span><Link to="/tenders/add"><FilePlus2 size={17} /> Publish tender</Link></div>
      {error ? <p className="publishing-error" role="alert">{error}</p> : null}
      {downloadError ? <p className="publishing-error" role="alert">{downloadError}</p> : null}
      {loading ? <p className="workspace-empty">Loading your tenders...</p> : null}
      {!loading && !error && tenders.length === 0 ? (
        <section className="workspace-empty"><Inbox size={30} /><h2>No tenders published yet</h2><p>Publish your first opportunity to let suppliers find and respond to it.</p><Link to="/tenders/add">Create a tender</Link></section>
      ) : null}

      <section className="workspace-tender-list" aria-label="Published tenders">
        {tenders.map((tender) => (
          <article className="workspace-tender" key={tender.id}>
            <div className="workspace-tender-main">
              <div><span className="workspace-category">{tender.category}</span><h2>{tender.title}</h2><p>{tender.organization} · {tender.location}</p></div>
              <div className="workspace-tender-meta"><span>Deadline <strong>{formatDate(tender.deadline)}</strong></span><span>Response route <strong>{tender.submissionMode === "PLATFORM" ? "NexTender" : tender.submissionMode === "EXTERNAL_LINK" ? "Official portal" : "Contact organizer"}</strong></span></div>
            </div>
            <div className="workspace-tender-actions">
              <Link to={`/tenders/${tender.id}`}>View listing <ArrowUpRight size={16} /></Link>
              {tender.submissionMode === "PLATFORM" ? <button type="button" onClick={() => setOpenTenderId(openTenderId === tender.id ? null : tender.id)}><Inbox size={16} /> {tender.submissions.length} submissions</button> : null}
              {tender.submissionMode === "EXTERNAL_LINK" && tender.officialUrl ? <a href={tender.officialUrl} target="_blank" rel="noreferrer">Official portal <ArrowUpRight size={16} /></a> : null}
            </div>
            {openTenderId === tender.id ? (
              <div className="workspace-submissions">
                <h3><BellRing size={17} /> Supplier responses</h3>
                {!tender.submissions.length ? <p>No bids have been submitted for this tender yet.</p> : null}
                {tender.submissions.map((submission) => (
                  <section className="workspace-submission" key={submission.id}>
                    <div className="workspace-submission-heading"><div><strong>{submission.supplierOrganization}</strong><span>{submission.contactName} · {submission.contactEmail}</span></div><small>{formatDate(submission.submittedAt)}</small></div>
                    {submission.amountValue != null ? <p className="workspace-proposal-amount">Proposed amount: INR {Number(submission.amountValue).toLocaleString("en-IN")}</p> : null}
                    <p className="workspace-proposal">{submission.proposal}</p>
                    {submission.documents?.length ? <div className="workspace-documents">{submission.documents.map((document) => <button type="button" key={document.id} onClick={() => handleDownload(tender.id, submission, document)}><FileDown size={15} /> {document.fileName}</button>)}</div> : null}
                  </section>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}