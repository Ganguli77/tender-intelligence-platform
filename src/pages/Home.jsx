import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBookmark,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaDatabase,
  FaFileAlt,
  FaLock,
  FaPlay,
  FaRegStar,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";
import { INDIA_MAP_VIEWBOX, INDIA_STATE_GEOMETRY } from "../data/indiaStateGeometry";
import { tenders as dataTenders } from "../data/tenders";
import "./Home.css";

const heroTrustCompanies = [
  "Larsen & Toubro",
  "Tata Projects",
  "Infosys",
  "HCC",
  "Wipro",
  "Godrej Properties",
];

const features = [
  {
    icon: FaSearch,
    title: "AI Tender Discovery",
    description: "Continuously scans public and private sources to surface opportunities aligned with your business profile.",
  },
  {
    icon: FaDatabase,
    title: "Smart Search",
    description: "Filter by value, geography, department, eligibility, keywords, and intent without digging through portals.",
  },
  {
    icon: FaBell,
    title: "Real-Time Alerts",
    description: "Get precise notifications for new tenders, corrigenda, closing windows, and high-fit opportunities.",
  },
  {
    icon: FaChartLine,
    title: "AI Analytics",
    description: "Understand fit, risk, competition, timelines, and likely win paths before committing bid effort.",
  },
];

const previewTenders = [
  {
    title: "Smart City Command Center Upgrade",
    organization: "Urban Development Authority",
    category: "IT Infrastructure",
    budget: "INR 18.4 Cr",
    deadline: "24 Jul 2026",
    status: "Open",
    score: 96,
  },
  {
    title: "District Hospital Equipment Supply",
    organization: "State Health Mission",
    category: "Healthcare",
    budget: "INR 9.8 Cr",
    deadline: "31 Jul 2026",
    status: "Closing Soon",
    score: 91,
  },
  {
    title: "Solar Rooftop Deployment Phase II",
    organization: "Renewable Energy Agency",
    category: "Energy",
    budget: "INR 42 Cr",
    deadline: "08 Aug 2026",
    status: "Open",
    score: 88,
  },
  {
    title: "National Highway Sensor Network",
    organization: "Road Transport Department",
    category: "Construction",
    budget: "INR 76 Cr",
    deadline: "19 Aug 2026",
    status: "Open",
    score: 84,
  },
  {
    title: "University Cloud ERP Implementation",
    organization: "Central University Consortium",
    category: "Education",
    budget: "INR 12.6 Cr",
    deadline: "14 Aug 2026",
    status: "New",
    score: 93,
  },
  {
    title: "Industrial Water Treatment Plant",
    organization: "Industrial Development Board",
    category: "Manufacturing",
    budget: "INR 28.1 Cr",
    deadline: "27 Aug 2026",
    status: "Open",
    score: 87,
  },
];

const STATE_ALIASES = {
  "New Delhi": "Delhi",
  NCT: "Delhi",
  Telangana: "Andhra Pradesh",
};

function parseState(location = "") {
  const parts = String(location)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const state = parts.at(-1) || "Unknown";
  return STATE_ALIASES[state] || state;
}

function buildStateMetrics(tenderList = []) {
  const byState = new Map();

  tenderList.forEach((tender) => {
    const state = parseState(tender.location);
    const current = byState.get(state) || {
      count: 0,
      totalBudget: 0,
      sectors: new Map(),
      closingSoon: 0,
      open: 0,
    };

    current.count += 1;
    current.totalBudget += Number(tender.amountValue || 0);
    current.sectors.set(tender.category || "General", (current.sectors.get(tender.category || "General") || 0) + 1);

    if (tender.status === "Closing Soon") {
      current.closingSoon += 1;
    }

    if (tender.status === "Open") {
      current.open += 1;
    }

    byState.set(state, current);
  });

  return byState;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    style: "currency",
    currency: "INR",
    notation: value >= 10000000 ? "compact" : "standard",
  }).format(value || 0);
}

function formatTopSectors(sectors = []) {
  if (!sectors.length) return "No active tender data";
  return sectors.map(([sector, count]) => `${sector} (${count})`).join(", ");
}

const stats = [
  { value: 10000, suffix: "+", label: "Active Tenders" },
  { value: 5000, suffix: "+", label: "Businesses" },
  { value: 95, suffix: "%", label: "AI Matching Accuracy" },
  { value: 500, prefix: "INR ", suffix: "Cr+", label: "Tender Opportunities" },
];

const testimonials = [
  {
    company: "Apex InfraWorks",
    user: "Riya Mehta, Bid Director",
    feedback: "NexTender AI turned tender discovery from a daily manual hunt into a focused pipeline review. Our team now spends time on the bids that can actually move revenue.",
  },
  {
    company: "MedGrid Systems",
    user: "Arjun Rao, Growth Lead",
    feedback: "The AI summaries and risk signals are unusually practical. We can qualify healthcare opportunities in minutes and avoid low-probability submissions.",
  },
  {
    company: "VoltEdge Energy",
    user: "Naina Kapoor, COO",
    feedback: "It feels like an enterprise command center for tenders. The alerts, match scoring, and dashboard view keep leadership aligned without spreadsheet chaos.",
  },
];

const faqs = [
  {
    question: "How does the AI matching work?",
    answer: "NexTender AI reads tender metadata, eligibility, categories, budgets, deadlines, and your business profile to calculate relevance, risk, and urgency signals.",
  },
  {
    question: "Is there a free plan or pricing tier?",
    answer: "Teams can start with a free discovery workflow, then upgrade for advanced alerts, AI summaries, collaboration, and analytics.",
  },
  {
    question: "How secure is our company data?",
    answer: "The platform is designed around encrypted data handling, role-based access, private watchlists, and controlled team workflows.",
  },
  {
    question: "Which data sources are supported?",
    answer: "The product is built for government portals, department feeds, private tenders, procurement notices, corrigenda, and internal opportunity tracking.",
  },
  {
    question: "Can NexTender AI manage applications?",
    answer: "Yes. You can shortlist tenders, assign ownership, track document readiness, monitor deadlines, and move opportunities through application stages.",
  },
];

function Counter({ value, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    let frameId;
    const startedAt = performance.now();
    const duration = 1300;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, visible]);

  return (
    <strong ref={ref}>
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </strong>
  );
}

function PremiumHeroGlobe() {
  const nodes = [
    "node-a",
    "node-b",
    "node-c",
    "node-d",
    "node-e",
    "node-f",
    "node-g",
    "node-h",
  ];

  return (
    <div className="nt-ai-globe-panel" aria-label="AI tender intelligence network visualization">
      <div className="nt-ai-globe-orb" aria-hidden="true">
        <div className="nt-ai-globe-map" />
        <div className="nt-ai-globe-lat lat-one" />
        <div className="nt-ai-globe-lat lat-two" />
        <div className="nt-ai-globe-lat lat-three" />
        <div className="nt-ai-globe-meridian meridian-one" />
        <div className="nt-ai-globe-meridian meridian-two" />
        <div className="nt-ai-globe-arc arc-one" />
        <div className="nt-ai-globe-arc arc-two" />
        <div className="nt-ai-globe-arc arc-three" />
        {nodes.map((node) => (
          <span className={`nt-ai-node ${node}`} key={node} />
        ))}
      </div>

      <article className="nt-float-card nt-float-score">
        <span>AI Match Score</span>
        <strong>94%</strong>
      </article>
      <article className="nt-float-card nt-float-alert">
        <span>Tender Alert</span>
        <strong>12 New</strong>
      </article>
      <article className="nt-float-card nt-float-chart">
        <span>Market Insights</span>
        <div className="nt-mini-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </article>
      <article className="nt-float-card nt-float-signal">
        <span>Win Signal</span>
        <strong>78%</strong>
      </article>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeState, setActiveState] = useState("Maharashtra");
  const [hoverTooltip, setHoverTooltip] = useState(null);

  const insightMetrics = useMemo(
    () => [
      { label: "Match Score", value: "94%", tone: "blue" },
      { label: "Risk Analysis", value: "Low", tone: "green" },
      { label: "Competition", value: "Medium", tone: "amber" },
      { label: "Win Probability", value: "72%", tone: "blue" },
    ],
    [],
  );

  const mapMetrics = useMemo(() => buildStateMetrics(dataTenders), []);

  const stateCards = useMemo(() => {
    const maxCount = Math.max(...INDIA_STATE_GEOMETRY.map((state) => mapMetrics.get(state.name)?.count || 0), 1);

    return INDIA_STATE_GEOMETRY.map((state) => {
      const metrics = mapMetrics.get(state.name) || {
        count: 0,
        totalBudget: 0,
        sectors: new Map(),
        closingSoon: 0,
        open: 0,
      };
      const topSectors = [...metrics.sectors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

      return {
        ...state,
        ...metrics,
        intensity: metrics.count / maxCount,
        topSectors,
        topSectorSummary: formatTopSectors(topSectors),
      };
    });
  }, [mapMetrics]);

  const activeStateData = useMemo(
    () => stateCards.find((state) => state.name === activeState) || stateCards[0],
    [activeState, stateCards],
  );

  const activeStateTenders = useMemo(() => {
    return dataTenders
      .filter((tender) => parseState(tender.location) === activeStateData?.name)
      .slice(0, 3);
  }, [activeStateData]);

  const totalMapBudget = useMemo(
    () => dataTenders.reduce((total, tender) => total + Number(tender.amountValue || 0), 0),
    [],
  );

  return (
    <main className="nt-home">
      <section className="nt-hero section-reveal">
        <div className="nt-hero-grid">
          <div className="nt-hero-copy">
            <div className="nt-hero-badges">
              <span className="nt-eyebrow">Enterprise AI Tender Platform</span>
              <span className="nt-secondary-badge">AI-Driven • Smart • Accurate</span>
            </div>
            <h1>
              AI-Powered Tender Intelligence for <span className="nt-gradient-text">Modern Businesses</span>.
            </h1>
            <p>
              Discover, analyze, monitor, and win government & private tenders using artificial intelligence.
            </p>
            <div className="nt-hero-actions">
              <button className="nt-btn nt-btn-primary" type="button" onClick={() => navigate("/tenders")}>
                Explore Tenders
                <FaArrowRight />
              </button>
              <button className="nt-btn nt-btn-secondary" type="button" onClick={() => navigate("/insights")}>
                <FaPlay />
                Watch Demo
              </button>
            </div>
            <div className="nt-hero-trust-indicators" aria-label="NexTender AI trust indicators">
              <span>Trusted by 5,000+ Businesses</span>
              <span>10,000+ Active Tenders</span>
              <span>100% Secure & Confidential</span>
            </div>
          </div>

          <div className="nt-hero-visual">
            <PremiumHeroGlobe />
          </div>
        </div>
      </section>

      <section className="nt-trust nt-brand-strip section-reveal" aria-label="Trusted company logos">
        <div className="nt-brand-strip-card">
          {heroTrustCompanies.map((company) => (
            <span key={company}>{company}</span>
          ))}
        </div>
      </section>

      <section className="nt-map-section section-reveal">
        <div className="nt-map-copy">
          <span className="nt-eyebrow">India Tender Heatmap</span>
          <h2>Explore Opportunities Across India</h2>
          <p>
            Hover or tap a state to view live tender density, procurement value, leading sectors, and closing-soon opportunities.
          </p>
          <div className="nt-map-stats">
            <article>
              <strong>{stateCards.filter((state) => state.count > 0).length}</strong>
              <span>States Covered</span>
            </article>
            <article>
              <strong>{dataTenders.length}</strong>
              <span>Live Records</span>
            </article>
            <article>
              <strong>{formatCurrency(totalMapBudget)}</strong>
              <span>Total Value</span>
            </article>
          </div>
          <div className="nt-selected-state">
            <div>
              <small>Selected State</small>
              <h3>{activeStateData?.name}</h3>
              <p>{activeStateData?.topSectorSummary}</p>
            </div>
            <div className="nt-selected-metrics">
              <span><b>{activeStateData?.count || 0}</b> Tenders</span>
              <span><b>{formatCurrency(activeStateData?.totalBudget)}</b> Value</span>
              <span><b>{activeStateData?.closingSoon || 0}</b> Closing Soon</span>
            </div>
            <div className="nt-state-tenders">
              {activeStateTenders.length ? (
                activeStateTenders.map((tender) => (
                  <button key={tender.id} type="button" onClick={() => navigate(`/tender/${tender.id}`)}>
                    <span>{tender.category}</span>
                    <strong>{tender.title}</strong>
                  </button>
                ))
              ) : (
                <p>No live preview tenders for this state yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="nt-map-card">
          <div className="nt-map-toolbar">
            <span>Procurement intensity</span>
            <div>
              <i className="low" />
              <i className="medium" />
              <i className="high" />
            </div>
          </div>
          <div className="nt-india-map" onMouseLeave={() => setHoverTooltip(null)}>
            <svg viewBox={INDIA_MAP_VIEWBOX} className="nt-india-map-svg" role="img" aria-label="Interactive India tender heat map">
              {stateCards.map((state) => {
                const isActive = activeStateData?.name === state.name;
                const fillClass =
                  state.count === 0 ? "empty" : state.intensity < 0.34 ? "low" : state.intensity < 0.68 ? "medium" : "high";

                return (
                  <g key={state.name}>
                    <path
                      d={state.path}
                      className={`nt-state-region ${fillClass} ${isActive ? "active" : ""}`}
                      onMouseEnter={(event) => {
                        setActiveState(state.name);
                        setHoverTooltip({ state, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
                      }}
                      onMouseMove={(event) => {
                        setHoverTooltip({ state, x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
                      }}
                      onFocus={() => {
                        setActiveState(state.name);
                        setHoverTooltip(null);
                      }}
                      onClick={() => setActiveState(state.name)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isActive}
                      aria-label={`${state.name}, ${state.count} tenders, ${formatCurrency(state.totalBudget)} value, top sectors ${state.topSectorSummary}`}
                    >
                      <title>{`${state.name}: ${state.count} tenders, ${formatCurrency(state.totalBudget)}, ${state.topSectorSummary}`}</title>
                    </path>
                    <text x={state.centroid[0]} y={state.centroid[1]} className="nt-state-label" textAnchor="middle">
                      {state.count > 0 && state.name.length <= 14 ? state.name : ""}
                    </text>
                    <text x={state.centroid[0]} y={state.centroid[1] + 20} className="nt-state-count" textAnchor="middle">
                      {state.count || ""}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hoverTooltip ? (
              <div
                className="nt-map-tooltip"
                style={{
                  left: `${hoverTooltip.x}px`,
                  top: `${hoverTooltip.y}px`,
                }}
              >
                <div className="nt-tooltip-head">
                  <strong>{hoverTooltip.state.name}</strong>
                  <span>{hoverTooltip.state.count}</span>
                </div>
                <dl>
                  <div>
                    <dt>Budget</dt>
                    <dd>{formatCurrency(hoverTooltip.state.totalBudget)}</dd>
                  </div>
                  <div>
                    <dt>Top Sectors</dt>
                    <dd>{hoverTooltip.state.topSectorSummary}</dd>
                  </div>
                  <div>
                    <dt>Closing Soon</dt>
                    <dd>{hoverTooltip.state.closingSoon}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="nt-section section-reveal">
        <div className="nt-section-heading">
          <span className="nt-eyebrow">Platform Features</span>
          <h2>Everything your tender team needs to find signal in the noise.</h2>
        </div>
        <div className="nt-feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="nt-feature-card" key={title}>
              <div className="nt-icon-box">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nt-section section-reveal">
        <div className="nt-section-heading centered">
          <span className="nt-eyebrow">How It Works</span>
          <h2>From discovery to action in three clean steps.</h2>
        </div>
        <div className="nt-steps">
          {[
            { icon: FaSearch, title: "Search", text: "Find live tenders by sector, budget, location, and eligibility." },
            { icon: FaChartLine, title: "AI Analysis", text: "Get summaries, match scores, risk signals, and competition context." },
            { icon: FaFileAlt, title: "Apply & Track", text: "Shortlist, assign owners, manage deadlines, and monitor progress." },
          ].map(({ icon: Icon, title, text }, index) => (
            <article className="nt-step" key={title}>
              <div className="nt-step-number">0{index + 1}</div>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nt-section section-reveal">
        <div className="nt-section-heading split">
          <div>
            <span className="nt-eyebrow">Live Tender Preview</span>
            <h2>High-value opportunities, scored and ready to evaluate.</h2>
          </div>
          <Link className="nt-link-button" to="/tenders">
            View All
            <FaArrowRight />
          </Link>
        </div>
        <div className="nt-tender-grid">
          {previewTenders.map((tender) => (
            <article className="nt-tender-card" key={tender.title}>
              <div className="nt-tender-top">
                <span className={`nt-status ${tender.status.toLowerCase().replace(/\s/g, "-")}`}>
                  {tender.status}
                </span>
                <button type="button" aria-label={`Bookmark ${tender.title}`}>
                  <FaBookmark />
                </button>
              </div>
              <h3>{tender.title}</h3>
              <p>{tender.organization}</p>
              <div className="nt-tender-meta">
                <span>{tender.category}</span>
                <strong>{tender.budget}</strong>
                <span>Deadline</span>
                <strong>{tender.deadline}</strong>
              </div>
              <div className="nt-score-row">
                <span>AI Match Score</span>
                <strong>{tender.score}%</strong>
              </div>
              <div className="nt-score-track">
                <span style={{ width: `${tender.score}%` }} />
              </div>
              <button className="nt-card-action" type="button" onClick={() => navigate("/tenders")}>
                View Details
                <FaArrowRight />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="nt-insights section-reveal">
        <div className="nt-insight-copy">
          <span className="nt-eyebrow">AI Insights Preview</span>
          <h2>Know which tender deserves your bid effort before your team opens the document.</h2>
          <p>
            NexTender AI turns long tender notices into executive summaries, fit scores, risk analysis, deadline predictions, and practical next actions.
          </p>
          <div className="nt-insight-list">
            {["AI Summary", "Tender Match Score", "Risk Analysis", "Competition Level", "Deadline Prediction", "Winning Probability"].map((item) => (
              <span key={item}>
                <FaCheck />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="nt-insight-mockup">
          <div className="nt-ai-summary">
            <small>AI Summary</small>
            <strong>Strong eligibility fit with moderate documentation complexity.</strong>
            <p>Recommended action: prioritize financial qualification review and vendor authorization documents this week.</p>
          </div>
          <div className="nt-insight-metrics">
            {insightMetrics.map((metric) => (
              <article className={metric.tone} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nt-dashboard-preview section-reveal">
        <div className="nt-section-heading centered">
          <span className="nt-eyebrow">Dashboard Preview</span>
          <h2>A realistic operating system for your tender pipeline.</h2>
        </div>
        <div className="nt-ops-dashboard">
          <div className="nt-ops-header">
            <div>
              <small>Executive Dashboard</small>
              <strong>Q3 Tender Pipeline</strong>
            </div>
            <button type="button">Quick Actions</button>
          </div>
          <div className="nt-ops-grid">
            <article className="nt-ops-card">
              <span>Pipeline Value</span>
              <strong>INR 186Cr</strong>
              <div className="nt-mini-chart rising" />
            </article>
            <article className="nt-ops-card">
              <span>Applications</span>
              <strong>42</strong>
              <div className="nt-donut">68%</div>
            </article>
            <article className="nt-ops-card wide">
              <span>Notifications</span>
              <ul>
                <li>3 deadlines moved forward</li>
                <li>7 tenders crossed 90% match</li>
                <li>2 corrigenda need review</li>
              </ul>
            </article>
            <article className="nt-ops-card wide">
              <span>Recent Activity</span>
              <div className="nt-activity">
                <p><b>Meera</b> shortlisted a cloud ERP tender</p>
                <p><b>Finance</b> approved EMD checklist</p>
                <p><b>AI</b> flagged medium compliance risk</p>
              </div>
            </article>
            <article className="nt-ops-card">
              <span>Application Status</span>
              <div className="nt-status-stack">
                <i style={{ width: "82%" }}>Ready</i>
                <i style={{ width: "64%" }}>Review</i>
                <i style={{ width: "38%" }}>Draft</i>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="nt-stats section-reveal">
        {stats.map((stat) => (
          <article key={stat.label}>
            <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="nt-section section-reveal">
        <div className="nt-section-heading centered">
          <span className="nt-eyebrow">Why NexTender AI</span>
          <h2>Replace portal fatigue with an intelligent tender workflow.</h2>
        </div>
        <div className="nt-comparison">
          <article className="nt-compare-card muted">
            <h3>Traditional Search</h3>
            <ul>
              <li>Manual portal checking</li>
              <li>Scattered spreadsheets</li>
              <li>Late deadline discovery</li>
              <li>No clear fit or risk signals</li>
            </ul>
          </article>
          <div className="nt-versus">vs</div>
          <article className="nt-compare-card premium">
            <h3>NexTender AI</h3>
            <ul>
              <li>AI-ranked tender discovery</li>
              <li>Unified team dashboard</li>
              <li>Real-time alerts and tracking</li>
              <li>Match, risk, and win probability insights</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="nt-section section-reveal">
        <div className="nt-section-heading centered">
          <span className="nt-eyebrow">Testimonials</span>
          <h2>Trusted by teams that treat tenders as a growth engine.</h2>
        </div>
        <div className="nt-testimonials">
          {testimonials.map((testimonial) => (
            <article className="nt-testimonial-card" key={testimonial.company}>
              <div className="nt-rating" aria-label="Five star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaRegStar key={star} />
                ))}
              </div>
              <p>{testimonial.feedback}</p>
              <div>
                <strong>{testimonial.user}</strong>
                <span>{testimonial.company}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="nt-section nt-faq section-reveal">
        <div className="nt-section-heading centered">
          <span className="nt-eyebrow">FAQ</span>
          <h2>Questions teams ask before moving procurement intelligence to AI.</h2>
        </div>
        <div className="nt-faq-list">
          {faqs.map((faq, index) => (
            <article className={`nt-faq-item ${openFaq === index ? "open" : ""}`} key={faq.question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>{faq.question}</span>
                <FaChevronDown />
              </button>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nt-final-cta section-reveal">
        <div>
          <span className="nt-eyebrow">Start with signal</span>
          <h2>Ready to Discover Your Next Opportunity?</h2>
          <p>Bring AI discovery, tender analytics, and application tracking into one premium workspace.</p>
          <div className="nt-hero-actions centered-actions">
            <button className="nt-btn nt-btn-primary" type="button" onClick={() => navigate("/register")}>
              Start Free
              <FaArrowRight />
            </button>
            <button className="nt-btn nt-btn-secondary" type="button" onClick={() => navigate("/tenders")}>
              Explore Tenders
            </button>
          </div>
        </div>
      </section>

      <footer className="nt-footer">
        <div className="nt-footer-brand">
          <span className="nt-footer-logo">N</span>
          <div>
            <strong>NexTender AI</strong>
            <p>AI-powered tender intelligence for modern businesses.</p>
          </div>
        </div>
        <div className="nt-footer-links">
          {["About", "Features", "Dashboard", "AI Insights", "Privacy", "Terms", "Contact"].map((link) => (
            <Link key={link} to={link === "AI Insights" ? "/insights" : link === "Dashboard" ? "/dashboard" : link === "About" ? "/about" : "/"}>
              {link}
            </Link>
          ))}
        </div>
        <div className="nt-footer-contact">
          <span>hello@nextender.ai</span>
          <div className="nt-socials" aria-label="Social links">
            <a href="/" aria-label="LinkedIn">in</a>
            <a href="/" aria-label="X">x</a>
            <a href="/" aria-label="GitHub">gh</a>
          </div>
        </div>
        <div className="nt-footer-bottom">
          <span>Copyright 2026 NexTender AI. All rights reserved.</span>
          <span><FaShieldAlt /> Enterprise-ready security</span>
          <span><FaLock /> Private by design</span>
        </div>
      </footer>
    </main>
  );
}
