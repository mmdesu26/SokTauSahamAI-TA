import { useEffect, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function InvestorGlossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [glossaryItems, setGlossaryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlossary = async () => {
    setIsLoading(true);

    const { ok, data } = await apiFetch("/glossary");

    if (ok && data.success) {
      setGlossaryItems(data.data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchGlossary();
  }, []);

  const filtered = glossaryItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q)
    );
  });

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
          pasar Indonesia
        </p>
      </div>

      <div className="relative mx-auto max-w-2xl">
        <Search className="pointer-events-none absolute top-1/2 left-5 h-6 w-6 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari istilah, singkatan, atau definisi..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-3 pl-15 pr-4 text-white placeholder-slate-500 transition focus:border-[#4988C4]/60 focus:outline-none"        />
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
              <h3 className="mb-4 text-xl font-semibold text-cyan-400 transition-colors group-hover:text-cyan-300">
                {item.term}
              </h3>
              <p className="leading-relaxed text-slate-300">{item.definition}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl text-slate-400">
            Tidak menemukan istilah yang sesuai dengan pencarian "{searchQuery}"
          </p>
          <p className="mt-2 text-slate-500">
            Coba gunakan kata kunci lain atau hapus filter pencarian
          </p>
        </div>
      )}
    </div>
  );
}