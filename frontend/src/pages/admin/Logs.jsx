import React, { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlert";

export default function AdminLogs() {
  const { showError } = useAppAlert();
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [expandedLog, setExpandedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const LIMIT = 50;

  const fetchLogs = async (offsetVal = 0, sourceQuery = searchQuery) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT,
        offset: offsetVal,
        ...(filterLevel !== "all" && { level: filterLevel }),
        ...(sourceQuery && { source: sourceQuery }),
      });

      const { ok, data } = await apiFetch(`/admin/logs?${params}`);

      if (ok && data?.success) {
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setOffset(offsetVal);
      } else {
        showError(data?.message || "Gagal mengambil log.", "Gagal");
      }
    } catch (error) {
      showError("Terjadi kesalahan saat mengambil log.", "Gagal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
  }, [filterLevel]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchLogs(0, query);
  };

  const filteredLogs = logs;

  const getLevelColors = (level) => {
    const colors = {
      info: "border-[var(--color-admin)]/20 bg-[var(--color-admin)]/15 text-[var(--color-admin)]",
      warning:
        "border-amber-500/20 bg-amber-500/15 text-amber-700 dark:text-amber-300",
      error: "border-red-500/20 bg-red-500/15 text-red-700 dark:text-red-300",
      success:
        "border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    };

    return (
      colors[level] ||
      "border-border bg-muted text-foreground"
    );
  };

  const getBorderColor = (level) => {
    const colors = {
      error: "border-red-400",
      warning: "border-amber-500",
      success: "border-emerald-500",
      info: "border-[var(--color-admin)]",
    };

    return colors[level] || "border-[var(--color-admin)]";
  };

  function formatLogTimestamp(value) {
    if (!value) return "-";

    const raw = String(value).trim();

    // backend kirim naive datetime: "2026-04-01 00:18:37"
    // dipaksa anggap itu UTC
    const normalized = raw.includes("T")
      ? raw.replace(" ", "")
      : raw.replace(" ", "T");

    const utcValue = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
    const date = new Date(utcValue);

    if (Number.isNaN(date.getTime())) return value;

    return `${new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date)} WIB`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Log & Monitoring
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
          Monitor semua aktivitas sistem, error, dan status operasi secara
          real-time.
        </p>
      </section>

      {/* Search + Action */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari sumber aktivitas (CRUD Stock, Prediction, Auth, dll)..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12 text-foreground placeholder:text-muted-foreground shadow-sm transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const csv = logs
                .map(
                  (log) =>
                    `"${log.timestamp}","${log.level}","${log.source}","${log.message}","${log.username}"`
                )
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "logs.csv";
              a.click();
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
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
                : "border border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {level === "all"
              ? "Semua Level"
              : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </section>

      {/* Logs */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Memuat log...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-border/70">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`border-l-4 ${getBorderColor(log.level)}`}>
                <button
                  onClick={() =>
                    setExpandedLog(expandedLog === log.id ? null : log.id)
                  }
                  className="w-full px-6 py-5 text-left transition hover:bg-muted/50"
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
                        <p className="font-medium text-foreground">
                          {log.message}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{log.source}</span>
                          <span>•</span>
                          <span>{log.username || "system"}</span>
                          <span>•</span>
                          <span>{formatLogTimestamp(log.timestamp)}</span>
                        </div>

                        {expandedLog === log.id && log.details && (
                          <div className="mt-4 rounded-xl border border-border bg-muted/60 p-4">
                            <p className="font-mono whitespace-pre-wrap text-xs text-muted-foreground">
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
            <p className="text-lg text-muted-foreground">
              Tidak ada log yang sesuai dengan filter
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {offset + 1} - {Math.min(offset + LIMIT, total)} dari{" "}
            {total} log
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => fetchLogs(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}