import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Resumen · Credit Lens',
    loadComponent: () => import('./features/summary/summary').then((m) => m.Summary),
  },
  {
    path: 'puntaje',
    title: 'Mi puntaje · Credit Lens',
    loadComponent: () => import('./features/score/score').then((m) => m.Score),
  },
  {
    path: 'obligaciones',
    title: 'Mis obligaciones · Credit Lens',
    loadComponent: () => import('./features/products/products').then((m) => m.Products),
  },
  {
    path: 'obligaciones/:id',
    title: 'Detalle de obligación · Credit Lens',
    loadComponent: () => import('./features/products/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'simulador',
    title: 'Simulador · Credit Lens',
    loadComponent: () => import('./features/simulator/simulator').then((m) => m.Simulator),
  },
  {
    path: 'plan-deudas',
    title: 'Plan para salir de deudas · Credit Lens',
    loadComponent: () => import('./features/payoff/payoff').then((m) => m.Payoff),
  },
  {
    path: 'uso-de-cupos',
    title: 'Uso de cupos · Credit Lens',
    loadComponent: () => import('./features/utilization/utilization').then((m) => m.Utilization),
  },
  {
    path: 'permanencia',
    title: '¿Cuándo sale un reporte negativo? · Credit Lens',
    loadComponent: () => import('./features/legal/permanence-page').then((m) => m.PermanencePage),
  },
  {
    path: 'reclamos',
    title: 'Derecho de petición · Credit Lens',
    loadComponent: () => import('./features/claims/claims').then((m) => m.Claims),
  },
  {
    path: 'fuentes',
    title: 'Fuentes · Credit Lens',
    loadComponent: () => import('./features/legal/sources-page').then((m) => m.SourcesPage),
  },
  { path: '**', redirectTo: '' },
];
