import RecommendationCard from "./RecommendationCard";

function RecommendationSkeleton() {
  return (
    <article className="recommendation-skeleton" aria-hidden="true">
      <span />
      <strong />
      <p />
      <div>
        <i />
        <i />
        <i />
        <i />
      </div>
    </article>
  );
}

export default function RecommendationSection({ recommendations = [], loading = false }) {
  const hasRecommendations = Array.isArray(recommendations) && recommendations.length > 0;

  return (
    <section className="recommendation-section">
      <style>{`
        .recommendation-section {
          width: min(1220px, calc(100% - 40px));
          margin: 0 auto;
          color: #f8fbff;
        }

        .recommendation-section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .recommendation-section-kicker {
          display: inline-flex;
          width: fit-content;
          margin-bottom: 10px;
          color: #55f0bd;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .recommendation-section h2 {
          margin: 0;
          color: #fff;
          font-size: clamp(1.6rem, 3vw, 2.55rem);
          line-height: 1.1;
          letter-spacing: 0;
        }

        .recommendation-section p {
          max-width: 560px;
          margin: 10px 0 0;
          color: #a9d8ff;
          font-size: 0.98rem;
          line-height: 1.65;
        }

        .recommendation-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .recommendation-empty {
          display: grid;
          place-items: center;
          min-height: 180px;
          border: 1px solid rgba(85, 240, 189, 0.18);
          border-radius: 18px;
          color: #a9d8ff;
          background:
            radial-gradient(circle at 50% 0%, rgba(24, 168, 255, 0.16), transparent 34%),
            rgba(5, 16, 38, 0.92);
          text-align: center;
        }

        .recommendation-skeleton {
          min-height: 330px;
          padding: 22px;
          border: 1px solid rgba(85, 240, 189, 0.18);
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(5, 17, 38, 0.96), rgba(2, 8, 25, 0.98));
          overflow: hidden;
        }

        .recommendation-skeleton span,
        .recommendation-skeleton strong,
        .recommendation-skeleton p,
        .recommendation-skeleton i {
          display: block;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(9, 28, 62, 0.82), rgba(85, 240, 189, 0.2), rgba(9, 28, 62, 0.82));
          background-size: 220% 100%;
          animation: recommendationShimmer 1.2s ease-in-out infinite;
        }

        .recommendation-skeleton span {
          width: 132px;
          height: 36px;
        }

        .recommendation-skeleton strong {
          width: 88%;
          height: 24px;
          margin-top: 28px;
        }

        .recommendation-skeleton p {
          width: 64%;
          height: 16px;
          margin-top: 16px;
        }

        .recommendation-skeleton div {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 30px;
        }

        .recommendation-skeleton i {
          height: 42px;
          border-radius: 12px;
        }

        @keyframes recommendationShimmer {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }

        @media (max-width: 1080px) {
          .recommendation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .recommendation-section {
            width: min(100% - 28px, 1220px);
          }

          .recommendation-section-head {
            display: block;
          }

          .recommendation-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="recommendation-section-head">
        <div>
          <span className="recommendation-section-kicker">AI Recommendations</span>
          <h2>Recommended For You</h2>
          <p>AI-powered recommendations based on your interests.</p>
        </div>
      </div>

      {loading ? (
        <div className="recommendation-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <RecommendationSkeleton key={index} />
          ))}
        </div>
      ) : hasRecommendations ? (
        <div className="recommendation-grid">
          {recommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation?.tender?.id || recommendation?.tender?.referenceNo || index}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : (
        <div className="recommendation-empty">No recommendations available yet.</div>
      )}
    </section>
  );
}
