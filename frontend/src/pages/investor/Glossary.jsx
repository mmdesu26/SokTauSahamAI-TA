import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BadgeCheck,
  Library,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function InvestorGlossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [glossaryItems, setGlossaryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
        item.verifiedBy?.toLowerCase().includes(q)
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

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
        <Library className="h-3.5 w-3.5" />
        Berbasis Literatur Resmi
      </span>
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      {/* Header */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/30 p-8 backdrop-blur-md md:p-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Glosarium Saham
        </h1>
        <p className="max-w-3xl text-lg text-slate-300 md:text-xl">
          Pahami istilah-istilah penting dalam dunia investasi saham dan
          analisis pasar Indonesia.
        </p>
      </div>

      {/* Search */}
      <div className="relative mx-auto max-w-2xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari istilah atau definisi..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-14 pr-4 text-white placeholder-slate-500 transition focus:border-[#4988C4]/60 focus:outline-none"
        />
      </div>

      {/* Jumlah hasil */}
      {!isLoading && (
        <p className="text-sm text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-300">{filtered.length}</span>{" "}
          istilah
          {searchQuery && (
            <>
              {" "}
              untuk kata kunci{" "}
              <span className="font-semibold text-cyan-400">
                &quot;{searchQuery}&quot;
              </span>
            </>
          )}
        </p>
      )}

      {/* Konten */}
      {isLoading ? (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">Memuat glosarium...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="group flex flex-col rounded-3xl border border-slate-800 bg-slate-900/65 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-900/20"
              >
                {/* Card body - fixed area */}
                <div className="flex flex-1 flex-col p-6">
                  {/* Term + Badge */}
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-cyan-400 transition-colors group-hover:text-cyan-300">
                      {item.term}
                    </h3>
                    {getStatusBadge(item.verificationStatus)}
                  </div>

                  {/* Definisi: clamp default, expand kalau diklik */}
                  <p
                    className={`text-sm leading-relaxed text-slate-300 transition-all duration-300 ${
                      isExpanded ? "" : "line-clamp-4"
                    }`}
                  >
                    {item.definition}
                  </p>

                  {/* Tombol baca selengkapnya */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                  >
                    {isExpanded ? (
                      <>
                        Sembunyikan <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Baca selengkapnya <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Footer info */}
                <div className="space-y-2 rounded-b-3xl border-t border-slate-800 bg-slate-950/50 px-6 py-4 text-xs text-slate-400">
                  {item.verifiedBy && (
                    <p>
                      <span className="font-semibold text-slate-300">
                        Terverifikasi oleh:
                      </span>{" "}
                      {item.verifiedBy}
                    </p>
                  )}

                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-cyan-400 underline underline-offset-4 transition hover:text-cyan-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      Lihat sumber
                    </a>
                  ) : (
                    <p className="text-slate-600">Tidak ada sumber</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">
            Tidak menemukan istilah yang sesuai dengan pencarian &quot;
            {searchQuery}&quot;
          </p>
          <p className="mt-2 text-slate-500">Coba gunakan kata kunci lain.</p>
        </div>
      )}
    </div>
  );
}