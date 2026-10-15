import { ClaimInput, ClaimLetter, letterHeader } from '../../domain/claim-letter';

/** Renders the letter to an A4 PDF and triggers the download. jsPDF is lazy-loaded. */
export async function downloadClaimPdf(input: ClaimInput, letter: ClaimLetter): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 22;
  const W = 210 - M * 2;
  let y = 24;
  const ensure = (h: number) => {
    if (y + h > 275) {
      doc.addPage();
      y = 24;
    }
  };
  const para = (
    text: string,
    opts: { bold?: boolean; size?: number; gap?: number; indent?: number } = {},
  ) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 11);
    const lines = doc.splitTextToSize(text, W - (opts.indent ?? 0)) as string[];
    for (const l of lines) {
      ensure(6);
      doc.text(l, M + (opts.indent ?? 0), y);
      y += 5.4;
    }
    y += opts.gap ?? 2.5;
  };

  for (const l of letterHeader(input)) {
    if (!l) {
      y += 3;
      continue;
    }
    para(l, { gap: 0 });
  }
  y += 4;
  para(`Asunto: ${letter.subject}`, { bold: true, gap: 5 });
  para(letter.opening, { gap: 5 });
  para('Hechos', { bold: true });
  letter.facts.forEach((f, i) => para(`${i + 1}. ${f}`, { indent: 3 }));
  y += 2;
  para('Peticiones', { bold: true });
  letter.requests.forEach((r, i) => para(`${i + 1}. ${r}`, { indent: 3 }));
  y += 2;
  para('Fundamentos', { bold: true });
  letter.grounds.forEach((g) => para(`• ${g}`, { indent: 3 }));
  y += 2;
  letter.closing.forEach((c) => para(c));
  y += 8;
  ensure(30);
  para('Atentamente,', { gap: 16 });
  doc.line(M, y - 4, M + 70, y - 4);
  para(input.fullName || '[nombre completo]', { bold: true, gap: 0 });
  para(`C.C. ${input.documentNumber || '[número]'}`);

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text(
      'Plantilla educativa generada con Credit Lens (demo) · by JFredDev · No es asesoría legal.',
      M,
      289,
    );
    doc.text(`${p}/${pages}`, 210 - M, 289, { align: 'right' });
    doc.setTextColor(0);
  }
  doc.save(`derecho-de-peticion-${input.type}.pdf`);
}
