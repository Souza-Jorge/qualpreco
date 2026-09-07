import { useEffect, useRef, useState } from "react";
import { Loader2, ScanLine, Search, X } from "lucide-react";
import type { Produto } from "@/integrations/supabase/client";
import {
  buscarProdutos,
  fmtBRL,
  getFriendlyError,
  precoVigente,
} from "@/lib/produtos-busca";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/BarcodeScanner";

// Campo de busca reutilizável (código, nome, EAN e scanner) usando a mesma
// lógica da Consulta de Preços (src/lib/produtos-busca.ts).
export function BuscaProdutos({
  onSelect,
  placeholder = "Código, nome ou código de barras",
}: {
  onSelect: (p: Produto) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const reqIdRef = useRef(0);

  const rodar = async (raw: string) => {
    const q = raw.trim();
    setErro(null);
    if (!q) {
      setResults([]);
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const list = await buscarProdutos(q);
      if (reqId !== reqIdRef.current) return;
      setResults(list);
      if (list.length === 0) setErro(`Nenhum produto encontrado para "${q}".`);
    } catch (e: any) {
      if (reqId !== reqIdRef.current) return;
      setErro(getFriendlyError(e));
      setResults([]);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setErro(null);
      return;
    }
    const t = setTimeout(() => rodar(q), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const escolher = (p: Produto) => {
    onSelect(p);
    setQuery("");
    setResults([]);
    setErro(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            inputMode="search"
            enterKeyHint="search"
            className="h-14 pl-11 pr-11 text-base text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-accent"
              aria-label="Limpar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setScanOpen(true)}
          className="h-14 shrink-0 gap-2 px-4 text-base font-semibold"
          aria-label="Escanear código de barras"
        >
          <ScanLine className="h-6 w-6" />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Consultando...
        </div>
      )}

      {erro && !loading && (
        <p className="px-1 text-sm text-muted-foreground">{erro}</p>
      )}

      {results.length > 0 && !loading && (
        <Card className="max-h-[45vh] divide-y overflow-y-auto">
          {results.map((p) => {
            const { precoFinal, promoAtiva } = precoVigente(p);
            return (
              <button
                key={p.codigo}
                type="button"
                onClick={() => escolher(p)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent active:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-0.5 flex gap-2 text-[11px] text-muted-foreground">
                    <span>#{p.codigo}</span>
                    {p.barcode && <span className="truncate">· {p.barcode}</span>}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-base font-bold ${
                    promoAtiva ? "text-success" : "text-primary"
                  }`}
                >
                  {fmtBRL(precoFinal)}
                </span>
              </button>
            );
          })}
        </Card>
      )}

      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(code) => {
          setScanOpen(false);
          setQuery(code);
          rodar(code);
        }}
      />
    </div>
  );
}
