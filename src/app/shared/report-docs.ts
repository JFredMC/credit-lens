import { CreditReport, Pair } from '../domain/report';

export type DocFormat = 'pdf' | 'xlsx' | 'docx';

export const BRAND = 'Credit Lens';
export const SITE = 'jfredmc.github.io/credit-lens';
export const MARK = 'by JFredDev';

export const MIME: Record<DocFormat, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const INK: [number, number, number] = [23, 27, 46];
const BRAND_RGB: [number, number, number] = [79, 70, 229];
const MUTED: [number, number, number] = [100, 106, 125];

async function pdf(r: CreditReport): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 0;
  const ensure = (h: number) => {
    if (y + h > H - 64) {
      doc.addPage();
      y = M;
    }
  };
  doc.setFillColor(...INK).rect(0, 0, W, 90, 'F');
  doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(22);
  doc.text(BRAND, M, 52);
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(200, 204, 230);
  doc.text('Tu crédito, claro · demo con datos ficticios', M, 70);
  doc.text(`Corte: ${r.asOfLabel}`, W - M, 52, { align: 'right' });
  y = 124;
  doc
    .setTextColor(...INK)
    .setFont('helvetica', 'bold')
    .setFontSize(16)
    .text(r.title, M, y);
  const section = (t: string) => {
    ensure(44);
    y += 30;
    doc
      .setFont('helvetica', 'bold')
      .setFontSize(12)
      .setTextColor(...BRAND_RGB)
      .text(t, M, y);
    y += 6;
  };
  const pairs = (rows: Pair[]) => {
    for (const [a, b] of rows) {
      const lines = doc
        .setFont('helvetica', 'normal')
        .setFontSize(10)
        .splitTextToSize(b, W - M * 2 - 200) as string[];
      ensure(lines.length * 13 + 8);
      y += 14;
      doc.setTextColor(...MUTED).text(a, M, y);
      doc.setTextColor(...INK).text(lines, W - M, y, { align: 'right' });
      y += (lines.length - 1) * 13;
      doc.setDrawColor(230, 232, 240).line(M, y + 5, W - M, y + 5);
    }
  };
  section('Datos de la persona');
  pairs(r.person);
  section('Puntaje (modelo educativo Credit Lens, 150–950)');
  ensure(40);
  y += 30;
  doc
    .setFont('helvetica', 'bold')
    .setFontSize(28)
    .setTextColor(...INK)
    .text(String(r.score), M, y);
  doc
    .setFontSize(12)
    .setTextColor(...BRAND_RGB)
    .text(r.band, M + 70, y);
  y += 6;
  pairs(r.factors);
  section('Indicadores');
  pairs(r.kpis);
  section('Obligaciones');
  // Left-aligned text columns, then right-aligned amount columns (x = right edge).
  const xs = [M, M + 130, M + 250, M + 360, M + 440, W - M];
  const cell = (c: string, i: number) =>
    i >= 3
      ? doc.text(c, xs[i], y, { align: 'right' })
      : doc.text(doc.splitTextToSize(c, 118)[0] as string, xs[i], y);
  ensure(24);
  y += 16;
  doc
    .setFont('helvetica', 'bold')
    .setFontSize(9)
    .setTextColor(...MUTED);
  r.productHeader.forEach(cell);
  doc.setFont('helvetica', 'normal').setTextColor(...INK);
  for (const row of r.products) {
    ensure(18);
    y += 15;
    row.forEach(cell);
  }
  section('Consultas a tu historial');
  pairs(r.inquiries);
  ensure(60);
  y += 30;
  doc
    .setFontSize(8.5)
    .setTextColor(...MUTED)
    .text(doc.splitTextToSize(r.disclaimer, W - M * 2), M, y);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc
      .setFontSize(8.5)
      .setTextColor(...MUTED)
      .text(`${BRAND} · ${SITE}`, M, H - 30);
    doc.text(`${MARK} · ${i}/${pages}`, W - M, H - 30, { align: 'right' });
  }
  return doc.output('blob');
}

async function xlsx(r: CreditReport): Promise<Blob> {
  const { default: write } = await import('write-excel-file/universal');
  const b = { fontWeight: 'bold' as const };
  const head = (t: string) => [{ value: t, ...b, color: '#4f46e5' }];
  const rows: unknown[][] = [
    [{ value: BRAND, ...b, fontSize: 16, color: '#4f46e5' }],
    [{ value: r.title, ...b }],
    [`Corte: ${r.asOfLabel}`],
    [],
    head('Datos de la persona'),
    ...r.person,
    [],
    head('Puntaje (modelo educativo Credit Lens)'),
    [
      { value: 'Puntaje', ...b },
      { value: r.score, type: Number, ...b },
    ],
    ['Banda', r.band],
    ...r.factors,
    [],
    head('Indicadores'),
    ...r.kpis,
    [],
    head('Obligaciones'),
    r.productHeader.map((h) => ({ value: h, ...b })),
    ...r.products,
    [],
    head('Consultas'),
    ...r.inquiries,
    [],
    [{ value: r.disclaimer, wrap: true, color: '#646a7d' }],
    [{ value: `${SITE} · ${MARK}`, color: '#646a7d' }],
  ];
  return write(rows as never, {
    sheet: 'Reporte',
    columns: [
      { width: 34 },
      { width: 44 },
      { width: 12 },
      { width: 16 },
      { width: 14 },
      { width: 12 },
    ],
  }).toBlob();
}

async function docx(r: CreditReport): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    Header,
    Footer,
  } = await import('docx');
  const p = (text: string, o: { bold?: boolean; color?: string; size?: number } = {}) =>
    new Paragraph({ children: [new TextRun({ text, ...o })] });
  const h = (t: string) =>
    new Paragraph({
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: t, bold: true, color: '4F46E5', size: 26 })],
    });
  const table = (rows: string[][], bold = false) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(
        (cells, i) =>
          new TableRow({
            children: cells.map(
              (c) => new TableCell({ children: [p(c, { bold: bold && i === 0, size: 20 })] }),
            ),
          }),
      ),
    });
  const doc = new Document({
    creator: BRAND,
    title: r.title,
    sections: [
      {
        headers: {
          default: new Header({ children: [p(BRAND, { bold: true, color: '4F46E5', size: 28 })] }),
        },
        footers: {
          default: new Footer({
            children: [p(`${BRAND} · ${SITE} · ${MARK}`, { size: 16, color: '646A7D' })],
          }),
        },
        children: [
          p(r.title, { bold: true, size: 32 }),
          p(`Corte: ${r.asOfLabel}`, { color: '646A7D', size: 20 }),
          h('Datos de la persona'),
          table(r.person),
          h('Puntaje (modelo educativo Credit Lens, 150–950)'),
          p(`${r.score} · ${r.band}`, { bold: true, size: 36 }),
          table(r.factors),
          h('Indicadores'),
          table(r.kpis),
          h('Obligaciones'),
          table([r.productHeader, ...r.products], true),
          h('Consultas a tu historial'),
          table(r.inquiries),
          new Paragraph({
            spacing: { before: 240 },
            children: [new TextRun({ text: r.disclaimer, size: 18, color: '646A7D' })],
          }),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

/** Builds the report in the requested format; each library is loaded only when used. */
export async function buildReportDoc(r: CreditReport, fmt: DocFormat): Promise<Blob> {
  const blob = fmt === 'pdf' ? await pdf(r) : fmt === 'xlsx' ? await xlsx(r) : await docx(r);
  return blob.type ? blob : new Blob([blob], { type: MIME[fmt] });
}
