// ===== API CLIENT — gak diubah, cuma rapihin =====
// buat narik data dari backend, auto inject token admin kalau ada
import { clearAdminSession, getToken } from "@/utils/authSession";

const isDev = import.meta.env.DEV;
// kalau dev pake proxy /api, kalau prod hit langsung ke ngrok
const BASE_URL = isDev
  ? "/api"
  : "https://flukey-donald-unsubscribing.ngrok-free.dev/api";

export async function apiFetch(endpoint, options = {}) {
  const token = getToken(); // ambil token dari session admin
  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "ngrok-skip-browser-warning": "true", // skip warning page ngrok
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    // parse JSON dari response, kalau gagal kasih default
    data = await response.json();
  } catch {
    data = { message: "Response bukan JSON" };
  }

  // 401 = token expired / gak valid → auto logout
  if (response.status === 401) {
    clearAdminSession();
  }

  return { ok: response.ok, data, status: response.status };
}
