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

import GradientSection from "@/components/GradientBg";

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

  // modal add/edit
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" | "edit"
  const [selectedStockId, setSelectedStockId] = useState(null);

  // modal delete
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

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenDeleteModal = (stockId, stockName) => {
    setSelectedStockId(stockId);
    setSelectedStockName(stockName || "");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    // TODO: Implementasi delete real (API / state update)
    setShowDeleteModal(false);
    setSelectedStockId(null);
    setSelectedStockName("");
  };

  const handleSave = () => {
    // TODO: Implementasi save real (API / state update)
    setShowModal(false);
  };

  return (
    <GradientSection className="min-h-screen w-full">
      <div className="pt-16 md:pt-20 lg:pt-24 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Manajemen Data Saham
            </h1>
            <p className="text-slate-400">
              Kelola data master saham dengan Create, Read, Update, Delete
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari ticker atau nama saham..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                type="button"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal("add")}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Tambah Saham
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Ticker
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Nama Perusahaan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Sektor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Update Terakhir
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((stock) => (
                      <tr
                        key={stock.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                      >
                        <td className="px-6 py-4 font-semibold text-white">
                          {stock.ticker}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {stock.name}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {stock.sector}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {stock.lastUpdated}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              stock.status === "Active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-slate-500/20 text-slate-400"
                            }`}
                          >
                            {stock.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenModal("edit", stock)}
                              className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDeleteModal(stock.id, stock.ticker)
                              }
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        Tidak ada data saham yang ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {modalType === "add" ? "Tambah Saham Baru" : "Edit Saham"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ticker
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                  placeholder="BBCA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                  placeholder="Bank Central Asia Tbk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sektor
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sector: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="">Pilih Sektor</option>
                  <option value="Finance">Finance</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Telecom">Telecom</option>
                  <option value="Mining">Mining</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                Simpan
              </button>
            </div>

            {/* opsional debug kecil biar aman */}
            <div className="mt-4 text-xs text-slate-600">
              Mode: {modalType} | Selected ID: {String(selectedStockId)}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Hapus Saham?</h3>
            </div>

            <p className="text-slate-300 mb-6">
              Anda yakin ingin menghapus saham{" "}
              <span className="font-semibold text-white">
                {selectedStockName}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </GradientSection>
  );
}
