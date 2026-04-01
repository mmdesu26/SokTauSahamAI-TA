import { Navigate, Outlet } from "react-router-dom";
import { isAdminSessionActive, getUser } from "@/utils/authSession";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  if (allowedRoles.includes("admin")) {
    const isActive = isAdminSessionActive();
    const user = getUser();

    if (!isActive || !user || user.role !== "admin") {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children || <Outlet />;
}
