import { Link } from "react-router-dom";
import { BellRing, BookmarkCheck, BrainCircuit, Radio } from "lucide-react";

function ActivityIcon({ type }) {
  if (type === "saved") return <BookmarkCheck size={17} />;
  if (type === "alert") return <BellRing size={17} />;
  if (type === "ai") return <BrainCircuit size={17} />;
  return <Radio size={17} />;
}

export default function ActivityFeed({ activity }) {
  return (
    <section className="dashboard-glass-card">
      <div className="dashboard-card-head">
        <div>
          <h2>Recent Activity</h2>
        </div>
        <button type="button" aria-label="Activity options">...</button>
      </div>

      <div className="dashboard-activity-feed">
        {(activity || []).length ? activity.map((item) => (
          <article key={item.id}>
            <i><ActivityIcon type={item.type} /></i>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <time>{item.timeAgo}</time>
          </article>
        )) : (
          <p className="dashboard-empty-text">Save tenders, create alerts, or analyze tenders to generate activity.</p>
        )}
      </div>

      <Link className="dashboard-view-all" to="/insights">View All Activity</Link>
    </section>
  );
}
