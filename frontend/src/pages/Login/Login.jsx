import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Smartphone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { getApiErrorMessage } from "../../services/api";
import { getFirebasePhoneAuth, isFirebasePhoneConfigured } from "../../services/firebaseAuth";
import { login as loginRequest, loginWithGoogle, loginWithPhone } from "../../services/authService";
import "./Login.css";

const initialForm = {
  identifier: "",
  password: "",
};

const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const phonePattern = /^\+[1-9]\d{7,14}$/;

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
          width="350"
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
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const firebaseAuthRef = useRef(null);

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

  useEffect(() => () => {
    recaptchaVerifierRef.current?.clear();
  }, []);

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

  const handleSelectMethod = (method) => {
    setLoginMethod(method);
    setError("");
    setNotice("");
  };

  const handleSendPhoneCode = async () => {
    const normalizedPhone = phoneNumber.trim();
    if (!phonePattern.test(normalizedPhone)) {
      setError("Enter your phone number with country code, for example +14155552671.");
      return;
    }
    if (!recaptchaContainerRef.current) {
      setError("Phone sign-in is not configured. Please use email or contact support.");
      return;
    }

    setPhoneLoading(true);
    setError("");
    setNotice("");

    try {
      const auth = await getFirebasePhoneAuth();
      if (!auth) {
        throw new Error("Phone sign-in is not configured. Please use email or contact support.");
      }
      firebaseAuthRef.current = auth;
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: "invisible",
        });
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        recaptchaVerifierRef.current,
      );
      setPhoneConfirmation(confirmation);
      setPhoneNumber(normalizedPhone);
      setNotice("Verification code sent. Check your phone.");
    } catch (err) {
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      setError(getApiErrorMessage(err, "Unable to send a verification code. Please try again."));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneConfirmation || !verificationCode.trim()) {
      setError("Enter the verification code sent to your phone.");
      return;
    }

    setPhoneLoading(true);
    setError("");
    setNotice("");

    try {
      const auth = firebaseAuthRef.current || await getFirebasePhoneAuth();
      if (!auth) {
        throw new Error("Phone sign-in is not configured. Please use email or contact support.");
      }
      const credential = await phoneConfirmation.confirm(verificationCode.trim());
      const idToken = await credential.user.getIdToken();
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      firebaseAuthRef.current = null;
      const data = await loginWithPhone(idToken);
      completeLogin(data, phoneNumber);
    } catch (err) {
      const auth = firebaseAuthRef.current;
      if (auth?.currentUser) {
        try {
          const { signOut } = await import("firebase/auth");
          await signOut(auth);
          firebaseAuthRef.current = null;
        } catch (signOutError) {
          setError(getApiErrorMessage(signOutError, "Unable to end the temporary Firebase session."));
          return;
        }
      }
      setError(getApiErrorMessage(err, "Unable to verify this phone number. Please try again."));
    } finally {
      setPhoneLoading(false);
    }
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
      <div className="auth-network" aria-hidden="true" />
      <Link className="auth-brand" to="/" aria-label="NexTender AI home">
        <span>N</span>
        NexTender AI
      </Link>

      <section className="auth-shell" aria-labelledby="login-title">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-card__sr-only" id="login-title">Sign in to NexTender AI</h1>

          <div className="auth-method-switch" role="group" aria-label="Choose sign-in method">
            <button
              type="button"
              className={loginMethod === "email" ? "is-active" : ""}
              aria-pressed={loginMethod === "email"}
              onClick={() => handleSelectMethod("email")}
            >
              <Mail size={17} />
              Email Address
            </button>
            <button
              type="button"
              className={loginMethod === "phone" ? "is-active" : ""}
              aria-pressed={loginMethod === "phone"}
              onClick={() => handleSelectMethod("phone")}
            >
              <Smartphone size={17} />
              Phone Number
            </button>
          </div>

          {loginMethod === "email" ? (
            <>
              <label className="auth-field">
                <span>Business Email or Username</span>
                <div className="auth-input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    name="identifier"
                    value={form.identifier}
                    onChange={handleChange}
                    autoComplete="username"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>Password</span>
                <div className="auth-password">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder="Password"
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
              {error ? <div className="auth-error" role="alert">{error}</div> : null}
              <button className="auth-submit" type="submit" disabled={isSubmitDisabled}>
                {loading ? <Loader size="sm" label="Signing in" /> : null}
                {loading ? "Signing in..." : "Sign in with Password"}
                {!loading ? <ArrowRight size={18} /> : null}
              </button>
            </>
          ) : (
            <>
              <p className="auth-phone-help">
                We’ll text a one-time verification code to your phone.
              </p>
              <label className="auth-field">
                <span>Phone Number</span>
                <div className="auth-input-wrap">
                  <Smartphone size={18} aria-hidden="true" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={(event) => {
                      setPhoneNumber(event.target.value);
                      setError("");
                    }}
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    inputMode="tel"
                    disabled={phoneLoading || Boolean(phoneConfirmation)}
                  />
                </div>
              </label>
              {phoneConfirmation ? (
                <label className="auth-field">
                  <span>Verification Code</span>
                  <input
                    name="verificationCode"
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(event.target.value);
                      setError("");
                    }}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Enter the code sent to you"
                    disabled={phoneLoading}
                  />
                </label>
              ) : null}
              {isFirebasePhoneConfigured ? (
                <>
                  {phoneConfirmation ? (
                    <div className="auth-phone-actions">
                      <button
                        className="auth-phone-resend"
                        type="button"
                        onClick={() => {
                          setPhoneConfirmation(null);
                          setVerificationCode("");
                          setNotice("");
                        }}
                        disabled={phoneLoading}
                      >
                        Change number
                      </button>
                      <button
                        className="auth-submit"
                        type="button"
                        onClick={handleVerifyPhoneCode}
                        disabled={phoneLoading || !verificationCode.trim()}
                      >
                        {phoneLoading ? <Loader size="sm" label="Verifying phone" /> : null}
                        {phoneLoading ? "Verifying..." : "Verify and sign in"}
                        {!phoneLoading ? <ArrowRight size={18} /> : null}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="auth-submit"
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneLoading || !phoneNumber.trim()}
                    >
                      {phoneLoading ? <Loader size="sm" label="Sending code" /> : null}
                      {phoneLoading ? "Sending code..." : "Send verification code"}
                      {!phoneLoading ? <ArrowRight size={18} /> : null}
                    </button>
                  )}
                  <div ref={recaptchaContainerRef} />
                </>
              ) : (
                <p className="auth-provider-note">
                  Phone sign-in needs Firebase setup. You can still use email and password.
                </p>
              )}
              {notice ? <div className="auth-success" role="status">{notice}</div> : null}
              {error ? <div className="auth-error" role="alert">{error}</div> : null}
            </>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          {isGoogleConfigured ? (
            <GoogleLoginButton disabled={loading || phoneLoading} onComplete={completeLogin} onError={setError} />
          ) : (
            <>
              <div className="auth-google-placeholder">
                <span aria-hidden="true">G</span>
                Continue with Google
              </div>
              <p className="auth-provider-note auth-google-note">
                Google sign-in requires a configured OAuth client ID.
              </p>
            </>
          )}

          <p className="auth-switch">
            New to NexTender AI? <Link to="/register">Create an account</Link>
          </p>

          <div className="auth-card__proof">
            <LockKeyhole size={15} />
            JWT-secured access with persistent sessions
          </div>
        </form>
      </section>
    </main>
  );
}
