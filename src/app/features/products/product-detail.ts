import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import { formatCOP, formatDate, formatPct } from '../../domain/format';
import { MONTH_LABEL, PRODUCT_LABEL, STATUS_LABEL } from '../../domain/models';
import { HISTORY_LEGEND, HistoryGrid } from '../../shared/history-grid';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, HistoryGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back small" routerLink="/obligaciones">← Mis obligaciones</a>
    @if (product(); as p) {
      <header class="page-head">
        <div>
          <p class="eyebrow">{{ typeLabel[p.type] }} · {{ p.sector }}</p>
          <h1>{{ p.entity }}</h1>
          <p class="lead">
            Abierta el {{ date(p.openedAt)
            }}{{ p.closedAt ? ' · cerrada el ' + date(p.closedAt) : '' }}
          </p>
        </div>
        <span
          class="chip"
          [class]="p.status === 'EN_MORA' ? 'bad' : p.status === 'AL_DIA' ? 'good' : ''"
          >{{ statusLabel[p.status] }}</span
        >
      </header>
      <section class="grid-4">
        <article class="card">
          <span class="kpi-label">Saldo</span><span class="kpi-value">{{ cop(p.balance) }}</span>
        </article>
        <article class="card">
          <span class="kpi-label">Cuota mensual</span
          ><span class="kpi-value">{{ p.monthlyPayment ? cop(p.monthlyPayment) : '—' }}</span>
        </article>
        <article class="card">
          <span class="kpi-label">{{ p.limit ? 'Cupo' : 'Monto inicial' }}</span
          ><span class="kpi-value">{{ cop(p.limit ?? p.originalAmount) }}</span>
        </article>
        <article class="card">
          <span class="kpi-label">Tasa E.A. (ficticia)</span
          ><span class="kpi-value">{{ p.annualRate ? pct(p.annualRate) : '—' }}</span>
        </article>
      </section>
      @if (p.overdueAmount) {
        <div class="callout warn">
          <strong>{{ cop(p.overdueAmount) }} vencidos · {{ p.daysLate }} días de mora.</strong>
          Ponerte al día es lo que más ayuda a tu puntaje.
        </div>
      }
      <article class="card">
        <h2>Hábito de pago · 24 meses</h2>
        <app-history-grid [history]="p.history" [asOf]="store.asOf" />
        <ul class="legend">
          @for (l of legend; track l.s) {
            <li><span [class]="'sw ' + l.s"></span>{{ l.label }}: {{ countOf(l.s) }}</li>
          }
        </ul>
      </article>
    } @else {
      <p class="card">Esta obligación no existe en el perfil actual.</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .back {
      text-decoration: none;
      font-weight: 700;
    }
    .page-head {
      margin: 0;
    }
    .card {
      display: flex;
      flex-direction: column;
    }
    .legend {
      list-style: none;
      padding: 0;
      margin: 0.8rem 0 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem 1rem;
      font-size: 0.78rem;
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
export class ProductDetail {
  readonly id = input.required<string>();
  protected readonly store = inject(DemoStore);
  protected readonly product = computed(() =>
    this.store.persona().products.find((p) => p.id === this.id()),
  );
  protected readonly cop = formatCOP;
  protected readonly pct = formatPct;
  protected readonly date = formatDate;
  protected readonly typeLabel = PRODUCT_LABEL;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly monthLabel = MONTH_LABEL;
  protected readonly legend = HISTORY_LEGEND;
  protected countOf(s: string): number {
    return this.product()?.history.filter((m) => m === s).length ?? 0;
  }
}
