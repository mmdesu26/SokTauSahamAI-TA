import { clearAdminSession, getToken } from "@/utils/authSession";

const isDev = import.meta.env.DEV;
const BASE_URL = isDev ? "/api" : "https://flukey-donald-unsubscribing.ngrok-free.dev/api";
// const BASE_URL = isDev ? "/api" : "https://api.soktausaham.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: "Response bukan JSON" };
  }

  if (response.status === 401) {
    clearAdminSession();
  }

  return { ok: response.ok, data, status: response.status };
}
