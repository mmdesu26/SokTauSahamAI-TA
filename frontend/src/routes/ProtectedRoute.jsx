// Guard route admin — kalau session mati, redirect ke login

// Import Navigate dan Outlet dari react-router-dom
// - Navigate → untuk redirect ke halaman lain
// - Outlet → untuk render nested route
import { Navigate, Outlet } from "react-router-dom";

// Import helper auth session
// - isAdminSessionActive → cek apakah session/token masih valid
// - getUser → ambil data user dari storage (biasanya localStorage)
import { isAdminSessionActive, getUser } from "@/utils/authSession";


export default function ProtectedRoute({ allowedRoles = [], children }) {
  /**
   * Komponen ini berfungsi sebagai "route guard"
   * untuk membatasi akses halaman berdasarkan role user.
   *
   * Parameter:
   * - allowedRoles: array role yang diizinkan (contoh: ["admin"])
   * - children: komponen yang akan dirender jika lolos validasi
   */

  // Jika route hanya untuk admin
  if (allowedRoles.includes("admin")) {

    // Cek apakah session admin masih aktif (token belum expired)
    const isActive = isAdminSessionActive();

    // Ambil data user dari storage
    const user = getUser();

    // Jika:
    // - session tidak aktif
    // - atau user tidak ada
    // - atau role bukan admin
    if (!isActive || !user || user.role !== "admin") {
      // Redirect ke halaman login admin
      return <Navigate to="/admin/login" replace />;
    }
  }

  // Jika lolos validasi:
  // - render children jika ada
  // - jika tidak ada → render nested route (<Outlet />)
  return children || <Outlet />;
}