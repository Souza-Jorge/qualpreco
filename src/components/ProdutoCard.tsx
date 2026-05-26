import type { Produto } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Tag } from "lucide-react";

const brl = (v: number | null | undefined) =>
  v == null
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR");
};

const daysUntil = (d: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
};

export function ProdutoCard({ produto }: { produto: Produto }) {
  const promoAtiva =
    produto.preco_promocional != null &&
    (!produto.data_fim_promocao ||
      new Date(produto.data_fim_promocao).getTime() >= Date.now() - 86400000);

  const precoFinal = promoAtiva ? produto.preco_promocional! : produto.preco_venda;

  const diasValidade = daysUntil(produto.data_validade);
  const validadeVencida = diasValidade != null && diasValidade < 0;
  const validadeProxima = diasValidade != null && diasValidade >= 0 && diasValidade <= 30;

  const semEstoque = (produto.estoque ?? 0) <= 0;

  return (
    <Card className="overflow-hidden border-2">
      <div className="bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs uppercase opacity-80">
          <Tag className="h-3.5 w-3.5" />
          Código {produto.codigo}
        </div>
        <h2 className="mt-1 text-xl font-bold leading-tight md:text-2xl">
          {produto.nome}
        </h2>
      </div>

      <div className="space-y-4 p-4">
        {/* Preço destaque */}
        <div className="rounded-lg bg-accent p-4">
          {promoAtiva && (
            <Badge className="mb-2 bg-destructive text-destructive-foreground hover:bg-destructive">
              PROMOÇÃO
              {produto.data_fim_promocao &&
                ` até ${fmtDate(produto.data_fim_promocao)}`}
            </Badge>
          )}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className={`text-4xl font-bold md:text-5xl ${
                promoAtiva ? "text-success" : "text-primary"
              }`}
            >
              {brl(precoFinal)}
            </span>
            {promoAtiva && produto.preco_venda != null && (
              <span className="text-lg text-muted-foreground line-through">
                {brl(produto.preco_venda)}
              </span>
            )}
          </div>
        </div>

        {/* Estoque / Validade */}
        <div className="flex flex-wrap gap-2">
          <Badge
            className={
              semEstoque
                ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                : "bg-success text-success-foreground hover:bg-success"
            }
          >
            <Package className="mr-1 h-3.5 w-3.5" />
            {semEstoque ? "Sem estoque" : `Estoque: ${produto.estoque}`}
          </Badge>

          {produto.data_validade && (
            <Badge
              className={
                validadeVencida
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                  : validadeProxima
                    ? "bg-warning text-warning-foreground hover:bg-warning"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary"
              }
            >
              {(validadeVencida || validadeProxima) && (
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              )}
              {validadeVencida
                ? `Vencido em ${fmtDate(produto.data_validade)}`
                : `Validade: ${fmtDate(produto.data_validade)}`}
            </Badge>
          )}
        </div>

        {/* Detalhes */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-sm sm:grid-cols-3">
          {produto.emb && (
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Emb.</dt>
              <dd className="font-medium">{produto.emb}</dd>
            </div>
          )}
          {produto.pack != null && (
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Pack</dt>
              <dd className="font-medium">{produto.pack}</dd>
            </div>
          )}
          {produto.preco_custo != null && (
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Custo</dt>
              <dd className="font-medium">{brl(produto.preco_custo)}</dd>
            </div>
          )}
        </dl>
      </div>
    </Card>
  );
}
