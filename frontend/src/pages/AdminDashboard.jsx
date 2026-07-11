import { AlertTriangle, CalendarClock, FileClock, Plus, RefreshCw, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../services/api";
import "./AdminDashboard.css";

const emptyDashboard = {
  totalUsers: 0,
  activeTenders: 0,
  expiredTenders: 0,
  newTendersToday: 0,
  recentUsers: [],
  recentTenders: [],
};

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [users, setUsers] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async ({ background = false, ignoreRef } = {}) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await api.get("/admin/dashboard");
      const [usersResponse, tendersResponse] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/tenders"),
      ]);
      if (!ignoreRef?.current) {
        setDashboard({ ...emptyDashboard, ...response.data });
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        setTenders(Array.isArray(tendersResponse.data) ? tendersResponse.data : []);
      }
    } catch (err) {
      if (!ignoreRef?.current) {
        setError(getApiErrorMessage(err, "Unable to load admin dashboard."));
      }
    } finally {
      if (!ignoreRef?.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialDashboard() {
      try {
        const response = await api.get("/admin/dashboard");
        const [usersResponse, tendersResponse] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/tenders"),
        ]);
        if (!ignore) {
          setDashboard({ ...emptyDashboard, ...response.data });
          setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
          setTenders(Array.isArray(tendersResponse.data) ? tendersResponse.data : []);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Unable to load admin dashboard."));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  async function refreshDashboard() {
    try {
      await loadDashboard({ background: true });
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleUserRole(user) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await api.put(`/admin/users/${user.id}`, { role: nextRole });
    await loadDashboard({ background: true });
  }

  async function deleteTender(id) {
    await api.delete(`/admin/tenders/${id}`);
    await loadDashboard({ background: true });
  }

  const stats = useMemo(
    () => [
      { label: "Total Users", value: dashboard.totalUsers, icon: UsersRound },
      { label: "Active Tenders", value: dashboard.activeTenders, icon: ShieldCheck },
      { label: "Expired Tenders", value: dashboard.expiredTenders, icon: FileClock },
      { label: "New Tenders Today", value: dashboard.newTendersToday, icon: CalendarClock },
    ],
    [dashboard],
  );

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard__hero">
        <div>
          <span className="eyebrow">Admin Command Center</span>
          <h1>Platform intelligence at a glance.</h1>
          <p>Monitor users, tender freshness, and operational activity from a protected ADMIN workspace.</p>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => navigate("/tenders/add")}
        >
          <Plus size={17} />
          Create Tender
        </button>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={refreshDashboard}
          disabled={refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="admin-dashboard__error">
          <AlertTriangle size={18} />
          {error}
        </div>
      ) : null}

      <div className="admin-dashboard__stats">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="admin-stat" key={label}>
            <span>
              <Icon size={20} />
            </span>
            <small>{label}</small>
            <strong>{loading ? "..." : value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-dashboard__grid">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Recent User Registrations</h2>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((user) => (
                    <tr key={user.id || user.email}>
                      <td>{user.name || "Unnamed"}</td>
                      <td>{user.email || "No email"}</td>
                      <td><span className="admin-role">{user.role}</span></td>
                      <td>
                        <button className="admin-mini-button" type="button" onClick={() => toggleUserRole(user)}>
                          Make {user.role === "ADMIN" ? "USER" : "ADMIN"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Recent Tenders</h2>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {tenders.length ? (
                  tenders.map((tender) => (
                    <tr key={tender.id || tender.title}>
                      <td>{tender.title}</td>
                      <td>{tender.organization}</td>
                      <td><span className="admin-role">{tender.status || "Open"}</span></td>
                      <td>
                        <span>{formatDate(tender.deadline)}</span>
                        <button className="admin-icon-danger" type="button" onClick={() => deleteTender(tender.id)} title="Delete tender">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No tenders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
