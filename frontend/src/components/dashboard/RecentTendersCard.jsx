import { Link } from "react-router-dom";

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

function daysUntil(value) {
  if (!value) return null;
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;
  return Math.ceil((deadline.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

function formatAmount(value) {
  if (!value || value === "Value on request") return value || "On request";
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `₹${new Intl.NumberFormat("en-IN").format(amount)}` : value;
}

export default function RecentTendersCard({ tenders }) {
  return (
    <section className="dashboard-glass-card dashboard-ranked-card">
      <div className="dashboard-card-head">
        <div>
          <h2>Top 5 High-Score Tenders</h2>
        </div>
        <button type="button" aria-label="High-score tender options">...</button>
      </div>

      <div className="dashboard-tender-table-wrap">
        <table className="dashboard-tender-table">
          <thead>
            <tr>
              <th>Tender Ref</th>
              <th>Client Name</th>
              <th>Estimated Value</th>
              <th>Submission Deadline</th>
              <th>AI Match Score</th>
              <th><span className="dashboard-sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {(tenders || []).length ? tenders.map((tender) => {
              const days = daysUntil(tender.deadline);
              return (
                <tr key={tender.id || tender.title}>
                  <td><span className="dashboard-tender-ref">{String(tender.id || "").padStart(8, "0")}</span></td>
                  <td><strong className="dashboard-client-name">{tender.organization || "Not specified"}</strong></td>
                  <td>{formatAmount(tender.amount)}</td>
                  <td>
                    <span className={days !== null && days <= 7 ? "dashboard-deadline is-urgent" : "dashboard-deadline"}>
                      {days !== null && days >= 0 ? `${days} Days Left` : formatDate(tender.deadline)}
                    </span>
                  </td>
                  <td><span className="dashboard-match-score">{tender.opportunityScore || 0}% Match</span></td>
                  <td><Link className="dashboard-analyze-link" to={`/tenders/${tender.id}`}>Analyze with AI</Link></td>
                </tr>
              );
            }) : (
              <tr><td colSpan="6" className="dashboard-empty-table">Run AI analysis on tenders to populate ranked opportunities.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Link className="dashboard-view-all" to="/tenders">View All Tenders</Link>
    </section>
  );
}
