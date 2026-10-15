import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Resumen · Credit Lens',
    loadComponent: () => import('./features/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
