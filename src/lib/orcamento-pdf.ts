import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/logo-xapadao.png";
import {
  fmtData,
  fmtNumero,
  fmtQuantidade,
  type ItemLocal,
  type Orcamento,
} from "@/lib/orcamentos";


const EMPRESA = "COMÉRCIO DE BEBIDAS CHAPADA D’OESTE LTDA";
const CNPJ = "CNPJ. 08.859.942/0001-31";
const IE = "INSC. EST. 373.111.107.116";
const ENDERECO =
  "Rua Angelina Barreto Fernandes Nº. 54 – Vila Aurora, Itapevi-SP – 06657-060";
const TELEFONES = "TEL.: 4141-5209 - 4142-3787 – 4773-8902";

const brl = (n: number) =>
  "R$ " +
  Number(n || 0)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");




async function carregarLogo(): Promise<string | null> {
  try {
    const resp = await fetch(logoUrl);
    if (!resp.ok) return null;
    const bytes = new Uint8Array(await resp.arrayBuffer());
    let bin = "";
    const passo = 0x8000;
    for (let i = 0; i < bytes.length; i += passo) {
      bin += String.fromCharCode(...bytes.subarray(i, i + passo));
    }
    return "data:image/png;base64," + btoa(bin);
  } catch {
    return null;
  }
}

export const nomeArquivoPdf = (numero: number) =>
  `Orcamento-${String(numero).padStart(6, "0")}.pdf`;

export async function gerarOrcamentoPdf(
  orc: Orcamento,
  itens: ItemLocal[]
): Promise<{ doc: jsPDF; filename: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 14;

  // ---------- Cabeçalho ----------
  const logo = await carregarLogo();
  let y = margem;

  if (logo) {
    const lw = 34;
    const lh = (lw * 181) / 420;
    try {
      doc.addImage(logo, "PNG", margem, y, lw, lh);
    } catch {
      /* segue sem logo */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(EMPRESA, margem + 40, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Orçamento de produtos", margem + 40, y + 12.5);
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("ORÇAMENTO", larguraPagina - margem, y + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(fmtNumero(orc.numero), larguraPagina - margem, y + 13, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `Data: ${fmtData(orc.created_at)}   |   Status: ${orc.status}`,
    larguraPagina - margem,
    y + 18,
    { align: "right" }
  );
  doc.setTextColor(0);

  y += 24;
  doc.setDrawColor(200);
  doc.line(margem, y, larguraPagina - margem, y);
  y += 8;

  // ---------- Cliente ----------
  const campos: Array<[string, string | null]> = [
    ["Nome", orc.cliente_nome],
    ["Empresa", orc.cliente_empresa],
    ["CPF/CNPJ", orc.cliente_cpf_cnpj],
    ["Telefone", orc.cliente_telefone],
    ["E-mail", orc.cliente_email],
  ];
  const preenchidos = campos.filter(([, v]) => (v ?? "").trim().length > 0) as Array<
    [string, string]
  >;

  if (preenchidos.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CLIENTE", margem, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const colunas = 2;
    const largColuna = (larguraPagina - margem * 2) / colunas;
    preenchidos.forEach(([rotulo, valor], i) => {
      const col = i % colunas;
      const linha = Math.floor(i / colunas);
      const x = margem + col * largColuna;
      const ly = y + linha * 5.5;
      doc.setTextColor(110);
      doc.text(`${rotulo}:`, x, ly);
      doc.setTextColor(0);
      const offset = doc.getTextWidth(`${rotulo}: `);
      doc.text(String(valor), x + offset, ly, {
        maxWidth: largColuna - offset - 4,
      });
    });
    y += Math.ceil(preenchidos.length / colunas) * 5.5 + 4;
  }

  // ---------- Itens ----------
  const corpo = itens.map((i) => [
    i.codigo ?? "",
    i.produto_nome + (i.ean ? `\nEAN: ${i.ean}` : ""),
    fmtQuantidade(i.quantidade, i.quantidade_por_caixa).replace(" | ", "\n"),
    brl(i.preco_unitario),
    brl(Math.round((i.quantidade * i.preco_unitario + Number.EPSILON) * 100) / 100),
  ]);


  autoTable(doc, {
    startY: y,
    head: [["Código", "Produto", "Qtd.", "Preço unit.", "Subtotal"]],
    body: corpo.length > 0 ? corpo : [["", "Nenhum item neste orçamento.", "", "", ""]],
    margin: { left: margem, right: margem, bottom: 20 },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: 30 },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: 255,
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: { fillColor: [246, 246, 247] },
    columnStyles: {
      0: { cellWidth: 22 },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 28, halign: "right" },
    },
  });

  // ---------- Totais ----------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fim = (doc as any).lastAutoTable.finalY + 8;
  const alturaBloco = 30;
  if (fim + alturaBloco > alturaPagina - 20) {
    doc.addPage();
    fim = margem;
  }

  const boxL = larguraPagina - margem - 78;
  const linhaTotal = (rotulo: string, valor: string, ly: number, forte = false) => {
    doc.setFont("helvetica", forte ? "bold" : "normal");
    doc.setFontSize(forte ? 12 : 10);
    doc.text(rotulo, boxL, ly);
    doc.text(valor, larguraPagina - margem, ly, { align: "right" });
  };

  linhaTotal("Subtotal", brl(Number(orc.subtotal)), fim);
  linhaTotal("Desconto", brl(Number(orc.desconto)), fim + 6);
  doc.setDrawColor(200);
  doc.line(boxL, fim + 9.5, larguraPagina - margem, fim + 9.5);
  linhaTotal("TOTAL", brl(Number(orc.total)), fim + 16, true);

  let depois = fim + 26;

  // ---------- Observação ----------
  const obs = (orc.observacao ?? "").trim();
  if (obs.length > 0) {
    if (depois > alturaPagina - 40) {
      doc.addPage();
      depois = margem;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OBSERVAÇÃO", margem, depois);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const linhas = doc.splitTextToSize(obs, larguraPagina - margem * 2);
    doc.text(linhas, margem, depois + 5.5);
  }

  // ---------- Rodapé ----------
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(220);
    doc.line(margem, alturaPagina - 14, larguraPagina - margem, alturaPagina - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${EMPRESA} — ${fmtNumero(orc.numero)} — ${fmtData(orc.created_at)}`,
      margem,
      alturaPagina - 9
    );
    doc.text(`Página ${p} de ${total}`, larguraPagina - margem, alturaPagina - 9, {
      align: "right",
    });
    doc.setTextColor(0);
  }

  return { doc, filename: nomeArquivoPdf(orc.numero) };
}
