import { Routes, Route, Navigate } from "react-router-dom";
import InvestorLayout from "../layouts/InvestorLayout";
import AdminLayout from "../layouts/AdminLayout";
import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPW";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminDataStocks from "../pages/admin/DataStocks";
import AdminLogs from "../pages/admin/Logs";
import InvestorDashboard from "../pages/investor/Dashboard";
import InvestorStocks from "../pages/investor/Stocks";
import InvestorStockDetail from "../pages/investor/StockDetail";
import InvestorGlossary from "../pages/investor/Glossary";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* INVESTOR */}
      <Route element={<InvestorLayout />}>
        <Route path="/investor/dashboard" element={<InvestorDashboard />} />
        <Route path="/investor/stocks" element={<InvestorStocks />} />
        <Route path="/investor/stocks/:ticker" element={<InvestorStockDetail />} />
        <Route path="/investor/glossary" element={<InvestorGlossary />} />
      </Route>

      {/* ADMIN */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="datastocks" element={<AdminDataStocks />} />
        <Route path="logs" element={<AdminLogs />} />        
      </Route>
    </Routes>
  );
}
