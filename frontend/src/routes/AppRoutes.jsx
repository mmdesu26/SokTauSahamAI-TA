// app routes — restruktur sesuai brief
// landing & dashboard digabung jadi satu flow di / (Home)
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import InvestorLayout from "@/layouts/InvestorLayout";
import AdminLayout from "@/layouts/AdminLayout";

// investor pages
import Home from "@/pages/investor/Home";
import Stocks from "@/pages/investor/Stocks";
import StockDetail from "@/pages/investor/StockDetail";
import Glossary from "@/pages/investor/Glossary";

// admin pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminDataStocks from "@/pages/admin/DataStocks";
import AdminLogs from "@/pages/admin/Logs";
import AdminGlossary from "@/pages/admin/Glossary";
import ChangePassword from "@/pages/admin/ChangePw";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== INVESTOR (public) — landing & dashboard udah jadi satu flow ===== */}
      <Route element={<InvestorLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/stocks/:ticker" element={<StockDetail />} />
        <Route path="/glossary" element={<Glossary />} />
      </Route>

      {/* ===== ADMIN ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/datastocks" element={<AdminDataStocks />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/glossary" element={<AdminGlossary />} />
          <Route path="/admin/changepassword" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* fallback — redirect aman */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

      {/* legacy redirect — kalau masih ada link /investor/* dr versi lama */}
      <Route path="/investor/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/investor/stocks" element={<Navigate to="/stocks" replace />} />
      <Route path="/investor/stocks/:ticker" element={<RedirectStockDetail />} />
      <Route path="/investor/glossary" element={<Navigate to="/glossary" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// helper kecil — redirect /investor/stocks/:ticker → /stocks/:ticker
function RedirectStockDetail() {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace("/investor/stocks/", "/stocks/");
  return <Navigate to={path + (params.toString() ? `?${params}` : "")} replace />;
}
