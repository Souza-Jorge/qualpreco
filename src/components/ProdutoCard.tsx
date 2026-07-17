import { toNumber, type Produto } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Tag, Barcode } from "lucide-react";

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
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

export function ProdutoCard({ produto }: { produto: Produto }) {
  const precoVenda = toNumber(produto.sale_price);
  const precoPromo = toNumber(produto.promo_price);
  const precoCusto = toNumber(produto.cost_price);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const promoAtiva =
    precoPromo != null &&
    (!produto.promo_end || new Date(produto.promo_end).getTime() >= hoje.getTime());

  const precoFinal = promoAtiva ? precoPromo : precoVenda;

  const diasValidade = daysUntil(produto.data_validade);
  const validadeVencida = diasValidade != null && diasValidade < 0;
  const validadeProxima = diasValidade != null && diasValidade >= 0 && diasValidade <= 30;

  const estoque = produto.stock_quantity ?? 0;
  const semEstoque = estoque <= 0;

  return (
    <Card className="overflow-hidden border-2">
      <div className="bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase opacity-90">
          <span className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" /> Cód. {produto.codigo}
          </span>
          {produto.barcode && (
            <span className="flex items-center gap-1">
              <Barcode className="h-3.5 w-3.5" /> {produto.barcode}
            </span>
          )}
          {produto.category_name && (
            <span className="opacity-80">{produto.category_name}</span>
          )}
        </div>
        <h2 className="mt-1 text-xl font-bold leading-tight md:text-2xl">
          {produto.name}
        </h2>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-lg bg-accent p-4">
          {promoAtiva && (
            <Badge className="mb-2 bg-destructive text-destructive-foreground hover:bg-destructive">
              PROMOÇÃO
              {produto.promo_end && ` até ${fmtDate(produto.promo_end)}`}
            </Badge>
          )}
          <div className="flex flex-wrap items-baseline gap-3">
            <span
              className={`text-4xl font-bold md:text-5xl ${
                promoAtiva ? "text-success" : "text-primary"
              }`}
            >
              {brl(precoFinal)}
            </span>
            {promoAtiva && precoVenda != null && (
              <span className="text-lg text-muted-foreground line-through">
                {brl(precoVenda)}
              </span>
            )}
          </div>

          {(produto.unit || produto.pack != null || precoCusto != null) && (
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/40 pt-3">
              {produto.unit && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Emb.
                  </dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {produto.unit}
                  </dd>
                </div>
              )}
              {produto.pack != null && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Pack
                  </dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {produto.pack}
                  </dd>
                </div>
              )}
              {precoCusto != null && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Custo
                  </dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {brl(precoCusto)}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            className={
              semEstoque
                ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                : "bg-success text-success-foreground hover:bg-success"
            }
          >
            <Package className="mr-1 h-3.5 w-3.5" />
            {semEstoque ? "Sem estoque" : `Estoque: ${estoque}`}
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
      </div>

    </Card>
  );
}
