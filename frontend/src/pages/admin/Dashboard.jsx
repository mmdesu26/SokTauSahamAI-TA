import { Activity, Database, Zap, Users } from "lucide-react";

import GradientSection from "@/components/GradientBg";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Saham", value: "527", icon: Database, color: "cyan" },
    { label: "Active Users", value: "2,345", icon: Users, color: "green" },
  ];

  const systemStatus = [
    { name: "API yFinance", status: "Online", uptime: "99.8%" },
    { name: "ML Training", status: "Running", uptime: "Active" },
    { name: "Database", status: "Online", uptime: "99.9%" },
  ];

  const recentActivities = [
    { type: "training", message: "ML Model Training Dimulai", time: "5 menit lalu", status: "running" },
    { type: "error", message: "API Error: yFinance Timeout", time: "15 menit lalu", status: "resolved" },
    { type: "data", message: "Data Update: 5,234 Records", time: "1 jam lalu", status: "completed" },
  ];

  return (
    <GradientSection className="min-h-screen w-full">
      <div className="pt-16 md:pt-20 lg:pt-24 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-red-950/30 border border-orange-500/20 rounded-2xl p-8 md:p-12 backdrop-blur-md">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl">
              Monitor kesehatan sistem dan kelola data
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const colorClasses = {
                cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
                green: "bg-green-500/20 text-green-400 border-green-500/50",
                orange: "bg-orange-500/20 text-orange-400 border-orange-500/50",
              };
              return (
                <div
                  key={stat.label}
                  className={`bg-slate-900/65 border border-slate-700/80 rounded-2xl p-7 hover:border-slate-500/70 transition-all duration-300 backdrop-blur-md`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* System Status */}
          <div className="bg-slate-900/65 border border-slate-700/80 rounded-2xl p-7 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-orange-400" />
              Status Sistem
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {systemStatus.map((service) => (
                <div
                  key={service.name}
                  className="bg-slate-800/50 p-5 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-white">{service.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-green-400">{service.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">Uptime: {service.uptime}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: service.uptime.includes("%") ? service.uptime : "100%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900/65 border border-slate-700/80 rounded-2xl p-7 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-6">Aktivitas Terbaru</h2>

            <div className="space-y-4">
              {recentActivities.map((activity, idx) => {
                const statusColors = {
                  running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
                  completed: "bg-green-500/20 text-green-400 border-green-500/30",
                };
                return (
                  <div
                    key={idx}
                    className={`bg-slate-800/50 p-5 rounded-lg border ${statusColors[activity.status]}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{activity.message}</p>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GradientSection>
  );
}