import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../api/auth";
import "./Login.css";

export default function Register() {
  // Register state stores account details, loading status, and validation/API errors.
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", role: "USER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Keeps registration inputs synchronized with the local form object.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  // Sends the new account to the auth API, then returns the user to the login page.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerRequest(form);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* Registration shell mirrors the login layout for a consistent auth experience. */}
      <section className="login-shell">
        {/* Intro card explains the purpose of creating an account. */}
        <div className="login-card">
          <p className="login-eyebrow">Create account</p>
          <h1>Register to access tenders and personalized insights.</h1>
          <p>Use the same UI design while adding secure account creation.</p>
        </div>

        {/* Registration form captures username, password, and role. */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <h2>Register</h2>
            <p>Create a new account.</p>
          </div>

          <label className="login-field">
            <span>Username</span>
            <input name="username" value={form.username} onChange={handleChange} required />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>

          <label className="login-field">
            <span>Role</span>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>

          <Link to="/login" className="login-submit" style={{ textDecoration: "none", textAlign: "center" }}>
            Back to login
          </Link>
        </form>
      </section>
    </main>
  );
}
