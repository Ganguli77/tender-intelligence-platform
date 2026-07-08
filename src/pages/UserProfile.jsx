import { useAuth } from "../context/useAuth";
import "./UserProfile.css";

const applications = [
  {
    title: "Smart City Surveillance System",
    organization: "Urban Development Authority",
    status: "Submitted",
    date: "26 Jun 2026",
  },
  {
    title: "Hospital Equipment Supply",
    organization: "State Health Mission",
    status: "In Review",
    date: "21 Jun 2026",
  },
  {
    title: "Solar EPC Development",
    organization: "Renewable Energy Board",
    status: "Shortlisted",
    date: "17 Jun 2026",
  },
];

export default function UserProfile() {
  const { username, role, isAdmin } = useAuth();
  const displayRole = isAdmin ? "Admin" : role || "User";
  const user = {
    name: username || "User",
    role: displayRole,
    email: isAdmin ? "admin@nextrender.ai" : "user@nextrender.ai",
  };

  return (
    <main className="user-profile-page">
      <section className="profile-shell">
        <article className="profile-card">
          <div className={`profile-avatar ${isAdmin ? "admin" : "user"}`}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <span>Account Profile</span>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <strong>{user.role}</strong>
          </div>
        </article>

        <section className="applications-card">
          <div className="applications-head">
            <div>
              <span>My Applications</span>
              <h2>Recent tender activity</h2>
            </div>
            <button type="button">View all</button>
          </div>

          <div className="application-grid">
            {applications.map((application) => (
              <article className="application-card" key={application.title}>
                <div>
                  <h3>{application.title}</h3>
                  <p>{application.organization}</p>
                </div>
                <div className="application-meta">
                  <span>{application.status}</span>
                  <small>{application.date}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
