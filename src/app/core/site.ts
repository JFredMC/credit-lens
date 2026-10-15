export const APP_NAME = 'Credit Lens';
export const TAGLINE = 'Tu crédito, claro';
export const PORTFOLIO_URL = 'https://jfredmc.github.io/portfolio/';
export const REPO_URL = 'https://github.com/JFredMC/credit-lens';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** Optional live counter shown next to the label. */
  badge?: 'alerts';
}

/** Main navigation. Icons are SVG path data (24x24, stroke). */
export const NAV: NavItem[] = [
  { path: '/', label: 'Resumen', icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
  { path: '/puntaje', label: 'Mi puntaje', icon: 'M12 3a9 9 0 109 9M12 12l5-5M12 3v3' },
  { path: '/obligaciones', label: 'Obligaciones', icon: 'M3 6h18M3 12h18M3 18h12' },
  {
    path: '/alertas',
    label: 'Alertas',
    icon: 'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
    badge: 'alerts',
  },
  { path: '/calendario', label: 'Calendario', icon: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4' },
  {
    path: '/simulador',
    label: 'Simulador',
    icon: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  },
  { path: '/plan-deudas', label: 'Plan de deudas', icon: 'M3 17l6-6 4 4 8-8M14 7h7v7' },
  { path: '/uso-de-cupos', label: 'Uso de cupos', icon: 'M2 7h20v12H2zM2 11h20M6 15h4' },
  {
    path: '/permanencia',
    label: 'Reportes negativos',
    icon: 'M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z',
  },
  { path: '/reclamos', label: 'Reclamos', icon: 'M4 4h16v12H7l-3 3zM8 9h8M8 12h5' },
  { path: '/fuentes', label: 'Fuentes', icon: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5' },
];
