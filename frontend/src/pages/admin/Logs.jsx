import React, { useState } from "react";
import { Download, Search } from "lucide-react";

import GradientSection from "@/components/GradientBg";

const mockLogs = [
  {
    id: 1,
    timestamp: "2024-01-12 14:30:15",
    level: "error",
    source: "yFinance API",
    message: "Timeout saat mengambil data BBCA",
    details: "Error code: 504 Gateway Timeout",
  },
  {
    id: 2,
    timestamp: "2024-01-12 14:25:48",
    level: "info",
    source: "ML Training",
    message: "Model training dimulai untuk dataset baru",
    details: "Using 5000 training samples",
  },
  {
    id: 3,
    timestamp: "2024-01-12 14:20:10",
    level: "warning",
    source: "Database",
    message: "Query execution time tinggi",
    details: "Execution time: 3.2s (threshold: 2s)",
  },
  {
    id: 4,
    timestamp: "2024-01-12 14:15:33",
    level: "success",
    source: "Data Sync",
    message: "Sinkronisasi 1,245 records dari yFinance",
    details: "Updated at: 2024-01-12 14:15:33",
  },
];

export default function AdminLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [expandedLog, setExpandedLog] = useState(null);

  // Filtered logs
  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // Level colors untuk logs
  const getLevelColors = (level) => {
    const colors = {
      info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      error: "bg-red-500/20 text-red-400 border-red-500/30",
      success: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[level] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <GradientSection className="min-h-screen w-full">
      <div className="pt-16 md:pt-20 lg:pt-24 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-red-950/30 border border-orange-500/20 rounded-2xl p-8 md:p-12 backdrop-blur-md">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Log & Monitoring
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl">
              Monitor semua aktivitas sistem, error, dan status operasi secara real-time
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari log atau sumber..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition"
              />
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 px-4 rounded-lg transition">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Level Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "info", "warning", "error", "success"].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                  filterLevel === level
                    ? "bg-orange-500 text-white"
                    : "bg-slate-900/50 border border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {level === "all" ? "Semua Level" : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
            <div className="divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`border-l-4 ${
                    log.level === "error"
                      ? "border-red-500"
                      : log.level === "warning"
                      ? "border-yellow-500"
                      : log.level === "success"
                      ? "border-green-500"
                      : "border-blue-500"
                  }`}
                >
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full px-6 py-4 text-left hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap mt-0.5 ${getLevelColors(
                            log.level
                          )}`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{log.message}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span>{log.source}</span>
                            <span>•</span>
                            <span>{log.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedLog === log.id && log.details && (
                      <div className="mt-4 ml-12 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-300 font-mono">{log.details}</p>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">Tidak ada log yang sesuai dengan filter</p>
            </div>
          )}
        </div>
      </div>
    </GradientSection>
  );filter
}