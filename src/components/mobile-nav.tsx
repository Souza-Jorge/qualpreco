import { Link, useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Percent, FileText, Plus, MoreHorizontal, LogIn, LogOut, Power } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { fecharAplicativo, sairDaConta } from "@/lib/app-sessao";
import { cn } from "@/lib/utils";

/** Barra de navegação fixa no rodapé, usada apenas no celular. */
export function MobileNav() {
  const navigate = useNavigate();
  const [maisAberto, setMaisAberto] = useState(false);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setLogado(!!session)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const search = useSearch({ strict: false }) as { ofertas?: boolean };
  const ofertasAtivas = pathname === "/" && search.ofertas === true;
  const isHome = pathname === "/" && !ofertasAtivas;
  const isOrcamentos = pathname.startsWith("/orcamentos") && pathname !== "/orcamentos/novo";
  const isNovo = pathname === "/orcamentos/novo";

  const limparTela = () => {
    window.dispatchEvent(new CustomEvent("qualpreco:limpar"));
  };

  const itemClass = (ativo: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] leading-none",
      ativo ? "text-primary font-semibold" : "text-muted-foreground"
    );

  const sair = async () => {
    setMaisAberto(false);
    await sairDaConta();
    navigate({ to: "/", search: { ofertas: true } });
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação principal"
      >
        <div className="flex items-stretch">
          <Link to="/" search={{ ofertas: false }} onClick={limparTela} className={itemClass(isHome)}>
            <Search className="h-5 w-5" />
            <span>Buscar</span>
          </Link>
          <Link to="/" search={{ ofertas: true }} className={itemClass(ofertasAtivas)}>
            <Percent className="h-5 w-5" />
            <span>Ofertas</span>
          </Link>
          <Link to="/orcamentos" className={itemClass(isOrcamentos)}>
            <FileText className="h-5 w-5" />
            <span>Orçamentos</span>
          </Link>
          <Link to="/orcamentos/novo" className={itemClass(isNovo)}>
            <Plus className="h-5 w-5" />
            <span>Novo</span>
          </Link>
          <button type="button" onClick={() => setMaisAberto(true)} className={itemClass(false)}>
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <Sheet open={maisAberto} onOpenChange={setMaisAberto}>
        <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Conta</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-1">
            {logado ? (
              <button
                type="button"
                onClick={sair}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            ) : (
              <Link
                to="/orcamentos"
                onClick={() => setMaisAberto(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMaisAberto(false);
                void fecharAplicativo();
              }}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent"
            >
              <Power className="h-4 w-4" />
              Fechar app
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
