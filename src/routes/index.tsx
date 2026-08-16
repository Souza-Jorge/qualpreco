import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScanLine,
  Search,
  X,
  Loader2,
  History,
  SearchX,
  RotateCcw,
  Percent,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

// Datas vêm como "YYYY-MM-DD" (date-only). Monta a data local para evitar o
// bug de new Date() que interpreta como meia-noite UTC (dia anterior em UTC-3).
const fmtDateList = (d: string | null) => {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  const date = new Date(y, m - 1, day);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR");
};

type HistItem = { codigo: number; name: string };

function Index() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Produto[]>([]);
  const [selected, setSelected] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [history, setHistory] = useState<HistItem[]>([]);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const onlyPromoRef = useRef(false);
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
      ].slice(0, 5);
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

  // Divide o termo em palavras: todas precisam aparecer no nome (AND)
  const tokenize = (q: string) => {
    const parts = q.split(/\s+/).filter(Boolean);
    const big = parts.filter((p) => p.length > 1);
    return (big.length > 0 ? big : parts).slice(0, 5);
  };

  const buscarPorNome = async (q: string) => {
    let qb = supabase.from("products").select(COLUMNS);
    if (onlyPromoRef.current) {
      const todayStr = new Date().toLocaleDateString("en-CA");
      qb = qb
        .not("promo_price", "is", null)
        .or(`promo_end.is.null,promo_end.gte.${todayStr}`);
    }
    for (const t of tokenize(q)) qb = qb.ilike("name", `%${t}%`);
    const { data, error } = await qb.order("name").limit(NAME_LIMIT);
    if (error) throw error;
    return (data ?? []) as unknown as Produto[];
  };

  const listarPromocoes = async () => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .not("promo_price", "is", null)
      .or(`promo_end.is.null,promo_end.gte.${todayStr}`)
      .order("name")
      .limit(NAME_LIMIT);
    if (error) throw error;
    return (data ?? []) as unknown as Produto[];
  };


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
        let numQb = supabase
          .from("products")
          .select(COLUMNS)
          .or(filter)
          .limit(NUM_LIMIT);
        if (onlyPromoRef.current) {
          const todayStr = new Date().toLocaleDateString("en-CA");
          numQb = numQb
            .not("promo_price", "is", null)
            .or(`promo_end.is.null,promo_end.gte.${todayStr}`);
        }
        const { data, error } = await numQb;
        if (error) throw error;
        if (stale()) return;
        let list = (data ?? []) as unknown as Produto[];
        if (list.length === 0) {
          // Sem correspondência exata: busca parcial por nome ou código de barras
          const [porNome, porBarcode] = await Promise.all([
            buscarPorNome(q),
            (async () => {
              let bqb = supabase
                .from("products")
                .select(COLUMNS)
                .ilike("barcode", `%${q}%`)
                .limit(NAME_LIMIT);
              if (onlyPromoRef.current) {
                const todayStr = new Date().toLocaleDateString("en-CA");
                bqb = bqb
                  .not("promo_price", "is", null)
                  .or(`promo_end.is.null,promo_end.gte.${todayStr}`);
              }
              return bqb;
            })(),
          ]);
          if (porBarcode.error) throw porBarcode.error;
          if (stale()) return;
          const extras = (porBarcode.data ?? []) as unknown as Produto[];
          const mapa = new Map<number, Produto>();
          for (const p of [...porNome, ...extras]) mapa.set(p.codigo, p);
          list = [...mapa.values()];
        }

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
          setError(onlyPromoRef.current
            ? `Nenhum produto em oferta encontrado com o código "${q}".`
            : `Nenhum produto encontrado com o código "${q}".`);
        }
      } else {
        const list = await buscarPorNome(q);
        if (stale()) return;
        setResults(list);
        setSelected(list.length === 1 ? list[0] : null);
        if (list.length === 1) pushHistory(list[0]);
        if (list.length === 0) setError(onlyPromoRef.current
          ? `Nenhum produto em oferta encontrado para "${q}".`
          : `Nenhum produto encontrado para "${q}".`);
      }
    } catch (e: any) {
      if (stale()) return;
      console.error(e);
      setError(e?.message ?? "Erro ao consultar produtos.");
      setResults([]);
      setSelected(null);
    } finally {
      if (!stale()) setLoading(false);
    }
  };

  const togglePromo = () => {
    const next = !onlyPromo;
    onlyPromoRef.current = next;
    setOnlyPromo(next);
    const q = query.trim();
    if (next) {
      // Ativando: se há query, re-busca com filtro; senão lista todas as ofertas
      if (q.length >= 2) runSearch(q);
      else runListarPromocoes();
    } else {
      // Desativando: se há query, re-busca sem filtro; senão limpa
      if (q.length >= 2) runSearch(q);
      else {
        setResults([]);
        setSelected(null);
        setError(null);
      }
    }
  };

  const runListarPromocoes = async () => {
    const reqId = ++reqIdRef.current;
    const stale = () => reqId !== reqIdRef.current;
    setError(null);
    setSelected(null);
    setLoading(true);
    try {
      const list = await listarPromocoes();
      if (stale()) return;
      setResults(list);
      if (list.length === 0) setError("Nenhum produto em oferta no momento.");
    } catch (e: any) {
      if (stale()) return;
      console.error(e);
      setError(e?.message ?? "Erro ao listar promoções.");
      setResults([]);
    } finally {
      if (!stale()) setLoading(false);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
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
    setSelected(null);
    setError(null);
    if (onlyPromoRef.current) {
      runListarPromocoes();
    } else {
      setResults([]);
      inputRef.current?.focus();
    }
  };

  // Esc no desktop = nova consulta
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || scanOpen) return;
      if (!query && !selected && results.length === 0) return;
      clear();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected, results.length, scanOpen]);

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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="sticky top-0 z-30 border-b border-border/50 bg-primary shadow-md">
        <header className="mx-auto w-full max-w-3xl px-4 pb-3 pt-4 text-primary-foreground">
          <h1 className="text-xl font-bold leading-tight md:text-2xl">
            Consulta de Preços
          </h1>
          <p className="text-xs opacity-80 md:text-sm">
            Busque por código, nome ou escaneie o código de barras
          </p>

          <form onSubmit={onSubmit} className="mt-3">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Código, nome ou código de barras"
                  inputMode="search"
                  enterKeyHint="search"
                  autoFocus
                  className="h-14 border-0 bg-background pl-11 pr-11 text-base text-foreground shadow-sm placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clear}
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
                <span className="hidden min-[380px]:inline">Escanear</span>
              </Button>
            </div>
          </form>

          <button
            type="button"
            onClick={togglePromo}
            className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
              onlyPromo
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 ring-1 ring-primary-foreground/30"
            }`}
            aria-pressed={onlyPromo}
          >
            <Percent className="h-4 w-4" />
            Apenas ofertas
          </button>
        </header>
      </div>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        {loading && (
          <Card className="space-y-4 p-4" aria-busy="true">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando...
            </div>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-14 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        )}

        {error && !loading && (
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">
              Confira o código digitado, tente parte do nome do produto ou use o
              leitor de código de barras.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={clear}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Nova consulta
              </Button>
              <Button size="sm" onClick={() => setScanOpen(true)}>
                <ScanLine className="mr-2 h-4 w-4" />
                Escanear
              </Button>
            </div>
          </Card>
        )}

        {selected && !loading && (
          <div className="space-y-3">
            <ProdutoCard produto={selected} />
            <Button
              variant="outline"
              onClick={clear}
              className="h-12 w-full text-base"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova consulta
            </Button>
          </div>
        )}

        {showResultsList && !loading && (
          <Card className="max-h-[70vh] divide-y overflow-y-auto">
            <div className="sticky top-0 z-10 bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              {results.length} {onlyPromo ? "produtos em oferta" : "produtos encontrados"}
            </div>
            {results.map((p) => {
              const preco = toNumber(p.sale_price);
              const promo = toNumber(p.promo_price);
              const todayStr = new Date().toLocaleDateString("en-CA");
              const promoAtiva =
                promo != null && (!p.promo_end || p.promo_end >= todayStr);
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
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent active:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {promoAtiva && (
                        <span className="shrink-0 text-[10px] font-medium text-destructive">
                          {p.promo_end
                            ? `até ${fmtDateList(p.promo_end)}`
                            : "Oferta sem prazo"}
                        </span>
                      )}
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


        {!query && !loading && history.length === 0 && (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Comece uma consulta</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Digite o código, parte do nome do produto ou toque em Escanear para
              ler o código de barras com a câmera.
            </p>
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
