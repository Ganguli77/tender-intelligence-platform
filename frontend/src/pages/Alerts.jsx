import { useEffect, useState } from "react";
import { BellRing, Trash2 } from "lucide-react";
import AlertForm from "../components/AlertForm";
import { createAlert, deleteAlert, getAlerts } from "../api/tenders";
import "./TenderPages.css";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("Loading alerts...");

  const loadAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
      setStatus(data.length ? "" : "No alerts configured yet.");
    } catch {
      setStatus("Unable to load alerts.");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAlerts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleCreateAlert = async (alert) => {
    await createAlert(alert);
    await loadAlerts();
  };

  const handleDeleteAlert = async (id) => {
    await deleteAlert(id);
    await loadAlerts();
  };

  return (
    <main className="tender-page">
      <section className="tender-hero">
        <span className="tender-eyebrow">Tender monitoring</span>
        <h1>AI Alerts</h1>
        <p>Create smart alerts for categories, locations, risk bands, and opportunity scores so promising tenders do not slip past your team.</p>
      </section>

      <section className="phase6-alert-layout">
        <article className="detail-panel">
          <h2><BellRing size={20} /> Create Alert</h2>
          <AlertForm onSubmit={handleCreateAlert} />
        </article>

        <article className="detail-panel">
          <h2>Active Alerts</h2>
          {status && <p>{status}</p>}
          <div className="phase6-alert-list">
            {alerts.map((alert) => (
              <div key={alert.id}>
                <BellRing size={18} />
                <span>
                  <strong>{alert.name}</strong>
                  <small>{[alert.keywords, alert.category, alert.location].filter(Boolean).join(" / ") || "Broad tender alert"}</small>
                </span>
                <b>{alert.minOpportunityScore || 0}+</b>
                <button type="button" aria-label="Delete alert" onClick={() => handleDeleteAlert(alert.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
