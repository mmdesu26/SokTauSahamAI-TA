// GLOSARIUM — halaman dedicated buat daftar istilah saham
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

// helper sederhana buat nentuin definisi termasuk panjang atau tidak
function isLongText(text = "", limit = 160) {
  return String(text).trim().length > limit;
}

export default function Glossary() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await apiFetch("/glossary");
        if (r.ok && r.data?.success) {
          setItems(r.data.data || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter client-side
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();

    if (!s) return items;

    return items.filter(
      (x) =>
        x.term?.toLowerCase().includes(s) ||
        x.definition?.toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <Badge variant="primary" className="mb-3">
          Dasar Pengetahuan
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Glosarium Saham
        </h1>

        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Pahami istilah penting dunia investasi & analisis pasar Indonesia.
        </p>
      </header>

      {/* Search */}
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari istilah atau definisi..."
            className="h-12 pl-11 text-base"
          />
        </div>
      </div>

      {!loading && (
        <p className="text-center text-sm text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {filtered.length}
          </span>{" "}
          istilah
          {q && (
            <>
              {" "}
              untuk{" "}
              <span className="font-semibold text-primary">
                "{q}"
              </span>
            </>
          )}
        </p>
      )}

      {loading ? (
        <Card className="p-12">
          <Spinner label="Memuat glosarium..." />
        </Card>
      ) : filtered.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it) => {
              const open = expanded === it.id;

              const definitionIsLong = isLongText(it.definition);
              const hasSourceLink = Boolean(it.sourceUrl);

              const shouldShowExpandButton =
                definitionIsLong || hasSourceLink;

              return (
                <Card
                  key={it.id}
                  className="flex h-full flex-col p-5 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <div className="mb-3">
                    <h3 className="text-base font-semibold leading-tight">
                      {it.term}
                    </h3>
                  </div>

                  {/* Definisi */}
                  <p
                    className={`text-sm leading-relaxed text-muted-foreground ${
                      open ? "" : "line-clamp-3"
                    }`}
                  >
                    {it.definition}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    {shouldShowExpandButton && (
                      <button
                        onClick={() =>
                          setExpanded(open ? null : it.id)
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                      >
                        {open ? "Tutup" : "Selengkapnya"}

                        {open ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {open && (
                    <div className="mt-3 space-y-2">
                      {it.sourceUrl && (
                        <a
                          href={it.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Buka sumber
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Informasi Verifikasi */}
          <Card className="border-primary/20 bg-primary/5 p-5">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Seluruh istilah pada glosarium telah diverifikasi oleh{" "}
              <span className="font-semibold text-foreground">
                Bapak Vaisal Amir, S.E., M.S.A.
              </span>{" "}
              selaku Dosen Akuntansi Pajak, Lektor, dan Kepala Laboratorium
              Pasar Modal.
            </p>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          Tidak ada istilah yang cocok dengan "{q}".
        </Card>
      )}
    </div>
  );
}