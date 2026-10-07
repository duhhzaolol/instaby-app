import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFName, PDFPage, PDFString, rgb } from "pdf-lib";
import type { DadosPdfOrcamento } from "./orcamentoDocumento";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 46;
const BOTTOM = 72;
const WIDTH = A4.width - MARGIN * 2;
const INK = rgb(0.09, 0.09, 0.09);
const MUTED = rgb(0.38, 0.38, 0.38);
const RULE = rgb(0.79, 0.79, 0.79);
const BODY_SIZE = 10.5;
const BODY_LEADING = 15.5;

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
  pdf.setSubject(clean(dados.apresentacao.titulo));
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

  let page: PDFPage;
  let y = 0;
  let pageBodyTop = 0;
  function draw(text: string, x: number, baseline: number, size = BODY_SIZE, font = regular, color = INK) {
    if (text) page.drawText(text, { x, y: baseline, size, font, color });
  }
  function rule(baseline: number) {
    page.drawLine({ start: { x: MARGIN, y: baseline }, end: { x: A4.width - MARGIN, y: baseline }, thickness: 0.6, color: RULE });
  }
  function addPage() {
    const first = pdf.getPageCount() === 0;
    page = pdf.addPage([A4.width, A4.height]);
    const top = A4.height - MARGIN;
    const logoWidth = first ? 112 : 80;
    const logoHeight = logoWidth * logo.height / logo.width;
    page.drawImage(logo, { x: MARGIN, y: top - logoHeight, width: logoWidth, height: logoHeight });
    const referenceLines = lines(code, bold, first ? 11 : 9.5, 245);
    const refLeading = first ? 15 : 13;
    const refTop = top - (first ? 9 : 8);
    draw(first ? "ORÇAMENTO" : "ORÇAMENTO · CONTINUAÇÃO", A4.width - MARGIN - 245, refTop, 8.5, regular, MUTED);
    referenceLines.forEach((line, index) => draw(line, A4.width - MARGIN - 245, refTop - 16 - index * refLeading, first ? 11 : 9.5, bold));
    y = top - Math.max(logoHeight, 16 + referenceLines.length * refLeading) - 16;
    rule(y);
    y -= 22;
    if (first) {
      const columns = [
        { label: "EMISSÃO", value: dateLabel(dados.criadoEm) },
        { label: "VÁLIDO ATÉ", value: dateLabel(dados.validoAte) },
        { label: "SITUAÇÃO", value: status },
      ];
      const colWidth = WIDTH / 3;
      let height = 0;
      columns.forEach((column, index) => {
        const x = MARGIN + colWidth * index;
        draw(column.label, x, y, 8.5, regular, MUTED);
        const valueLines = lines(column.value, bold, 10, colWidth - 12);
        valueLines.forEach((line, lineIndex) => draw(line, x, y - 16 - lineIndex * 14, 10, bold));
        height = Math.max(height, valueLines.length * 14);
      });
      y -= height + 37;
    } else {
      y -= 3;
    }
    pageBodyTop = y;
  }
  function ensure(height: number) {
    if (y - height < BOTTOM && y < pageBodyTop - 0.5) addPage();
  }
  function flow(textLines: string[], options: {
    size?: number; leading?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number;
    continuation?: () => void; reserveTail?: number;
  } = {}) {
    const size = options.size ?? BODY_SIZE;
    const leading = options.leading ?? BODY_LEADING;
    textLines.forEach((line, index) => {
      const remaining = textLines.length - index;
      const reserve = options.reserveTail && remaining <= 3 ? remaining * leading + options.reserveTail : leading;
      if (y - reserve < BOTTOM) {
        addPage();
        options.continuation?.();
      }
      draw(line, options.x ?? MARGIN, y - size, size, options.font ?? regular, options.color ?? INK);
      y -= leading;
    });
  }

  addPage();
  const label = clean(dados.apresentacao.selo).trim();
  if (label) {
    flow(lines(label.toLocaleUpperCase("pt-BR"), bold, 9), { size: 9, leading: 13, font: bold, color: MUTED });
    y -= 12;
  }
  draw("PREPARADO PARA", MARGIN, y - 8.5, 8.5, regular, MUTED);
  y -= 18;
  flow(lines(client, bold, 12), { size: 12, leading: 17, font: bold });
  y -= 17;
  const title = [dados.apresentacao.titulo, dados.apresentacao.destaque, dados.apresentacao.complemento].filter((part) => part.trim()).join(" ");
  const titleLines = lines(title, bold, 23);
  ensure(Math.min(titleLines.length * 30, 60) + (dados.apresentacao.descricao.trim() ? 12 + BODY_LEADING * 2 : 0));
  flow(titleLines, { size: 23, leading: 30, font: bold });
  if (dados.apresentacao.descricao.trim()) {
    y -= 12;
    flow(lines(dados.apresentacao.descricao), { color: MUTED });
  }
  const customNote = "Esta seleção personalizada não altera a proposta original e não confirma a contratação.";
  const summaryNote = dados.personalizado
    ? customNote
    : dados.status === "aceito"
      ? dados.aceitoEm ? `Proposta aceita em ${dateLabel(dados.aceitoEm)}.` : "Proposta aceita, conforme registrado no sistema."
      : dados.status === "recusado"
        ? "Proposta recusada, conforme registrado no sistema."
        : "Consulte a proposta online para personalizar os serviços ou responder ao orçamento.";
  const noteLines = lines(summaryNote, regular, 9.5);
  const urlLines = lines(dados.urlPublica, regular, 9.5);
  const contactLines = dados.whatsappAgencia ? lines(`WhatsApp da agência: ${phoneLabel(dados.whatsappAgencia)}`, regular, 9.5) : [];
  // These are the exact cursor movements below, plus a small bottom clearance.
  // Keeping the access link and contact in this reservation prevents a page
  // containing only the link after an otherwise complete investment summary.
  const summaryHeight = 28 + 45 + noteLines.length * 14 + 18 + 20
    + urlLines.length * 14 + (contactLines.length ? 10 + contactLines.length * 14 : 0) + 8;
  const preparedItems = dados.itens.map((item) => {
    const itemWidth = WIDTH - 28;
    const nameLines = lines(item.nome, bold, 12.5, itemWidth);
    const descriptionLines = item.descricao.trim() ? lines(item.descricao, regular, BODY_SIZE, itemWidth) : [];
    const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(item.quantidade);
    const metaLines = lines(`Quantidade: ${quantity}${item.unidade ? ` · Unidade: ${item.unidade}` : ""}`, regular, 9.5, itemWidth - 150);
    const metaHeight = metaLines.length * 14;
    const afterDescriptionHeight = 10 + metaHeight + 15 + 22;
    const itemHeight = nameLines.length * 18 + (descriptionLines.length ? 8 : 0)
      + descriptionLines.length * BODY_LEADING + afterDescriptionHeight;
    const openingHeight = Math.min(nameLines.length, 3) * 18
      + (descriptionLines.length ? 8 + BODY_LEADING * Math.min(2, descriptionLines.length) : 10 + Math.min(metaHeight, 28));
    return { item, nameLines, descriptionLines, metaLines, metaHeight, afterDescriptionHeight, itemHeight, openingHeight };
  });

  y -= 27;
  const firstItem = preparedItems[0];
  const firstBlockHeight = firstItem ? firstItem.itemHeight <= 180 ? firstItem.itemHeight : firstItem.openingHeight : 25;
  ensure(23 + 18 + firstBlockHeight);
  draw("ESCOPO E INVESTIMENTO", MARGIN, y - 10, 10, bold);
  y -= 23;
  rule(y);
  y -= 18;

  preparedItems.forEach(({ item, nameLines, descriptionLines, metaLines, metaHeight, afterDescriptionHeight, itemHeight, openingHeight }, index) => {
    const number = String(index + 1).padStart(2, "0");
    const isLast = index === dados.itens.length - 1;
    // Only short service blocks stay together. A long service starts on the
    // current page as soon as its heading and first description lines fit.
    ensure(itemHeight <= 180 ? itemHeight : openingHeight);

    draw(number, MARGIN, y - 12, 9.5, bold, MUTED);
    flow(nameLines, {
      size: 12.5, leading: 18, font: bold, x: MARGIN + 28,
      reserveTail: descriptionLines.length ? 8 + BODY_LEADING * Math.min(2, descriptionLines.length) : 10 + Math.min(metaHeight, 28),
    });
    const continued = () => {
      draw(`SERVIÇO ${number} · CONTINUAÇÃO`, MARGIN + 28, y - 9, 9, bold, MUTED);
      y -= 24;
    };
    if (descriptionLines.length) {
      y -= 8;
      const reserveSummary = isLast && itemHeight > 180
        && afterDescriptionHeight + summaryHeight + BODY_LEADING * 3 + 24 < pageBodyTop - BOTTOM;
      flow(descriptionLines, {
        x: MARGIN + 28, continuation: continued,
        reserveTail: reserveSummary ? afterDescriptionHeight + summaryHeight : afterDescriptionHeight,
      });
    }
    y -= 10;
    ensure(metaHeight + 15);
    const amount = money(item.totalCentavos);
    const amountSize = Math.min(11, 145 / Math.max(1, bold.widthOfTextAtSize(amount, 1)));
    draw(amount, A4.width - MARGIN - bold.widthOfTextAtSize(amount, amountSize), y - 10.5, amountSize, bold);
    flow(metaLines, { size: 9.5, leading: 14, color: MUTED, x: MARGIN + 28, continuation: continued });
    y -= 15;
    rule(y);
    y -= 22;
  });

  ensure(summaryHeight);
  draw("INVESTIMENTO", MARGIN, y - 9, 9, bold, MUTED);
  y -= 28;
  const total = money(dados.itens.reduce((sum, item) => sum + item.totalCentavos, 0));
  const totalSize = Math.min(24, 270 / Math.max(1, bold.widthOfTextAtSize(total, 1)));
  draw(dados.apresentacao.tipo === "mensal" ? "Total mensal" : "Total do serviço", MARGIN, y - 17, 11, bold);
  draw(total, A4.width - MARGIN - bold.widthOfTextAtSize(total, totalSize), y - totalSize, totalSize, bold);
  y -= 45;
  flow(noteLines, { size: 9.5, leading: 14, color: MUTED });
  y -= 18;
  ensure(28 + Math.min(urlLines.length, 2) * 14);
  draw("ACESSAR A PROPOSTA", MARGIN, y - 9, 9, bold);
  y -= 20;

  function linkedLines(textLines: string[], href: string) {
    let target: string | undefined;
    try {
      const url = new URL(href);
      if (url.protocol === "https:" || url.protocol === "http:") target = url.href;
    } catch { /* Keep invalid legacy URLs legible without an unsafe link. */ }
    textLines.forEach((line) => {
      ensure(14);
      const baseline = y - 9.5;
      draw(line, MARGIN, baseline, 9.5, regular, MUTED);
      if (target && line) {
        const annotation = pdf.context.obj({
          Type: "Annot", Subtype: "Link", Rect: [MARGIN, baseline - 2, MARGIN + regular.widthOfTextAtSize(line, 9.5), baseline + 11],
          Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(target) },
        });
        page.node.addAnnot(pdf.context.register(annotation));
      }
      y -= 14;
    });
  }
  linkedLines(urlLines, dados.urlPublica);
  if (contactLines.length && dados.whatsappAgencia) {
    y -= 10;
    const phone = dados.whatsappAgencia.replace(/\D/g, "");
    const international = phone.length === 10 || phone.length === 11 ? `55${phone}` : phone;
    linkedLines(contactLines, international.length >= 10 ? `https://wa.me/${international}` : "");
  }

  const pageCount = pdf.getPageCount();
  pdf.getPages().forEach((footerPage, index) => {
    const pageNumber = `Página ${index + 1} de ${pageCount}`;
    const footerWidth = WIDTH - regular.widthOfTextAtSize(pageNumber, 8.5) - 20;
    let footerCode = code.replace(/\n/g, " ");
    while (footerCode && regular.widthOfTextAtSize(footerCode, 8.5) > footerWidth) footerCode = Array.from(footerCode).slice(0, -1).join("");
    if (footerCode !== code.replace(/\n/g, " ")) footerCode = `${footerCode.slice(0, -3)}...`;
    footerPage.drawLine({ start: { x: MARGIN, y: 48 }, end: { x: A4.width - MARGIN, y: 48 }, thickness: 0.5, color: RULE });
    footerPage.drawText(footerCode, { x: MARGIN, y: 32, size: 8.5, font: regular, color: MUTED });
    footerPage.drawText(pageNumber, { x: A4.width - MARGIN - regular.widthOfTextAtSize(pageNumber, 8.5), y: 32, size: 8.5, font: regular, color: MUTED });
  });
  return pdf.save();
}
