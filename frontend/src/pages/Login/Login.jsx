import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { getApiErrorMessage } from "../../services/api";
import { login as loginRequest, loginWithGoogle } from "../../services/authService";
import "./Login.css";

const initialForm = {
  identifier: "",
  password: "",
};

const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

function GoogleLoginButton({ disabled, onComplete, onError }) {
  const [googleLoading, setGoogleLoading] = useState(false);

  return (
    <div className={`auth-google-wrap ${disabled || googleLoading ? "is-disabled" : ""}`}>
      {googleLoading ? (
        <button className="auth-google-button" type="button" disabled>
          <Loader size="sm" label="Signing in with Google" />
          Connecting Google...
        </button>
      ) : (
        <GoogleLogin
          theme="filled_black"
          size="large"
          width="100%"
          onSuccess={async (credentialResponse) => {
            setGoogleLoading(true);
            onError("");

            try {
              if (!credentialResponse.credential) {
                throw new Error("Google did not return an ID token.");
              }

              const data = await loginWithGoogle(credentialResponse.credential);
              onComplete(data, data?.user?.name || data?.name || "Google user");
            } catch (err) {
              onError(getApiErrorMessage(err, "Unable to sign in with Google. Please try again."));
            } finally {
              setGoogleLoading(false);
            }
          }}
          onError={() => {
            setGoogleLoading(false);
            onError("Google sign-in was cancelled or failed. Please try again.");
          }}
        />
      )}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const isSubmitDisabled = useMemo(
    () => loading || !form.identifier.trim() || !form.password,
    [form.identifier, form.password, loading],
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const completeLogin = (data, fallbackUsername) => {
    if (!data?.token) {
      throw new Error("Login succeeded but no JWT token was returned.");
    }

    login({
      token: data.token,
      user: data.user || {
        name: data.name || data.username || fallbackUsername,
        email: data.email || data.username || "",
        picture: data.picture || "",
        role: data.role || "USER",
      },
    });
    navigate(redirectTo, { replace: true });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitDisabled) return;

    setLoading(true);
    setError("");

    try {
      const identifier = form.identifier.trim();
      const data = await loginRequest({
        username: identifier,
        email: identifier,
        password: form.password,
      });

      completeLogin(data, identifier);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to sign in. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="login-title">
        <aside className="auth-panel">
          <span className="auth-eyebrow">Secure SaaS Login</span>
          <h1>Welcome back to NexTender AI.</h1>
          <p>
            Continue to your tender dashboard, AI insights, saved searches, and protected procurement workflows.
          </p>
          <div className="auth-panel__proof">
            <LockKeyhole size={18} />
            JWT-secured access with persistent sessions.
          </div>
        </aside>

        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-card__header">
            <span className="auth-icon">
              <Mail size={20} />
            </span>
            <div>
              <h2 id="login-title">Sign in</h2>
              <p>Use your email, username, or Google account to continue.</p>
            </div>
          </div>

          {isGoogleConfigured ? (
            <>
              <GoogleLoginButton disabled={loading} onComplete={completeLogin} onError={setError} />
              <div className="auth-divider">
                <span>or continue with email</span>
              </div>
            </>
          ) : null}

          <label className="auth-field">
            <span>Email or Username</span>
            <input
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              autoComplete="username"
              placeholder="name@company.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-password">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Enter your password"
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

          <div className="auth-row-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <button className="auth-submit" type="submit" disabled={isSubmitDisabled}>
            {loading ? <Loader size="sm" label="Signing in" /> : null}
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-switch">
            New to NexTender AI? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
