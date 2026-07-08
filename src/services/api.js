import axios from "axios";

const AUTH_STORAGE_KEY = "tenderAuth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function readToken() {
  try {
    const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedAuth) return null;

    const parsedAuth = JSON.parse(storedAuth);
    return parsedAuth?.token || null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = readToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return data?.message || data?.error || error?.message || fallback;
}

export default api;
