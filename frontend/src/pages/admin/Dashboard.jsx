// ADMIN DASHBOARD — re-skin UI, logic monitoring log sama persis
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Database, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlert";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

// helper format waktu relatif — sama persis dr versi lama
function fmtRelative(ts) {
  if (!ts) return "-";
  const raw = String(ts).trim();
  const norm = raw.includes("T") ? raw : raw.replace(" ", "T");
  const utc = norm.endsWith("Z") ? norm : `${norm}Z`;
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return String(ts);

  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} jam lalu`;
  return `${Math.floor(diffH / 24)} hari lalu`;
}

const toneByLevel = (lv) => {
  switch (String(lv || "").toLowerCase()) {
    case "error": return "danger";
    case "warning": return "warning";
    case "success": return "success";
    default: return "info";
  }
};

export default function AdminDashboard() {
  const { showError } = useAppAlert();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // narik log dr backend
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100, offset: 0 });
      const { ok, data } = await apiFetch(`/admin/logs?${params}`);
      if (ok && data?.success) setLogs(data.data || []);
      else showError(data?.message || "Gagal mengambil log.", "Gagal");
    } catch (e) {
      console.error(e);
      showError("Terjadi kesalahan.", "Gagal");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  // hitung summary 4 angka — total/success/warning/error
  const summary = useMemo(() => ({
    total:   logs.length,
    success: logs.filter((l) => l.level === "success").length,
    warning: logs.filter((l) => l.level === "warning").length,
    error:   logs.filter((l) => l.level === "error").length,
  }), [logs]);

  // ambil 5 aktivitas terbaru
  const recent = useMemo(() => logs.slice(0, 5).map((l) => ({
    id: l.id, message: l.message, source: l.source,
    username: l.username || "system", level: l.level,
    time: fmtRelative(l.timestamp), details: l.details,
  })), [logs]);

  const cards = [
  {
    label: "Total Aktivitas",
    value: summary.total,
    icon: Database,
    tone: "info",
    desc: "Jumlah seluruh log aktivitas sistem",
  },
  {
    label: "Berhasil",
    value: summary.success,
    icon: CheckCircle2,
    tone: "success",
    desc: "Operasi yang berjalan dengan sukses",
  },
  {
    label: "Perlu Perhatian",
    value: summary.warning,
    icon: AlertTriangle,
    tone: "warning",
    desc: "Ada kondisi tidak normal (warning)",
  },
  {
    label: "Error",
    value: summary.error,
    icon: XCircle,
    tone: "danger",
    desc: "Operasi gagal atau terjadi kesalahan",
  },
];

  const toneClass = (t) => ({
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger:  "bg-danger/10 text-danger",
    info:    "bg-admin-soft text-admin",
  }[t]);

  return (
    <div className="space-y-8">
      {/* header pake admin accent */}
      <header>
        <Badge variant="admin" className="mb-2"><Activity className="h-3 w-3" /> Monitoring</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor aktivitas sistem berdasarkan log asli.</p>
      </header>

      {/* 4 stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClass(c.tone))}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={c.tone === "info" ? "admin" : c.tone}>{c.label}</Badge>
              </div>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </Card>
          );
        })}
      </section>

      {/* aktivitas terbaru */}
      <Card className="p-6">
        <h2 className="mb-5 text-lg font-semibold">Aktivitas Terbaru</h2>

        {loading ? <Spinner label="Memuat aktivitas..." />
          : recent.length ? (
          <div className="space-y-3">
            {recent.map((a) => {
              const tone = toneByLevel(a.level);
              return (
                <div key={a.id} className={cn("rounded-xl border border-border p-4", "bg-muted/30")}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant={tone}>{String(a.level || "info").toUpperCase()}</Badge>
                        <span className="text-xs text-muted-foreground">{a.source} • {a.username}</span>
                      </div>
                      <p className="text-sm font-medium">{a.message}</p>
                      {a.details && <p className="mt-1 text-xs text-muted-foreground">{a.details}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Belum ada aktivitas log.</p>
        )}
      </Card>
    </div>
  );
}