import { memo } from "react";
import { motion } from "framer-motion";
import { INDIA_MAP_VIEWBOX } from "../data/indiaStateGeometry";

// Formats state-level budget values for map tooltips and panels.
function formatCurrency(value = 0) {
  const numeric = Number(value || 0);
  if (numeric >= 10000000) return `INR ${(numeric / 10000000).toFixed(1)} Cr`;
  if (numeric >= 100000) return `INR ${(numeric / 100000).toFixed(0)} L`;
  return `INR ${numeric.toLocaleString("en-IN")}`;
}

// Decorative hero map used to show a high-level animated India tender signal.
export const HeroIndiaMap = memo(function HeroIndiaMap({ stateCards, onStateClick }) {
  return (
    <motion.div
      className="hero-map-card"
      initial={{ opacity: 0, scale: 0.94, rotateX: 8 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Scanline and SVG paths create the animated map visual in the hero. */}
      <div className="map-scanline" />
      <svg viewBox={INDIA_MAP_VIEWBOX} className="hero-india-map" aria-label="Animated India tender map">
        {stateCards.map((state, index) => (
          <motion.path
            key={state.name}
            d={state.path}
            className={`hero-state-glow heat-${state.heat}`}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.85, pathLength: 1 }}
            transition={{ delay: index * 0.015, duration: 0.7 }}
            onClick={() => onStateClick(state.name)}
          >
            <title>{`${state.name}: ${state.count} tenders`}</title>
          </motion.path>
        ))}
      </svg>
      {/* Floating panel highlights the current hottest state on the map. */}
      <div className="hero-map-panel">
        <span>AI map signal</span>
        <strong>{stateCards[0]?.name || "India"}</strong>
        <small>{stateCards[0]?.count || 0} tracked tenders in the hottest state</small>
      </div>
    </motion.div>
  );
});

// Interactive map used on the homepage for state hover, tooltip, and tender filtering.
export const InteractiveStateMap = memo(function InteractiveStateMap({
  stateCards,
  activeState,
  hoverTooltip,
  onHover,
  onLeave,
  onClick,
}) {
  return (
    <div className="state-map-shell" onMouseLeave={onLeave}>
      {/* SVG heat map renders each state as a clickable tender filter target. */}
      <svg viewBox={INDIA_MAP_VIEWBOX} className="state-map-svg" role="img" aria-label="Interactive India tender heat map">
        {stateCards.map((state) => {
          const active = activeState === state.name;

          return (
            <g key={state.name}>
              <motion.path
                d={state.path}
                className={`state-map-region heat-${state.heat} ${active ? "active" : ""}`}
                whileHover={{ scale: 1.025 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                onMouseEnter={(event) => onHover(state, event)}
                onMouseMove={(event) => onHover(state, event)}
                onFocus={(event) => onHover(state, event)}
                onClick={() => onClick(state.name)}
                tabIndex={0}
                role="button"
                aria-label={`${state.name}, ${state.count} tenders, ${formatCurrency(state.totalBudget)} value`}
              >
                <title>{`${state.name}: ${state.count} tenders, ${formatCurrency(state.totalBudget)} value`}</title>
              </motion.path>
              {state.count > 0 ? (
                <text x={state.centroid[0]} y={state.centroid[1]} className="state-map-count" textAnchor="middle">
                  {state.count}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Tooltip appears when a user hovers or focuses a state. */}
      {hoverTooltip ? (
        <div
          className="state-map-tooltip"
          style={{ left: `${hoverTooltip.x}px`, top: `${hoverTooltip.y}px` }}
        >
          <strong>{hoverTooltip.state.name}</strong>
          <span>{hoverTooltip.state.count} tenders</span>
          <small>{formatCurrency(hoverTooltip.state.totalBudget)} total value</small>
          <small>{hoverTooltip.state.topCategory || "Mixed"} leading category</small>
        </div>
      ) : null}
    </div>
  );
});
