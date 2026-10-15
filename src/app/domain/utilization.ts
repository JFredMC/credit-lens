import { Product } from './models';

export interface CardUse {
  product: Product;
  limit: number;
  balance: number;
  ratio: number;
  /** Amount to pay to bring this card to the target ratio (0 if already there). */
  toTarget: number;
}

export function cardUsage(
  products: Product[],
  target = 0.3,
): {
  cards: CardUse[];
  limit: number;
  balance: number;
  ratio: number;
  toTarget: number;
} {
  const cards = products
    .filter((p) => p.type === 'CARD' && p.status !== 'CERRADA' && p.limit)
    .map((p) => {
      const limit = p.limit ?? 0;
      return {
        product: p,
        limit,
        balance: p.balance,
        ratio: limit ? p.balance / limit : 0,
        toTarget: Math.max(0, Math.ceil(p.balance - limit * target)),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
  const limit = cards.reduce((s, c) => s + c.limit, 0);
  const balance = cards.reduce((s, c) => s + c.balance, 0);
  return {
    cards,
    limit,
    balance,
    ratio: limit ? balance / limit : 0,
    toTarget: Math.max(0, Math.ceil(balance - limit * target)),
  };
}
