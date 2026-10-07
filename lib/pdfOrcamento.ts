import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFPage, PDFString, rgb } from "pdf-lib";
import type { DadosPdfOrcamento } from "./orcamentoDocumento";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 46;
const BOTTOM = 72;
const WIDTH = A4.width - MARGIN * 2;
const INK = rgb(0.09, 0.09, 0.09);
const MUTED = rgb(0.38, 0.38, 0.38);
const RULE = rgb(0.79, 0.79, 0.79);
const BODY_SIZE = 10.5;

let assets: Promise<Buffer[]> | undefined;
function readAssets() {
  if (!assets) {
    assets = Promise.all([
      readFile(path.join(process.cwd(), "public/fonts/Manrope-Regular.ttf")),
      readFile(path.join(process.cwd(), "public/fonts/Manrope-Bold.ttf")),
      readFile(path.join(process.cwd(), "public/logo.png")),
    ]).catch((error) => {
      assets = undefined;
      throw error;
    });
  }
  return assets;
}

function dateLabel(value: string) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(date);
}

function phoneLabel(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return value;
}

function instagramLabel(value: string) {
  const text = value.trim();
  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    const handle = url.pathname.split("/").filter(Boolean)[0];
    if ((url.hostname === "instagram.com" || url.hostname === "www.instagram.com") && handle && /^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      return `@${handle}`;
    }
  } catch { /* A saved handle is already ready for print. */ }
  return text;
}

/** Gera uma proposta própria para impressão; não altera o orçamento nem seu aceite. */
export async function gerarPdfOrcamento(dados: DadosPdfOrcamento): Promise<Uint8Array> {
  const [regularBytes, boldBytes, logoBytes] = await readAssets();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const logo = await pdf.embedPng(logoBytes);
  const boldCharacters = new Set(bold.getCharacterSet());
  const characters = new Set(regular.getCharacterSet().filter((code) => boldCharacters.has(code)));

  // Custom fonts preserve Portuguese. Unsupported pictograms remain visible as
  // a replacement rather than making the whole document fail to encode.
  function clean(value: string) {
    const normalized = value.normalize("NFC")
      .replace(/\r\n?/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, " ")
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "");
    return Array.from(normalized).map((character) => {
      if (character === "\n" || characters.has(character.codePointAt(0)!)) return character;
      const fallbacks: Record<string, string> = { "\u00a0": " ", "–": "-", "—": "-", "…": "...", "‘": "'", "’": "'", "“": '"', "”": '"' };
      return fallbacks[character] ?? "?";
    }).join("");
  }

  const code = clean(dados.codigo);
  const client = clean(dados.clienteNome);
  const money = (cents: number) => clean(new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(cents / 100));
  const status = dados.personalizado
    ? "Seleção personalizada"
    : ({ pendente: "Pendente", aceito: "Aceito", recusado: "Recusado" }[dados.status] ?? dados.status);
  pdf.setTitle(clean(`Orçamento ${dados.codigo} — ${dados.clienteNome}`));
  pdf.setAuthor("Instaby");
  pdf.setSubject("Orçamento de serviços");
  pdf.setCreator("Instaby App");
  pdf.setProducer("Instaby App");
  pdf.catalog.set(PDFName.of("Lang"), PDFString.of("pt-BR"));

  function lines(value: string, font = regular, size = BODY_SIZE, maxWidth = WIDTH) {
    const result: string[] = [];
    for (const paragraph of clean(value).split("\n")) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) { result.push(""); continue; }
      let line = "";
      for (const word of words) {
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          if (line) { result.push(line); line = ""; }
          let part = "";
          for (const character of Array.from(word)) {
            if (part && font.widthOfTextAtSize(part + character, size) > maxWidth) {
              result.push(part);
              part = "";
            }
            part += character;
          }
          line = part;
        } else if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > maxWidth) {
          result.push(line);
          line = word;
        } else {
          line = line ? `${line} ${word}` : word;
        }
      }
      if (line) result.push(line);
    }
    return result;
  }

  let page!: PDFPage;
  let y = 0;
  const RIGHT = A4.width - MARGIN;
  const ROW_LEADING = 14;
  const PADDING = 10;
  const SERVICE_WIDTH = 136;
  const DESCRIPTION_WIDTH = 250;
  const descriptionX = MARGIN + SERVICE_WIDTH;
  const valueX = descriptionX + DESCRIPTION_WIDTH;
  const valueWidth = RIGHT - valueX;

  function draw(text: string, x: number, baseline: number, size = BODY_SIZE, font = regular, color = INK) {
    if (text) page.drawText(text, { x, y: baseline, size, font, color });
  }
  function rule(baseline: number, color = RULE, thickness = 0.5) {
    page.drawLine({ start: { x: MARGIN, y: baseline }, end: { x: RIGHT, y: baseline }, thickness, color });
  }
  function center(text: string, baseline: number, size: number, font = regular, color = INK) {
    draw(text, (A4.width - font.widthOfTextAtSize(text, size)) / 2, baseline, size, font, color);
  }
  function addPage() {
    const first = pdf.getPageCount() === 0;
    page = pdf.addPage([A4.width, A4.height]);
    const top = A4.height - MARGIN;
    if (first) {
      const logoWidth = 176;
      const logoHeight = logoWidth * logo.height / logo.width;
      page.drawImage(logo, { x: (A4.width - logoWidth) / 2, y: top - logoHeight, width: logoWidth, height: logoHeight });
      center("Agência de marketing", top - logoHeight - 18, 9.5, regular, MUTED);
      center("Orçamento de serviços", top - logoHeight - 53, 23, bold);
      y = top - logoHeight - 70;
      const category = clean(dados.apresentacao.selo).trim();
      if (category) {
        const categoryLines = lines(category, regular, 13, WIDTH);
        categoryLines.forEach(line => { y -= 18; center(line, y, 13); });
      }
      y -= 37;
      const columns = [
        { label: "EMISSÃO", value: dateLabel(dados.criadoEm) },
        { label: "VÁLIDO ATÉ", value: dateLabel(dados.validoAte) },
        { label: "CÓDIGO", value: code },
        { label: "SITUAÇÃO", value: status },
      ];
      const colWidth = WIDTH / columns.length;
      let height = 0;
      columns.forEach((column, index) => {
        const x = MARGIN + colWidth * index;
        draw(column.label, x, y, 8, regular, MUTED);
        const valueLines = lines(column.value, bold, 9.5, colWidth - 12);
        valueLines.forEach((line, lineIndex) => draw(line, x, y - 16 - lineIndex * 13, 9.5, bold));
        height = Math.max(height, valueLines.length * 13);
      });
      y -= height + 30;
      rule(y);
      y -= 27;
    } else {
      const logoWidth = 96;
      const logoHeight = logoWidth * logo.height / logo.width;
      page.drawImage(logo, { x: MARGIN, y: top - logoHeight, width: logoWidth, height: logoHeight });
      const label = "Orçamento de serviços - continuação";
      draw(label, RIGHT - regular.widthOfTextAtSize(label, 9), top - 9, 9, regular, MUTED);
      const ref = lines(code, bold, 10, 280);
      ref.forEach((line, index) => draw(line, RIGHT - bold.widthOfTextAtSize(line, 10), top - 25 - index * 14, 10, bold));
      y = top - Math.max(logoHeight, 25 + ref.length * 14) - 19;
      rule(y);
      y -= 24;
    }
  }

  addPage();
  const contactWidth = (WIDTH - 40) / 2;
  const clientX = MARGIN + contactWidth + 40;
  draw("INSTABY", MARGIN, y - 10, 11, bold);
  draw("CLIENTE", clientX, y - 10, 11, bold);
  y -= 30;
  const agencyDetails = [
    dados.whatsappAgencia ? phoneLabel(dados.whatsappAgencia) : "",
    dados.agencia?.site?.trim() ?? "",
    dados.agencia?.instagram ? instagramLabel(dados.agencia.instagram) : "",
  ].filter(Boolean);
  const clientDetails = [
    client,
    dados.contatoCliente?.contatoNome?.trim() && dados.contatoCliente.contatoNome.trim() !== dados.clienteNome.trim()
      ? dados.contatoCliente.contatoNome.trim() : "",
    dados.contatoCliente?.telefone ? phoneLabel(dados.contatoCliente.telefone) : "",
    dados.contatoCliente?.endereco?.trim() ?? "",
  ].filter(Boolean);
  const agencyLines = agencyDetails.flatMap(value => lines(value, regular, 9.5, contactWidth));
  const clientLines = clientDetails.flatMap(value => lines(value, regular, 9.5, contactWidth));
  const contactRows = Math.max(agencyLines.length, clientLines.length);
  for (let index = 0; index < contactRows; index++) {
    if (y - 15 < BOTTOM + 85) {
      addPage();
      draw("DADOS DO ORÇAMENTO - CONTINUAÇÃO", MARGIN, y - 9, 9, bold, MUTED);
      y -= 25;
    }
    draw(agencyLines[index] ?? "", MARGIN, y - 9.5, 9.5);
    draw(clientLines[index] ?? "", clientX, y - 9.5, 9.5);
    y -= 15;
  }
  // The two contact columns end together, even when one has more saved details.
  y -= 32;

  function tableHeader() {
    rule(y, INK, 0.8);
    draw("SERVIÇO", MARGIN + PADDING, y - 19, 9.5, bold);
    draw("DESCRIÇÃO", descriptionX + PADDING, y - 19, 9.5, bold);
    const label = "VALOR";
    draw(label, RIGHT - PADDING - bold.widthOfTextAtSize(label, 9.5), y - 19, 9.5, bold);
    y -= 31;
    rule(y, INK, 0.6);
  }
  for (let index = 0; index < dados.itens.length; index++) {
    const item = dados.itens[index];
    const nameLines = lines(item.nome, bold, 10, SERVICE_WIDTH - PADDING * 2);
    const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(item.quantidade);
    const quantityLines = lines(
      "Quantidade: " + quantity + (item.unidade ? " · " + item.unidade : ""),
      regular, 8.5, SERVICE_WIDTH - PADDING * 2,
    );
    const serviceLines = [
      ...nameLines.map(text => ({ text, font: bold, size: 10, color: INK })),
      { text: "", font: regular, size: 8.5, color: MUTED },
      ...quantityLines.map(text => ({ text, font: regular, size: 8.5, color: MUTED })),
    ];
    const descriptionLines = item.descricao.trim() ? lines(item.descricao, regular, 9.5, DESCRIPTION_WIDTH - PADDING * 2) : [];
    const lineCount = Math.max(serviceLines.length, descriptionLines.length, 1);
    const fullHeight = lineCount * ROW_LEADING + PADDING * 2;
    const isLast = index === dados.itens.length - 1;
    const openingHeight = fullHeight <= 180 ? fullHeight : Math.min(3, lineCount) * ROW_LEADING + PADDING * 2;
    const headerHeight = index === 0 ? 31 : 0;
    const summarySpace = isLast && fullHeight <= 180 ? 88 : 0;
    if (y - headerHeight - openingHeight - summarySpace < BOTTOM) {
      addPage();
      tableHeader();
    } else if (index === 0) tableHeader();
    let offset = 0;
    while (offset < lineCount) {
      const capacity = Math.floor((y - BOTTOM - PADDING * 2) / ROW_LEADING);
      if (capacity < 1) { addPage(); tableHeader(); continue; }
      const remaining = lineCount - offset;
      let count = Math.min(capacity, remaining);
      // Keep the last service lines beside its amount and the final total.
      // A large description may span pages without leaving a total-only page.
      if (isLast && remaining <= capacity && y - remaining * ROW_LEADING - PADDING * 2 - 88 < BOTTOM) {
        if (remaining <= 3) { addPage(); tableHeader(); continue; }
        count = remaining - 3;
      } else if (isLast && remaining > capacity && remaining - count < 3) {
        count = Math.max(1, remaining - 3);
      }
      const rowTop = y;
      const rowHeight = count * ROW_LEADING + PADDING * 2;
      const finalPart = offset + count === lineCount;
      for (let row = 0; row < count; row++) {
        const baseline = rowTop - PADDING - 10 - row * ROW_LEADING;
        const service = serviceLines[offset + row];
        if (service) draw(service.text, MARGIN + PADDING, baseline, service.size, service.font, service.color);
        draw(descriptionLines[offset + row] ?? "", descriptionX + PADDING, baseline, 9.5);
      }
      if (offset >= serviceLines.length) {
        draw("Serviço " + (index + 1) + " (continuação)", MARGIN + PADDING, rowTop - PADDING - 10, 8, regular, MUTED);
      }
      if (finalPart) {
        const amount = money(item.totalCentavos);
        const amountSize = Math.min(10, (valueWidth - PADDING * 2) / Math.max(1, bold.widthOfTextAtSize(amount, 1)));
        draw(amount, RIGHT - PADDING - bold.widthOfTextAtSize(amount, amountSize), rowTop - PADDING - 10, amountSize, bold);
      }
      // Hairline separators organize the table without filling large ink areas.
      for (const x of [MARGIN, descriptionX, valueX, RIGHT]) {
        page.drawLine({ start: { x, y: rowTop }, end: { x, y: rowTop - rowHeight }, thickness: 0.35, color: RULE });
      }
      y -= rowHeight;
      rule(y);
      offset += count;
      if (!finalPart) { addPage(); tableHeader(); }
    }
  }

  if (y - 88 < BOTTOM) addPage();
  y -= 28;
  const totalLabel = dados.apresentacao.tipo === "mensal" ? "TOTAL MENSAL" : "TOTAL DO SERVIÇO";
  draw(totalLabel, MARGIN, y - 19, 10, bold, MUTED);
  const total = money(dados.itens.reduce((sum, item) => sum + item.totalCentavos, 0));
  const totalSize = Math.min(28, 280 / Math.max(1, bold.widthOfTextAtSize(total, 1)));
  draw(total, RIGHT - bold.widthOfTextAtSize(total, totalSize), y - totalSize, totalSize, bold);

  const pageCount = pdf.getPageCount();
  pdf.getPages().forEach((footerPage, index) => {
    const pageNumber = "Página " + (index + 1) + " de " + pageCount;
    const footerWidth = WIDTH - regular.widthOfTextAtSize(pageNumber, 8.5) - 20;
    let footerCode = code.replace(/\n/g, " ");
    while (footerCode && regular.widthOfTextAtSize(footerCode, 8.5) > footerWidth) footerCode = Array.from(footerCode).slice(0, -1).join("");
    if (footerCode !== code.replace(/\n/g, " ")) footerCode = footerCode.slice(0, -3) + "...";
    footerPage.drawLine({ start: { x: MARGIN, y: 48 }, end: { x: RIGHT, y: 48 }, thickness: 0.5, color: RULE });
    footerPage.drawText(footerCode, { x: MARGIN, y: 32, size: 8.5, font: regular, color: MUTED });
    footerPage.drawText(pageNumber, { x: RIGHT - regular.widthOfTextAtSize(pageNumber, 8.5), y: 32, size: 8.5, font: regular, color: MUTED });
  });
  return pdf.save();
}
