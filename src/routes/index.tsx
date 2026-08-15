import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScanLine, Search, X, Loader2, History } from "lucide-react";
import { supabase, toNumber, type Produto } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProdutoCard } from "@/components/ProdutoCard";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Consulta de Preços" },
      {
        name: "description",
        content:
          "Consulta rápida de preços por código, nome ou leitura de código de barras.",
      },
    ],
  }),
  component: Index,
});

const COLUMNS =
  "codigo, name, barcode, unit, pack, stock_quantity, cost_price, sale_price, category_code, category_name, promo_price, promo_start, promo_end, data_validade";

const HIST_KEY = "consulta_historico_v2";

type HistItem = { codigo: number; name: string };

function Index() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Produto[]>([]);
  const [selected, setSelected] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [history, setHistory] = useState<HistItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIST_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!scanOpen && !selected) inputRef.current?.focus();
  }, [scanOpen, selected]);

  // Captura global de leitor de código de barras de mão (USB/Bluetooth).
  // Leitores enviam caracteres muito rápido seguidos de Enter, mesmo sem foco no input.
  const scanBufRef = useRef<string>("");
  const scanLastTsRef = useRef<number>(0);
  useEffect(() => {
    const MAX_INTERKEY_MS = 35;
    const MIN_LENGTH = 4;

    const onKey = (e: KeyboardEvent) => {
      // Ignora se houver dialog aberto (scanner da câmera, etc.)
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target as HTMLElement | null)?.isContentEditable;

      // Se já está digitando no input de busca, deixa o form cuidar
      if (isEditable && target !== inputRef.current) return;

      const now = performance.now();
      const delta = now - scanLastTsRef.current;
      scanLastTsRef.current = now;

      if (e.key === "Enter") {
        const code = scanBufRef.current;
        scanBufRef.current = "";
        if (code.length >= MIN_LENGTH) {
          e.preventDefault();
          setQuery(code);
          runSearch(code);
          inputRef.current?.focus();
        }
        return;
      }

      // Apenas caracteres imprimíveis de 1 char
      if (e.key.length !== 1) {
        scanBufRef.current = "";
        return;
      }

      // Reseta buffer se a tecla anterior foi humana (lenta)
      if (delta > MAX_INTERKEY_MS) {
        scanBufRef.current = "";
      }
      scanBufRef.current += e.key;
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHistory = (p: Produto) => {
    setHistory((prev) => {
      const next: HistItem[] = [
        { codigo: p.codigo, name: p.name },
        ...prev.filter((x) => x.codigo !== p.codigo),
      ].slice(0, 10);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isNumeric = (s: string) => /^\d+$/.test(s.trim());

  const NAME_LIMIT = 100;
  const NUM_LIMIT = 50;

  const reqIdRef = useRef(0);

  const runSearch = async (raw: string) => {
    const q = raw.trim();
    setError(null);
    if (!q) {
      setResults([]);
      setSelected(null);
      return;
    }
    const reqId = ++reqIdRef.current;
    const stale = () => reqId !== reqIdRef.current;
    setLoading(true);
    try {
      if (isNumeric(q)) {
        // Numérico: tenta código exato OU código de barras exato
        const INT4_MAX = 2147483647;
        const asInt = Number(q);
        const fitsInt = Number.isSafeInteger(asInt) && asInt <= INT4_MAX;
        const filter = fitsInt
          ? `codigo.eq.${q},barcode.eq.${q}`
          : `barcode.eq.${q}`;
        const { data, error } = await supabase
          .from("products")
          .select(COLUMNS)
          .or(filter)
          .limit(NUM_LIMIT);
        if (error) throw error;
        const list = (data ?? []) as unknown as Produto[];
        if (list.length === 1) {
          setSelected(list[0]);
          setResults([]);
          pushHistory(list[0]);
        } else if (list.length > 1) {
          setResults(list);
          setSelected(null);
        } else {
          setSelected(null);
          setResults([]);
          setError(`Nenhum produto encontrado com o código "${q}".`);
        }
      } else {
        const { data, error } = await supabase
          .from("products")
          .select(COLUMNS)
          .ilike("name", `%${q}%`)
          .order("name")
          .limit(NAME_LIMIT);

        if (error) throw error;
        const list = (data ?? []) as unknown as Produto[];
        setResults(list);
        setSelected(list.length === 1 ? list[0] : null);
        if (list.length === 1) pushHistory(list[0]);
        if (list.length === 0) setError(`Nenhum produto encontrado para "${q}".`);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erro ao consultar produtos.");
      setResults([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (!q || isNumeric(q)) return;
    const t = setTimeout(() => runSearch(q), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
    inputRef.current?.focus();
  };

  const onScan = (code: string) => {
    setQuery(code);
    runSearch(code);
  };

  const loadFromHistory = (codigo: number) => {
    const s = String(codigo);
    setQuery(s);
    runSearch(s);
  };

  const showResultsList = useMemo(
    () => results.length > 1 && !selected,
    [results, selected]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold md:text-2xl">Consulta de Preços</h1>
          <p className="text-xs opacity-80 md:text-sm">
            Busque por código, nome ou escaneie o código de barras
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <form onSubmit={onSubmit}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Código, nome ou código de barras"
                inputMode="search"
                autoFocus
                className="h-14 pl-11 pr-11 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={clear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Limpar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              onClick={() => setScanOpen(true)}
              className="h-14 w-14 shrink-0 p-0"
              aria-label="Escanear código de barras"
            >
              <ScanLine className="h-6 w-6" />
            </Button>
          </div>
        </form>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Consultando...
          </div>
        )}

        {error && !loading && (
          <Card className="border-destructive bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </Card>
        )}

        {selected && !loading && <ProdutoCard produto={selected} />}

        {showResultsList && !loading && (
          <Card className="max-h-[70vh] divide-y overflow-y-auto">

            {results.map((p) => {
              const preco = toNumber(p.sale_price);
              const promo = toNumber(p.promo_price);
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const promoAtiva =
                promo != null &&
                (!p.promo_end || new Date(p.promo_end).getTime() >= hoje.getTime());
              const precoFinal = promoAtiva ? promo : preco;
              const estoque = p.stock_quantity ?? 0;
              const semEstoque = estoque <= 0;
              const fmt = (v: number | null) =>
                v != null
                  ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "—";
              return (
                <button
                  key={p.codigo}
                  onClick={() => {
                    setSelected(p);
                    pushHistory(p);
                  }}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      {promoAtiva && (
                        <span className="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                          PROMO
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="shrink-0">#{p.codigo}</span>
                      {p.unit && <span className="shrink-0">· {p.unit}</span>}
                      {p.pack != null && <span className="shrink-0">· x{p.pack}</span>}
                      {p.barcode && (
                        <span className="hidden truncate sm:inline">
                          · {p.barcode}
                        </span>
                      )}
                      {p.category_name && (
                        <span className="hidden truncate md:inline">
                          · {p.category_name}
                        </span>
                      )}
                      <span
                        className={`ml-auto shrink-0 font-medium ${
                          semEstoque ? "text-destructive" : "text-success"
                        }`}
                      >
                        {semEstoque ? "Sem estoque" : `Est. ${estoque}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end leading-tight">
                    <span
                      className={`text-base font-bold ${
                        promoAtiva ? "text-success" : "text-primary"
                      }`}
                    >
                      {fmt(precoFinal)}
                    </span>
                    {promoAtiva && preco != null && (
                      <span className="text-[11px] text-muted-foreground line-through">
                        {fmt(preco)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {results.length >= 100 && (
              <div className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                Mostrando os primeiros 100 — refine a busca para ver mais.
              </div>
            )}
          </Card>
        )}


        {!query && !loading && history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="h-4 w-4" />
              Consultas recentes
            </div>
            <Card className="divide-y overflow-hidden">
              {history.map((h) => (
                <button
                  key={h.codigo}
                  onClick={() => loadFromHistory(h.codigo)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 truncate text-sm">{h.name}</div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {h.codigo}
                  </div>
                </button>
              ))}
            </Card>
          </div>
        )}
      </main>

      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={onScan}
      />
    </div>
  );
}
