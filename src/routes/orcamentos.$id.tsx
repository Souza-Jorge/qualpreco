import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { OrcamentoEditor, OrcamentoHeader } from "@/components/OrcamentoEditor";

export const Route = createFileRoute("/orcamentos/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Editar orçamento — QualPreço" },
      {
        name: "description",
        content: "Edite os produtos, quantidades e valores do orçamento em rascunho.",
      },
      { property: "og:title", content: "Editar orçamento — QualPreço" },
      {
        property: "og:description",
        content: "Ajuste itens e valores do orçamento em rascunho.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditarOrcamento,
});

function EditarOrcamento() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <OrcamentoHeader titulo="Orçamento" />
      <main className="mx-auto w-full max-w-3xl px-4 py-4">
        <AuthGate>
          {(userId) => <OrcamentoEditor userId={userId} orcamentoId={id} />}
        </AuthGate>
      </main>
    </div>
  );
}
