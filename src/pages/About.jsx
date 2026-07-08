import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCloud,
  FaDatabase,
  FaInfoCircle,
  FaLayerGroup,
  FaLightbulb,
  FaSearch,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import "./About.css";

// Story cards explain the main user benefits shown near the top of the About page.
const storyCards = [
  {
    title: "Find faster",
    text: "Discover tenders with filters, search, and AI-driven prioritization that reduce the time spent hunting across portals.",
    icon: FaSearch,
  },
  {
    title: "Read smarter",
    text: "Summaries and live insights help teams understand bid scope, deadlines, and relevance without reading every line twice.",
    icon: FaLightbulb,
  },
  {
    title: "Act together",
    text: "Shared dashboards, status views, and saved workflows keep procurement, finance, and delivery aligned.",
    icon: FaUsers,
  },
];

// Feature tabs let visitors switch between platform value propositions.
const featureSets = [
  {
    key: "intelligence",
    label: "Intelligence",
    title: "Signal-rich tender discovery",
    description:
      "We combine structured tender data with simple, decision-friendly views so teams can spot high-value opportunities quickly.",
    points: ["Live analytics", "Deadline awareness", "Category clustering"],
  },
  {
    key: "workflow",
    label: "Workflow",
    title: "Built for a real bid pipeline",
    description:
      "From discovery to review, the platform supports the day-to-day work of procurement teams without adding clutter.",
    points: ["Shortlisted tenders", "Actionable summaries", "Team-ready handoff"],
  },
  {
    key: "trust",
    label: "Trust",
    title: "Transparent and dependable",
    description:
      "The interface emphasizes clarity, traceability, and confidence so users can rely on what they see and move faster.",
    points: ["Structured records", "Clear source views", "Stable navigation"],
  },
];

// Milestones describe the simple tender workflow from ingestion to collaboration.
const milestones = [
  { year: "01", title: "Ingest", text: "Collect tenders from the backend and organize them by status, category, and deadline." },
  { year: "02", title: "Score", text: "Highlight the most relevant opportunities using simple analytics and readable summaries." },
  { year: "03", title: "Collaborate", text: "Share insights across your team with a dashboard that keeps everyone on the same page." },
];

// FAQ items power the expandable questions section.
const faqs = [
  {
    q: "What makes this platform different?",
    a: "It focuses on reducing friction. The experience turns large tender lists into a guided workflow with clear next actions.",
  },
  {
    q: "Can the About page feel interactive without heavy complexity?",
    a: "Yes. Lightweight interactions like tabs, hover states, and accordions create motion and depth while staying fast.",
  },
  {
    q: "Is this page connected to live data?",
    a: "The About page is mostly presentational, but it links directly into the live dashboard and tender views for a consistent journey.",
  },
];

export default function About() {
  // Local state controls the selected feature tab and open FAQ accordion item.
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState(featureSets[0].key);
  const [openFaq, setOpenFaq] = useState(0);

  // Finds the selected feature content for the interactive overview section.
  const currentFeature = useMemo(
    () => featureSets.find((feature) => feature.key === selectedFeature) || featureSets[0],
    [selectedFeature],
  );

  return (
    <main className="about-page">
      {/* Hero section introduces the product and provides direct navigation to core workflows. */}
      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">About AI Tender Intelligence</span>
          <h1>Make tender discovery feel sharp, modern, and easy to act on.</h1>
          <p>
            This platform helps teams move from endless scanning to confident decisions with live
            tender data, clean analytics, and a workflow that keeps the next step obvious.
          </p>
          <div className="about-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              <FaChartLine /> Explore dashboard
            </button>
            <button type="button" onClick={() => navigate("/tenders")}>
              <FaDatabase /> Browse tenders
            </button>
          </div>
        </div>

        <div className="about-hero-visual" aria-label="Platform highlights">
          <div className="about-radar">
            <span className="radar-ring ring-one" />
            <span className="radar-ring ring-two" />
            <span className="radar-ring ring-three" />
            <div className="radar-core">
              <FaShieldAlt />
              <strong>Trusted signal</strong>
              <small>Clear, fast, and structured</small>
            </div>
          </div>
          <div className="about-visual-stat">
            <FaClock />
            <div>
              <strong>Live decisions</strong>
              <span>Reduce review time and focus on urgent bids.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Story cards summarize how the product helps teams find, read, and act faster. */}
      <section className="about-story-grid">
        {storyCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="about-story-card" key={card.title}>
              <div className="about-card-icon">
                <Icon />
              </div>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </article>
          );
        })}
      </section>

      {/* Interactive overview lets users switch between intelligence, workflow, and trust messaging. */}
      <section className="about-panel about-interactive">
        <div className="about-panel-header">
          <span className="about-eyebrow">Interactive overview</span>
          <h2>See the platform from different angles.</h2>
        </div>

        <div className="about-tabs" role="tablist" aria-label="About platform sections">
          {featureSets.map((feature) => (
            <button
              key={feature.key}
              type="button"
              role="tab"
              aria-selected={selectedFeature === feature.key}
              className={selectedFeature === feature.key ? "active" : ""}
              onClick={() => setSelectedFeature(feature.key)}
            >
              {feature.label}
            </button>
          ))}
        </div>

        <div className="about-feature-layout">
          <article className="about-feature-copy">
            <h3>{currentFeature.title}</h3>
            <p>{currentFeature.description}</p>
            <ul className="about-bullets">
              {currentFeature.points.map((point) => (
                <li key={point}>
                  <FaCheckCircle /> {point}
                </li>
              ))}
            </ul>
          </article>

          <div className="about-metric-stack">
            <div className="about-metric-card">
              <FaLayerGroup />
              <strong>Structured views</strong>
              <span>Digestible sections instead of overwhelming walls of data.</span>
            </div>
            <div className="about-metric-card">
              <FaCloud />
              <strong>Always accessible</strong>
              <span>Built to feel responsive and clear on desktop and mobile.</span>
            </div>
            <div className="about-metric-card">
              <FaInfoCircle />
              <strong>Context first</strong>
              <span>Helpful labels and summaries keep the experience self-explanatory.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline section explains the platform workflow in three simple steps. */}
      <section className="about-panel">
        <div className="about-panel-header">
          <span className="about-eyebrow">How it works</span>
          <h2>A simple flow with a premium feel.</h2>
        </div>

        <div className="about-timeline">
          {milestones.map((item) => (
            <article className="about-timeline-item" key={item.year}>
              <span>{item.year}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ section answers common product and page-experience questions. */}
      <section className="about-panel about-faq">
        <div className="about-panel-header">
          <span className="about-eyebrow">Questions</span>
          <h2>Quick answers for curious visitors.</h2>
        </div>

        <div className="about-accordion">
          {faqs.map((faq, index) => {
            const open = openFaq === index;

            return (
              <article className={`about-accordion-item ${open ? "open" : ""}`} key={faq.q}>
                <button type="button" onClick={() => setOpenFaq(open ? -1 : index)}>
                  <span>{faq.q}</span>
                  <strong>{open ? "-" : "+"}</strong>
                </button>
                {open && <p>{faq.a}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
