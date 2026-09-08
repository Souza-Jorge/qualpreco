import type jsPDF from "jspdf";
import { ehNativo, salvarPdf } from "@/lib/salvar-arquivo";

export type ResultadoCompartilhar = "compartilhado" | "baixado" | "cancelado";

function foiCancelado(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? e ?? "").toLowerCase();
  const nome = String((e as { name?: string })?.name ?? "");
  return (
    nome === "AbortError" ||
    msg.includes("abort") ||
    msg.includes("cancel") ||
    msg.includes("share canceled")
  );
}

/**
 * Compartilha o PDF pelo recurso nativo do aparelho ou pelo navegador.
 * Quando não há suporte a compartilhar arquivos, baixa o arquivo.
 */
export async function compartilharPdf(
  doc: jsPDF,
  filename: string,
  titulo: string
): Promise<ResultadoCompartilhar> {
  if (ehNativo()) {
    const { Share } = await import("@capacitor/share");
    const salvo = await salvarPdf(doc, filename, "cache");
    try {
      await Share.share({
        title: titulo,
        text: titulo,
        files: salvo.caminho ? [salvo.caminho] : undefined,
        dialogTitle: "Compartilhar orçamento",
      });
      return "compartilhado";
    } catch (e) {
      if (foiCancelado(e)) return "cancelado";
      throw e;
    }
  }

  const blob = doc.output("blob") as Blob;
  const arquivo = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (nav.share && nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: titulo, text: titulo });
      return "compartilhado";
    } catch (e) {
      if (foiCancelado(e)) return "cancelado";
      throw e;
    }
  }

  doc.save(filename);
  return "baixado";
}
