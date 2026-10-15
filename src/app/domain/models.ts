export type ProductType = 'CARD' | 'CONSUMER' | 'VEHICLE' | 'MORTGAGE' | 'TELCO' | 'EDUCATION';

/** One month of payment behaviour, oldest first. */
export type MonthStatus = 'OK' | 'M30' | 'M60' | 'M90' | 'M120' | 'NA';

export type ProductStatus = 'AL_DIA' | 'EN_MORA' | 'CERRADA';

export interface Product {
  id: string;
  type: ProductType;
  entity: string;
  sector: 'Financiero' | 'Telecomunicaciones' | 'Real' | 'Cooperativo';
  /** ISO date (yyyy-mm-dd). */
  openedAt: string;
  closedAt?: string;
  /** Credit limit for revolving products (cards). */
  limit?: number;
  originalAmount: number;
  balance: number;
  monthlyPayment: number;
  /** Effective annual interest rate, as a fraction (0.28 = 28 % E.A.). */
  annualRate: number;
  status: ProductStatus;
  daysLate: number;
  overdueAmount: number;
  /** Day of month when the installment is due. */
  dueDay: number;
  /** Last 24 months, oldest first. */
  history: MonthStatus[];
}

export interface Inquiry {
  date: string;
  entity: string;
  purpose: string;
}

export interface Persona {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  documentType: 'CC';
  documentMasked: string;
  city: string;
  monthlyIncome: number;
  products: Product[];
  inquiries: Inquiry[];
  /** Fictional score from previous months, oldest first (12 points). */
  scoreTrend: number[];
}

export const PRODUCT_LABEL: Record<ProductType, string> = {
  CARD: 'Tarjeta de crédito',
  CONSUMER: 'Crédito de consumo',
  VEHICLE: 'Crédito de vehículo',
  MORTGAGE: 'Crédito hipotecario',
  TELCO: 'Plan de telefonía',
  EDUCATION: 'Crédito educativo',
};

export const STATUS_LABEL: Record<ProductStatus, string> = {
  AL_DIA: 'Al día',
  EN_MORA: 'En mora',
  CERRADA: 'Cerrada',
};

export const MONTH_LABEL: Record<MonthStatus, string> = {
  OK: 'Al día',
  M30: 'Mora 30 días',
  M60: 'Mora 60 días',
  M90: 'Mora 90 días',
  M120: 'Mora 120+ días',
  NA: 'Sin dato',
};
