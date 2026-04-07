import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  BadgeCheck,
  FileText,
  Library,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function InvestorGlossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [glossaryItems, setGlossaryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlossary = async () => {
    setIsLoading(true);

    try {
      const { ok, data } = await apiFetch("/glossary");

      if (ok && data.success) {
        setGlossaryItems(data.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlossary();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return glossaryItems.filter((item) => {
      if (!q) return true;

      return (
        item.term?.toLowerCase().includes(q) ||
        item.definition?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.sourceName?.toLowerCase().includes(q)
      );
    });
  }, [glossaryItems, searchQuery]);

  const getStatusBadge = (status) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          <BadgeCheck className="h-3.5 w-3.5" />
          Terverifikasi
        </span>
      );
    }

    if (status === "reviewed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
          <FileText className="h-3.5 w-3.5" />
          Sudah Ditinjau
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
        <Library className="h-3.5 w-3.5" />
        Literatur Resmi
      </span>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 p-8 backdrop-blur-md md:p-12">
        <div className="mb-4 flex items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Glosarium Saham
          </h1>
        </div>

        <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
          Pahami istilah-istilah penting dalam dunia investasi saham dan analisis
          pasar Indonesia.
        </p>
      </div>

      <div className="relative mx-auto max-w-2xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari istilah, kategori, sumber, atau definisi..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-14 pr-4 text-white placeholder-slate-500 transition focus:border-[#4988C4]/60 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">Memuat glosarium...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl border border-slate-800 bg-slate-900/65 p-7 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-900/20"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-cyan-400 transition-colors group-hover:text-cyan-300">
                  {item.term}
                </h3>

                {getStatusBadge(item.verificationStatus)}
              </div>

              {item.category && (
                <div className="mb-4">
                  <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                    {item.category}
                  </span>
                </div>
              )}

              <p className="mb-5 leading-relaxed text-slate-300">
                {item.definition}
              </p>

              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
                <p>
                  <span className="font-semibold text-slate-200">Sumber:</span>{" "}
                  {item.sourceName || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-200">Organisasi:</span>{" "}
                  {item.sourceOrganization || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-200">Tahun:</span>{" "}
                  {item.sourceYear || "-"}
                </p>
                {item.verifiedBy && (
                  <p>
                    <span className="font-semibold text-slate-200">Validator:</span>{" "}
                    {item.verifiedBy}
                    {item.verifierRole ? ` (${item.verifierRole})` : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">
            Tidak menemukan istilah yang sesuai dengan pencarian "{searchQuery}"
          </p>
          <p className="mt-2 text-slate-500">
            Coba gunakan kata kunci lain atau hapus filter pencarian.
          </p>
        </div>
      )}
    </div>
  );
}