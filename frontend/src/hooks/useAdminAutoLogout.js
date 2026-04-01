import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAdminSession, refreshAdminSession, isAdminSessionActive, ADMIN_IDLE_LIMIT_MS } from "@/utils/authSession";
import { apiFetch } from "@/lib/api";

export default function useAdminAutoLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminSessionActive()) {
      clearAdminSession();
      navigate("/admin/login", { replace: true });
      return;
    }

    let timeoutId;

    const doLogout = async () => {
      try {
        await apiFetch("/auth/logout", { method: "POST" });
      } catch {}
      clearAdminSession();
      navigate("/admin/login", { replace: true });
    };

    const resetTimer = () => {
      refreshAdminSession();
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(doLogout, ADMIN_IDLE_LIMIT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [navigate]);
}
