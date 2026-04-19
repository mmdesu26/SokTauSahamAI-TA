// session storage helper — logic gak diubah sama sekali
const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";
const EXPIRES_KEY = "admin_session_expires_at";
const IDLE_LIMIT_MS = 20 * 60 * 1000; // 20 menit auto-logout admin

export function getToken() {
  // ambil token dr sessionStorage
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setAdminSession(token, user, expiresInMinutes = 20) {
  // simpen token + user + expire time pas login sukses
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(
    EXPIRES_KEY,
    String(Date.now() + expiresInMinutes * 60 * 1000)
  );
}

export function clearAdminSession() {
  // bersihin semua jejak session
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(EXPIRES_KEY);
}

export function isAdminSessionActive() {
  // cek session masih valid gak
  const token = getToken();
  const user = getUser();
  const expiresAt = Number(sessionStorage.getItem(EXPIRES_KEY) || 0);

  if (!token || !user || user.role !== "admin") return false;
  if (!expiresAt || Date.now() >= expiresAt) {
    clearAdminSession();
    return false;
  }
  return true;
}

export function refreshAdminSession() {
  // perpanjang waktu idle pas user aktif
  if (!isAdminSessionActive()) return;
  sessionStorage.setItem(EXPIRES_KEY, String(Date.now() + IDLE_LIMIT_MS));
}

export const ADMIN_IDLE_LIMIT_MS = IDLE_LIMIT_MS;
