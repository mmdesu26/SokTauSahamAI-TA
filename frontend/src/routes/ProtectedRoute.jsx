import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (allowedRoles.includes("admin")) {
    if (!token || !user || user.role !== "admin") {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children || <Outlet />;
}