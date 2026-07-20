import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  CheckCircle2,
  Clock3,
  FileText,
  Landmark,
  LockKeyhole,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { getTenders } from "../../api/tenders";
import { INDIA_MAP_VIEWBOX, INDIA_STATE_GEOMETRY } from "../../data/indiaStateGeometry";
import { tenders as fallbackTenders } from "../../data/tenders";
import "./Home.css";

const trustLogos = [
  "Larsen & Toubro",
  "Tata Projects",
  "Infosys",
  "HCC",
  "Wipro",
  "Godrej Properties",
];

const tenderCards = [
  {
    title: "Smart City Surveillance & Command Center Upgrade",
    organization: "Maharashtra Urban Development Authority",
    category: "IT Infrastructure",
    value: "INR 18.4 Cr",
    deadline: "24 Jul 2026",
    status: "Open",
    score: 94,
  },
  {
    title: "District Hospital Diagnostic Equipment Supply",
    organization: "Karnataka State Health Mission",
    category: "Healthcare",
    value: "INR 9.8 Cr",
    deadline: "31 Jul 2026",
    status: "Closing Soon",
    score: 89,
  },
  {
    title: "Solar Rooftop Deployment for Public Schools",
    organization: "Tamil Nadu Renewable Energy Agency",
    category: "Energy",
    value: "INR 32.6 Cr",
    deadline: "08 Aug 2026",
    status: "New",
    score: 91,
  },
  {
    title: "Metro Depot Civil Works and Maintenance",
    organization: "Delhi Metro Rail Corporation",
    category: "Construction",
    value: "INR 76.2 Cr",
    deadline: "19 Aug 2026",
    status: "Open",
    score: 86,
  },
];

const stats = [
  { value: "10,000+", label: "Active Tenders" },
  { value: "5,000+", label: "Businesses" },
  { value: "95%", label: "AI Accuracy" },
  { value: "INR 500Cr+", label: "Opportunities" },
];

const testimonials = [
  {
    initials: "RS",
    name: "Rahul Sharma",
    role: "Director, InfraBuild Pvt Ltd",
    quote: "NexTender AI reduced our tender discovery time from hours to minutes.",
  },
  {
    initials: "PM",
    name: "Priya Mehta",
    role: "CEO, TechServe Solutions",
    quote: "The AI recommendations helped us identify opportunities we would have missed.",
  },
  {
    initials: "AK",
    name: "Amit Kumar",
    role: "Head of Procurement, EnergyCorp",
    quote: "The dashboard gives our team a clear view of upcoming deadlines and risks.",
  },
];

const faqs = [
  {
    question: "How does AI matching work?",
    answer:
      "NexTender AI analyzes category, budget, organization, location, and historical patterns to estimate how relevant a tender is for your business.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. The platform uses JWT-based authentication and follows secure backend practices with Spring Security.",
  },
  {
    question: "How often are tenders updated?",
    answer:
      "Tender data can be refreshed regularly from connected data sources and backend APIs.",
  },
  {
    question: "Can multiple team members use the platform?",
    answer:
      "The architecture is designed to support future enterprise collaboration features and team-based workflows.",
  },
];

const globePins = [
  { lat: 28.6, lon: 77.2 },
  { lat: 19.1, lon: 72.9 },
  { lat: 13.1, lon: 80.3 },
  { lat: 1.3, lon: 103.8 },
  { lat: 35.7, lon: 139.7 },
  { lat: 25.2, lon: 55.3 },
  { lat: 51.5, lon: -0.1 },
];

const globeRoutes = [
  [0, 1],
  [0, 2],
  [0, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [1, 5],
];

const globeMapOutlines = [
  [
    [72, -168],
    [60, -150],
    [53, -126],
    [49, -104],
    [32, -117],
    [18, -103],
    [8, -81],
    [19, -75],
    [28, -82],
    [36, -75],
    [46, -61],
    [55, -76],
    [64, -96],
    [71, -125],
    [72, -168],
  ],
  [
    [14, -81],
    [8, -72],
    [-3, -78],
    [-15, -76],
    [-32, -70],
    [-54, -67],
    [-48, -58],
    [-31, -49],
    [-16, -39],
    [1, -48],
    [9, -61],
    [14, -81],
  ],
  [
    [70, -10],
    [60, 8],
    [53, 34],
    [56, 68],
    [50, 101],
    [58, 133],
    [45, 150],
    [31, 140],
    [23, 121],
    [16, 106],
    [23, 88],
    [31, 78],
    [28, 63],
    [38, 47],
    [31, 34],
    [41, 26],
    [45, 12],
    [38, -5],
    [51, -9],
    [70, -10],
  ],
  [
    [36, -17],
    [31, 7],
    [15, 16],
    [6, 29],
    [-8, 38],
    [-28, 32],
    [-35, 20],
    [-29, 12],
    [-16, 13],
    [-5, 8],
    [5, -2],
    [15, -16],
    [29, -14],
    [36, -17],
  ],
  [
    [31, 67],
    [29, 77],
    [21, 88],
    [13, 80],
    [8, 77],
    [18, 72],
    [24, 66],
    [31, 67],
  ],
  [
    [22, 92],
    [16, 101],
    [8, 106],
    [1, 104],
    [-6, 112],
    [-8, 124],
    [2, 128],
    [10, 119],
    [18, 112],
    [22, 92],
  ],
  [
    [-11, 112],
    [-20, 121],
    [-29, 134],
    [-36, 146],
    [-25, 153],
    [-16, 145],
    [-13, 130],
    [-11, 112],
  ],
  [
    [63, -52],
    [52, -35],
    [43, -21],
    [36, -9],
    [42, -4],
    [58, -17],
    [68, -32],
    [63, -52],
  ],
  [
    [-63, -180],
    [-68, -120],
    [-66, -45],
    [-70, 22],
    [-65, 96],
    [-69, 160],
    [-63, 180],
    [-61, 75],
    [-62, -35],
    [-63, -180],
  ],
];

function globeLatLonToVector(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function globeShortestLonDistance(lon, center) {
  return Math.abs(((lon - center + 540) % 360) - 180);
}

function globeInEllipse(lat, lon, centerLat, centerLon, latRadius, lonRadius) {
  const adjustedLonRadius = lonRadius * Math.max(0.46, Math.cos(THREE.MathUtils.degToRad(centerLat)));
  const y = (lat - centerLat) / latRadius;
  const x = globeShortestLonDistance(lon, centerLon) / adjustedLonRadius;
  return x * x + y * y < 1;
}

function globeIsLandPoint(lat, lon) {
  return (
    globeInEllipse(lat, lon, 37, 86, 28, 93) ||
    globeInEllipse(lat, lon, 22, 79, 16, 18) ||
    globeInEllipse(lat, lon, 51, 14, 17, 43) ||
    globeInEllipse(lat, lon, 8, 20, 38, 37) ||
    globeInEllipse(lat, lon, -4, 117, 15, 38) ||
    globeInEllipse(lat, lon, -25, 134, 15, 25) ||
    globeInEllipse(lat, lon, 48, -105, 25, 78) ||
    globeInEllipse(lat, lon, -17, -60, 34, 27)
  );
}

function makeGlobePointCloud(count, radius) {
  const land = [];
  const ocean = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const ringRadius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;
    const x = Math.cos(theta) * ringRadius;
    const z = Math.sin(theta) * ringRadius;
    const lat = THREE.MathUtils.radToDeg(Math.asin(y));
    const lon = THREE.MathUtils.radToDeg(Math.atan2(z, -x));
    const target = globeIsLandPoint(lat, lon) ? land : ocean;

    target.push(x * radius, y * radius, z * radius);
  }

  return { land: new Float32Array(land), ocean: new Float32Array(ocean) };
}

function makeGlobeArc(start, end, height = 0.5) {
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(start.length() + height);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(44);
}

function makeGlobeOutline(points, radius) {
  return points.map(([lat, lon]) => globeLatLonToVector(lat, lon, radius));
}

function makeAIGlobeNetwork(count, radius) {
  const nodes = [];
  const linePositions = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const ringRadius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index * 1.8;
    const jitter = 0.94 + ((index * 37) % 17) / 180;
    nodes.push(new THREE.Vector3(
      Math.cos(theta) * ringRadius * radius * jitter,
      y * radius * jitter,
      Math.sin(theta) * ringRadius * radius * jitter,
    ));
  }

  nodes.forEach((node, index) => {
    for (let next = index + 1; next < nodes.length; next += 1) {
      const distance = node.distanceTo(nodes[next]);
      if (distance < 0.72 && (index + next) % 4 === 0) {
        linePositions.push(node.x, node.y, node.z, nodes[next].x, nodes[next].y, nodes[next].z);
      }
    }
  });

  return { nodes, linePositions: new Float32Array(linePositions) };
}

function makeGlobeMapTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  const toPoint = ([lat, lon]) => [
    ((lon + 180) / 360) * width,
    ((90 - lat) / 180) * height,
  ];

  const drawProjectedLine = (coordinates, opacity = 0.24, lineWidth = 1.5) => {
    context.beginPath();
    coordinates.map(toPoint).forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.lineWidth = lineWidth;
    context.strokeStyle = `rgba(255,255,255,${opacity})`;
    context.stroke();
  };

  context.clearRect(0, 0, width, height);

  globeMapOutlines.forEach((outline, index) => {
    const points = outline.map(toPoint);
    context.beginPath();
    points.forEach(([x, y], pointIndex) => {
      if (pointIndex === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();

    const gradient = context.createRadialGradient(width * 0.58, height * 0.42, 20, width * 0.58, height * 0.42, width * 0.46);
    gradient.addColorStop(0, "rgba(192, 132, 252, 0.58)");
    gradient.addColorStop(0.45, "rgba(168, 85, 247, 0.46)");
    gradient.addColorStop(1, "rgba(76, 29, 149, 0.24)");
    context.fillStyle = gradient;
    context.fill();

    context.lineWidth = index === 0 ? 4 : 3;
    context.strokeStyle = index === 0 ? "rgba(216,180,254,0.62)" : "rgba(168,85,247,0.5)";
    context.shadowColor = "rgba(168,85,247,0.86)";
    context.shadowBlur = 22;
    context.stroke();
    context.shadowBlur = 0;

    context.save();
    context.clip();
    context.globalCompositeOperation = "screen";

    const latitudes = [-55, -40, -25, -10, 5, 20, 35, 50, 65];
    const longitudes = [-160, -135, -110, -85, -60, -35, -10, 15, 40, 65, 90, 115, 140, 165];

    latitudes.forEach((lat, lineIndex) => {
      drawProjectedLine(
        Array.from({ length: 18 }, (_, pointIndex) => [
          lat + Math.sin(pointIndex * 0.72 + lineIndex) * 2.2,
          -180 + pointIndex * 21.2,
        ]),
        0.08,
        1,
      );
    });

    longitudes.forEach((lon, lineIndex) => {
      drawProjectedLine(
        Array.from({ length: 13 }, (_, pointIndex) => [
          72 - pointIndex * 11.4,
          lon + Math.sin(pointIndex * 0.8 + lineIndex) * 2.4,
        ]),
        0.08,
        1,
      );
    });

    const regionalLines = [
      [[49, -125], [43, -104], [38, -84], [31, -78]],
      [[58, -112], [51, -95], [46, -75]],
      [[21, -101], [17, -92], [13, -84]],
      [[5, -75], [-8, -66], [-20, -58], [-36, -58]],
      [[-8, -78], [-16, -70], [-28, -67], [-42, -71]],
      [[55, 6], [48, 17], [44, 29], [39, 43]],
      [[50, 45], [43, 68], [39, 90], [44, 118]],
      [[31, 69], [27, 79], [23, 88]],
      [[28, 100], [19, 106], [12, 104]],
      [[29, 32], [17, 30], [5, 29], [-11, 30]],
      [[7, 12], [-6, 21], [-21, 24], [-31, 18]],
      [[-14, 122], [-23, 132], [-32, 143]],
    ];

    regionalLines.forEach((line) => drawProjectedLine(line, 0.18, 1.35));

    context.fillStyle = "rgba(124,58,237,0.16)";
    context.fillRect(0, 0, width, height);
    context.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function formatTenderValue(value = 0) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `INR ${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)} L`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

function getTenderState(tender = {}) {
  const location = String(tender.location || tender.state || "");
  const normalizedLocation = location.toLowerCase();

  if (normalizedLocation.includes("new delhi") || normalizedLocation === "delhi") {
    return "Delhi";
  }

  const directMatch = INDIA_STATE_GEOMETRY.find((state) => normalizedLocation.includes(state.name.toLowerCase()));
  if (directMatch) return directMatch.name;

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || "Not specified";
}

function getHeatLevel(count, maxCount) {
  if (!count) return "none";
  if (count === maxCount) return "hot";
  if (count >= Math.max(2, maxCount * 0.55)) return "high";
  if (count >= Math.max(1, maxCount * 0.28)) return "medium";
  return "low";
}

function hasStoredAuthToken() {
  if (typeof window === "undefined") return false;

  try {
    const storedAuth = window.localStorage.getItem("tenderAuth");
    return Boolean(JSON.parse(storedAuth || "{}")?.token);
  } catch {
    return false;
  }
}

function useRevealOnScroll() {
  useEffect(() => {
    const elements = document.querySelectorAll(".home-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function LightAIGlobe3D() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.08, 6.65);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const globeGroup = new THREE.Group();
    globeGroup.rotation.set(-0.12, -2.75, 0.04);
    scene.add(globeGroup);

    scene.add(new THREE.AmbientLight(0x6d28d9, 1.05));
    const keyLight = new THREE.DirectionalLight(0xd8b4fe, 1.15);
    keyLight.position.set(-3, 4, 5);
    const purpleRim = new THREE.DirectionalLight(0xa855f7, 3.75);
    purpleRim.position.set(4.5, 1.4, -3);
    const violetFill = new THREE.PointLight(0x7c3aed, 4.3, 9);
    violetFill.position.set(0.4, -0.3, 2.8);
    scene.add(keyLight, purpleRim, violetFill);

    const radius = 1.72;
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x07030f,
        emissive: 0x1d0738,
        emissiveIntensity: 0.28,
        roughness: 0.46,
        metalness: 0.46,
        transmission: 0.03,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        clearcoat: 0.55,
        clearcoatRoughness: 0.28,
      }),
    );
    globeGroup.add(shell);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.12, 96, 48),
      new THREE.MeshBasicMaterial({
        color: 0x7c3aed,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    globeGroup.add(halo);

    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.012, 96, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
    );
    globeGroup.add(rim);

    const mapTexture = makeGlobeMapTexture();
    const mapMaterial = new THREE.MeshBasicMaterial({
      map: mapTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mapSurface = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.034, 128, 64),
      mapMaterial,
    );
    globeGroup.add(mapSurface);

    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const makeCircleLine = (points) => new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), ringMaterial);

    [-0.78, -0.48, -0.22, 0.08, 0.34, 0.62, 0.86].forEach((yScale) => {
      const y = radius * yScale;
      const ringRadius = Math.sqrt(radius * radius - y * y);
      const points = Array.from({ length: 120 }, (_, index) => {
        const angle = (index / 120) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius);
      });
      globeGroup.add(makeCircleLine(points));
    });

    Array.from({ length: 10 }, (_, index) => index * (Math.PI / 10)).forEach((angle) => {
      const points = Array.from({ length: 140 }, (_, pointIndex) => {
        const theta = (pointIndex / 140) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
      });
      const longitude = makeCircleLine(points);
      longitude.rotation.y = angle;
      globeGroup.add(longitude);
    });

    const { land, ocean } = makeGlobePointCloud(14000, radius * 1.028);
    const landGeometry = new THREE.BufferGeometry();
    landGeometry.setAttribute("position", new THREE.BufferAttribute(land, 3));
    const landPoints = new THREE.Points(
      landGeometry,
      new THREE.PointsMaterial({
        color: 0xc084fc,
        size: 0.029,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );

    const oceanGeometry = new THREE.BufferGeometry();
    oceanGeometry.setAttribute("position", new THREE.BufferAttribute(ocean, 3));
    const oceanPoints = new THREE.Points(
      oceanGeometry,
      new THREE.PointsMaterial({
        color: 0x7c3aed,
        size: 0.011,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    globeGroup.add(oceanPoints, landPoints);

    const { nodes: aiNodes, linePositions: aiLinePositions } = makeAIGlobeNetwork(145, radius * 1.075);
    const aiNetworkGeometry = new THREE.BufferGeometry();
    aiNetworkGeometry.setAttribute("position", new THREE.BufferAttribute(aiLinePositions, 3));
    const aiNetworkMaterial = new THREE.LineBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const aiNetwork = new THREE.LineSegments(aiNetworkGeometry, aiNetworkMaterial);
    globeGroup.add(aiNetwork);

    const aiNodeGeometry = new THREE.BufferGeometry().setFromPoints(aiNodes);
    const aiNodeMaterial = new THREE.PointsMaterial({
      color: 0xf3e8ff,
      size: 0.034,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const aiNodePoints = new THREE.Points(aiNodeGeometry, aiNodeMaterial);
    globeGroup.add(aiNodePoints);

    const mapLineMaterials = [];
    globeMapOutlines.forEach((outline, index) => {
      const material = new THREE.LineBasicMaterial({
        color: index === 0 ? 0xc084fc : 0xa855f7,
        transparent: true,
        opacity: index === 0 ? 0.42 : 0.32,
        depthWrite: false,
      });
      mapLineMaterials.push(material);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(makeGlobeOutline(outline, radius * 1.062)),
        material,
      );
      globeGroup.add(line);
    });

    const particlePositions = new Float32Array(260 * 3);
    for (let index = 0; index < 260; index += 1) {
      const distance = 2.05 + Math.random() * 1.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[index * 3] = distance * Math.sin(phi) * Math.cos(theta);
      particlePositions[index * 3 + 1] = distance * Math.cos(phi) * 0.78;
      particlePositions[index * 3 + 2] = distance * Math.sin(phi) * Math.sin(theta);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xc084fc,
        size: 0.012,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    const pinVectors = globePins.map((pin) => globeLatLonToVector(pin.lat, pin.lon, radius * 1.045));
    const routeMaterials = [];
    const markerMaterials = [];
    const pulseMaterials = [];

    globeRoutes.forEach(([from, to], index) => {
      const points = makeGlobeArc(pinVectors[from], pinVectors[to], 0.34 + (index % 3) * 0.08);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: index % 2 ? 0xc084fc : 0xa855f7,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      });
      routeMaterials.push(material);
      const line = new THREE.Line(
        geometry,
        material,
      );
      globeGroup.add(line);
    });

    pinVectors.forEach((position, index) => {
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xffffff : 0xc084fc,
        transparent: true,
        opacity: 0.96,
      });
      markerMaterials.push(markerMaterial);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(index === 0 ? 0.046 : 0.034, 18, 18),
        markerMaterial,
      );
      marker.position.copy(position.clone().multiplyScalar(1.012));
      globeGroup.add(marker);

      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      pulseMaterials.push(pulseMaterial);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(index === 0 ? 0.09 : 0.068, 24, 24),
        pulseMaterial,
      );
      pulse.position.copy(marker.position);
      globeGroup.add(pulse);
    });

    const themeState = {
      landBaseOpacity: 0.9,
      landPulse: 0.08,
    };

    const applyGlobeTheme = () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";

      if (isDark) {
        shell.material.color.setHex(0x07030f);
        shell.material.emissive.setHex(0x1d0738);
        shell.material.emissiveIntensity = 0.3;
        shell.material.opacity = 0.5;
        shell.material.metalness = 0.48;
        shell.material.transmission = 0.02;
        shell.material.clearcoat = 0.5;
        halo.material.opacity = 0.1;
        rim.material.color.setHex(0xc084fc);
        rim.material.opacity = 0.18;
        mapMaterial.opacity = 0.78;
        aiNetworkMaterial.opacity = 0.48;
        aiNodeMaterial.opacity = 0.94;
        landPoints.material.color.setHex(0xa855f7);
        landPoints.material.size = 0.018;
        landPoints.material.opacity = 0.24;
        oceanPoints.material.color.setHex(0x7c3aed);
        oceanPoints.material.opacity = 0.18;
        particles.material.opacity = 0.52;
        ringMaterial.opacity = 0.2;
        mapLineMaterials.forEach((material, index) => {
          material.color.setHex(index === 0 ? 0xc084fc : 0xa855f7);
          material.opacity = index === 0 ? 0.36 : 0.28;
        });
        routeMaterials.forEach((material, index) => {
          material.color.setHex(index % 2 ? 0xc084fc : 0xa855f7);
          material.opacity = 0.58;
        });
        markerMaterials.forEach((material, index) => {
          material.color.setHex(index === 0 ? 0xf3e8ff : 0xc084fc);
          material.opacity = 0.96;
        });
        pulseMaterials.forEach((material) => {
          material.color.setHex(0xa855f7);
          material.opacity = 0.24;
        });
        themeState.landBaseOpacity = 0.2;
        themeState.landPulse = 0.04;
      } else {
        shell.material.color.setHex(0x090414);
        shell.material.emissive.setHex(0x25084a);
        shell.material.emissiveIntensity = 0.34;
        shell.material.opacity = 0.48;
        shell.material.metalness = 0.42;
        shell.material.transmission = 0.03;
        shell.material.clearcoat = 0.6;
        halo.material.opacity = 0.1;
        rim.material.color.setHex(0xa855f7);
        rim.material.opacity = 0.14;
        mapMaterial.opacity = 0.76;
        aiNetworkMaterial.opacity = 0.44;
        aiNodeMaterial.opacity = 0.9;
        landPoints.material.color.setHex(0xa855f7);
        landPoints.material.size = 0.018;
        landPoints.material.opacity = 0.22;
        oceanPoints.material.color.setHex(0x7c3aed);
        oceanPoints.material.opacity = 0.2;
        particles.material.opacity = 0.44;
        ringMaterial.opacity = 0.18;
        mapLineMaterials.forEach((material, index) => {
          material.color.setHex(index === 0 ? 0xc084fc : 0x9333ea);
          material.opacity = index === 0 ? 0.34 : 0.26;
        });
        routeMaterials.forEach((material, index) => {
          material.color.setHex(index % 2 ? 0xc084fc : 0x7c3aed);
          material.opacity = 0.5;
        });
        markerMaterials.forEach((material, index) => {
          material.color.setHex(index === 0 ? 0xf3e8ff : 0xa855f7);
          material.opacity = 0.98;
        });
        pulseMaterials.forEach((material) => {
          material.color.setHex(0x7c3aed);
          material.opacity = 0.22;
        });
        themeState.landBaseOpacity = 0.18;
        themeState.landPulse = 0.04;
      }

      shell.material.needsUpdate = true;
      halo.material.needsUpdate = true;
      rim.material.needsUpdate = true;
      mapMaterial.needsUpdate = true;
      aiNetworkMaterial.needsUpdate = true;
      aiNodeMaterial.needsUpdate = true;
      landPoints.material.needsUpdate = true;
      oceanPoints.material.needsUpdate = true;
      particles.material.needsUpdate = true;
      mapLineMaterials.forEach((material) => {
        material.needsUpdate = true;
      });
    };

    applyGlobeTheme();
    const themeObserver = new MutationObserver(applyGlobeTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      const safeWidth = Math.max(width, 320);
      const safeHeight = Math.max(height, 320);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    let frameId;
    const timer = new THREE.Timer();
    timer.connect(document);

    const animate = (timestamp) => {
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      globeGroup.rotation.y = -2.75 + elapsed * 0.075;
      globeGroup.rotation.x = -0.12 + Math.sin(elapsed * 0.4) * 0.025;
      globeGroup.rotation.z = 0.04 + Math.sin(elapsed * 0.22) * 0.018;
      particles.rotation.y = elapsed * 0.022;
      aiNetwork.rotation.y = Math.sin(elapsed * 0.2) * 0.035;
      aiNodePoints.material.opacity = 0.76 + Math.abs(Math.sin(elapsed * 1.6)) * 0.2;
      landPoints.material.opacity = Math.max(0.12, themeState.landBaseOpacity + Math.sin(elapsed * 1.4) * themeState.landPulse);
      halo.material.opacity = Math.max(0.06, halo.material.opacity + Math.sin(elapsed * 1.2) * 0.0008);
      markerMaterials.forEach((material, index) => {
        material.opacity = 0.78 + Math.sin(elapsed * 2 + index) * 0.18;
      });
      pulseMaterials.forEach((material, index) => {
        material.opacity = 0.12 + Math.abs(Math.sin(elapsed * 1.6 + index)) * 0.18;
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      timer.dispose();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      mapTexture.dispose();
    };
  }, []);

  return (
    <div className="home-globe-3d-stage" ref={stageRef}>
      <canvas ref={canvasRef} className="home-globe-3d-canvas" />
    </div>
  );
}

function AIGlobeIllustration() {
  return (
    <div className="home-globe-shell" aria-label="AI tender intelligence globe illustration">
      <div className="home-globe-orbit home-globe-orbit--outer" />
      <div className="home-globe-orbit home-globe-orbit--inner" />

      <LightAIGlobe3D />

      <div className="home-hero-dashboard" aria-label="NexTender AI dashboard preview">
        <div className="home-hero-dashboard__top">
          <div>
            <span>NexTender AI</span>
            <strong>Tender Intelligence Dashboard</strong>
          </div>
          <div className="home-dashboard-icons">
            <i />
            <i />
          </div>
        </div>

        <div className="home-dashboard-search">
          <Search size={14} />
          <span>Search tender intelligence...</span>
        </div>

        <div className="home-dashboard-stats">
          <article>
            <FileText size={17} />
            <span>Recent Tender</span>
            <strong>Metro Depot AI Surveillance</strong>
            <small>Delhi Infrastructure Board</small>
          </article>
          <article>
            <Target size={17} />
            <span>AI Match</span>
            <strong>94%</strong>
            <small>Excellent opportunity</small>
          </article>
          <article>
            <Bell size={17} />
            <span>Notifications</span>
            <strong>12</strong>
            <small>New matches today</small>
          </article>
        </div>

        <div className="home-dashboard-body">
          <div className="home-dashboard-chart">
            <div>
              <span>
                <BarChart3 size={15} />
                Analytics Chart
              </span>
              <strong>Pipeline Value</strong>
            </div>
            <div className="home-dashboard-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="home-dashboard-timeline">
            <span>Mini Activity Timeline</span>
            <ol>
              <li>
                <i />
                <span>AI scored 18 tenders</span>
              </li>
              <li>
                <i />
                <span>3 deadlines approaching</span>
              </li>
              <li>
                <i />
                <span>New PSU tender detected</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <article className="home-floating-card home-floating-card--score">
        <span>AI Match Score</span>
        <strong>94%</strong>
        <small>Excellent Match</small>
        <div className="home-score-sparkline" aria-hidden="true">
          <i />
          <TrendingUp size={28} />
        </div>
      </article>

      <article className="home-floating-card home-floating-card--alert">
        <div className="home-alert-icon">
          <Bell size={22} />
        </div>
        <div>
          <span>Tender Alert</span>
          <strong>12 New Opportunities</strong>
          <small>High-value matches</small>
          <Link to="/tenders">
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
      </article>

      <article className="home-floating-card home-floating-card--analytics">
        <span>INR 48 Cr</span>
        <strong>Infrastructure Tender</strong>
        <small>Closing in 3 Days</small>
        <div className="home-card-icon home-card-icon--clock">
          <Clock3 size={18} />
        </div>
      </article>

      <article className="home-floating-card home-floating-card--signal">
        <Activity size={18} />
        <span>Opportunity Score</span>
        <strong>92</strong>
        <small>High Success Probability</small>
        <div className="home-signal-progress" aria-hidden="true">
          <i />
        </div>
      </article>
    </div>
  );
}

function IndiaHeatmap() {
  const [activeState, setActiveState] = useState("Maharashtra");
  const [mapTenders, setMapTenders] = useState(fallbackTenders);
  const [isUsingLiveData, setIsUsingLiveData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!hasStoredAuthToken()) {
      return undefined;
    }

    getTenders()
      .then((items) => {
        if (isMounted && items.length) {
          setMapTenders(items);
          setIsUsingLiveData(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMapTenders(fallbackTenders);
          setIsUsingLiveData(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stateCards = useMemo(() => {
    const tendersByState = mapTenders.reduce((grouped, tender) => {
      const state = getTenderState(tender);
      if (!grouped.has(state)) grouped.set(state, []);
      grouped.get(state).push(tender);
      return grouped;
    }, new Map());

    const maxCount = Math.max(...Array.from(tendersByState.values()).map((items) => items.length), 1);

    return INDIA_STATE_GEOMETRY.map((state) => {
      const stateTenders = tendersByState.get(state.name) || [];
      const totalValue = stateTenders.reduce((sum, tender) => sum + Number(tender.amountValue || 0), 0);
      const categoryCounts = stateTenders.reduce((counts, tender) => {
        const category = tender.category || "General";
        counts.set(category, (counts.get(category) || 0) + 1);
        return counts;
      }, new Map());
      const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "No active tender";

      return {
        ...state,
        count: stateTenders.length,
        totalValue,
        tenders: stateTenders,
        topCategory,
        heat: getHeatLevel(stateTenders.length, maxCount),
      };
    });
  }, [mapTenders]);

  const selectedState = stateCards.find((state) => state.name === activeState) || stateCards.find((state) => state.count > 0) || stateCards[0];
  const topStates = [...stateCards].filter((state) => state.count > 0).sort((a, b) => b.count - a.count).slice(0, 4);
  const nationalSummary = stateCards.reduce(
    (summary, state) => ({
      tenders: summary.tenders + state.count,
      value: summary.value + state.totalValue,
      states: summary.states + (state.count > 0 ? 1 : 0),
    }),
    { tenders: 0, value: 0, states: 0 },
  );

  const handleSelectState = (stateName) => {
    setActiveState(stateName);
  };

  return (
    <div className="home-map-card">
      <div className="home-map-toolbar">
        <span>{isUsingLiveData ? "Live Tender Density" : "Sample Tender Density"}</span>
        <div>
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="home-map-layout">
        <div className="home-india-map">
          <svg viewBox={INDIA_MAP_VIEWBOX} role="img" aria-label="Interactive India state tender heatmap">
            {stateCards.map((state) => {
              const active = selectedState?.name === state.name;

              return (
                <g key={state.name}>
                  <path
                    className={`home-state home-state--${state.heat} ${active ? "is-active" : ""}`}
                    d={state.path}
                    tabIndex={0}
                    role="button"
                    aria-label={`${state.name}: ${state.count} tenders, ${formatTenderValue(state.totalValue)} total value`}
                    onFocus={() => handleSelectState(state.name)}
                    onClick={() => handleSelectState(state.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelectState(state.name);
                      }
                    }}
                  >
                    <title>{`${state.name}: ${state.count} tenders`}</title>
                  </path>
                  {state.count > 0 ? (
                    <text x={state.centroid[0]} y={state.centroid[1]} className="home-state-count" textAnchor="middle">
                      {state.count}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="home-map-details" aria-live="polite">
          <div className="home-map-summary">
            <article>
              <span>India total</span>
              <strong>{nationalSummary.tenders}</strong>
            </article>
            <article>
              <span>States active</span>
              <strong>{nationalSummary.states}</strong>
            </article>
            <article>
              <span>Pipeline value</span>
              <strong>{formatTenderValue(nationalSummary.value)}</strong>
            </article>
          </div>

          <div className="home-map-details__head">
            <span>Selected state</span>
            <h3>{selectedState?.name || "India"}</h3>
          </div>
          <div className="home-map-stats">
            <article>
              <span>Tenders</span>
              <strong>{selectedState?.count || 0}</strong>
            </article>
            <article>
              <span>Total value</span>
              <strong>{formatTenderValue(selectedState?.totalValue)}</strong>
            </article>
            <article>
              <span>Top category</span>
              <strong>{selectedState?.topCategory || "No active tender"}</strong>
            </article>
          </div>

          <div className="home-map-tender-list">
            {(selectedState?.tenders || []).slice(0, 4).map((tender) => (
              <Link to={`/tenders/${tender.id}`} key={tender.id} className="home-map-tender">
                <span>{tender.category}</span>
                <strong>{tender.title}</strong>
                <small>{tender.organization}</small>
                <i>{tender.amount || formatTenderValue(tender.amountValue)}</i>
              </Link>
            ))}
            {selectedState?.count ? null : (
              <p>No sample tenders are currently tagged to this state.</p>
            )}
          </div>

          <div className="home-map-top-states">
            {topStates.map((state) => (
              <button
                type="button"
                className={selectedState?.name === state.name ? "is-active" : ""}
                key={state.name}
                onClick={() => handleSelectState(state.name)}
              >
                <span>{state.name}</span>
                <strong>{state.count}</strong>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function InsightsPreview() {
  return (
    <section className="home-section home-insights home-reveal">
      <div className="home-section-heading">
        <span className="home-kicker">AI Insights Preview</span>
        <h2>Decision intelligence for every bid.</h2>
      </div>

      <div className="home-insight-panel">
        <div className="home-insight-score">
          <span>AI Match Score</span>
          <strong>94%</strong>
          <small>Excellent</small>
        </div>

        <div className="home-insight-metrics">
          <article>
            <span>Risk Level</span>
            <strong>Low</strong>
            <small>Safe</small>
          </article>
          <article>
            <span>Competition</span>
            <strong>Medium</strong>
            <small>Balanced</small>
          </article>
          <article>
            <span>Deadline</span>
            <strong>12d</strong>
            <small>Urgent</small>
          </article>
        </div>

        <div className="home-signal-summary">
          <div>
            <span>AI Signal Summary</span>
            <strong>Strong Opportunity</strong>
          </div>
          <div className="home-signal-grid">
            <article>
              <span>Category Fit</span>
              <strong>Strong</strong>
            </article>
            <article>
              <span>Budget Alignment</span>
              <strong>Good</strong>
            </article>
            <article>
              <span>Missing Documents</span>
              <strong>1 item</strong>
            </article>
          </div>
        </div>

        <div className="home-ai-summary">
          <span>AI Summary</span>
          <p>
            This tender shows a high probability of eligibility based on category alignment, budget range, and recent
            application patterns. Recommended for immediate review.
          </p>
          <div className="home-probability">
            <span>Winning Probability</span>
            <strong>78%</strong>
          </div>
          <Link className="home-button home-button--primary" to="/insights">
            View AI Insights
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useRevealOnScroll();

  return (
    <div className="home-page">
      <section className="home-hero home-reveal">
        <div className="home-hero__content">
          <div className="home-hero-badges">
            <span className="home-kicker">
              <Sparkles size={15} />
              Enterprise AI Tender Platform
            </span>
            <span className="home-kicker home-kicker--secondary">
              <Sparkles size={15} />
              AI <b>•</b> Smart Matching <b>•</b> Predictive Analytics
            </span>
          </div>
          <h1>
            AI-Powered
            <br />
            Tender Intelligence
            <br />
            for <span>Modern</span>
            <br />
            Businesses
          </h1>
          <p>
            Discover, analyze and win Government & Private tenders with AI-powered opportunity scoring, predictive
            analytics, intelligent recommendations and real-time monitoring.
          </p>
          <div className="home-actions">
            <Link className="home-button home-button--primary" to="/tenders">
              <Search size={19} />
              Explore Marketplace
              <ArrowRight size={18} />
            </Link>
            <Link className="home-button home-button--secondary" to="/insights">
              <PlayCircle size={19} />
              Watch Demo
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="home-trust-metrics">
            <span>
              <ShieldCheck size={22} />
              Trusted by <strong>Government Agencies</strong>
            </span>
            <span>
              <CheckCircle2 size={22} />
              <strong>PSUs</strong>
            </span>
            <span>
              <Landmark size={22} />
              <strong>Private Enterprises</strong>
            </span>
            <span>
              <LockKeyhole size={22} />
              <strong>Startups</strong>
            </span>
          </div>
        </div>

        <AIGlobeIllustration />

        <div className="home-logo-strip" aria-label="Trusted by leading organizations">
          <span>Trusted by leading organizations</span>
          {trustLogos.map((logo) => (
            <strong key={logo}>{logo}</strong>
          ))}
        </div>
      </section>

      <section className="home-section home-heatmap home-reveal">
        <div className="home-section-heading">
          <span className="home-kicker">India Tender Heatmap</span>
          <h2>India Tender Activity</h2>
          <p>Regional procurement momentum, highlighted with live opportunity density across high-volume states.</p>
        </div>
        <IndiaHeatmap />
      </section>

      <section id="features" className="home-section home-reveal">
        <div className="home-section-heading home-section-heading--split">
          <div>
            <span className="home-kicker">Live Tender Preview</span>
            <h2>Premium tender cards with AI fit signals.</h2>
          </div>
          <Link className="home-inline-link" to="/tenders">
            Explore all
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="home-tender-grid">
          {tenderCards.map((tender) => (
            <article className="home-tender-card" key={tender.title}>
              <div className="home-tender-card__top">
                <span className={`home-status home-status--${tender.status.toLowerCase().replace(/\s/g, "-")}`}>
                  {tender.status}
                </span>
                <button type="button" aria-label={`Bookmark ${tender.title}`}>
                  <Bookmark size={18} />
                </button>
              </div>
              <h3>{tender.title}</h3>
              <p>{tender.organization}</p>
              <div className="home-tender-details">
                <span>Category</span>
                <strong>{tender.category}</strong>
                <span>Value</span>
                <strong>{tender.value}</strong>
                <span>Deadline</span>
                <strong>{tender.deadline}</strong>
              </div>
              <div className="home-match-row">
                <span>AI Match Score</span>
                <strong>{tender.score}%</strong>
              </div>
              <div className="home-match-track">
                <i style={{ width: `${tender.score}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <InsightsPreview />

      <section className="home-stats home-reveal">
        {stats.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section id="pricing" className="home-section home-pricing home-reveal">
        <div className="home-section-heading home-section-heading--center">
          <span className="home-kicker">Pricing</span>
          <h2>Future-ready plans for every tender team.</h2>
          <p>Move from discovery to AI scoring, predictive analytics, alerts and enterprise controls as your bid operation grows.</p>
        </div>
        <div className="home-pricing-grid">
          {[
            ["Starter", "For founders and compact bid teams", "Smart search", "Saved tenders", "Basic alerts"],
            ["Growth", "For active procurement teams", "AI match scoring", "Predictive analytics", "Priority alerts"],
            ["Enterprise", "For large organizations", "Admin controls", "Custom workflows", "Dedicated support"],
          ].map(([name, description, featureOne, featureTwo, featureThree]) => (
            <article className="home-pricing-card" key={name}>
              <span>{name}</span>
              <h3>{description}</h3>
              <ul>
                {[featureOne, featureTwo, featureThree].map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link className="home-inline-link" to="/register">
                Get Started
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-reveal">
        <div className="home-section-heading home-section-heading--center">
          <span className="home-kicker">Testimonials</span>
          <h2>Built for teams that move on opportunity.</h2>
        </div>
        <div className="home-testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="home-testimonial-card" key={testimonial.initials}>
              <div className="home-avatar">{testimonial.initials}</div>
              <p>"{testimonial.quote}"</p>
              <div>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-faq home-reveal">
        <div className="home-section-heading home-section-heading--center">
          <span className="home-kicker">FAQ</span>
          <h2>Enterprise-ready answers.</h2>
        </div>
        <div className="home-faq-list">
          {faqs.map((faq) => (
            <details className="home-faq-item" key={faq.question}>
              <summary>
                {faq.question}
                <CheckCircle2 size={18} />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="home-final-cta home-reveal">
        <span className="home-kicker">Get Started Today</span>
        <h2>Ready to Discover Your Next Opportunity?</h2>
        <p>Join businesses using AI to find, analyze, and win high-value tenders.</p>
        <div className="home-actions home-actions--center">
          <Link className="home-button home-button--primary" to="/register">
            Get Started
            <ArrowRight size={18} />
          </Link>
          <Link className="home-button home-button--secondary" to="/tenders">
            <Landmark size={18} />
            Explore Tenders
          </Link>
        </div>
        <div className="home-security-note">
          <ShieldCheck size={17} />
          Secure by design with modern authentication and backend controls
        </div>
      </section>
    </div>
  );
}

