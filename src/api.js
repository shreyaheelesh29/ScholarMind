const API_BASE = "/api";

export function saveSession(result) {
  localStorage.setItem("scholarmind_token", result.access_token);
  localStorage.setItem("scholarmind_user", JSON.stringify(result.user));
}

export function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem("scholarmind_user") || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("scholarmind_token");
  localStorage.removeItem("scholarmind_user");
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("scholarmind_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || `Request failed (${response.status})`);
  return result;
}
