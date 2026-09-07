import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { OrcamentoEditor, OrcamentoHeader } from "@/components/OrcamentoEditor";

export const Route = createFileRoute("/orcamentos/novo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Novo orçamento — QualPreço" },
      {
        name: "description",
        content:
          "Monte um orçamento rápido com busca de produtos por código, nome ou código de barras.",
      },
      { property: "og:title", content: "Novo orçamento — QualPreço" },
      {
        property: "og:description",
        content: "Monte um orçamento rápido durante o atendimento.",
      },
    ],
  }),
  component: NovoOrcamento,
});

function NovoOrcamento() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <OrcamentoHeader titulo="Novo orçamento" />
      <main className="mx-auto w-full max-w-3xl px-4 py-4">
        <AuthGate>{(userId) => <OrcamentoEditor userId={userId} />}</AuthGate>
      </main>
    </div>
  );
}
