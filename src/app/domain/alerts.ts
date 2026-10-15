import { formatCOP, formatDate, monthsBetween, parseISO, toISO } from './format';
import { PRODUCT_LABEL, Persona } from './models';
import { upcomingPayments } from './payments';

export type AlertKind = 'consulta' | 'pago' | 'cupo' | 'reporte';
export type AlertSeverity = 'info' | 'warn' | 'critical';

export interface CreditAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** yyyy-mm-dd */
  date: string;
  title: string;
  body: string;
  link?: string;
}

export const KIND_LABEL: Record<AlertKind, string> = {
  consulta: 'Consultas',
  pago: 'Pagos',
  cupo: 'Uso de cupos',
  reporte: 'Cambios en el reporte',
};

const DAY = 86_400_000;

/** Fictional alert feed derived from the persona's demo data. Newest first. */
export function buildAlerts(p: Persona, asOf: Date, utilThreshold = 0.7): CreditAlert[] {
  const out: CreditAlert[] = [];
  const asOfIso = toISO(asOf);

  for (const q of p.inquiries) {
    if (q.self) continue;
    const d = parseISO(q.date);
    if (asOf.getTime() - d.getTime() > 90 * DAY) continue;
    out.push({
      id: `q-${q.date}-${q.entity}`,
      kind: 'consulta',
      severity: 'info',
      date: q.date,
      title: `${q.entity} consultó tu historial`,
      body: `Motivo: ${q.purpose.toLowerCase()}. Si no la reconoces, revisa tu huella de consulta.`,
      link: '/huella',
    });
  }

  for (const prod of p.products) {
    if (prod.status === 'EN_MORA') {
      out.push({
        id: `mora-${prod.id}`,
        kind: 'pago',
        severity: 'critical',
        date: asOfIso,
        title: `Tienes ${formatCOP(prod.overdueAmount)} vencidos con ${prod.entity}`,
        body: `${prod.daysLate} días de mora en tu ${PRODUCT_LABEL[prod.type].toLowerCase()}. Ponerte al día detiene el daño a tu puntaje.`,
        link: `/obligaciones/${prod.id}`,
      });
    }
    const last = prod.history[prod.history.length - 1];
    if (last.startsWith('M') && prod.status !== 'CERRADA') {
      out.push({
        id: `rep-mora-${prod.id}-${asOfIso.slice(0, 7)}`,
        kind: 'reporte',
        severity: 'warn',
        date: asOfIso,
        title: `${prod.entity} reportó mora este mes`,
        body: 'El último mes de tu hábito de pago quedó con mora. El reporte negativo solo procede después del aviso previo de 20 días.',
        link: `/obligaciones/${prod.id}`,
      });
    }
    const opened = parseISO(prod.openedAt);
    if (monthsBetween(opened, asOf) < 12) {
      out.push({
        id: `rep-new-${prod.id}`,
        kind: 'reporte',
        severity: 'info',
        date: prod.openedAt,
        title: `Nueva obligación reportada: ${prod.entity}`,
        body: `Se agregó un ${PRODUCT_LABEL[prod.type].toLowerCase()} a tu historial. Si no lo reconoces, puedes reclamar por suplantación.`,
        link: `/obligaciones/${prod.id}`,
      });
    }
    if (prod.closedAt && monthsBetween(parseISO(prod.closedAt), asOf) < 12) {
      out.push({
        id: `rep-closed-${prod.id}`,
        kind: 'reporte',
        severity: 'info',
        date: prod.closedAt,
        title: `${prod.entity} reportó tu obligación como cerrada`,
        body: 'Desde la fecha de pago corre el término de permanencia del dato negativo, si lo hubo.',
        link: '/permanencia',
      });
    }
    if (prod.type === 'CARD' && prod.limit && prod.status !== 'CERRADA') {
      const r = prod.balance / prod.limit;
      if (r >= utilThreshold) {
        out.push({
          id: `cupo-${prod.id}-${Math.round(utilThreshold * 100)}`,
          kind: 'cupo',
          severity: r >= 0.9 ? 'critical' : 'warn',
          date: asOfIso,
          title: `Usas el ${Math.round(r * 100)} % de tu tarjeta ${prod.entity}`,
          body: `Superaste tu umbral del ${Math.round(utilThreshold * 100)} %. Abona ${formatCOP(Math.ceil(prod.balance - prod.limit * 0.3))} para quedar en 30 %.`,
          link: '/uso-de-cupos',
        });
      }
    }
  }

  for (const u of upcomingPayments(p.products, asOf)) {
    if (u.daysLeft > 5 || u.product.status === 'EN_MORA') continue;
    out.push({
      id: `pay-${u.product.id}-${toISO(u.date)}`,
      kind: 'pago',
      severity: 'warn',
      date: asOfIso,
      title: `Pago de ${formatCOP(u.amount)} a ${u.product.entity} en ${u.daysLeft} día${u.daysLeft === 1 ? '' : 's'}`,
      body: `Vence el ${formatDate(toISO(u.date))}. Pagar a tiempo es el factor que más pesa en tu puntaje.`,
      link: '/calendario',
    });
  }

  const rank: Record<AlertSeverity, number> = { critical: 0, warn: 1, info: 2 };
  return out.sort((a, b) => b.date.localeCompare(a.date) || rank[a.severity] - rank[b.severity]);
}
