import { useMemo } from "react";
import { Link } from "react-router-dom";
import { INDIA_MAP_VIEWBOX, INDIA_STATE_GEOMETRY } from "../../data/indiaStateGeometry";

const numberFormat = new Intl.NumberFormat("en-IN");

function formatPipelineValue(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(0)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(0)} L`;
  }
  return `₹${numberFormat.format(amount)}`;
}

export default function DashboardRegionalMap({ regions = [], error = "" }) {
  const regionByName = useMemo(
    () => new Map(regions.map((region) => [region.state, region])),
    [regions]
  );
  const topRegions = regions.slice(0, 5);
  const maximumCount = Math.max(...regions.map((region) => Number(region.tenderCount || 0)), 1);
  const pipelineValue = regions.reduce((sum, region) => sum + Number(region.pipelineValue || 0), 0);

  return (
    <section className="dashboard-glass-card dashboard-regional-card">
      <div className="dashboard-card-head">
        <h2>Active Tender Volume per State</h2>
        <button type="button" aria-label="Regional activity options">...</button>
      </div>

      <div className="dashboard-regional-content">
        <div className="dashboard-india-map-wrap">
          <svg
            className="dashboard-india-map"
            viewBox={INDIA_MAP_VIEWBOX}
            role="img"
            aria-label="India tender activity map"
          >
            {INDIA_STATE_GEOMETRY.map((state) => {
              const count = Number(regionByName.get(state.name)?.tenderCount || 0);
              const intensity = count ? 0.78 + (count / maximumCount) * 0.22 : 0.68;
              return (
                <path
                  key={state.name}
                  d={state.path}
                  fill={`rgba(0, 224, 219, ${intensity})`}
                  stroke="#142f4c"
                  strokeWidth="2.5"
                >
                  <title>{`${state.name}: ${numberFormat.format(count)} tenders`}</title>
                </path>
              );
            })}
            {topRegions.slice(0, 3).map((region) => {
              const state = INDIA_STATE_GEOMETRY.find((item) => item.name === region.state);
              if (!state) return null;
              const labelX = Math.min(650, state.centroid[0] + 24);
              const labelY = Math.max(24, Math.min(870, state.centroid[1] - 28));
              return (
                <g key={region.state} className="dashboard-map-marker">
                  <circle cx={state.centroid[0]} cy={state.centroid[1]} r="10" />
                  <circle cx={state.centroid[0]} cy={state.centroid[1]} r="4" />
                  <rect x={labelX} y={labelY} width="160" height="50" rx="9" />
                  <text x={labelX + 10} y={labelY + 21}>{region.state}</text>
                  <text x={labelX + 10} y={labelY + 40}>
                    {numberFormat.format(region.tenderCount)} Active
                  </text>
                </g>
              );
            })}
            <g className="dashboard-map-pipeline-tag">
              <rect x="330" y="48" width="190" height="48" rx="9" />
              <text x="342" y="68">Active Pipeline:</text>
              <text x="342" y="87">{formatPipelineValue(pipelineValue)}</text>
            </g>
          </svg>
        </div>

        <aside className="dashboard-region-list">
          <div className="dashboard-region-list-title">Top Activity States</div>
          {topRegions.length ? topRegions.map((region, index) => (
            <Link key={region.state} to={`/tenders?state=${encodeURIComponent(region.state)}`}>
              <i className={`dashboard-region-dot dashboard-region-dot--${index}`} />
              <span>{region.state}</span>
              <strong>{numberFormat.format(region.tenderCount)}</strong>
            </Link>
          )) : (
            <p className="dashboard-empty-text">
              {error || "No state-level tender locations are available yet."}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
