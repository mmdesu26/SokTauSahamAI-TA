// hook buat auto-logout admin kalau idle 20 menit
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  isAdminSessionActive,
  refreshAdminSession,
  clearAdminSession,
} from "@/utils/authSession";

export default function useAdminAutoLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    // setiap kali user gerak/keyboard, refresh expire timer
    const events = ["mousemove", "keydown", "click", "scroll"];
    const onActivity = () => refreshAdminSession();
    events.forEach((e) => window.addEventListener(e, onActivity));

    // tiap 30 detik cek session masih hidup gak
    const interval = setInterval(() => {
      if (!isAdminSessionActive()) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
      }
    }, 30 * 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
  }, [navigate]);
}
