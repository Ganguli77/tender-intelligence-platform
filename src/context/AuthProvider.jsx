import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";

const AUTH_STORAGE_KEY = "tenderAuth";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function readStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null, username: null, role: null };
  }

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return { token: null, username: null, role: null };
    }

    const parsed = JSON.parse(stored);
    return {
      token: parsed.token ?? null,
      username: parsed.username ?? null,
      role: normalizeRole(parsed.role),
    };
  } catch {
    return { token: null, username: null, role: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (auth.token) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  const login = useCallback(({ token, username, role }) => {
    setAuth({
      token: token ?? null,
      username: username ?? null,
      role: normalizeRole(role),
    });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, username: null, role: null });
  }, []);

  const value = useMemo(() => {
    return {
      ...auth,
      isAuthenticated: Boolean(auth.token),
      isAdmin: normalizeRole(auth.role) === "ADMIN",
      login,
      logout,
    };
  }, [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
