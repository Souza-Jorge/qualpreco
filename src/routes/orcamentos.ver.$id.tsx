import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Ban, CheckCircle2, FileDown, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { OrcamentoHeader } from "@/components/OrcamentoEditor";
import {
  carregarOrcamento,
  fmtData,
  fmtNumero,
  mudarStatus,
  subtotalItem,
  type ItemLocal,
  type Orcamento,
} from "@/lib/orcamentos";
import { fmtBRL } from "@/lib/produtos-busca";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/orcamentos/ver/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Detalhes do orçamento — QualPreço" },
      {
        name: "description",
        content: "Veja cliente, itens e valores do orçamento.",
      },
      { property: "og:title", content: "Detalhes do orçamento — QualPreço" },
      {
        property: "og:description",
        content: "Veja cliente, itens e valores do orçamento.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerOrcamentoPage,
});

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{valor}</span>
    </div>
  );
}

function Detalhe({ id }: { id: string }) {
  const navigate = useNavigate();
  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acao, setAcao] = useState<"Finalizado" | "Cancelado" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const gerarPdf = async () => {
    if (!orc || gerandoPdf) return;
    setGerandoPdf(true);
    try {
      const [{ gerarOrcamentoPdf }, { salvarPdf }] = await Promise.all([
        import("@/lib/orcamento-pdf"),
        import("@/lib/salvar-arquivo"),
      ]);
      const { doc, filename } = await gerarOrcamentoPdf(orc, itens);
      const r = await salvarPdf(doc, filename);
      toast.success(
        r.destino === "download"
          ? `PDF gerado: ${filename}`
          : `PDF salvo em Documentos: ${filename}`
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível gerar o PDF.");
    } finally {
      setGerandoPdf(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const r = await carregarOrcamento(id);
        if (!ativo) return;
        if (!r) {
          setErro("Orçamento não encontrado.");
          return;
        }
        setOrc(r.orcamento);
        setItens(r.itens);
      } catch (e: any) {
        if (ativo) setErro(e?.message ?? "Erro ao carregar o orçamento.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id]);

  const confirmar = async () => {
    if (!acao || !orc) return;
    setSalvando(true);
    try {
      await mudarStatus(orc.id, acao);
      setOrc({ ...orc, status: acao });
      setAcao(null);
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível alterar o status.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (erro || !orc) {
    return (
      <Card className="p-6 text-center text-sm text-destructive">
        {erro ?? "Orçamento não encontrado."}
      </Card>
    );
  }

  const rascunho = orc.status === "Rascunho";
  const subtotal = itens.reduce((s, i) => s + subtotalItem(i), 0);

  return (
    <div className="space-y-4 pb-32">
      <Card className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{fmtNumero(orc.numero)}</span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase">
            {orc.status}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">{fmtData(orc.created_at)}</div>
      </Card>

      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold">Cliente</h2>
        <Linha rotulo="Nome" valor={orc.cliente_nome} />
        <Linha rotulo="Empresa" valor={orc.cliente_empresa} />
        <Linha rotulo="CPF/CNPJ" valor={orc.cliente_cpf_cnpj} />
        <Linha rotulo="Telefone" valor={orc.cliente_telefone} />
        <Linha rotulo="E-mail" valor={orc.cliente_email} />
        {!orc.cliente_nome &&
          !orc.cliente_empresa &&
          !orc.cliente_cpf_cnpj &&
          !orc.cliente_telefone &&
          !orc.cliente_email && (
            <p className="text-sm text-muted-foreground">Sem dados de cliente.</p>
          )}
      </Card>

      <div className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">
          Itens ({itens.length})
        </h2>
        {itens.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum item neste orçamento.
          </Card>
        ) : (
          <Card className="divide-y">
            {itens.map((i) => (
              <div key={i.key} className="space-y-1 p-3">
                <div className="text-sm font-medium">{i.produto_nome}</div>
                <div className="text-[11px] text-muted-foreground">
                  #{i.codigo}
                  {i.ean ? ` · ${i.ean}` : ""}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {i.quantidade} × {fmtBRL(i.preco_unitario)}
                  </span>
                  <span className="font-bold text-primary">{fmtBRL(subtotalItem(i))}</span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Card className="space-y-2 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{fmtBRL(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Desconto</span>
          <span className="font-medium">{fmtBRL(Number(orc.desconto))}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">
            {fmtBRL(Number(orc.total))}
          </span>
        </div>
        {orc.observacao && (
          <p className="border-t pt-2 text-sm text-muted-foreground">{orc.observacao}</p>
        )}
      </Card>

      <Button
        variant="outline"
        className="h-14 w-full gap-2 text-base font-semibold"
        onClick={gerarPdf}
        disabled={gerandoPdf}
      >
        {gerandoPdf ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileDown className="h-5 w-5" />
        )}
        Gerar PDF
      </Button>

      {acao && (
        <Card className="space-y-3 border-primary/40 p-4">
          <p className="text-sm font-medium">
            {acao === "Finalizado"
              ? "Finalizar este orçamento? Depois disso ele não poderá mais ser alterado."
              : "Cancelar este orçamento? Depois disso ele não poderá mais ser alterado."}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={confirmar}
              disabled={salvando}
              className="h-12 flex-1 text-base"
            >
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 text-base"
              onClick={() => setAcao(null)}
              disabled={salvando}
            >
              Voltar
            </Button>
          </div>
        </Card>
      )}

      {rascunho && !acao && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-card/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl gap-2 px-4 py-3">
            <Button
              variant="outline"
              className="h-14 flex-1 gap-2 text-base font-semibold"
              onClick={() => navigate({ to: "/orcamentos/$id", params: { id: orc.id } })}
            >
              <Pencil className="h-5 w-5" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="h-14 gap-2 px-4 text-base text-destructive"
              onClick={() => setAcao("Cancelado")}
            >
              <Ban className="h-5 w-5" />
              Cancelar
            </Button>
            <Button
              className="h-14 flex-1 gap-2 text-base font-semibold"
              onClick={() => setAcao("Finalizado")}
            >
              <CheckCircle2 className="h-5 w-5" />
              Finalizar
            </Button>
          </div>
        </div>
      )}

      {!rascunho && (
        <Button asChild variant="outline" className="h-12 w-full text-base">
          <Link to="/orcamentos">Voltar aos orçamentos</Link>
        </Button>
      )}
    </div>
  );
}

function VerOrcamentoPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <OrcamentoHeader titulo="Orçamento" />
      <main className="mx-auto w-full max-w-3xl px-4 py-4">
        <AuthGate>{() => <Detalhe id={id} />}</AuthGate>
      </main>
    </div>
  );
}
