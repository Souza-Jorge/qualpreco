import { Link, useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Percent, FileText, Plus, LogIn, LogOut, Power } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoXapadao from "@/assets/logo-xapadao-header.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { fecharAplicativo, sairDaConta } from "@/lib/app-sessao";

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed" && !isMobile;
  // No mobile, fecha o menu deslizante depois de escolher um item.
  const fecharNoMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  // Sessão do usuário (para mostrar Entrar ou Sair).
  const [logado, setLogado] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setLogado(!!session)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Sai da conta (login) e volta para a tela inicial — o app NÃO fecha.
  const sair = async () => {
    fecharNoMobile();
    await sairDaConta();
    navigate({ to: "/", search: { ofertas: true } });
  };

  const fecharApp = async () => {
    fecharNoMobile();
    await fecharAplicativo();
  };

  // Limpa a tela inicial ao escolher "Consultar preços".
  const limparTela = () => {
    fecharNoMobile();
    window.dispatchEvent(new CustomEvent("qualpreco:limpar"));
  };

  const pathname = useRouterState({
    select: (router) => router.location.pathname,
  });
  // Lê o filtro de ofertas da URL (definido em validateSearch da rota "/").
  const search = useSearch({ strict: false }) as { ofertas?: boolean };
  const ofertasAtivas = pathname === "/" && search.ofertas === true;

  const isHome = pathname === "/" && !ofertasAtivas;
  const isOrcamentos = pathname.startsWith("/orcamentos") && pathname !== "/orcamentos/novo";
  const isNovoOrcamento = pathname === "/orcamentos/novo";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-1 py-1.5">
        <div className="flex items-center justify-center">
          <img
            src={logoXapadao.url}
            alt="Xapadão Bebidas"
            className={collapsed ? "h-9 w-auto" : "h-14 w-auto object-contain"}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isHome}>
                  <Link to="/" search={{ ofertas: false }} className="flex items-center gap-2 text-[13px]" onClick={limparTela}>
                    <Search className="h-4 w-4" />
                    {!collapsed && <span>Consultar preços</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={ofertasAtivas}>
                  <Link
                    to="/"
                    search={{ ofertas: !ofertasAtivas }}
                    className="flex items-center gap-2 text-[13px]" onClick={fecharNoMobile}
                  >
                    <Percent className="h-4 w-4" />
                    {!collapsed && <span>Ofertas</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Orçamentos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isOrcamentos}>
                  <Link to="/orcamentos" className="flex items-center gap-2 text-[13px]" onClick={fecharNoMobile}>
                    <FileText className="h-4 w-4" />
                    {!collapsed && <span>Listar orçamentos</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isNovoOrcamento}>
                  <Link to="/orcamentos/novo" className="flex items-center gap-2 text-[13px]" onClick={fecharNoMobile}>
                    <Plus className="h-4 w-4" />
                    {!collapsed && <span>Novo orçamento</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            {logado ? (
              <SidebarMenuButton onClick={sair} className="flex items-center gap-2 text-[13px]">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sair da conta</span>}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild>
                <Link to="/orcamentos" className="flex items-center gap-2 text-[13px]" onClick={fecharNoMobile}>
                  <LogIn className="h-4 w-4" />
                  {!collapsed && <span>Entrar</span>}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={fecharApp} className="flex items-center gap-2 text-[13px]">
              <Power className="h-4 w-4" />
              {!collapsed && <span>Fechar app</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
