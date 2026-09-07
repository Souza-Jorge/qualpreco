import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Exige usuário autenticado (RLS dos orçamentos usa auth.uid()).
// Não altera as telas existentes: só protege o módulo de Orçamentos.
export function AuthGate({
  children,
}: {
  children: (userId: string) => React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [checando, setChecando] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setUserId(data.session?.user?.id ?? null);
      setChecando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setEntrando(false);
    if (error) setErro("E-mail ou senha inválidos.");
  };

  if (checando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <Card className="mx-auto mt-6 w-full max-w-sm space-y-4 p-5">
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold">Entrar</h2>
          <p className="text-xs text-muted-foreground">
            Os orçamentos são pessoais: é preciso entrar com sua conta.
          </p>
        </div>
        <form onSubmit={entrar} className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            className="h-12 text-base"
            required
          />
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            className="h-12 text-base"
            required
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" disabled={entrando} className="h-12 w-full text-base">
            {entrando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Entrar
          </Button>
        </form>
      </Card>
    );
  }

  return <>{children(userId)}</>;
}
