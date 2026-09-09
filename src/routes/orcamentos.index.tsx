import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus, Search, FileText } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { MODO_TESTE_SEM_LOGIN } from "@/lib/modo-teste";
import { OrcamentoHeader } from "@/components/OrcamentoEditor";
import {
  fmtData,
  fmtNumero,
  listarOrcamentos,
  type Orcamento,
  type OrcamentoStatus,
} from "@/lib/orcamentos";
import { fmtBRL } from "@/lib/produtos-busca";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/orcamentos/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Orçamentos — QualPreço" },
      {
        name: "description",
        content: "Histórico dos seus orçamentos com busca por número, cliente e status.",
      },
      { property: "og:title", content: "Orçamentos — QualPreço" },
      {
        property: "og:description",
        content: "Consulte, finalize ou cancele seus orçamentos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrcamentosPage,
});

const FILTROS: Array<"Todos" | OrcamentoStatus> = [
  "Todos",
  "Rascunho",
  "Finalizado",
  "Cancelado",
];

const corStatus = (s: OrcamentoStatus) =>
  s === "Finalizado"
    ? "bg-primary/10 text-primary"
    : s === "Cancelado"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";

function Lista({ userId }: { userId: string }) {
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"Todos" | OrcamentoStatus>("Todos");

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const r = await listarOrcamentos(userId);
        if (ativo) setLista(r);
      } catch (e: any) {
        if (ativo) setErro(e?.message ?? "Não foi possível carregar os orçamentos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [userId]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase().replace(/^#/, "");
    return lista.filter((o) => {
      if (status !== "Todos" && o.status !== status) return false;
      if (!q) return true;
      const numero = String(o.numero);
      return (
        numero.includes(q) ||
        fmtNumero(o.numero).toLowerCase().includes(q) ||
        (o.cliente_nome ?? "").toLowerCase().includes(q) ||
        (o.cliente_empresa ?? "").toLowerCase().includes(q)
      );
    });
  }, [lista, busca, status]);

  return (
    <div className="space-y-3 pb-24">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número, cliente ou empresa"
          className="h-12 pl-11 text-base text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            variant={status === f ? "default" : "outline"}
            className="h-10 rounded-full px-4"
            onClick={() => setStatus(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {carregando ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : erro ? (
        <p className="px-1 text-sm text-destructive" role="alert">
          {erro}
        </p>
      ) : filtrados.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
          <FileText className="h-8 w-8 opacity-50" />
          {lista.length === 0
            ? "Você ainda não criou nenhum orçamento."
            : "Nenhum orçamento encontrado com esses filtros."}
        </Card>
      ) : (
        <Card className="divide-y">
          {filtrados.map((o) => (
            <Link
              key={o.id}
              to="/orcamentos/ver/$id"
              params={{ id: o.id }}
              className="flex items-center gap-3 p-3 active:bg-muted/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{fmtNumero(o.numero)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${corStatus(o.status)}`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="truncate text-sm">
                  {o.cliente_nome || o.cliente_empresa || "Sem cliente"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {fmtData(o.created_at)}
                </div>
              </div>
              <span className="shrink-0 text-base font-bold text-primary">
                {fmtBRL(Number(o.total))}
              </span>
            </Link>
          ))}
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-card/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <Button asChild className="h-14 w-full gap-2 text-base font-semibold">
            <Link to="/orcamentos/novo">
              <Plus className="h-5 w-5" />
              Novo orçamento
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrcamentosPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <OrcamentoHeader titulo="Orçamentos" />
      <main className="mx-auto w-full max-w-3xl px-4 py-4">
        {MODO_TESTE_SEM_LOGIN && (
          <p className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            Modo de teste — acesso sem login
          </p>
        )}
        <AuthGate>{(userId) => <Lista userId={userId} />}</AuthGate>
      </main>
    </div>
  );
}
