import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScanLine, Search, X, Loader2, History } from "lucide-react";
import { supabase, type Produto } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProdutoCard } from "@/components/ProdutoCard";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Consulta de Preços" },
      { name: "description", content: "Consulta rápida de preços por código, nome ou leitura de código de barras." },
    ],
  }),
  component: Index,
});

const COLUMNS =
  "codigo, nome, emb, pack, estoque, preco_custo, preco_venda, preco_promocional, data_fim_promocao, data_validade";

const HIST_KEY = "consulta_historico_v1";

function Index() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Produto[]>([]);
  const [selected, setSelected] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [history, setHistory] = useState<{ codigo: string; nome: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega histórico
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIST_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Mantém input em foco (compatível com leitor USB)
  useEffect(() => {
    if (!scanOpen && !selected) inputRef.current?.focus();
  }, [scanOpen, selected]);

  const pushHistory = (p: Produto) => {
    setHistory((prev) => {
      const next = [
        { codigo: p.codigo, nome: p.nome },
        ...prev.filter((x) => x.codigo !== p.codigo),
      ].slice(0, 10);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isNumeric = (s: string) => /^\d+$/.test(s.trim());

  const runSearch = async (raw: string) => {
    const q = raw.trim();
    setError(null);
    if (!q) {
      setResults([]);
      setSelected(null);
      return;
    }
    setLoading(true);
    try {
      if (isNumeric(q)) {
        const { data, error } = await supabase
          .from("produto")
          .select(COLUMNS)
          .eq("codigo", q)
          .limit(1);
        if (error) throw error;
        const item = (data?.[0] as Produto | undefined) ?? null;
        if (item) {
          setSelected(item);
          setResults([]);
          pushHistory(item);
        } else {
          setSelected(null);
          setResults([]);
          setError(`Nenhum produto encontrado com o código ${q}.`);
        }
      } else {
        const { data, error } = await supabase
          .from("produto")
          .select(COLUMNS)
          .ilike("nome", `%${q}%`)
          .order("nome")
          .limit(20);
        if (error) throw error;
        const list = (data ?? []) as Produto[];
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

  // Debounce para busca por texto
  useEffect(() => {
    const q = query.trim();
    if (!q || isNumeric(q)) return; // numérico só busca no Enter
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

  const loadFromHistory = (codigo: string) => {
    setQuery(codigo);
    runSearch(codigo);
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

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
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
          <Card className="divide-y overflow-hidden">
            {results.map((p) => (
              <button
                key={p.codigo}
                onClick={() => {
                  setSelected(p);
                  pushHistory(p);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Cód. {p.codigo}
                  </div>
                </div>
                <div className="shrink-0 font-semibold text-primary">
                  {p.preco_venda != null
                    ? p.preco_venda.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "—"}
                </div>
              </button>
            ))}
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
                  <div className="min-w-0 truncate text-sm">{h.nome}</div>
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
