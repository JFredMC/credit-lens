import { describe, expect, it } from 'vitest';
import { parseISO } from './format';
import { AS_OF, PERSONAS } from './personas';
import { buildReport, reportFileName } from './report';
import { scorePersona } from './score';
import { summarize } from './summary';

describe('buildReport', () => {
  it('includes every product and inquiry and the disclaimer', () => {
    const p = PERSONAS[1];
    const s = scorePersona(p, parseISO(AS_OF));
    const r = buildReport(p, s, summarize(p), AS_OF);
    expect(r.score).toBe(s.score);
    expect(r.products).toHaveLength(p.products.length);
    expect(r.products[0]).toHaveLength(r.productHeader.length);
    expect(r.inquiries).toHaveLength(p.inquiries.length);
    expect(r.factors).toHaveLength(5);
    expect(r.disclaimer).toContain('no está afiliado');
    expect(reportFileName(p, 'pdf')).toBe(`credit-lens-reporte-${p.id}.pdf`);
  });
});
