import { supabase } from "@/integrations/supabase/client";

// Cliente cadastrado (apenas os campos usados no orçamento)
export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  empresa: string | null;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  created_at: string;
};

export type ClienteNovo = {
  nome: string;
  empresa?: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
};

// Busca parcial por nome, empresa ou telefone (case-insensitive)
export async function buscarClientes(busca: string): Promise<Cliente[]> {
  const q = busca.trim();
  if (!q) return [];
  const filtro = `%${q.replace(/[%_,]/g, " ")}%`;
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .or(`nome.ilike.${filtro},empresa.ilike.${filtro},telefone.ilike.${filtro}`)
    .order("nome")
    .limit(10);
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function criarCliente(
  userId: string,
  dados: ClienteNovo
): Promise<Cliente> {
  const vazioParaNull = (v?: string) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  };
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      user_id: userId,
      nome: dados.nome.trim(),
      empresa: vazioParaNull(dados.empresa),
      cpf_cnpj: vazioParaNull(dados.cpf_cnpj),
      telefone: vazioParaNull(dados.telefone),
      email: vazioParaNull(dados.email),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Cliente;
}
