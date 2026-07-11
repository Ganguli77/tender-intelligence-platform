import { useEffect, useRef } from "react";
import * as THREE from "three";

const orbitCards = [
  { title: "Tender Found", value: "Infrastructure", className: "nt-orbit-card-a" },
  { title: "AI Match", value: "94%", className: "nt-orbit-card-b" },
  { title: "Deadline", value: "Tomorrow", className: "nt-orbit-card-c" },
  { title: "Sector", value: "Healthcare", className: "nt-orbit-card-d" },
  { title: "Analytics", value: "Live", className: "nt-orbit-card-e" },
];

const pins = [
  { lat: 40.7, lon: -74, name: "New York" },
  { lat: 51.5, lon: -0.1, name: "London" },
  { lat: 28.6, lon: 77.2, name: "Delhi" },
  { lat: 1.3, lon: 103.8, name: "Singapore" },
  { lat: -33.9, lon: 151.2, name: "Sydney" },
  { lat: -23.5, lon: -46.6, name: "Sao Paulo" },
  { lat: 25.2, lon: 55.3, name: "Dubai" },
];

const routes = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [2, 6],
  [6, 1],
  [0, 5],
  [5, 6],
];

function latLonToVector(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function shortestLonDistance(lon, center) {
  return Math.abs(((lon - center + 540) % 360) - 180);
}

function inEllipse(lat, lon, centerLat, centerLon, latRadius, lonRadius) {
  const adjustedLonRadius = lonRadius * Math.max(0.46, Math.cos(THREE.MathUtils.degToRad(centerLat)));
  const y = (lat - centerLat) / latRadius;
  const x = shortestLonDistance(lon, centerLon) / adjustedLonRadius;
  return x * x + y * y < 1;
}

function isLandPoint(lat, lon) {
  return (
    inEllipse(lat, lon, 48, -105, 25, 78) ||
    inEllipse(lat, lon, 17, -93, 15, 34) ||
    inEllipse(lat, lon, -17, -60, 34, 27) ||
    inEllipse(lat, lon, 51, 14, 17, 43) ||
    inEllipse(lat, lon, 8, 20, 38, 37) ||
    inEllipse(lat, lon, 37, 86, 28, 93) ||
    inEllipse(lat, lon, 22, 79, 16, 18) ||
    inEllipse(lat, lon, -4, 117, 15, 38) ||
    inEllipse(lat, lon, -25, 134, 15, 25) ||
    inEllipse(lat, lon, 62, 97, 15, 70) ||
    inEllipse(lat, lon, 72, -42, 10, 24)
  );
}

function makePointCloud(count, radius) {
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
    const target = isLandPoint(lat, lon) ? land : ocean;

    target.push(x * radius, y * radius, z * radius);
  }

  return { land: new Float32Array(land), ocean: new Float32Array(ocean) };
}

function createArc(start, end, height = 0.64) {
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(start.length() + height);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(42);
}

export default function AIGlobe() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.25, 6.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x050505, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const globeGroup = new THREE.Group();
    globeGroup.rotation.set(-0.14, -0.56, 0.02);
    scene.add(globeGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 0.78);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.18);
    keyLight.position.set(-3.4, 4.2, 4.8);
    const rimLight = new THREE.DirectionalLight(0x3b82f6, 2.4);
    rimLight.position.set(4.8, 1.6, -3.4);
    scene.add(ambient, keyLight, rimLight);

    const globeRadius = 1.72;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius, 96, 48),
      new THREE.MeshStandardMaterial({
        color: 0x080b11,
        emissive: 0x07111f,
        emissiveIntensity: 0.24,
        metalness: 0.72,
        roughness: 0.52,
        transparent: true,
        opacity: 0.92,
      }),
    );
    globeGroup.add(sphere);

    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius * 1.008, 96, 48),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        wireframe: true,
        transparent: true,
        opacity: 0.035,
      }),
    );
    globeGroup.add(rim);

    const { land, ocean } = makePointCloud(2200, globeRadius * 1.018);
    const landGeometry = new THREE.BufferGeometry();
    landGeometry.setAttribute("position", new THREE.BufferAttribute(land, 3));
    const landPoints = new THREE.Points(
      landGeometry,
      new THREE.PointsMaterial({
        color: 0x60a5fa,
        size: 0.027,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );

    const oceanGeometry = new THREE.BufferGeometry();
    oceanGeometry.setAttribute("position", new THREE.BufferAttribute(ocean, 3));
    const oceanPoints = new THREE.Points(
      oceanGeometry,
      new THREE.PointsMaterial({
        color: 0xbcd7ff,
        size: 0.009,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      }),
    );
    globeGroup.add(oceanPoints, landPoints);

    const pinVectors = pins.map((pin) => latLonToVector(pin.lat, pin.lon, globeRadius * 1.04));
    routes.forEach(([from, to], index) => {
      const points = createArc(pinVectors[from], pinVectors[to], 0.34 + (index % 3) * 0.08);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: index % 2 ? 0x93c5fd : 0x2563eb,
          transparent: true,
          opacity: 0.36,
          blending: THREE.AdditiveBlending,
        }),
      );
      globeGroup.add(line);
    });

    pinVectors.forEach((position, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(index === 2 ? 0.045 : 0.033, 16, 16),
        new THREE.MeshBasicMaterial({
          color: index === 2 ? 0xffffff : 0x93c5fd,
          transparent: true,
          opacity: 0.92,
        }),
      );
      marker.position.copy(position.multiplyScalar(1.015));
      globeGroup.add(marker);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(index === 2 ? 0.078 : 0.058, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          transparent: true,
          opacity: 0.13,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      pulse.position.copy(marker.position);
      globeGroup.add(pulse);
    });

    const starPositions = [];
    for (let index = 0; index < 260; index += 1) {
      const radius = 5.5 + Math.random() * 4.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      starPositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      );
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.012,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    scene.add(stars);

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
      globeGroup.rotation.y += 0.0017;
      globeGroup.rotation.x = -0.14 + Math.sin(elapsed * 0.42) * 0.018;
      landPoints.material.opacity = 0.82 + Math.sin(elapsed * 1.6) * 0.08;
      stars.rotation.y -= 0.00024;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      timer.dispose();
      resizeObserver.disconnect();
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
    <div className="nt-globe-wrap" aria-label="Animated global AI tender network">
      <div className="nt-globe-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="nt-globe-canvas" />
        <div className="nt-globe-vignette" aria-hidden="true" />
      </div>

      <div className="nt-orbit-ring nt-orbit-ring-one" aria-hidden="true" />
      <div className="nt-orbit-ring nt-orbit-ring-two" aria-hidden="true" />

      <div className="nt-globe-hud" aria-hidden="true">
        {orbitCards.map((card) => (
          <article className={`nt-orbit-card ${card.className}`} key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <i />
          </article>
        ))}
      </div>

      <div className="nt-globe-signal nt-globe-signal-a" aria-hidden="true" />
      <div className="nt-globe-signal nt-globe-signal-b" aria-hidden="true" />
      <div className="nt-globe-signal nt-globe-signal-c" aria-hidden="true" />
    </div>
  );
}
