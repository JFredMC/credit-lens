import { toISO } from './format';
import { Inquiry, Persona, Product, ProductType } from './models';
import { computeScore, ScoreResult } from './score';

export type SimAction =
  | { kind: 'pay'; productId: string; amount: number }
  | { kind: 'catchUp'; productId: string }
  | { kind: 'close'; productId: string }
  | { kind: 'miss'; productId: string }
  | { kind: 'inquiries'; count: number }
  | { kind: 'newLoan'; type: ProductType; amount: number };

export interface SimResult {
  before: ScoreResult;
  after: ScoreResult;
  delta: number;
}

/** Applies hypothetical actions to a copy of the persona and recomputes the fictional score. */
export function simulate(p: Persona, actions: SimAction[], asOf: Date): SimResult {
  let products: Product[] = p.products.map((x) => ({ ...x, history: [...x.history] }));
  const inquiries: Inquiry[] = [...p.inquiries];
  const asOfIso = toISO(asOf);

  for (const a of actions) {
    switch (a.kind) {
      case 'pay':
        products = products.map((x) =>
          x.id === a.productId ? { ...x, balance: Math.max(0, x.balance - a.amount) } : x,
        );
        break;
      case 'catchUp':
        products = products.map((x) =>
          x.id === a.productId && x.status === 'EN_MORA'
            ? {
                ...x,
                status: 'AL_DIA',
                daysLate: 0,
                balance: Math.max(0, x.balance - x.overdueAmount),
                overdueAmount: 0,
              }
            : x,
        );
        break;
      case 'close':
        products = products.map((x) =>
          x.id === a.productId ? { ...x, status: 'CERRADA', closedAt: asOfIso } : x,
        );
        break;
      case 'miss':
        products = products.map((x) =>
          x.id === a.productId ? { ...x, history: [...x.history.slice(1), 'M30'] } : x,
        );
        break;
      case 'inquiries':
        for (let i = 0; i < a.count; i++)
          inquiries.push({ date: asOfIso, entity: 'Simulación', purpose: 'Solicitud' });
        break;
      case 'newLoan':
        products.push({
          id: 'sim-new',
          type: a.type,
          entity: 'Nuevo crédito (simulado)',
          sector: 'Financiero',
          openedAt: asOfIso,
          originalAmount: a.amount,
          balance: a.amount,
          limit: a.type === 'CARD' ? a.amount : undefined,
          monthlyPayment: Math.round(a.amount / 36),
          annualRate: 0.25,
          status: 'AL_DIA',
          daysLate: 0,
          overdueAmount: 0,
          dueDay: 15,
          history: Array(24).fill('NA'),
        });
        inquiries.push({ date: asOfIso, entity: 'Simulación', purpose: 'Nuevo crédito' });
        break;
    }
  }
  const before = computeScore({ products: p.products, inquiries: p.inquiries, asOf });
  const after = computeScore({ products, inquiries, asOf });
  return { before, after, delta: after.score - before.score };
}
