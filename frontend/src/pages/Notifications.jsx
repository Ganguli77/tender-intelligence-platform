import { useEffect, useState } from "react";
import { Bell, CheckCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { getNotifications, markNotificationRead } from "../api/tenders";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getNotifications()
      .then((items) => { if (active) setNotifications(items); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load notifications."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleRead = async (notification) => {
    if (notification.read) return;
    try {
      await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (readError) {
      setError(readError.message || "Unable to update this notification.");
    }
  };

  return (
    <main className="app-page">
      <section className="app-page-header">
        <div>
          <span className="app-kicker"><Bell size={15} /> Notifications</span>
          <h1>Notification Center</h1>
          <p>Updates for tenders published by your organization.</p>
        </div>
      </section>

      {error ? <p role="alert">{error}</p> : null}
      {loading ? <p>Loading notifications...</p> : null}
      {!loading && !error && notifications.length === 0 ? <section className="app-card"><Bell size={22} /><h2>You’re all caught up</h2><p>New supplier bids on your tenders will appear here.</p><Link to="/my-tenders">Go to My Tenders</Link></section> : null}
      <section className="notification-list" aria-label="Notifications">
        {notifications.map((notification) => (
          <article className={`notification-item ${notification.read ? "is-read" : "is-unread"}`} key={notification.id}>
            <span className="notification-item-icon"><FileText size={19} /></span>
            <div className="notification-item-copy"><strong>{notification.title}</strong><p>{notification.message}</p><time>{notification.createdAt ? new Date(notification.createdAt).toLocaleString("en-IN") : ""}</time></div>
            <div className="notification-item-actions"><Link to="/my-tenders" onClick={() => handleRead(notification)}>Review bids</Link>{!notification.read ? <button type="button" title="Mark as read" aria-label="Mark notification as read" onClick={() => handleRead(notification)}><CheckCheck size={17} /></button> : null}</div>
          </article>
        ))}
      </section>
    </main>
  );
}
