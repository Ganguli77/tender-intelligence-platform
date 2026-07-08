import { useState } from "react";
import {
  INDIA_MAP_VIEWBOX,
  INDIA_STATE_GEOMETRY,
} from "../data/indiaStateGeometry";

export default function IndiaMap({
  activeState = "",
  onStateHover,
  onStateLeave,
  onStateClick,
}) {
  const [hoveredState, setHoveredState] = useState("");

  const handleStateHover = (stateName) => {
    setHoveredState(stateName);
    onStateHover?.(stateName);
  };

  const handleStateLeave = () => {
    setHoveredState("");
    onStateLeave?.();
  };

  return (
    <svg
      viewBox={INDIA_MAP_VIEWBOX}
      width="100%"
      height="100%"
      style={{
        maxWidth: "650px",
        overflow: "visible",
      }}
    >
      {INDIA_STATE_GEOMETRY.map((state) => {
        const active = activeState === state.name;

        return (
          <g key={state.name}>
            <path
              d={state.path}
              fill={active ? "#38bdf8" : "#1e293b"}
              stroke="#64748b"
              strokeWidth={active ? 2 : 1}
              style={{
                cursor: "pointer",
                transition: "all .25s ease",
              }}
              onMouseEnter={() => handleStateHover(state.name)}
              onMouseLeave={handleStateLeave}
              onClick={() => onStateClick?.(state.name)}
            />

            {(active || hoveredState === state.name) && (
              <text
                x={state.centroid[0]}
                y={state.centroid[1]}
                textAnchor="middle"
                fontSize="12"
                fill="#fff"
                fontWeight="bold"
                pointerEvents="none"
              >
                {state.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
