import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaStar,
  FaTag,
} from "react-icons/fa";

function valueOrFallback(value, fallback = "Not specified") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function formatDeadline(deadline) {
  if (!deadline || deadline === "Not specified") {
    return "Not specified";
  }

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return deadline;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecommendationCard({ recommendation }) {
  const tender = recommendation?.tender || {};
  const matchPercentage = recommendation?.matchPercentage ?? recommendation?.score ?? 0;
  const reasonBadge = recommendation?.reasonBadge || recommendation?.badge || "Recommended";
  const reasons = Array.isArray(recommendation?.reasons) && recommendation.reasons.length
    ? recommendation.reasons
    : recommendation?.explanations || [];
  const tenderId = tender.id ?? tender._id;

  return (
    <article className="recommendation-card">
      <style>{`
        .recommendation-card {
          position: relative;
          display: grid;
          gap: 18px;
          min-height: 100%;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(85, 240, 189, 0.18);
          border-radius: 18px;
          color: #fff;
          background:
            radial-gradient(circle at 18% 0%, rgba(24, 168, 255, 0.15), transparent 30%),
            linear-gradient(145deg, rgba(5, 17, 38, 0.96), rgba(2, 8, 25, 0.98));
          box-shadow: 0 20px 60px rgba(2, 8, 25, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
        }

        .recommendation-card:hover {
          transform: translateY(-6px);
          border-color: rgba(85, 240, 189, 0.42);
          box-shadow: 0 24px 70px rgba(2, 8, 25, 0.42), 0 0 34px rgba(24, 168, 255, 0.16);
        }

        .recommendation-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 35%, rgba(255, 255, 255, 0.08), transparent 65%);
          opacity: 0;
          transform: translateX(-24%);
          transition: opacity 0.24s ease, transform 0.5s ease;
          pointer-events: none;
        }

        .recommendation-card:hover::before {
          opacity: 1;
          transform: translateX(24%);
        }

        .recommendation-card-top,
        .recommendation-card-meta,
        .recommendation-card-actions {
          position: relative;
          z-index: 1;
        }

        .recommendation-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .recommendation-match,
        .recommendation-badge,
        .recommendation-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          font-weight: 800;
        }

        .recommendation-match {
          min-height: 38px;
          padding: 0 13px;
          color: #ffffff;
          background: linear-gradient(135deg, #1769ff, #0bc5ea);
          box-shadow: 0 12px 26px rgba(24, 168, 255, 0.2);
          white-space: nowrap;
        }

        .recommendation-badge {
          min-height: 34px;
          padding: 0 12px;
          color: #dff7ff;
          border: 1px solid rgba(85, 240, 189, 0.22);
          background: rgba(8, 30, 62, 0.72);
          font-size: 0.78rem;
          white-space: nowrap;
        }

        .recommendation-title {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #fff;
          font-size: clamp(1.08rem, 1.6vw, 1.3rem);
          line-height: 1.35;
          letter-spacing: 0;
        }

        .recommendation-org {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: -6px 0 0;
          color: #a9d8ff;
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .recommendation-org svg,
        .recommendation-card-meta svg {
          color: #55f0bd;
          flex: 0 0 auto;
        }

        .recommendation-card-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .recommendation-card-meta span {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding: 10px 11px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          color: #dff7ff;
          background: rgba(7, 22, 52, 0.56);
          font-size: 0.86rem;
          line-height: 1.35;
        }

        .recommendation-card-meta b {
          overflow: hidden;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recommendation-chips {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .recommendation-chip {
          min-height: 30px;
          padding: 0 10px;
          color: #dff7ff;
          border: 1px solid rgba(85, 240, 189, 0.18);
          background: rgba(8, 30, 62, 0.58);
          font-size: 0.76rem;
        }

        .recommendation-card-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 2px;
        }

        .recommendation-view-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid rgba(85, 240, 189, 0.32);
          border-radius: 12px;
          color: #ffffff;
          background: linear-gradient(135deg, #1769ff, #0bc5ea);
          box-shadow: 0 14px 34px rgba(24, 168, 255, 0.18);
          font-weight: 900;
          text-decoration: none;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .recommendation-view-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 42px rgba(85, 240, 189, 0.16);
        }

        .recommendation-view-button.is-disabled {
          pointer-events: none;
          opacity: 0.62;
        }

        @media (max-width: 560px) {
          .recommendation-card {
            padding: 18px;
            border-radius: 16px;
          }

          .recommendation-card-top,
          .recommendation-card-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .recommendation-card-meta {
            grid-template-columns: 1fr;
          }

          .recommendation-view-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="recommendation-card-top">
        <span className="recommendation-match">
          <FaStar /> {matchPercentage}% Match
        </span>
        <span className="recommendation-badge">{reasonBadge}</span>
      </div>

      <h3 className="recommendation-title">{valueOrFallback(tender.title, "Untitled Tender")}</h3>
      <p className="recommendation-org">
        <FaBuilding /> {valueOrFallback(tender.organization)}
      </p>

      <div className="recommendation-card-meta">
        <span><FaTag /> <b>{valueOrFallback(tender.category, "General")}</b></span>
        <span><FaMapMarkerAlt /> <b>{valueOrFallback(tender.location)}</b></span>
        <span><FaRupeeSign /> <b>{valueOrFallback(tender.amount)}</b></span>
        <span><FaCalendarAlt /> <b>{formatDeadline(tender.deadline)}</b></span>
      </div>

      {reasons.length > 0 && (
        <div className="recommendation-chips">
          {reasons.slice(0, 4).map((reason) => (
            <span className="recommendation-chip" key={reason}>{reason}</span>
          ))}
        </div>
      )}

      <div className="recommendation-card-actions">
        <Link
          className={`recommendation-view-button ${tenderId ? "" : "is-disabled"}`}
          to={tenderId ? `/tender/${tenderId}` : "#"}
          aria-disabled={!tenderId}
        >
          View Tender <FaArrowRight />
        </Link>
      </div>
    </article>
  );
}
