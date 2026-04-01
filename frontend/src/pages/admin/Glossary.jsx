import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Info,
  AlertCircle,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlertContext";

export default function AdminGlossary() {
  const { showSuccess, showError } = useAppAlert();

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    term: "",
    definition: "",
  });

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;

    return items.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const fetchGlossary = async () => {
    setIsLoading(true);

    try {
      const { ok, data } = await apiFetch("/glossary");

      if (ok && data.success) {
        setItems(data.data || []);
      } else {
        showError(data.message || "Gagal mengambil data glosarium.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat mengambil data glosarium.", "Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlossary();
  }, []);

  const resetForm = () => {
    setFormData({
      term: "",
      definition: "",
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setFormData({
      term: item.term,
      definition: item.definition,
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      term: formData.term.trim(),
      definition: formData.definition.trim(),
    };

    if (!payload.term || !payload.definition) {
      showError("Istilah dan definisi wajib diisi.", "Gagal");
      return;
    }

    try {
      let response;

      if (editingId) {
        response = await apiFetch(`/admin/glossary/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiFetch("/admin/glossary", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const { ok, data } = response;

      if (ok && data.success) {
        showSuccess(
          data.message || "Data glosarium berhasil disimpan.",
          "Berhasil"
        );
        closeModal();
        fetchGlossary();
      } else {
        showError(data.message || "Gagal menyimpan data glosarium.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat menyimpan data glosarium.", "Gagal");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const { ok, data } = await apiFetch(`/admin/glossary/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (ok && data.success) {
        showSuccess(
          data.message || "Data glosarium berhasil dihapus.",
          "Berhasil"
        );
        fetchGlossary();
      } else {
        showError(data.message || "Gagal menghapus data glosarium.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat menghapus data glosarium.", "Gagal");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-8 shadow-sm md:p-12">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#222222] md:text-5xl">
        Manajemen Data Glosarium
      </h1>

      <p className="max-w-3xl text-lg text-[#666666] md:text-xl text-justify">
        Kelola data master glosarium dengan Create, Read, Update, dan Delete
        untuk mengisi istilah-istilah saham yang ditampilkan pada halaman user.
      </p>
    </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative mx-auto min-w-[260px] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari istilah, singkatan, atau definisi..."
            className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pr-4 pl-12 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[var(--color-admin2)] hover:text-[#222222]"
          >
            <Plus size={18} />
            Tambah Istilah
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--color-admin)]/15 p-3">
              <Info className="h-5 w-5 text-[var(--color-admin)]" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Daftar Istilah Glosarium
              </h2>
              <p className="text-sm text-gray-600">
                Edit atau hapus istilah yang akan tampil di halaman user.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-admin)] px-5 py-2 text-sm font-semibold text-white shadow-sm">
            <BookOpen className="h-4 w-4" />
            Total Istilah: {items.length}
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-gray-500">Memuat data...</div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--color-admin4)] bg-[var(--color-admin3)] p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold leading-snug text-gray-800">
                    {item.term}
                  </h3>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-admin4)] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[var(--color-admin)] hover:text-[var(--color-admin)]"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeleteModal(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>
                  </div>
                </div>

                <p className="leading-relaxed text-gray-600">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-admin4)] bg-[var(--color-admin3)] px-6 py-14 text-center">
            <p className="text-xl font-semibold text-gray-700">
              Data tidak ditemukan
            </p>
            <p className="mt-2 text-gray-500">
              Tidak ada istilah yang cocok dengan pencarian "{searchQuery}".
            </p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[var(--color-admin)]/15 p-3">
                  <BookOpen className="h-5 w-5 text-[var(--color-admin)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingId ? "Edit Istilah" : "Tambah Istilah Baru"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Isi data istilah glosarium yang akan ditampilkan ke user.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Istilah
                </label>
                <input
                  type="text"
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  placeholder="Contoh: PER (Price-to-Earnings Ratio)"
                  className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Definisi
                </label>
                <textarea
                  name="definition"
                  value={formData.definition}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Masukkan penjelasan istilah..."
                  className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-admin4)] bg-white px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <X size={18} />
                  Batal
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[var(--color-admin2)] hover:text-[#222222]"
                >
                  <Save size={18} />
                  {editingId ? "Simpan Perubahan" : "Tambah Istilah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-admin4)] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>

              <h3 className="text-lg font-semibold text-[#222222]">
                Hapus Istilah?
              </h3>
            </div>

            <p className="mb-6 text-[#555555]">
              Anda yakin ingin menghapus istilah{" "}
              <span className="font-semibold text-[#222222]">
                {selectedItem.term}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 rounded-xl border border-[var(--color-admin4)] bg-white py-3 text-[#222222] transition hover:bg-[var(--color-admin3)]"
              >
                Batal
              </button>

              <button
                onClick={handleDelete}
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