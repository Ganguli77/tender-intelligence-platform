import { Link } from "react-router-dom";
import { ChevronRight, Cloud } from "lucide-react";

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function RecentTendersCard({ tenders }) {
  return (
    <section className="dashboard-glass-card">
      <div className="dashboard-card-head">
        <div>
          <h2>Top 5 High-Score Tenders</h2>
        </div>
        <button type="button" aria-label="High-score tender options">...</button>
      </div>

      <div className="dashboard-ranked-list">
        {(tenders || []).length ? tenders.map((tender) => (
          <Link key={tender.id || tender.title} to={`/tenders/${tender.id}`}>
            <i><Cloud size={18} /></i>
            <span>
              <strong>{tender.title}</strong>
              <small>{tender.organization}</small>
            </span>
            <em>
              <small>Deadline</small>
              <strong>{formatDate(tender.deadline)}</strong>
            </em>
            <b>{tender.opportunityScore || 0}</b>
            <ChevronRight size={18} />
          </Link>
        )) : (
          <p className="dashboard-empty-text">Run AI analysis on tenders to populate ranked opportunities.</p>
        )}
      </div>
      <Link className="dashboard-view-all" to="/tenders">View All Tenders</Link>
    </section>
  );
}
