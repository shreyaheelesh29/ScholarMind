const API_BASE = "/api";

export function saveSession(result) {
  localStorage.setItem("scholarmind_token", result.access_token);
  localStorage.setItem("scholarmind_user", JSON.stringify(result.user));
  window.dispatchEvent(new Event("scholarmind-user-updated"));
}

export function saveSessionUser(user) {
  localStorage.setItem("scholarmind_user", JSON.stringify(user));
  window.dispatchEvent(new Event("scholarmind-user-updated"));
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
  window.dispatchEvent(new Event("scholarmind-user-updated"));
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("scholarmind_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");
  if (!response.ok) {
    const detail = typeof result === "string" ? result.trim() : result.detail || result.message;
    const error = new Error(detail || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return result;
}
