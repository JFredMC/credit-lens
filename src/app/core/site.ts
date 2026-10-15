export const APP_NAME = 'Credit Lens';
export const TAGLINE = 'Tu crédito, claro';
export const PORTFOLIO_URL = 'https://jfredmc.github.io/portfolio/';
export const REPO_URL = 'https://github.com/JFredMC/credit-lens';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/** Main navigation. Icons are SVG path data (24x24, stroke). */
export const NAV: NavItem[] = [
  { path: '/', label: 'Resumen', icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
];
