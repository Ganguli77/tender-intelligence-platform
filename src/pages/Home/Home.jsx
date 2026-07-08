import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  CheckCircle2,
  Landmark,
  LockKeyhole,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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
    value: "₹18.4 Cr",
    deadline: "24 Jul 2026",
    status: "Open",
    score: 94,
  },
  {
    title: "District Hospital Diagnostic Equipment Supply",
    organization: "Karnataka State Health Mission",
    category: "Healthcare",
    value: "₹9.8 Cr",
    deadline: "31 Jul 2026",
    status: "Closing Soon",
    score: 89,
  },
  {
    title: "Solar Rooftop Deployment for Public Schools",
    organization: "Tamil Nadu Renewable Energy Agency",
    category: "Energy",
    value: "₹32.6 Cr",
    deadline: "08 Aug 2026",
    status: "New",
    score: 91,
  },
  {
    title: "Metro Depot Civil Works and Maintenance",
    organization: "Delhi Metro Rail Corporation",
    category: "Construction",
    value: "₹76.2 Cr",
    deadline: "19 Aug 2026",
    status: "Open",
    score: 86,
  },
];

const stats = [
  { value: "10,000+", label: "Active Tenders" },
  { value: "5,000+", label: "Businesses" },
  { value: "95%", label: "AI Accuracy" },
  { value: "₹500Cr+", label: "Opportunities" },
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

const heatmapLabels = [
  { name: "Maharashtra", count: "2,145 tenders", x: 116, y: 250, className: "home-map-label--maharashtra" },
  { name: "Karnataka", count: "1,780 tenders", x: 132, y: 314, className: "home-map-label--karnataka" },
  { name: "Delhi", count: "1,220 tenders", x: 154, y: 123, className: "home-map-label--delhi" },
  { name: "Tamil Nadu", count: "1,650 tenders", x: 173, y: 362, className: "home-map-label--tamil" },
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
    camera.position.set(0, 0.08, 7.55);

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
    globeGroup.rotation.set(-0.12, -2.58, 0.04);
    scene.add(globeGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.25);
    keyLight.position.set(-3, 4, 5);
    const blueRim = new THREE.DirectionalLight(0x3b82f6, 2.2);
    blueRim.position.set(4.5, 1.4, -3);
    scene.add(keyLight, blueRim);

    const radius = 1.58;
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        emissive: 0xeff6ff,
        emissiveIntensity: 0.28,
        roughness: 0.42,
        metalness: 0.08,
        transmission: 0.12,
        transparent: true,
        opacity: 0.5,
        clearcoat: 0.72,
        clearcoatRoughness: 0.28,
      }),
    );
    globeGroup.add(shell);

    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.012, 96, 48),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        wireframe: true,
        transparent: true,
        opacity: 0.045,
      }),
    );
    globeGroup.add(rim);

    const { land, ocean } = makeGlobePointCloud(5200, radius * 1.025);
    const landGeometry = new THREE.BufferGeometry();
    landGeometry.setAttribute("position", new THREE.BufferAttribute(land, 3));
    const landPoints = new THREE.Points(
      landGeometry,
      new THREE.PointsMaterial({
        color: 0x2563eb,
        size: 0.021,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
    );

    const oceanGeometry = new THREE.BufferGeometry();
    oceanGeometry.setAttribute("position", new THREE.BufferAttribute(ocean, 3));
    const oceanPoints = new THREE.Points(
      oceanGeometry,
      new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.009,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    globeGroup.add(oceanPoints, landPoints);

    const pinVectors = globePins.map((pin) => globeLatLonToVector(pin.lat, pin.lon, radius * 1.045));
    const routeMaterials = [];
    const markerMaterials = [];
    const pulseMaterials = [];

    globeRoutes.forEach(([from, to], index) => {
      const points = makeGlobeArc(pinVectors[from], pinVectors[to], 0.34 + (index % 3) * 0.08);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: index % 2 ? 0x60a5fa : 0x2563eb,
        transparent: true,
        opacity: 0.36,
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
        color: index === 0 ? 0x2563eb : 0x3b82f6,
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
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.18,
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
        shell.material.color.setHex(0x071426);
        shell.material.emissive.setHex(0x071b33);
        shell.material.emissiveIntensity = 0.2;
        shell.material.opacity = 0.34;
        shell.material.metalness = 0.34;
        shell.material.transmission = 0.04;
        shell.material.clearcoat = 0.48;
        rim.material.color.setHex(0x60a5fa);
        rim.material.opacity = 0.075;
        landPoints.material.color.setHex(0x60a5fa);
        landPoints.material.size = 0.02;
        oceanPoints.material.color.setHex(0x1d4ed8);
        oceanPoints.material.opacity = 0.1;
        routeMaterials.forEach((material, index) => {
          material.color.setHex(index % 2 ? 0x38bdf8 : 0x60a5fa);
          material.opacity = 0.22;
        });
        markerMaterials.forEach((material, index) => {
          material.color.setHex(index === 0 ? 0xbfdbfe : 0x60a5fa);
          material.opacity = 0.9;
        });
        pulseMaterials.forEach((material) => {
          material.color.setHex(0x2563eb);
          material.opacity = 0.12;
        });
        themeState.landBaseOpacity = 0.68;
        themeState.landPulse = 0.06;
      } else {
        shell.material.color.setHex(0xdbeafe);
        shell.material.emissive.setHex(0xeff6ff);
        shell.material.emissiveIntensity = 0.36;
        shell.material.opacity = 0.54;
        shell.material.metalness = 0.08;
        shell.material.transmission = 0.12;
        shell.material.clearcoat = 0.72;
        rim.material.color.setHex(0x2563eb);
        rim.material.opacity = 0.072;
        landPoints.material.color.setHex(0x2563eb);
        landPoints.material.size = 0.026;
        oceanPoints.material.color.setHex(0x60a5fa);
        oceanPoints.material.opacity = 0.2;
        routeMaterials.forEach((material, index) => {
          material.color.setHex(index % 2 ? 0x3b82f6 : 0x2563eb);
          material.opacity = 0.4;
        });
        markerMaterials.forEach((material, index) => {
          material.color.setHex(index === 0 ? 0x1d4ed8 : 0x2563eb);
          material.opacity = 0.98;
        });
        pulseMaterials.forEach((material) => {
          material.color.setHex(0x3b82f6);
          material.opacity = 0.2;
        });
        themeState.landBaseOpacity = 0.9;
        themeState.landPulse = 0.08;
      }

      shell.material.needsUpdate = true;
      rim.material.needsUpdate = true;
      landPoints.material.needsUpdate = true;
      oceanPoints.material.needsUpdate = true;
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
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      globeGroup.rotation.y = -2.58 + Math.sin(elapsed * 0.18) * 0.16;
      globeGroup.rotation.x = -0.12 + Math.sin(elapsed * 0.4) * 0.025;
      landPoints.material.opacity = themeState.landBaseOpacity + Math.sin(elapsed * 1.4) * themeState.landPulse;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
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

      <article className="home-floating-card home-floating-card--score">
        <span>AI Match Score</span>
        <strong>94%</strong>
        <small>Excellent fit</small>
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
          <strong>12 New</strong>
          <small>High-value matches</small>
          <Link to="/tenders">
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
      </article>

      <article className="home-floating-card home-floating-card--analytics">
        <span>Market Insights</span>
        <div className="home-bar-chart" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <small>High opportunities in your region</small>
      </article>

      <article className="home-floating-card home-floating-card--signal">
        <ArrowUpRight size={18} />
        <span>Win Signal</span>
        <strong>78%</strong>
        <small>Recommended</small>
        <div className="home-signal-progress" aria-hidden="true">
          <i />
        </div>
      </article>
    </div>
  );
}

function IndiaHeatmap() {
  return (
    <div className="home-map-card">
      <div className="home-map-toolbar">
        <span>Live Tender Density</span>
        <div>
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="home-india-map">
        <svg viewBox="0 0 320 420" role="img" aria-label="Simplified India tender activity heatmap">
          <path className="home-state home-state--low" d="M127 52 170 40 205 68 197 107 154 112 124 91Z" />
          <path className="home-state home-state--medium" d="M95 94 154 112 144 163 99 164 70 130Z" />
          <path className="home-state home-state--high" d="M144 112 206 106 229 151 198 186 145 164Z" />
          <path className="home-state home-state--delhi" d="M138 118 157 119 155 139 136 137Z" />
          <path className="home-state home-state--low" d="M68 132 99 164 91 213 48 203 38 159Z" />
          <path className="home-state home-state--high" d="M99 164 145 164 155 216 114 249 91 213Z" />
          <path className="home-state home-state--medium" d="M155 216 198 186 229 214 216 262 165 263Z" />
          <path className="home-state home-state--maharashtra" d="M86 217 155 216 165 263 124 300 76 278Z" />
          <path className="home-state home-state--karnataka" d="M124 300 165 263 203 292 190 342 138 348Z" />
          <path className="home-state home-state--tamil" d="M190 342 211 365 193 399 156 383 138 348Z" />
          <path className="home-state home-state--low" d="M203 292 236 274 255 314 231 352 190 342Z" />
          <path className="home-state home-state--medium" d="M198 186 246 159 278 202 260 250 216 262 229 214Z" />
          <path className="home-map-outline" d="M127 52 170 40 205 68 197 107 229 151 278 202 260 250 236 274 255 314 231 352 211 365 193 399 156 383 138 348 124 300 76 278 86 217 48 203 38 159 70 130 95 94Z" />
        </svg>

        {heatmapLabels.map((label) => (
          <div
            className={`home-map-label ${label.className}`}
            key={label.name}
            style={{ "--label-x": `${label.x}px`, "--label-y": `${label.y}px` }}
          >
            <strong>{label.name}</strong>
            <span>{label.count}</span>
          </div>
        ))}
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
              AI-Driven <b>•</b> Smart <b>•</b> Accurate
            </span>
          </div>
          <h1>
            AI-Powered Tender Intelligence for <span>Modern Businesses.</span>
          </h1>
          <p>Discover, analyze, monitor, and win government & private tenders using artificial intelligence.</p>
          <div className="home-actions">
            <Link className="home-button home-button--primary" to="/tenders">
              <Search size={19} />
              Explore Tenders
            </Link>
            <Link className="home-button home-button--secondary" to="/insights">
              <PlayCircle size={19} />
              Watch Demo
            </Link>
          </div>
          <div className="home-trust-metrics">
            <span>
              <ShieldCheck size={22} />
              Trusted by <strong>5,000+</strong> Businesses
            </span>
            <span>
              <CheckCircle2 size={22} />
              <strong>10,000+</strong> Active Tenders
            </span>
            <span>
              <LockKeyhole size={22} />
              <strong>100%</strong> Secure & Confidential
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

      <section className="home-section home-reveal">
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

      <section className="home-section home-reveal">
        <div className="home-section-heading home-section-heading--center">
          <span className="home-kicker">Testimonials</span>
          <h2>Built for teams that move on opportunity.</h2>
        </div>
        <div className="home-testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="home-testimonial-card" key={testimonial.initials}>
              <div className="home-avatar">{testimonial.initials}</div>
              <p>“{testimonial.quote}”</p>
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

      <section className="home-final-cta home-reveal">
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
