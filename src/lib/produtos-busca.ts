import { supabase, toNumber, type Produto } from "@/integrations/supabase/client";

// Lógica única de busca de produtos, compartilhada pela Consulta de Preços
// e pelo módulo de Orçamentos. Não duplicar em outros lugares.

export const COLUMNS =
  "codigo, name, barcode, unit, pack, stock_quantity, cost_price, sale_price, category_code, category_name, promo_price, promo_start, promo_end, data_validade";

export const NAME_LIMIT = 100;
export const NUM_LIMIT = 50;

export const hojeStr = () => new Date().toLocaleDateString("en-CA");

export const isNumeric = (s: string) => /^\d+$/.test(s.trim());

// Divide o termo em palavras: todas precisam aparecer no nome (AND)
export const tokenize = (q: string) => {
  const parts = q.split(/\s+/).filter(Boolean);
  const big = parts.filter((p) => p.length > 1);
  return (big.length > 0 ? big : parts).slice(0, 5);
};

const aplicarPromo = (qb: any) => {
  const todayStr = hojeStr();
  return qb
    .not("promo_price", "is", null)
    .not("promo_end", "is", null)
    .gte("promo_end", todayStr);
};

export type BuscaOpts = { onlyPromo?: boolean };

export const buscarPorNome = async (q: string, opts: BuscaOpts = {}) => {
  let qb: any = supabase.from("products").select(COLUMNS);
  if (opts.onlyPromo) qb = aplicarPromo(qb);
  for (const t of tokenize(q)) qb = qb.ilike("name", `%${t}%`);
  const { data, error } = await qb.order("name").limit(NAME_LIMIT);
  if (error) throw error;
  return (data ?? []) as unknown as Produto[];
};

export const listarPromocoes = async () => {
  const { data, error } = await aplicarPromo(
    supabase.from("products").select(COLUMNS)
  )
    .order("name")
    .limit(NAME_LIMIT);
  if (error) throw error;
  return (data ?? []) as unknown as Produto[];
};

// Busca completa: numérico (código/EAN exato, depois parcial) ou por nome.
export const buscarProdutos = async (
  raw: string,
  opts: BuscaOpts = {}
): Promise<Produto[]> => {
  const q = raw.trim();
  if (!q) return [];

  if (!isNumeric(q)) return buscarPorNome(q, opts);

  const INT4_MAX = 2147483647;
  const asInt = Number(q);
  const fitsInt = Number.isSafeInteger(asInt) && asInt <= INT4_MAX;
  const filter = fitsInt ? `codigo.eq.${q},barcode.eq.${q}` : `barcode.eq.${q}`;

  let numQb: any = supabase.from("products").select(COLUMNS).or(filter).limit(NUM_LIMIT);
  if (opts.onlyPromo) numQb = aplicarPromo(numQb);
  const { data, error } = await numQb;
  if (error) throw error;

  let list = (data ?? []) as unknown as Produto[];
  if (list.length > 0) return list;

  // Sem correspondência exata: parcial por nome ou por código de barras
  const [porNome, porBarcode] = await Promise.all([
    buscarPorNome(q, opts),
    (async () => {
      let bqb: any = supabase
        .from("products")
        .select(COLUMNS)
        .ilike("barcode", `%${q}%`)
        .limit(NAME_LIMIT);
      if (opts.onlyPromo) bqb = aplicarPromo(bqb);
      return bqb;
    })(),
  ]);
  if (porBarcode.error) throw porBarcode.error;
  const extras = (porBarcode.data ?? []) as unknown as Produto[];
  const mapa = new Map<number, Produto>();
  for (const p of [...porNome, ...extras]) mapa.set(p.codigo, p);
  return [...mapa.values()];
};

export const getFriendlyError = (e: any, context: "search" | "promo" = "search") => {
  const message = String(e?.message ?? e ?? "").toLowerCase();
  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("networkerror") ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return "Sem conexão com a internet. Verifique sua conexão e tente novamente.";
  }
  return context === "promo"
    ? e?.message ?? "Erro ao listar promoções."
    : e?.message ?? "Erro ao consultar produtos.";
};

// Preço vigente do produto (considera promoção ativa)
export const precoVigente = (p: Produto) => {
  const preco = toNumber(p.sale_price);
  const promo = toNumber(p.promo_price);
  const promoAtiva =
    promo != null && p.promo_end != null && p.promo_end >= hojeStr();
  return { preco, promo, promoAtiva, precoFinal: promoAtiva ? promo : preco };
};

export const fmtBRL = (v: number | null | undefined) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
