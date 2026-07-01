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
  ExternalLink,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAppAlert } from "@/components/AppAlert";

const INITIAL_FORM = {
  term: "",
  definition: "",
  source_url: "",
};

function truncateUrl(url, maxLength = 45) {
  if (!url) return "-";

  try {
    const { hostname, pathname } = new URL(url);
    const short = `${hostname}${pathname}`;

    return short.length > maxLength
      ? short.slice(0, maxLength) + "…"
      : short;
  } catch {
    return url.length > maxLength
      ? url.slice(0, maxLength) + "…"
      : url;
  }
}

export default function AdminGlossary() {
  const { showSuccess, showError } = useAppAlert();

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return items.filter(
      (item) =>
        !q ||
        item.term?.toLowerCase().includes(q) ||
        item.definition?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const fetchGlossary = async () => {
    setIsLoading(true);

    try {
      const { ok, data } = await apiFetch("/admin/glossary");

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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      term: formData.term.trim(),
      definition: formData.definition.trim(),
      source_url: formData.source_url.trim(),
    };

    if (!payload.term || !payload.definition) {
      showError("Istilah dan definisi wajib diisi.", "Validasi Gagal");
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
      const { ok, data } = await apiFetch(
        `/admin/glossary/${selectedItem.id}`,
        {
          method: "DELETE",
        }
      );

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">

      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-12">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Manajemen Data Glosarium
        </h1>

        <p className="max-w-4xl text-lg text-muted-foreground">
          Kelola istilah saham, definisi, dan link sumber glosarium.
        </p>
      </section>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <div className="flex-1">
          <div className="relative">

            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari istilah atau definisi..."
              className="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12"
            />

          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white"
        >
          <Plus size={18} />
          Tambah Istilah
        </button>

      </div>

      <section className="rounded-3xl border border-border bg-card shadow-sm">

        <div className="flex flex-col gap-3 border-b border-border px-7 py-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[var(--color-admin)]/15 p-3">
              <Info className="h-5 w-5 text-[var(--color-admin)]" />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Daftar Istilah Glosarium
              </h2>

              <p className="text-sm text-muted-foreground">
                Edit definisi, ubah link sumber, atau hapus istilah.
              </p>
            </div>

          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-admin)] px-5 py-2 text-sm font-semibold text-white">
            <BookOpen className="h-4 w-4" />
            Total: {items.length} istilah
          </div>

        </div>

        {/* Konten tabel */}
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            Memuat data...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted text-left text-sm font-semibold text-muted-foreground">
                  <th className="w-[25%] px-6 py-4">Istilah</th>
                  <th className="w-[45%] px-6 py-4">Definisi</th>
                  <th className="w-[20%] px-6 py-4">Sumber</th>
                  <th className="w-[10%] px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-muted/50"
                  >
                    {/* Istilah */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {item.term}
                      </p>
                    </td>

                    {/* Definisi */}
                    <td className="px-6 py-4">
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {item.definition}
                      </p>
                    </td>

                    {/* Sumber */}
                    <td className="px-6 py-4">
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={item.sourceUrl}
                          className="inline-flex items-center gap-1 text-sm text-[var(--color-admin)] underline underline-offset-4 transition hover:opacity-75"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="max-w-[140px] truncate">
                            {truncateUrl(item.sourceUrl)}
                          </span>
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Edit"
                          className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition hover:border-[var(--color-admin)] hover:text-[var(--color-admin)]"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          title="Hapus"
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-400 transition hover:bg-red-100 hover:text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-b-3xl border-t border-dashed border-border bg-muted/40 px-6 py-16 text-center">
            <p className="text-xl font-semibold text-foreground">
              Data tidak ditemukan
            </p>

            <p className="mt-2 text-muted-foreground">
              Tidak ada istilah yang cocok dengan pencarian.
            </p>
          </div>
        )}
      </section>

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-7 shadow-2xl">

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[var(--color-admin)]/15 p-3">
                  <BookOpen className="h-5 w-5 text-[var(--color-admin)]" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {editingId ? "Edit Istilah" : "Tambah Istilah Baru"}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Isi istilah, definisi, dan link sumber.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Istilah */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Istilah <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  placeholder="Contoh: Price to Earnings Ratio (PER)"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
              </div>

              {/* Definisi */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Definisi <span className="text-red-500">*</span>
                </label>

                <textarea
                  name="definition"
                  value={formData.definition}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Masukkan definisi istilah..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />
              </div>

              {/* Link Sumber */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Link Sumber
                </label>

                <input
                  type="url"
                  name="source_url"
                  value={formData.source_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition focus:border-[var(--color-admin)] focus:outline-none focus:ring-2 focus:ring-[var(--color-admin)]/20"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Masukkan tautan referensi resmi seperti BEI, OJK, IDX, atau sumber
                  literatur terpercaya lainnya.
                </p>
              </div>

              {/* Tombol */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-medium text-foreground transition hover:bg-muted"
                >
                  <X size={18} />
                  Batal
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-admin)] px-5 py-3 font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  <Save size={18} />
                  {editingId ? "Simpan Perubahan" : "Tambah Istilah"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Hapus Istilah?
              </h3>
            </div>

            <p className="mb-6 text-muted-foreground">
              Anda yakin ingin menghapus istilah{" "}
              <span className="font-semibold text-foreground">
                {selectedItem.term}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 rounded-xl border border-border bg-background py-3 font-medium text-foreground transition hover:bg-muted"
              >
                Batal
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 py-3 font-medium text-white transition hover:bg-red-600"
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