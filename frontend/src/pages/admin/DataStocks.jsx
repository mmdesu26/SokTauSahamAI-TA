import React, { useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Upload,
  AlertCircle,
  X,
} from "lucide-react";

const mockStocks = [
  {
    id: 1,
    ticker: "BBCA",
    name: "Bank Central Asia Tbk",
    sector: "Finance",
    lastUpdated: "2024-01-12 14:30",
    status: "Active",
  },
  {
    id: 2,
    ticker: "BMRI",
    name: "Bank Mandiri Tbk",
    sector: "Finance",
    lastUpdated: "2024-01-12 14:28",
    status: "Active",
  },
  {
    id: 3,
    ticker: "ASII",
    name: "Astra International Tbk",
    sector: "Automotive",
    lastUpdated: "2024-01-12 14:25",
    status: "Active",
  },
  {
    id: 4,
    ticker: "TLKM",
    name: "Telekomunikasi Indonesia Tbk",
    sector: "Telecom",
    lastUpdated: "2024-01-12 14:20",
    status: "Inactive",
  },
];

export default function AdminDataStocks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStockName, setSelectedStockName] = useState("");

  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    sector: "",
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mockStocks;

    return mockStocks.filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleOpenModal = (type, stock = null) => {
    setModalType(type);

    if (type === "edit" && stock) {
      setFormData({
        ticker: stock.ticker ?? "",
        name: stock.name ?? "",
        sector: stock.sector ?? "",
      });
      setSelectedStockId(stock.id);
    } else {
      setFormData({ ticker: "", name: "", sector: "" });
      setSelectedStockId(null);
    }

    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleOpenDeleteModal = (stockId, stockName) => {
    setSelectedStockId(stockId);
    setSelectedStockName(stockName || "");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    setSelectedStockId(null);
    setSelectedStockName("");
  };

  const handleSave = () => {
    setShowModal(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      {/* Header */}
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-8 shadow-sm md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#222222] md:text-5xl">
          Manajemen Data Saham
        </h1>
        <p className="max-w-3xl text-lg text-[#666666] md:text-xl">
          Kelola data master saham dengan Create, Read, Update, Delete
        </p>
      </section>

      {/* Search + Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative mx-auto min-w-[260px] max-w-md flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Cari ticker atau nama saham..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pr-4 pl-12 text-[#222222] placeholder-[#666666] shadow-sm transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 font-medium text-[#222222] shadow-sm transition hover:bg-[var(--color-admin3)]">
            <Download className="h-4 w-4 text-[var(--color-admin)]" />
            Export
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 font-medium text-[#222222] shadow-sm transition hover:bg-[var(--color-admin3)]">
            <Upload className="h-4 w-4 text-[var(--color-admin)]" />
            Import
          </button>

          <button
            onClick={() => handleOpenModal("add")}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-admin)] px-4 py-3 font-medium text-white shadow-sm transition hover:bg-[var(--color-admin2)] hover:text-[#222222]"
          >
            <Plus className="h-4 w-4" />
            Tambah Saham
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-admin4)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-[var(--color-admin4)] bg-[var(--color-admin3)]/70">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#222222]">
                  Ticker
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#222222]">
                  Nama Perusahaan
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#222222]">
                  Sektor
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#222222]">
                  Update Terakhir
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#222222]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#222222]">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((stock) => (
                <tr
                  key={stock.id}
                  className="border-b border-[var(--color-admin4)]/60 transition hover:bg-[var(--color-admin3)]/60"
                >
                  <td className="px-6 py-4 font-semibold text-[#222222]">
                    {stock.ticker}
                  </td>
                  <td className="px-6 py-4 text-[#222222]">{stock.name}</td>
                  <td className="px-6 py-4 text-[#666666]">{stock.sector}</td>
                  <td className="px-6 py-4 text-sm text-[#666666]">
                    {stock.lastUpdated}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        stock.status === "Active"
                          ? "border-[var(--color-admin4)] bg-[var(--color-admin)]/15 text-[var(--color-admin)]"
                          : "border-[var(--color-admin4)] bg-[var(--color-admin4)]/30 text-[#666666]"
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
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-[#666666]"
                  >
                    Tidak ada data saham yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-admin4)] bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#222222]">
                {modalType === "add" ? "Tambah Saham Baru" : "Edit Saham"}
              </h2>

              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 transition hover:bg-[var(--color-admin3)]"
              >
                <X className="h-6 w-6 text-[#666666] hover:text-[#222222]" />
              </button>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                value={formData.ticker}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ticker: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="Ticker"
                className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-[#222222] transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
              />

              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Nama Perusahaan"
                className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-[#222222] transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
              />

              <select
                value={formData.sector}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sector: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-[#222222] transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
              >
                <option value="">Pilih Sektor</option>
                <option value="Finance">Finance</option>
                <option value="Automotive">Automotive</option>
                <option value="Telecom">Telecom</option>
                <option value="Mining">Mining</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-xl border border-[var(--color-admin4)] bg-white py-3 text-[#222222] transition hover:bg-[var(--color-admin3)]"
              >
                Batal
              </button>

              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-[var(--color-admin)] py-3 text-white transition hover:bg-[var(--color-admin2)] hover:text-[#222222]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-admin4)] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>

              <h3 className="text-lg font-semibold text-[#222222]">
                Hapus Saham?
              </h3>
            </div>

            <p className="mb-6 text-[#555555]">
              Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-[#222222]">
                {selectedStockName}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-[var(--color-admin4)] bg-white py-3 text-[#222222] transition hover:bg-[var(--color-admin3)]"
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