import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { getApiErrorMessage } from "../../services/api";
import { register as registerRequest } from "../../services/authService";
import "../Login/Login.css";
import "./Register.css";

const initialForm = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

function validate(form) {
  if (!form.fullName.trim()) return "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
  if (form.username.trim().length < 3) return "Username must be at least 3 characters.";
  if (form.password.length < 6) return "Password must be at least 6 characters.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  return "";
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validationMessage = useMemo(() => validate(form), [form]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = validate(form);
    if (message) {
      setError(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerRequest({
        name: form.fullName.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      setSuccess("Account created successfully. Redirecting to login...");
      window.setTimeout(() => navigate("/login", { replace: true }), 700);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <section className="auth-shell" aria-labelledby="register-title">
        <aside className="auth-panel">
          <span className="auth-eyebrow">Create Workspace</span>
          <h1>Start your tender intelligence workflow.</h1>
          <p>
            Register your account to access protected dashboards, AI recommendations, and opportunity tracking.
          </p>
        </aside>

        <form className="auth-card register-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-card__header">
            <span className="auth-icon">
              <UserPlus size={20} />
            </span>
            <div>
              <h2 id="register-title">Create account</h2>
              <p>Enter your details to continue.</p>
            </div>
          </div>

          <div className="register-grid">
            <label className="auth-field">
              <span>Full Name</span>
              <input name="fullName" value={form.fullName} onChange={handleChange} autoComplete="name" required />
            </label>

            <label className="auth-field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            </label>
          </div>

          <label className="auth-field">
            <span>Username</span>
            <input name="username" value={form.username} onChange={handleChange} autoComplete="username" required />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-password">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="auth-field">
            <span>Confirm Password</span>
            <div className="auth-password">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-success">{success}</div> : null}

          <button className="auth-submit" type="submit" disabled={loading} title={validationMessage || undefined}>
            {loading ? <Loader size="sm" label="Creating account" /> : null}
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
