import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCOP, formatPct } from '../../domain/format';
import { PRODUCT_LABEL, Product, STATUS_LABEL } from '../../domain/models';
import { HistoryGrid } from '../../shared/history-grid';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, HistoryGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    <a
      class="card pc"
      [routerLink]="['/obligaciones', p.id]"
      [attr.data-testid]="'product-' + p.id"
    >
      <div class="top">
        <div class="logo" aria-hidden="true">{{ p.entity.slice(0, 2) }}</div>
        <div class="title">
          <strong>{{ p.entity }}</strong>
          <span class="small muted">{{ typeLabel[p.type] }}</span>
        </div>
        <span class="chip" [class]="tone()">{{ statusLabel[p.status] }}</span>
      </div>
      <dl class="nums">
        <div>
          <dt>Saldo</dt>
          <dd class="num">{{ cop(p.balance) }}</dd>
        </div>
        <div>
          <dt>Cuota</dt>
          <dd class="num">{{ p.monthlyPayment ? cop(p.monthlyPayment) : '—' }}</dd>
        </div>
        @if (p.overdueAmount) {
          <div>
            <dt>Vencido</dt>
            <dd class="num bad">{{ cop(p.overdueAmount) }} · {{ p.daysLate }} días</dd>
          </div>
        } @else if (p.limit) {
          <div>
            <dt>Uso del cupo</dt>
            <dd class="num">{{ pct(p.balance / p.limit) }}</dd>
          </div>
        }
      </dl>
      @if (p.limit && p.status !== 'CERRADA') {
        <div class="bar" aria-hidden="true">
          <span
            [style.width.%]="(p.balance / p.limit) * 100"
            [class.hot]="p.balance / p.limit > 0.5"
          ></span>
        </div>
      }
      <app-history-grid [history]="p.history" [asOf]="asOf()" [showAxis]="false" />
    </a>
  `,
  styles: `
    .pc {
      display: grid;
      gap: 0.8rem;
      color: inherit;
      text-decoration: none;
      transition:
        transform 0.15s ease,
        border-color 0.15s ease;
    }
    .pc:hover {
      border-color: var(--brand);
      transform: translateY(-1px);
    }
    .top {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.7rem;
      align-items: center;
    }
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--brand-strong);
      background: var(--brand-soft);
      text-transform: uppercase;
    }
    .title {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .nums {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 0.5rem;
      margin: 0;
    }
    dt {
      font-size: 0.72rem;
      color: var(--muted);
      font-weight: 600;
    }
    dd {
      margin: 0;
      font-weight: 700;
    }
    dd.bad {
      color: var(--bad);
    }
    .bar span.hot {
      background: var(--warn);
    }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly asOf = input.required<Date>();
  protected readonly cop = formatCOP;
  protected readonly pct = formatPct;
  protected readonly typeLabel = PRODUCT_LABEL;
  protected readonly statusLabel = STATUS_LABEL;
  protected tone(): string {
    const s = this.product().status;
    return s === 'EN_MORA' ? 'bad' : s === 'AL_DIA' ? 'good' : '';
  }
}
