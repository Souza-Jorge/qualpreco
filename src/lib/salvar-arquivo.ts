import type jsPDF from "jspdf";

export type ResultadoSalvar = {
  destino: "download" | "arquivo";
  caminho?: string;
};

function ehNativo() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (globalThis as any).Capacitor;
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

/**
 * Baixa o PDF no navegador ou grava o arquivo no aparelho (Android/Capacitor).
 */
export async function salvarPdf(doc: jsPDF, filename: string): Promise<ResultadoSalvar> {
  if (ehNativo()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const dataUri = doc.output("datauristring");
    const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
    const escrita = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
    return { destino: "arquivo", caminho: escrita.uri };
  }

  doc.save(filename);
  return { destino: "download" };
}
