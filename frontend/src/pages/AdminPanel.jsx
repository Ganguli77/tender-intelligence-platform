import { useEffect, useMemo, useState } from "react";
import { getTenders } from "../api/tenders";
import "./AdminPanel.css";

function isActive(deadline) {
  if (!deadline) return true;
  return new Date(deadline) >= new Date();
}

function formatDate(date) {
  if (!date) return "Not specified";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPanel() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getTenders()
      .then((data) => {
        if (mounted) setTenders(data);
      })
      .catch(() => {
        if (mounted) setTenders([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = tenders.filter((tender) => isActive(tender.deadline)).length;
    const categories = new Set(tenders.map((tender) => tender.category).filter(Boolean)).size;

    return [
      { label: "Total Tenders", value: tenders.length.toLocaleString("en-IN"), detail: "Loaded from backend" },
      { label: "Open Tenders", value: active.toLocaleString("en-IN"), detail: "Still accepting bids" },
      { label: "Categories", value: categories.toLocaleString("en-IN"), detail: "Across the tender index" },
    ];
  }, [tenders]);

  const visibleTenders = tenders.slice(0, 8);

  return (
    <main className="admin-panel-page">
      <section className="admin-panel-hero">
        <span>Admin Workspace</span>
        <h1>NexTender AI Control Panel</h1>
        <p>Monitor platform activity, review tender flow, and keep procurement intelligence organized.</p>
      </section>

      <section className="admin-stat-grid" aria-label="Admin metrics">
        {stats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="admin-table-card">
        <div className="admin-table-head">
          <div>
            <span>Tender Review</span>
            <h2>Listed Tenders</h2>
          </div>
          <button type="button" disabled={loading}>{loading ? "Loading" : "Live data"}</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-tender-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {visibleTenders.map((tender) => (
                <tr key={tender.id || tender.referenceNo || tender.title}>
                  <td>{tender.title}</td>
                  <td>{tender.category}</td>
                  <td>
                    <span className={`admin-status ${isActive(tender.deadline) ? "open" : "closed"}`}>
                      {isActive(tender.deadline) ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td>{formatDate(tender.deadline)}</td>
                </tr>
              ))}
              {!loading && !visibleTenders.length ? (
                <tr>
                  <td colSpan="4">No tenders available from the backend.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
