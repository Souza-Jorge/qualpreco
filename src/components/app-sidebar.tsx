import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import { Search, Percent, FileText, Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
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
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-center">
          <img
            src={logoXapadao.url}
            alt="Xapadão Bebidas"
            className={collapsed ? "h-8 w-auto" : "h-11 w-24 object-contain sm:w-28"}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isHome}>
                  <Link to="/" search={{ ofertas: false }} className="flex items-center gap-2">
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
                    className="flex items-center gap-2"
                  >
                    <Percent className="h-4 w-4" />
                    {!collapsed && <span>Apenas ofertas</span>}
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
                  <Link to="/orcamentos" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {!collapsed && <span>Listar orçamentos</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isNovoOrcamento}>
                  <Link to="/orcamentos/novo" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {!collapsed && <span>Novo orçamento</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
