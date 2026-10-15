import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../../core/demo-store';
import { ProductStatus } from '../../domain/models';
import { HISTORY_LEGEND } from '../../shared/history-grid';
import { ProductCard } from './product-card';

type Filter = 'ALL' | ProductStatus;

@Component({
  selector: 'app-products',
  imports: [ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Mis obligaciones</p>
        <h1>Tus productos y su hábito de pago</h1>
        <p class="lead">
          Cada barra es un mes de los últimos 24. Verde es al día; amarillo a rojo, mora creciente.
        </p>
      </div>
      <div class="seg" role="group" aria-label="Filtrar">
        @for (f of filters; track f.id) {
          <button type="button" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">
            {{ f.label }} <span class="muted">{{ count(f.id) }}</span>
          </button>
        }
      </div>
    </header>
    <ul class="legend" aria-label="Convenciones">
      @for (l of legend; track l.s) {
        <li><span [class]="'sw ' + l.s"></span>{{ l.label }}</li>
      }
    </ul>
    <section class="grid-2">
      @for (p of list(); track p.id) {
        <app-product-card [product]="p" [asOf]="store.asOf" />
      } @empty {
        <p class="card muted">No hay productos en este filtro.</p>
      }
    </section>
  `,
  styles: `
    .legend {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem 1rem;
      font-size: 0.76rem;
      color: var(--muted);
    }
    .legend li {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .sw {
      width: 10px;
      height: 14px;
      border-radius: 3px;
      background: var(--soft);
    }
    .OK {
      background: var(--good);
    }
    .M30 {
      background: #facc15;
    }
    .M60 {
      background: #f59e0b;
    }
    .M90 {
      background: #ef4444;
    }
    .M120 {
      background: #991b1b;
    }
  `,
})
export class Products {
  protected readonly store = inject(DemoStore);
  protected readonly legend = HISTORY_LEGEND;
  protected readonly filter = signal<Filter>('ALL');
  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'Todas' },
    { id: 'AL_DIA', label: 'Al día' },
    { id: 'EN_MORA', label: 'En mora' },
    { id: 'CERRADA', label: 'Cerradas' },
  ];
  protected readonly list = computed(() => {
    const f = this.filter();
    return this.store.persona().products.filter((p) => f === 'ALL' || p.status === f);
  });
  protected count(f: Filter): number {
    return this.store.persona().products.filter((p) => f === 'ALL' || p.status === f).length;
  }
}
