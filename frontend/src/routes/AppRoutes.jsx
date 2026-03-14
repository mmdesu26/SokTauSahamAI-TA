import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import InvestorLayout from "../layouts/InvestorLayout";
import AdminLayout from "../layouts/AdminLayout";
import LandingPage from "../pages/LandingPage";
import AdminLogin from "../pages/admin/Login";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminDataStocks from "../pages/admin/DataStocks";
import AdminLogs from "../pages/admin/Logs";
import AdminGlossary from "../pages/admin/Glossary";
import InvestorDashboard from "../pages/investor/Dashboard";
import InvestorStocks from "../pages/investor/Stocks";
import InvestorStockDetail from "../pages/investor/StockDetail";
import InvestorGlossary from "../pages/investor/Glossary";
import ChangePassword from "../pages/admin/ChangePw";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Guest / public */}
      <Route element={<InvestorLayout />}>
        <Route path="/investor/dashboard" element={<InvestorDashboard />} />
        <Route path="/investor/stocks" element={<InvestorStocks />} />
        <Route path="/investor/stocks/:ticker" element={<InvestorStockDetail />} />
        <Route path="/investor/glossary" element={<InvestorGlossary />} />
      </Route>

      {/* Admin login public */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin protected */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/datastocks" element={<AdminDataStocks />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/changepassword" element={<ChangePassword />} />
          <Route path="/admin/glossary" element={<AdminGlossary />} />
        </Route>
      </Route>

      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}