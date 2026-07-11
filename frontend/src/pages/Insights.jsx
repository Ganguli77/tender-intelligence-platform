import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaChartPie,
  FaClock,
  FaCompass,
  FaLightbulb,
  FaLayerGroup,
  FaRobot,
  FaRupeeSign,
  FaShieldAlt,
  FaSignal,
} from "react-icons/fa";
import { getTenderInsights } from "../api/tenders";
import "./TenderPages.css";


function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(value || 0);
}

function formatDate(date) {
  if (!date || date === "Not specified") return "Not specified";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Insights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTenderInsights()
      .then((data) => {
        setInsights(data);
        setError("");
      })
      .catch(() => {
        setInsights(null);
        setError("Backend insights are not available. Start the Spring Boot API and refresh.");
      });
  }, []);

  const categories = useMemo(() => {
    return Object.entries(insights?.byCategory || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [insights]);

  const total = insights?.total || 0;
  const active = insights?.active || 0;
  const totalValue = insights?.totalValue || 0;
  const closingSoon = insights?.closingSoon || [];
  const topCategory = categories[0]?.[0] || "Construction";
  const activeRatio = total ? Math.round((active / total) * 100) : 0;

  return (
    <main className="tender-page ai-insights-page">
      <section className="ai-insights-hero">
        <div>
          <span className="tender-eyebrow premium-eyebrow">
            <FaRobot /> AI Insights
          </span>
          <h1>AI Tender Intelligence</h1>
          <p>
            Live procurement signals, category movement, closing alerts, and value
            intelligence from the tender backend.
          </p>
          <div className="ai-hero-actions">
            <button type="button" onClick={() => navigate("/tenders")}>
              Explore Tenders <FaArrowRight />
            </button>
            <button type="button" onClick={() => navigate("/dashboard")}>
              Open Dashboard <FaChartPie />
            </button>
          </div>
        </div>

        <div className="ai-orbit-card" aria-hidden="true">
          <span className="ai-orbit-ring ring-one" />
          <span className="ai-orbit-ring ring-two" />
          <div className="ai-orbit-core">
            <FaLightbulb />
            <strong>{activeRatio}%</strong>
            <small>active signal</small>
          </div>
        </div>
      </section>

      {error ? (
        <section className="empty-state premium-empty-state">
          <h2>Insights unavailable</h2>
          <p>{error}</p>
        </section>
      ) : (
        <>
          <section className="ai-insight-metrics">
            <article>
              <FaSignal />
              <span>Total Tenders</span>
              <strong>{insights?.total ?? "..."}</strong>
            </article>
            <article>
              <FaBolt />
              <span>Active</span>
              <strong>{insights?.active ?? "..."}</strong>
            </article>
            <article>
              <FaLayerGroup />
              <span>Top Category</span>
              <strong>{topCategory}</strong>
            </article>
            <article>
              <FaRupeeSign />
              <span>Total Value</span>
              <strong>{insights ? formatCurrency(totalValue) : "..."}</strong>
            </article>
          </section>

          <section className="ai-insight-grid">
            <article className="ai-panel category-panel">
              <div className="ai-panel-head">
                <span><FaChartPie /> Category Mix</span>
                <strong>{categories.length} sectors</strong>
              </div>
              <div className="insight-bars">
                {categories.map(([category, count]) => {
                  const percent = total ? Math.round((count / total) * 100) : 0;

                  return (
                    <div className="insight-bar" key={category}>
                      <div>
                        <span><FaLayerGroup /> {category}</span>
                        <strong>{count}</strong>
                      </div>
                      <progress value={percent} max="100" aria-label={`${category} ${percent}%`} />
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="ai-panel signal-panel">
              <div className="ai-panel-head">
                <span><FaCompass /> AI Signal Summary</span>
                <strong>{activeRatio}% live</strong>
              </div>
              <div className="signal-list">
                <div><FaShieldAlt /><span>Strongest sector</span><strong>{topCategory}</strong></div>
                <div><FaClock /><span>Closing soon</span><strong>{closingSoon.length}</strong></div>
                <div><FaRupeeSign /><span>Indexed value</span><strong>{formatCurrency(totalValue)}</strong></div>
              </div>
            </article>

            <article className="ai-panel closing-panel">
              <div className="ai-panel-head">
                <span><FaClock /> Closing Soon</span>
                <strong>{closingSoon.length} alerts</strong>
              </div>
              <ul className="insight-list">
                {closingSoon.length ? closingSoon.map((tender) => (
                  <li key={tender.id} onClick={() => navigate(`/tender/${tender.id}`)}>
                    <span>{tender.title}</span>
                    <strong><FaCalendarAlt /> {formatDate(tender.deadline)}</strong>
                    <small><FaRupeeSign /> {tender.amount}</small>
                  </li>
                )) : (
                  <li>
                    <span>No near-deadline tenders right now</span>
                    <strong><FaCalendarAlt /> Clear pipeline</strong>
                    <small>Refresh after backend data changes.</small>
                  </li>
                )}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
