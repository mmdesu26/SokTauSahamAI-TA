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
  BadgeCheck,
  Library,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlertContext";

const INITIAL_FORM = {
  term: "",
  definition: "",
  source_url: "",
  verification_status: "literature_based",
  verified_by: "",
};

const STATUS_OPTIONS = [
  { value: "literature_based", label: "Berbasis Literatur Resmi" },
  { value: "verified", label: "Terverifikasi" },
];

export default function AdminGlossary() {
  const { showSuccess, showError } = useAppAlert();

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.term?.toLowerCase().includes(q) ||
        item.definition?.toLowerCase().includes(q) ||
        item.verifiedBy?.toLowerCase().includes(q);

      const matchStatus =
        !statusFilter || item.verificationStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const fetchGlossary = async () => {
    setIsLoading(true);

    try {
      const { ok, data } = await apiFetch("/glossary");

      if (ok && data.success) {
        setItems(data.data || []);
      } else {
        showError(data?.message || "Gagal mengambil data glosarium.", "Gagal");
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
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setFormData({
      term: item.term || "",
      definition: item.definition || "",
      source_url: item.sourceUrl || "",
      verification_status: item.verificationStatus || "literature_based",
      verified_by: item.verifiedBy || "",
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

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "verification_status" && value !== "verified") {
        next.verified_by = "";
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      term: formData.term.trim(),
      definition: formData.definition.trim(),
      source_url: formData.source_url.trim(),
      verification_status: formData.verification_status.trim(),
      verified_by:
        formData.verification_status === "verified"
          ? formData.verified_by.trim()
          : "",
    };

    if (!payload.term || !payload.definition) {
      showError("Istilah dan definisi wajib diisi.", "Validasi Gagal");
      return;
    }

    if (
      payload.verification_status === "verified" &&
      !payload.verified_by
    ) {
      showError(
        "Nama verifier wajib diisi jika status terverifikasi.",
        "Validasi Gagal"
      );
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
        showError(data?.message || "Gagal menyimpan data glosarium.", "Gagal");
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
        showError(data?.message || "Gagal menghapus data glosarium.", "Gagal");
      }
    } catch {
      showError("Terjadi kesalahan saat menghapus data glosarium.", "Gagal");
    } finally {
      closeDeleteModal();
    }
  };

  const getStatusBadge = (status) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck className="h-3.5 w-3.5" />
          Terverifikasi
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
        <Library className="h-3.5 w-3.5" />
        Literatur Resmi
      </span>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <section className="rounded-3xl border border-[var(--color-admin4)] bg-white p-8 shadow-sm md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#222222] md:text-5xl">
          Manajemen Data Glosarium
        </h1>

        <p className="max-w-4xl text-lg text-[#666666] md:text-xl text-justify">
          Kelola istilah saham, link sumber, dan status verifikasi glosarium.
        </p>
      </section>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari istilah atau definisi..."
              className="w-full rounded-xl border border-[var(--color-admin4)] bg-white py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[var(--color-admin2)] hover:text-[#222222]"
        >
          <Plus size={18} />
          Tambah Istilah
        </button>
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
                Edit link sumber, ubah status, atau hapus istilah.
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
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold leading-snug text-gray-800">
                      {item.term}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(item.verificationStatus)}
                    </div>
                  </div>

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

                <p className="mb-4 leading-relaxed text-gray-600">
                  {item.definition}
                </p>

                <div className="space-y-2 rounded-xl bg-white/80 p-4 text-sm text-gray-600 border border-[var(--color-admin4)]">
                  <p>
                    <span className="font-semibold text-gray-800">Link Sumber:</span>{" "}
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-admin)] underline break-all"
                      >
                        {item.sourceUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>

                  {item.verifiedBy && (
                    <p>
                      <span className="font-semibold text-gray-800">Terverifikasi oleh:</span>{" "}
                      {item.verifiedBy}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-admin4)] bg-[var(--color-admin3)] px-6 py-14 text-center">
            <p className="text-xl font-semibold text-gray-700">
              Data tidak ditemukan
            </p>
            <p className="mt-2 text-gray-500">
              Tidak ada istilah yang cocok dengan filter yang dipilih.
            </p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--color-admin4)] bg-white p-7 shadow-2xl">
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
                    Isi istilah, definisi, link sumber, dan status verifikasi.
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Istilah
                  </label>
                  <input
                    type="text"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    placeholder="Contoh: PER"
                    className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Definisi
                  </label>
                  <textarea
                    name="definition"
                    value={formData.definition}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Masukkan definisi istilah..."
                    className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Link Sumber
                  </label>
                  <input
                    type="text"
                    name="source_url"
                    value={formData.source_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status Verifikasi
                  </label>
                  <select
                    name="verification_status"
                    value={formData.verification_status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.verification_status === "verified" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Terverifikasi oleh
                    </label>
                    <input
                      type="text"
                      name="verified_by"
                      value={formData.verified_by}
                      onChange={handleChange}
                      placeholder="Contoh: Dr. Nama Dosen"
                      className="w-full rounded-xl border border-[var(--color-admin4)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                    />
                  </div>
                )}
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