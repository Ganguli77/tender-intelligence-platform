import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { getApiErrorMessage } from "../../services/api";
import { requestPasswordReset, resetPassword } from "../../services/authService";
import "../Login/Login.css";

const initialForm = {
  username: "",
  token: "",
  password: "",
  confirmPassword: "",
};

export default function ForgotPassword() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canReset = useMemo(
    () => form.token.trim() && form.password.length >= 6 && form.password === form.confirmPassword,
    [form.confirmPassword, form.password, form.token],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleRequestToken = async (event) => {
    event.preventDefault();

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    setLoadingRequest(true);
    setError("");
    setSuccess("");

    try {
      const data = await requestPasswordReset(form.username.trim());
      setForm((current) => ({ ...current, token: data.resetToken || "" }));
      setSuccess(data.resetToken ? `Temporary reset token: ${data.resetToken}` : data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create a reset token."));
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoadingReset(true);
    setError("");
    setSuccess("");

    try {
      const data = await resetPassword({
        token: form.token.trim(),
        password: form.password,
      });
      setForm(initialForm);
      setSuccess(data.message || "Password reset successfully. You can sign in now.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reset your password."));
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="forgot-password-title">
        <aside className="auth-panel">
          <span className="auth-eyebrow">Account Recovery</span>
          <h1>Reset access to your tender workspace.</h1>
          <p>Generate a temporary token for your username, then choose a new password for your account.</p>
        </aside>

        <form className="auth-card" onSubmit={handleResetPassword} noValidate>
          <div className="auth-card__header">
            <span className="auth-icon">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 id="forgot-password-title">Forgot password</h2>
              <p>Reset tokens expire after 15 minutes.</p>
            </div>
          </div>

          <label className="auth-field">
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Enter your username"
            />
          </label>

          <button className="auth-submit auth-secondary-action" type="button" onClick={handleRequestToken} disabled={loadingRequest}>
            {loadingRequest ? <Loader size="sm" label="Creating token" /> : null}
            {loadingRequest ? "Creating token..." : "Get reset token"}
          </button>

          <label className="auth-field">
            <span>Reset Token</span>
            <input
              name="token"
              value={form.token}
              onChange={handleChange}
              autoComplete="one-time-code"
              placeholder="Paste token here"
            />
          </label>

          <label className="auth-field">
            <span>New Password</span>
            <div className="auth-password">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-success">{success}</div> : null}

          <button className="auth-submit" type="submit" disabled={loadingReset || !canReset}>
            {loadingReset ? <Loader size="sm" label="Resetting password" /> : null}
            {loadingReset ? "Resetting password..." : "Reset password"}
          </button>

          <p className="auth-switch">
            Remembered it? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
