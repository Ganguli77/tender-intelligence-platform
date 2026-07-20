import { Bell, CheckCircle2, Clock3, Sparkles } from "lucide-react";

const notifications = [
  {
    title: "New AI match available",
    body: "A construction tender with a strong opportunity score was added to the marketplace.",
    tone: "info",
    icon: Sparkles,
  },
  {
    title: "Saved tender deadline approaching",
    body: "One of your saved tenders closes soon. Review documents before submission.",
    tone: "warning",
    icon: Clock3,
  },
  {
    title: "Alert delivery active",
    body: "Your tender alerts are monitoring categories, locations, and AI scores.",
    tone: "success",
    icon: CheckCircle2,
  },
];

export default function Notifications() {
  return (
    <main className="app-page">
      <section className="app-page-header">
        <div>
          <span className="app-kicker"><Bell size={15} /> Notifications</span>
          <h1>Notification Center</h1>
          <p>Track AI matches, saved tender reminders, alert updates, and important workspace events.</p>
        </div>
      </section>

      <section className="app-card-grid">
        {notifications.map(({ title, body, tone, icon: Icon }) => (
          <article className={`app-card app-card--${tone}`} key={title}>
            <Icon size={22} />
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
