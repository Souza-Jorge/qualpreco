import type jsPDF from "jspdf";

export type ResultadoSalvar = {
  destino: "download" | "arquivo";
  caminho?: string;
};

export function ehNativo() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (globalThis as any).Capacitor;
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function pdfParaBase64(doc: jsPDF) {
  const dataUri = doc.output("datauristring");
  return dataUri.slice(dataUri.indexOf(",") + 1);
}

/**
 * Baixa o PDF no navegador ou grava o arquivo no aparelho (Android/Capacitor).
 */
export async function salvarPdf(
  doc: jsPDF,
  filename: string,
  destino: "documentos" | "cache" = "documentos"
): Promise<ResultadoSalvar> {
  if (ehNativo()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const escrita = await Filesystem.writeFile({
      path: filename,
      data: pdfParaBase64(doc),
      directory: destino === "cache" ? Directory.Cache : Directory.Documents,
      recursive: true,
    });
    return { destino: "arquivo", caminho: escrita.uri };
  }

  doc.save(filename);
  return { destino: "download" };
}
