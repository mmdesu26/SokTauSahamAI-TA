import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlertContext";

function formatRelativeTime(timestamp) {
  if (!timestamp) return "-";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

function getStatusTone(level) {
  switch (String(level || "").toLowerCase()) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "success":
      return "success";
    default:
      return "info";
  }
}

function buildServiceStatus(logs) {
  const findLatestBySource = (keyword) => {
    return logs.find((log) =>
      String(log?.source || "")
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
  };

  const yfinanceLog = findLatestBySource("yfinance");
  const predictionLog = logs.find((log) => {
    const source = String(log?.source || "").toLowerCase();
    const message = String(log?.message || "").toLowerCase();
    return source.includes("prediction") || message.includes("prediksi");
  });
  const databaseLog = findLatestBySource("database");

  const buildItem = (name, log, fallbackStatus = "Unknown") => {
    const level = String(log?.level || "").toLowerCase();
    let status = fallbackStatus;

    if (level === "error") status = "Bermasalah";
    else if (level === "warning") status = "Warning";
    else if (level === "success" || level === "info") status = "Normal";

    return {
      name,
      status,
      level: level || "info",
      uptime: log?.timestamp ? formatRelativeTime(log.timestamp) : "-",
      detail: log?.message || "Belum ada data log.",
    };
  };

  return [
    buildItem("API yFinance", yfinanceLog),
    buildItem("Prediksi / ML", predictionLog),
    buildItem("Database", databaseLog),
  ];
}

export default function AdminDashboard() {
  const { showError } = useAppAlert();

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 100,
        offset: 0,
      });

      const { ok, data } = await apiFetch(`/admin/logs?${params}`);

      if (ok && data?.success) {
        setLogs(data.data || []);
      } else {
        showError(data?.message || "Gagal mengambil dashboard admin.", "Gagal");
      }
    } catch (error) {
      console.error(error);
      showError("Terjadi kesalahan saat mengambil dashboard admin.", "Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardLogs();
  }, []);

  const summary = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.level === "success").length;
    const warning = logs.filter((l) => l.level === "warning").length;
    const error = logs.filter((l) => l.level === "error").length;

    return { total, success, warning, error };
  }, [logs]);

  const systemStatus = useMemo(() => buildServiceStatus(logs), [logs]);

  const recentActivities = useMemo(() => {
    return logs.slice(0, 3).map((log) => ({
      id: log.id,
      message: log.message,
      source: log.source,
      username: log.username || "system",
      level: log.level,
      time: formatRelativeTime(log.timestamp),
      details: log.details,
    }));
  }, [logs]);

  const summaryCards = [
    {
      label: "Total Log Terbaca",
      value: summary.total,
      icon: Database,
      tone: "info",
    },
    {
      label: "Success",
      value: summary.success,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Warning",
      value: summary.warning,
      icon: AlertTriangle,
      tone: "warning",
    },
    {
      label: "Error",
      value: summary.error,
      icon: XCircle,
      tone: "error",
    },
  ];

  const getToneClasses = (tone) => {
    switch (tone) {
      case "success":
        return {
          icon: "text-emerald-600",
          badge: "bg-emerald-100 text-emerald-700",
          border: "border-emerald-200",
        };
      case "warning":
        return {
          icon: "text-amber-600",
          badge: "bg-amber-100 text-amber-700",
          border: "border-amber-200",
        };
      case "error":
        return {
          icon: "text-red-600",
          badge: "bg-red-100 text-red-700",
          border: "border-red-200",
        };
      default:
        return {
          icon: "text-[var(--color-admin)]",
          badge: "bg-[var(--color-admin3)] text-[var(--color-admin)]",
          border: "border-[var(--color-admin4)]",
        };
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 pb-16">
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-10 shadow-sm">
        <h1 className="mb-3 text-4xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Monitor kesehatan sistem dan aktivitas berdasarkan log asli
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          const tone = getToneClasses(item.tone);

          return (
            <div
              key={item.label}
              className={`rounded-3xl border bg-white p-6 shadow-sm ${tone.border}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <Icon className={`h-7 w-7 ${tone.icon}`} />
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
                  {item.label}
                </span>
              </div>

              <p className="text-3xl font-bold text-gray-800">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Aktivitas Terbaru
        </h2>

        {isLoading ? (
          <p className="text-gray-500">Memuat aktivitas...</p>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const tone = getToneClasses(getStatusTone(activity.level));

              return (
                <div
                  key={activity.id}
                  className={`rounded-xl border bg-[var(--color-admin3)] p-5 ${tone.border}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                          {String(activity.level || "info").toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {activity.source} • {activity.username}
                        </span>
                      </div>

                      <p className="font-medium text-gray-800">
                        {activity.message}
                      </p>

                      {activity.details ? (
                        <p className="mt-2 text-sm text-gray-600">
                          {activity.details}
                        </p>
                      ) : null}
                    </div>

                    <span className="shrink-0 text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">Belum ada aktivitas log.</p>
        )}
      </section>
    </div>
  );
}