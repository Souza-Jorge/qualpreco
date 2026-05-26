import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ztnyvrmiwmrqhquavfhl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bnl2cm1pd21ycWhxdWF2ZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTEyMTYsImV4cCI6MjA5MzI4NzIxNn0.GuWFB1xy1ycIBvhqTi2QLJzjdAVFV65cqykkEZT-jDA";

// Schema real da tabela `products`
export type Produto = {
  codigo: number;
  name: string;
  barcode: string | null;
  unit: string | null;
  pack: number | null;
  stock_quantity: number | null;
  cost_price: string | number | null;
  sale_price: string | number | null;
  category_code: number | null;
  category_name: string | null;
  promo_price: string | number | null;
  promo_start: string | null;
  promo_end: string | null;
  data_validade: string | null;
};

// Preços vêm como string com vírgula ("16,35"). Converte para número.
export const toNumber = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? null : n;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
