import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sourcePath = path.join(os.tmpdir(), "india_state.geojson");
const outputPath = path.join(process.cwd(), "src", "data", "indiaStateGeometry.js");
const geojson = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const WIDTH = 820;
const HEIGHT = 960;
const PADDING = 28;

const NAME_ALIASES = {
  "Andaman and Nicobar": "Andaman & Nicobar Islands",
  "Dadra and Nagar Haveli": "Dadra & Nagar Haveli",
  "Daman and Diu": "Daman & Diu",
  "Jammu and Kashmir": "Jammu & Kashmir",
  Orissa: "Odisha",
  Uttaranchal: "Uttarakhand",
};

function collectPoints(geometry) {
  const points = [];

  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      points.push(value);
      return;
    }
    value.forEach(visit);
  };

  visit(geometry.coordinates);
  return points;
}

const allPoints = geojson.features.flatMap((feature) => collectPoints(feature.geometry));
let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

allPoints.forEach(([lon, lat]) => {
  minLon = Math.min(minLon, lon);
  maxLon = Math.max(maxLon, lon);
  minLat = Math.min(minLat, lat);
  maxLat = Math.max(maxLat, lat);
});
const scale = Math.min(
  (WIDTH - PADDING * 2) / (maxLon - minLon),
  (HEIGHT - PADDING * 2) / (maxLat - minLat)
);
const mapWidth = (maxLon - minLon) * scale;
const mapHeight = (maxLat - minLat) * scale;
const offsetX = (WIDTH - mapWidth) / 2;
const offsetY = (HEIGHT - mapHeight) / 2;

function project([lon, lat]) {
  return [
    Number((offsetX + (lon - minLon) * scale).toFixed(1)),
    Number((offsetY + (maxLat - lat) * scale).toFixed(1)),
  ];
}

function distanceToSegment(point, start, end) {
  const [px, py] = point;
  const [sx, sy] = start;
  const [ex, ey] = end;
  const dx = ex - sx;
  const dy = ey - sy;

  if (dx === 0 && dy === 0) {
    return Math.hypot(px - sx, py - sy);
  }

  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (sx + t * dx), py - (sy + t * dy));
}

function simplify(points, tolerance = 0.9) {
  if (points.length <= 3) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i += 1) {
    const distance = distanceToSegment(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance > tolerance) {
    return [
      ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
      ...simplify(points.slice(index), tolerance),
    ];
  }

  return [points[0], points[end]];
}

function ringToPath(ring) {
  const projected = ring.map(project);
  const simplified = simplify(projected);
  if (simplified.length < 3) return "";

  return `${simplified
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`)
    .join(" ")} Z`;
}

function geometryToPath(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  return polygons
    .flatMap((polygon) => polygon.map(ringToPath))
    .filter(Boolean)
    .join(" ");
}

function centroid(points) {
  const projected = points.map(project);
  const sum = projected.reduce(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y],
    [0, 0]
  );

  return [
    Number((sum[0] / projected.length).toFixed(1)),
    Number((sum[1] / projected.length).toFixed(1)),
  ];
}

const labelOverrides = {
  "Andaman & Nicobar Islands": [718, 840],
  Chandigarh: [233, 218],
  "Dadra & Nagar Haveli": [125, 484],
  "Daman & Diu": [101, 454],
  Delhi: [247, 262],
  Goa: [173, 610],
  Lakshadweep: [115, 805],
  Puducherry: [301, 751],
};

const states = geojson.features
  .map((feature) => {
    const name = NAME_ALIASES[feature.properties.NAME_1] || feature.properties.NAME_1;
    const points = collectPoints(feature.geometry);

    return {
      name,
      centroid: labelOverrides[name] || centroid(points),
      path: geometryToPath(feature.geometry),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const output = `// Generated from a public India state boundary GeoJSON.
// Regenerate with: node scripts/generateIndiaStateGeometry.mjs
export const INDIA_MAP_VIEWBOX = "0 0 ${WIDTH} ${HEIGHT}";

export const INDIA_STATE_GEOMETRY = ${JSON.stringify(states, null, 2)};
`;

fs.writeFileSync(outputPath, output);
