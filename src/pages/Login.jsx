import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginRequest } from "../api/auth";
import { useAuth } from "../context/useAuth";
import "./Login.css";

export default function Login() {
  // Login state stores credentials, loading status, and any authentication error.
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, username, logout } = useAuth();
  const [form, setForm] = useState({
    username: "admin",
    password: "admin123",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirects already-authenticated users back to their intended protected page.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, isAuthenticated, navigate]);

  // Keeps username and password inputs synchronized with local form state.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  // Authenticates the user and stores the returned session in the shared auth context.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(form);
      login({
        token: data.token,
        username: data.username || form.username,
        role: data.role || (form.username === "admin" ? "ADMIN" : "USER"),
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  // Signs out the current user from the login page when a session is already active.
  const handleLogout = () => {
    logout();
    setError("");
  };

  return (
    <main className="login-page">
      {/* Login shell places the product message beside the secure access form. */}
      <section className="login-shell">
        {/* Left card explains the secure-access purpose and demo credentials. */}
        <div className="login-card">
          <p className="login-eyebrow">Secure access</p>
          <h1>Sign in to unlock tenders, insights, and admin tools.</h1>
          <p>
            Use the seeded admin account to get started quickly, or wire this same form to your own users.
          </p>

          <div className="login-note">
            <div style={{ display: "grid", gap: "6px" }}>
              <strong>Demo account</strong>
              <span>Username: admin</span>
              <span>Password: admin123</span>
            </div>
          </div>
        </div>

        {/* Login form collects credentials and submits them to the auth API. */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <h2>Login</h2>
            <p>Enter your credentials to continue.</p>
          </div>

          <label className="login-field">
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <Link to="/register" className="login-submit" style={{ textDecoration: "none", textAlign: "center" }}>
            Create account
          </Link>

          {isAuthenticated ? (
            <button className="login-logout" type="button" onClick={handleLogout}>
              Sign out {username ? `(${username})` : ""}
            </button>
          ) : null}
        </form>
      </section>
    </main>
  );
}
