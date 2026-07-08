import api from "./api";

const AUTH_BASE_URL = "/auth";

export async function login(credentials) {
  const response = await api.post(`${AUTH_BASE_URL}/login`, credentials);
  return response.data;
}

export async function register(userData) {
  const response = await api.post(`${AUTH_BASE_URL}/register`, userData);
  return response.data;
}

export async function loginWithGoogle(token) {
  const response = await api.post(`${AUTH_BASE_URL}/google`, { token });
  return response.data;
}

export default {
  login,
  loginWithGoogle,
  register,
};
