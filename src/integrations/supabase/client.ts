import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ztnyvrmiwmrqhquavfhl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bnl2cm1pd21ycWhxdWF2ZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTEyMTYsImV4cCI6MjA5MzI4NzIxNn0.GuWFB1xy1ycIBvhqTi2QLJzjdAVFV65cqykkEZT-jDA";

export type Produto = {
  codigo: string;
  nome: string;
  emb: string | null;
  pack: number | null;
  estoque: number | null;
  preco_custo: number | null;
  preco_venda: number | null;
  preco_promocional: number | null;
  data_fim_promocao: string | null;
  data_validade: string | null;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
