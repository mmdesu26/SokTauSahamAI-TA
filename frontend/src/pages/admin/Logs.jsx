import React, { useState } from "react";
import { Download, Search } from "lucide-react";

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

  const filteredLogs = mockLogs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      log.message.toLowerCase().includes(query) ||
      log.source.toLowerCase().includes(query);

    const matchesLevel = filterLevel === "all" || log.level === filterLevel;

    return matchesSearch && matchesLevel;
  });

  const getLevelColors = (level) => {
    const colors = {
      info: "border-[var(--color-admin4)] bg-[var(--color-admin)]/15 text-[var(--color-admin)]",
      warning:
        "border-[var(--color-admin4)] bg-[var(--color-admin2)]/25 text-[#5f4b32]",
      error: "border-red-200 bg-red-100 text-red-700",
      success:
        "border-[var(--color-admin4)] bg-[var(--color-admin4)]/35 text-[#5f4b32]",
    };

    return (
      colors[level] ||
      "border-[var(--color-admin4)] bg-[var(--color-admin3)] text-[#222222]"
    );
  };

  const getBorderColor = (level) => {
    const colors = {
      error: "border-red-400",
      warning: "border-[var(--color-admin2)]",
      success: "border-[var(--color-admin4)]",
      info: "border-[var(--color-admin)]",
    };

    return colors[level] || "border-[var(--color-admin)]";
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      {/* Header */}
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-8 shadow-sm md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#222222] md:text-5xl">
          Log & Monitoring
        </h1>
        <p className="max-w-3xl text-lg text-[#666666] md:text-xl">
          Monitor semua aktivitas sistem, error, dan status operasi secara
          real-time
        </p>
      </section>

      {/* Search + Action */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Cari log atau sumber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pr-4 pl-12 text-[#222222] placeholder-[#666666] shadow-sm transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
          />
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 font-medium text-[#222222] shadow-sm transition hover:bg-[var(--color-admin3)]">
            <Download className="h-4 w-4 text-[var(--color-admin)]" />
            Export
          </button>
        </div>
      </section>

      {/* Filter */}
      <section className="flex flex-wrap gap-2">
        {["all", "info", "warning", "error", "success"].map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition ${
              filterLevel === level
                ? "bg-[var(--color-admin)] text-white"
                : "border border-[var(--color-admin4)] bg-white text-[#222222] hover:bg-[var(--color-admin3)]"
            }`}
          >
            {level === "all"
              ? "Semua Level"
              : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </section>

      {/* Logs */}
      <section className="overflow-hidden rounded-3xl border border-[var(--color-admin4)] bg-white shadow-sm">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-[var(--color-admin4)]/70">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`border-l-4 ${getBorderColor(log.level)}`}>
                <button
                  onClick={() =>
                    setExpandedLog(expandedLog === log.id ? null : log.id)
                  }
                  className="w-full px-6 py-5 text-left transition hover:bg-[var(--color-admin3)]/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-4">
                      <span
                        className={`mt-0.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${getLevelColors(
                          log.level
                        )}`}
                      >
                        {log.level.toUpperCase()}
                      </span>

                      <div className="flex-1">
                        <p className="font-medium text-[#222222]">{log.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#666666]">
                          <span>{log.source}</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>

                        {expandedLog === log.id && log.details && (
                          <div className="mt-4 rounded-xl border border-[var(--color-admin4)] bg-[var(--color-admin3)]/70 p-4">
                            <p className="font-mono text-xs text-[#555555]">
                              {log.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-[#666666]">
              Tidak ada log yang sesuai dengan filter
            </p>
          </div>
        )}
      </section>
    </div>
  );
}