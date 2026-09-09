import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { Produto } from "@/integrations/supabase/client";
import { fmtBRL, precoVigente } from "@/lib/produtos-busca";
import {
  atualizarOrcamento,
  calcTotais,
  carregarOrcamento,
  clienteVazio,
  criarOrcamento,
  fmtQuantidade,
  subtotalItem,
  totalUnidades,
  type ClienteForm,
  type ItemLocal,
  type OrcamentoStatus,
} from "@/lib/orcamentos";

import { BuscaProdutos } from "@/components/BuscaProdutos";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function OrcamentoEditor({
  userId,
  orcamentoId,
}: {
  userId: string;
  orcamentoId?: string;
}) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<ClienteForm>(clienteVazio);
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [descontoTxt, setDescontoTxt] = useState("0");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(!!orcamentoId);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [numero, setNumero] = useState<number | null>(null);
  const [status, setStatus] = useState<OrcamentoStatus>("Rascunho");
  const [mostrarCliente, setMostrarCliente] = useState(false);

  useEffect(() => {
    if (!orcamentoId) return;
    let ativo = true;
    (async () => {
      try {
        const r = await carregarOrcamento(orcamentoId);
        if (!ativo) return;
        if (!r) {
          setErro("Orçamento não encontrado.");
          return;
        }
        const o = r.orcamento;
        setNumero(o.numero);
        setStatus(o.status);
        setCliente({
          cliente_nome: o.cliente_nome ?? "",
          cliente_empresa: o.cliente_empresa ?? "",
          cliente_cpf_cnpj: o.cliente_cpf_cnpj ?? "",
          cliente_telefone: o.cliente_telefone ?? "",
          cliente_email: o.cliente_email ?? "",
          observacao: o.observacao ?? "",
        });
        setItens(r.itens);
        setDescontoTxt(String(Number(o.desconto ?? 0)));
      } catch (e: any) {
        if (ativo) setErro(e?.message ?? "Erro ao carregar o orçamento.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [orcamentoId]);

  const desconto = useMemo(() => {
    const n = parseFloat(descontoTxt.replace(",", "."));
    return isNaN(n) || n < 0 ? 0 : n;
  }, [descontoTxt]);

  const totais = useMemo(() => calcTotais(itens, desconto), [itens, desconto]);

  const bloqueado = status !== "Rascunho";

  const addProduto = (p: Produto) => {
    const { precoFinal } = precoVigente(p);
    const packBruto = Number((p as any).pack);
    const pack =
      Number.isFinite(packBruto) && packBruto > 1 ? Math.round(packBruto) : null;
    setOk(false);
    setItens((prev) => {
      const existente = prev.find((i) => i.product_id === p.codigo);
      if (existente) {
        return prev.map((i) =>
          i.key === existente.key
            ? {
                ...i,
                unidades: i.unidades + 1,
                quantidade: totalUnidades(
                  i.caixas,
                  i.unidades + 1,
                  i.quantidade_por_caixa
                ),
              }
            : i
        );
      }
      return [
        {
          key: `${p.codigo}-${Date.now()}`,
          product_id: p.codigo,
          codigo: String(p.codigo),
          produto_nome: p.name,
          ean: p.barcode,
          quantidade: 1,
          quantidade_por_caixa: pack,
          caixas: 0,
          unidades: 1,
          preco_unitario: precoFinal ?? 0,
        },
        ...prev,
      ];
    });
  };

  const setQtdCampo = (key: string, campo: "caixas" | "unidades", v: string) => {
    const n = parseInt(v.replace(/\D/g, ""), 10);
    const valor = !isNaN(n) && n > 0 ? n : 0;
    setOk(false);
    setItens((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const atualizado = { ...i, [campo]: valor } as typeof i;
        return {
          ...atualizado,
          quantidade: totalUnidades(
            atualizado.caixas,
            atualizado.unidades,
            atualizado.quantidade_por_caixa
          ),
        };
      })
    );
  };

  const remover = (key: string) => {
    setOk(false);
    setItens((prev) => prev.filter((i) => i.key !== key));
  };


  const salvar = async () => {
    if (bloqueado || salvando) return;
    setErro(null);
    setSalvando(true);
    try {
      if (orcamentoId) {
        await atualizarOrcamento(orcamentoId, cliente, itens, totais.desconto);
      } else {
        await criarOrcamento(userId, cliente, itens, totais.desconto);
      }
      setOk(true);
      toast.success("Orçamento salvo com sucesso.");
      navigate({ to: "/orcamentos", replace: true });
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível salvar o orçamento.");
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

  return (
    <div className="space-y-4 pb-28">
      {bloqueado && (
        <Card className="border-destructive/40 p-3 text-sm text-destructive">
          Este orçamento está {status.toLowerCase()} e não pode mais ser editado.
        </Card>
      )}

      {/* Cliente (opcional, recolhido para agilizar o atendimento) */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarCliente((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" />
            Cliente {cliente.cliente_nome ? `· ${cliente.cliente_nome}` : "(opcional)"}
          </span>
          <span className="text-xs text-muted-foreground">
            {mostrarCliente ? "ocultar" : "abrir"}
          </span>
        </button>
        {mostrarCliente && (
          <div className="space-y-2 border-t px-4 py-3">
            {(
              [
                ["cliente_nome", "Nome", "text"],
                ["cliente_empresa", "Empresa", "text"],
                ["cliente_cpf_cnpj", "CPF/CNPJ", "text"],
                ["cliente_telefone", "Telefone", "tel"],
                ["cliente_email", "E-mail", "email"],
              ] as const
            ).map(([campo, label, tipo]) => (
              <Input
                key={campo}
                type={tipo}
                value={cliente[campo]}
                disabled={bloqueado}
                onChange={(e) =>
                  setCliente((c) => ({ ...c, [campo]: e.target.value }))
                }
                placeholder={label}
                className="h-12 text-base"
              />
            ))}
            <Textarea
              value={cliente.observacao}
              disabled={bloqueado}
              onChange={(e) =>
                setCliente((c) => ({ ...c, observacao: e.target.value }))
              }
              placeholder="Observação"
              className="min-h-20 text-base"
            />
          </div>
        )}
      </Card>

      {/* Produtos */}
      {!bloqueado && (
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">
            Adicionar produto
          </h2>
          <BuscaProdutos onSelect={addProduto} />
        </div>
      )}

      {/* Itens */}
      <div className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">
          Itens ({itens.length})
        </h2>
        {itens.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum produto adicionado ainda.
          </Card>
        ) : (
          <Card className="divide-y">
            {itens.map((i) => (
              <div key={i.key} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      <span className="text-muted-foreground">#{i.codigo}</span>{" "}
                      {i.produto_nome}
                      {i.quantidade_por_caixa
                        ? ` · Pack: ${i.quantidade_por_caixa} UN/CX`
                        : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remover(i.key)}
                    disabled={bloqueado}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {i.quantidade_por_caixa ? (
                      <div className="flex items-center gap-1">
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor={`cx-${i.key}`}
                        >
                          CX
                        </label>
                        <Input
                          id={`cx-${i.key}`}
                          value={i.caixas ? String(i.caixas) : ""}
                          disabled={bloqueado}
                          inputMode="numeric"
                          placeholder="0"
                          onChange={(e) =>
                            setQtdCampo(i.key, "caixas", e.target.value)
                          }
                          className="h-11 w-16 text-center text-base"
                          aria-label="Caixas"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <label
                        className="text-xs font-medium text-muted-foreground"
                        htmlFor={`un-${i.key}`}
                      >
                        UN
                      </label>
                      <Input
                        id={`un-${i.key}`}
                        value={i.unidades ? String(i.unidades) : ""}
                        disabled={bloqueado}
                        inputMode="numeric"
                        placeholder="0"
                        onChange={(e) =>
                          setQtdCampo(i.key, "unidades", e.target.value)
                        }
                        className="h-11 w-16 text-center text-base"
                        aria-label="Unidades"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      × {fmtBRL(i.preco_unitario)} / UN
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {fmtQuantidade(i.quantidade, i.quantidade_por_caixa)}
                    </span>
                  </div>
                  <span className="text-base font-bold text-primary">
                    {fmtBRL(subtotalItem(i))}
                  </span>
                </div>
              </div>

            ))}
          </Card>
        )}
      </div>

      {/* Valores */}
      <Card className="space-y-2 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{fmtBRL(totais.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Desconto</span>
          <Input
            value={descontoTxt}
            disabled={bloqueado}
            inputMode="decimal"
            onChange={(e) => {
              setOk(false);
              setDescontoTxt(e.target.value);
            }}
            className="h-11 w-32 text-right text-base"
            aria-label="Desconto"
          />
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">
            {fmtBRL(totais.total)}
          </span>
        </div>
      </Card>

      {erro && (
        <p className="px-1 text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}

      {/* Barra fixa com total e salvar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-muted-foreground">
              {numero ? `Orçamento #${numero} · ${status}` : "Novo orçamento"}
            </div>
            <div className="truncate text-xl font-bold text-primary">
              {fmtBRL(totais.total)}
            </div>
          </div>
          <Button
            onClick={salvar}
            disabled={bloqueado || salvando}
            className="h-14 gap-2 px-6 text-base font-semibold"
          >
            {salvando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : ok ? (
              <Check className="h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {ok ? "Salvo" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OrcamentoHeader({ titulo }: { titulo: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-border/50 bg-primary shadow-md">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 text-primary-foreground">
        <Link
          to="/"
          className="rounded-md p-2 hover:bg-primary-foreground/10"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold md:text-xl">{titulo}</h1>
      </header>
    </div>
  );
}
