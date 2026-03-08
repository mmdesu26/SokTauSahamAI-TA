import { Activity, Database, Users } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Saham", value: "527", icon: Database },
    { label: "Active Users", value: "2,345", icon: Users },
  ];

  const systemStatus = [
    { name: "API yFinance", status: "Online", uptime: "99.8%" },
    { name: "ML Training", status: "Running", uptime: "Active" },
    { name: "Database", status: "Online", uptime: "99.9%" },
  ];

  const recentActivities = [
    { message: "ML Model Training Dimulai", time: "5 menit lalu" },
    { message: "API Error: yFinance Timeout", time: "15 menit lalu" },
    { message: "Data Update: 5,234 Records", time: "1 jam lalu" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 pb-16">

      {/* Header */}
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-10 shadow-sm">
        <h1 className="mb-3 text-4xl font-bold text-gray-800">
          Admin Dashboard
        </h1>

        <p className="text-lg text-gray-600">
          Monitor kesehatan sistem dan kelola data
        </p>
      </section>


      {/* Stats */}
      <section>
        <div className="grid gap-6 md:grid-cols-2">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex justify-between">
                  <div className="rounded-lg bg-[var(--color-admin)]/15 p-3">
                    <Icon className="h-6 w-6 text-[var(--color-admin)]" />
                  </div>
                </div>

                <p className="text-sm text-gray-500">{stat.label}</p>

                <p className="text-3xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>


      {/* System Status */}
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm">

        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-800">
          <Activity className="h-6 w-6 text-[var(--color-admin)]" />
          Status Sistem
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {systemStatus.map((service) => (
            <div
              key={service.name}
              className="rounded-xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-5"
            >
              <div className="mb-3 flex justify-between">
                <p className="font-medium text-gray-800">{service.name}</p>

                <span className="text-xs font-semibold text-[var(--color-admin)]">
                  {service.status}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Uptime: {service.uptime}
              </p>

              <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-admin4)]">
                <div
                  className="h-2 rounded-full bg-[var(--color-admin)]"
                  style={{
                    width: service.uptime.includes("%")
                      ? service.uptime
                      : "100%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </section>


      {/* Recent Activity */}
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm">

        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Aktivitas Terbaru
        </h2>

        <div className="space-y-4">
          {recentActivities.map((activity, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-5"
            >
              <div className="flex justify-between gap-4">
                <p className="font-medium text-gray-800">
                  {activity.message}
                </p>

                <span className="text-xs text-gray-500">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>

      </section>

    </div>
  );
}