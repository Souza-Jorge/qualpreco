import { supabase } from "@/integrations/supabase/client";

export type OrcamentoStatus = "Rascunho" | "Finalizado" | "Cancelado";

export type Orcamento = {
  id: string;
  numero: number;
  user_id: string;
  cliente_nome: string | null;
  cliente_empresa: string | null;
  cliente_cpf_cnpj: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  observacao: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  status: OrcamentoStatus;
  created_at: string;
  updated_at: string;
};

export type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  product_id: number | null;
  codigo: string | null;
  produto_nome: string | null;
  ean: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

// Item ainda não persistido (na tela)
export type ItemLocal = {
  key: string;
  product_id: number | null;
  codigo: string | null;
  produto_nome: string;
  ean: string | null;
  quantidade: number;
  preco_unitario: number;
};

export type ClienteForm = {
  cliente_nome: string;
  cliente_empresa: string;
  cliente_cpf_cnpj: string;
  cliente_telefone: string;
  cliente_email: string;
  observacao: string;
};

export const clienteVazio: ClienteForm = {
  cliente_nome: "",
  cliente_empresa: "",
  cliente_cpf_cnpj: "",
  cliente_telefone: "",
  cliente_email: "",
  observacao: "",
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const subtotalItem = (i: ItemLocal) => round2(i.quantidade * i.preco_unitario);

export const calcTotais = (itens: ItemLocal[], desconto: number) => {
  const subtotal = round2(itens.reduce((s, i) => s + subtotalItem(i), 0));
  const desc = Math.min(Math.max(round2(desconto || 0), 0), subtotal);
  return { subtotal, desconto: desc, total: round2(subtotal - desc) };
};

const nulo = (v: string) => {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
};

const clientePayload = (c: ClienteForm) => ({
  cliente_nome: nulo(c.cliente_nome),
  cliente_empresa: nulo(c.cliente_empresa),
  cliente_cpf_cnpj: nulo(c.cliente_cpf_cnpj),
  cliente_telefone: nulo(c.cliente_telefone),
  cliente_email: nulo(c.cliente_email),
  observacao: nulo(c.observacao),
});

const itensPayload = (orcamentoId: string, itens: ItemLocal[]) =>
  itens.map((i) => ({
    orcamento_id: orcamentoId,
    product_id: i.product_id,
    codigo: i.codigo,
    produto_nome: i.produto_nome,
    ean: i.ean,
    quantidade: i.quantidade,
    preco_unitario: i.preco_unitario,
    subtotal: subtotalItem(i),
  }));

export async function criarOrcamento(
  userId: string,
  cliente: ClienteForm,
  itens: ItemLocal[],
  desconto: number
): Promise<Orcamento> {
  const { subtotal, desconto: desc, total } = calcTotais(itens, desconto);
  const { data, error } = await supabase
    .from("orcamentos")
    .insert({
      user_id: userId,
      ...clientePayload(cliente),
      subtotal,
      desconto: desc,
      total,
      status: "Rascunho",
    })
    .select("*")
    .single();
  if (error) throw error;
  const orc = data as unknown as Orcamento;

  if (itens.length > 0) {
    const { error: e2 } = await supabase
      .from("orcamento_itens")
      .insert(itensPayload(orc.id, itens));
    if (e2) throw e2;
  }
  return orc;
}

export async function atualizarOrcamento(
  id: string,
  cliente: ClienteForm,
  itens: ItemLocal[],
  desconto: number
): Promise<void> {
  const { subtotal, desconto: desc, total } = calcTotais(itens, desconto);
  const { error } = await supabase
    .from("orcamentos")
    .update({
      ...clientePayload(cliente),
      subtotal,
      desconto: desc,
      total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  // Reescreve os itens (a tela sempre envia a lista completa)
  const { error: eDel } = await supabase
    .from("orcamento_itens")
    .delete()
    .eq("orcamento_id", id);
  if (eDel) throw eDel;

  if (itens.length > 0) {
    const { error: eIns } = await supabase
      .from("orcamento_itens")
      .insert(itensPayload(id, itens));
    if (eIns) throw eIns;
  }
}

export async function carregarOrcamento(id: string) {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: itens, error: e2 } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", id)
    .order("created_at");
  if (e2) throw e2;

  const orc = data as unknown as Orcamento;
  const lista: ItemLocal[] = ((itens ?? []) as unknown as OrcamentoItem[]).map(
    (i, idx) => ({
      key: i.id ?? `i${idx}`,
      product_id: i.product_id,
      codigo: i.codigo,
      produto_nome: i.produto_nome ?? "",
      ean: i.ean,
      quantidade: Number(i.quantidade),
      preco_unitario: Number(i.preco_unitario),
    })
  );
  return { orcamento: orc, itens: lista };
}

export async function listarRascunhos(userId: string): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as Orcamento[];
}
