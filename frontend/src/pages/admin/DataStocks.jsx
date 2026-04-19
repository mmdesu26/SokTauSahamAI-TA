import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlert";

const INITIAL_FORM = {
  ticker: "",
  status: "Active",
};

export default function AdminDataStocks() {
  const { showSuccess, showError } = useAppAlert();

  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStockName, setSelectedStockName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stocks;

    return stocks.filter(
      (stock) =>
        String(stock.ticker || "").toLowerCase().includes(q) ||
        String(stock.name || "").toLowerCase().includes(q)
    );
  }, [searchQuery, stocks]);

  const fetchStocks = async () => {
    setIsLoading(true);

    try {
      const { ok, data } = await apiFetch("/admin/stocks");

      if (ok && data?.success) {
        setStocks(data.data || []);
      } else {
        showError(data?.message || "Gagal mengambil data saham.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat mengambil data saham.", "Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setSelectedStockId(null);
  };

  const handleOpenModal = (type, stock = null) => {
    setModalType(type);

    if (type === "edit" && stock) {
      setFormData({
        ticker: stock.ticker ?? "",
        status: stock.status ?? "Active",
      });
      setSelectedStockId(stock.id);
    } else {
      resetForm();
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleOpenDeleteModal = (stockId, stockName) => {
    setSelectedStockId(stockId);
    setSelectedStockName(stockName || "");
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedStockId(null);
    setSelectedStockName("");
  };

  const handleConfirmDelete = async () => {
    try {
      const { ok, data } = await apiFetch(`/admin/stocks/${selectedStockId}`, {
        method: "DELETE",
      });

      if (ok && data?.success) {
        showSuccess(data.message || "Data saham berhasil dihapus.", "Berhasil");
        fetchStocks();
      } else {
        showError(data?.message || "Gagal menghapus data saham.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat menghapus data saham.", "Gagal");
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleSave = async () => {
    if (!formData.ticker.trim()) {
      showError("Format: BBCA atau BBCA.JK (Ticker saham)", "Gagal");
      return;
    }

    const payload = {
      ticker: formData.ticker.trim().toUpperCase(),
      status: formData.status || "Active",
    };

    try {
      let response;

      if (modalType === "edit" && selectedStockId) {
        // Edit hanya bisa ubah status saja
        response = await apiFetch(`/admin/stocks/${selectedStockId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // Create: Fetch nama, sektor, harga otomatis dari yfinance
        response = await apiFetch("/admin/stocks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const { ok, data } = response;

      if (ok && data?.success) {
        showSuccess(
          data.message ||
            "Data saham berhasil disimpan. Informasi lain diambil dari yfinance.",
          "Berhasil"
        );
        handleCloseModal();
        fetchStocks();
      } else {
        showError(data?.message || "Gagal menyimpan data saham.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat menyimpan data saham.", "Gagal");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Manajemen Data Saham
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
          Kelola data master saham dengan Create, Read, Update, dan Delete untuk
          saham yang ditampilkan pada halaman user.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative mx-auto min-w-[260px] max-w-md flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari ticker atau nama saham..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12 text-foreground placeholder:text-muted-foreground shadow-sm transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenModal("add")}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-admin)] px-4 py-3 font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Tambah Saham
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Ticker
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Nama Perusahaan
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Sektor
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Harga
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Perubahan
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Terakhir Diubah
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    Memuat data saham...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((stock) => (
                  <tr
                    key={stock.id}
                    className="border-b border-border/60 transition hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {stock.ticker}
                    </td>
                    <td className="px-6 py-4 text-foreground">{stock.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {stock.sector}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      Rp {stock.price}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {stock.change}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {stock.lastUpdated}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          stock.status === "Active"
                            ? "border-[var(--color-admin)]/20 bg-[var(--color-admin)]/15 text-[var(--color-admin)]"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {stock.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal("edit", stock)}
                          className="rounded-lg p-2 text-[var(--color-admin)] transition hover:bg-[var(--color-admin)]/15"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleOpenDeleteModal(stock.id, stock.ticker)
                          }
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    Tidak ada data saham yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {modalType === "add" ? "Tambah Saham Baru" : "Edit Saham"}
              </h2>

              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 transition hover:bg-muted"
              >
                <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Ticker (format: BBCA atau BBCA.JK)
                </label>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ticker: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Contoh: BBCA"
                  disabled={modalType === "edit"}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20 disabled:cursor-not-allowed disabled:bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {modalType === "add"
                    ? "Data nama, sektor, dan harga akan diambil otomatis dari yfinance"
                    : "Ticker tidak bisa diubah. Edit hanya untuk mengubah status."}
                </p>
              </div>

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-xl border border-border bg-background py-3 text-foreground transition hover:bg-muted"
              >
                Batal
              </button>

              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-[var(--color-admin)] py-3 text-white transition hover:opacity-90"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                Hapus Saham?
              </h3>
            </div>

            <p className="mb-6 text-muted-foreground">
              Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-foreground">
                {selectedStockName}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 rounded-xl border border-border bg-background py-3 text-foreground transition hover:bg-muted"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-500 py-3 text-white transition hover:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}