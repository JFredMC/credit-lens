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
  { path: '**', redirectTo: '' },
];
