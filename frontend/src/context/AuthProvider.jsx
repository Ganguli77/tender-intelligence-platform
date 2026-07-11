import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";

export const AUTH_STORAGE_KEY = "tenderAuth";

function normalizeRole(role) {
  return String(role || "USER").trim().toUpperCase().replace(/^ROLE_/, "");
}

function decodeJwt(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const claims = decodeJwt(token);
  if (!claims?.exp) return false;
  return claims.exp * 1000 <= Date.now();
}

function normalizeUser(session = {}) {
  const user = session.user || session;
  const email = user.email || session.email || session.username || "";
  const name = user.name || session.name || session.username || email || "User";

  return {
    id: user.id ?? session.id ?? null,
    name,
    email,
    picture: user.picture || session.picture || "",
    role: normalizeRole(user.role || session.role),
  };
}

function readStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return { token: null, user: null };

    const parsed = JSON.parse(stored);
    if (!parsed?.token || isExpired(parsed.token)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return { token: null, user: null };
    }

    return {
      token: parsed.token,
      user: normalizeUser(parsed),
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth());

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleUnauthorized = () => logout();
    window.addEventListener("nextender:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("nextender:unauthorized", handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (auth.token && auth.user && !isExpired(auth.token)) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    if (!auth.token) return undefined;

    const claims = decodeJwt(auth.token);
    if (!claims?.exp) return undefined;

    const delay = Math.max(claims.exp * 1000 - Date.now(), 0);
    const timer = window.setTimeout(logout, delay);
    return () => window.clearTimeout(timer);
  }, [auth.token, logout]);

  const login = useCallback((session) => {
    if (!session?.token) {
      throw new Error("Authentication token is required.");
    }

    setAuth({
      token: session.token,
      user: normalizeUser(session),
    });
  }, []);

  const value = useMemo(() => {
    const role = auth.user?.role || null;

    return {
      token: auth.token,
      user: auth.user,
      username: auth.user?.name || auth.user?.email || "",
      email: auth.user?.email || "",
      role,
      isAuthenticated: Boolean(auth.token && auth.user),
      isAdmin: normalizeRole(role) === "ADMIN",
      login,
      logout,
    };
  }, [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
