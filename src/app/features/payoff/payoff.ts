import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../../core/demo-store';
import { addMonths, formatCOP, formatPct, monthShort } from '../../domain/format';
import { PRODUCT_LABEL } from '../../domain/models';
import { Debt, Strategy, payoffPlan } from '../../domain/payoff';
import { LineChart } from '../../shared/line-chart';

@Component({
  selector: 'app-payoff',
  imports: [LineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Plan para salir de deudas</p>
        <h1>¿Cuándo quedas libre de deudas?</h1>
        <p class="lead">
          Paga el mínimo en todo y pon el dinero extra en una sola deuda. Cuando la terminas, su
          cuota pasa a la siguiente.
        </p>
      </div>
    </header>

    <section class="grid-2 top">
      <article class="card">
        <h2>Tu presupuesto</h2>
        <div class="field">
          <label for="extra">Dinero extra al mes</label>
          <input
            id="extra"
            type="range"
            min="0"
            max="2000000"
            step="50000"
            [value]="extra()"
            (input)="extra.set(+$any($event.target).value)"
            data-testid="extra"
          />
          <span class="hint num"
            >{{ cop(extra()) }} además de las cuotas mínimas ({{ cop(minTotal()) }})</span
          >
        </div>
        <div class="seg" role="group" aria-label="Estrategia">
          <button
            type="button"
            [attr.aria-pressed]="strategy() === 'avalanche'"
            (click)="strategy.set('avalanche')"
          >
            Avalancha · mayor tasa
          </button>
          <button
            type="button"
            [attr.aria-pressed]="strategy() === 'snowball'"
            (click)="strategy.set('snowball')"
          >
            Bola de nieve · menor saldo
          </button>
        </div>
        <p class="small muted expl">
          {{
            strategy() === 'avalanche'
              ? 'Avalancha ataca primero la deuda más cara: pagas menos intereses.'
              : 'Bola de nieve cierra primero la deuda más pequeña: ganas motivación rápido.'
          }}
        </p>
      </article>
      <article class="card result">
        @if (plan().stuck) {
          <div class="callout warn">
            Con este presupuesto los intereses superan los pagos. Sube el dinero extra.
          </div>
        } @else {
          <span class="kpi-label">Quedas libre de deudas en</span>
          <span class="big num" data-testid="payoff-date">{{ freeDate() }}</span>
          <span class="muted small">{{ plan().months }} meses</span>
          <dl class="stats">
            <div>
              <dt>Intereses</dt>
              <dd class="num">{{ cop(plan().totalInterest) }}</dd>
            </div>
            <div>
              <dt>Total pagado</dt>
              <dd class="num">{{ cop(plan().totalPaid) }}</dd>
            </div>
            <div>
              <dt>Vs. {{ strategy() === 'avalanche' ? 'bola de nieve' : 'avalancha' }}</dt>
              <dd class="num" [class.good]="saving() >= 0">
                {{ saving() >= 0 ? 'Ahorras ' : 'Pagas ' }}{{ cop(abs(saving())) }}
              </dd>
            </div>
          </dl>
        }
      </article>
    </section>

    @if (!plan().stuck) {
      <section class="grid-2">
        <article class="card">
          <h2>Orden de pago</h2>
          <ol class="order">
            @for (o of plan().order; track o.id; let i = $index) {
              <li>
                <span class="n">{{ i + 1 }}</span>
                <div>
                  <strong>{{ o.name }}</strong
                  ><span class="small muted"
                    >{{ rateOf(o.id) }} E.A. · saldo {{ cop(balanceOf(o.id)) }}</span
                  >
                </div>
                <span class="chip brand">{{ dateAt(o.month) }}</span>
              </li>
            }
          </ol>
        </article>
        <article class="card">
          <h2>Saldo total mes a mes <span class="muted small">(millones)</span></h2>
          <app-line-chart [data]="chart()" ariaLabel="Saldo total de deuda por mes" />
        </article>
      </section>
    }
    <p class="small muted">
      Tasas y saldos ficticios. Cálculo con interés mensual equivalente a la tasa efectiva anual; no
      incluye seguros ni cuotas de manejo.
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .page-head {
      margin: 0;
    }
    .expl {
      margin: 0.6rem 0 0;
    }
    .result {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .big {
      font-size: clamp(1.6rem, 6vw, 2.2rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      text-transform: capitalize;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.6rem;
      margin: 0.9rem 0 0;
    }
    dt {
      font-size: 0.74rem;
      color: var(--muted);
      font-weight: 600;
    }
    dd {
      margin: 0;
      font-weight: 700;
    }
    dd.good {
      color: var(--good);
    }
    .order {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.7rem;
    }
    .order li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.7rem;
      align-items: center;
    }
    .order li div {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .n {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--brand);
      color: #fff;
      font-weight: 800;
      font-size: 0.8rem;
    }
  `,
})
export class Payoff {
  protected readonly store = inject(DemoStore);
  protected readonly cop = formatCOP;
  protected readonly abs = Math.abs;
  protected readonly extra = signal(300_000);
  protected readonly strategy = signal<Strategy>('avalanche');

  protected readonly debts = computed<Debt[]>(() =>
    this.store
      .persona()
      .products.filter((p) => p.status !== 'CERRADA' && p.balance > 0)
      .map((p) => ({
        id: p.id,
        name: `${p.entity} · ${PRODUCT_LABEL[p.type]}`,
        balance: p.balance,
        annualRate: p.annualRate,
        minPayment: p.monthlyPayment + p.overdueAmount,
      })),
  );
  protected readonly minTotal = computed(() => this.debts().reduce((s, d) => s + d.minPayment, 0));
  protected readonly plan = computed(() => payoffPlan(this.debts(), this.extra(), this.strategy()));
  protected readonly other = computed(() =>
    payoffPlan(
      this.debts(),
      this.extra(),
      this.strategy() === 'avalanche' ? 'snowball' : 'avalanche',
    ),
  );
  protected readonly saving = computed(
    () => this.other().totalInterest - this.plan().totalInterest,
  );
  protected readonly freeDate = computed(() => this.dateAt(this.plan().months));
  protected readonly chart = computed(() => {
    const t = this.plan().timeline;
    const step = Math.max(1, Math.ceil(t.length / 24));
    return t
      .filter((_, i) => i % step === 0 || i === t.length - 1)
      .map((v, i, arr) => {
        const m = i === arr.length - 1 ? t.length - 1 : i * step;
        const d = addMonths(this.store.asOf, m);
        return {
          value: Math.round(v / 1_000_000),
          label: `${monthShort(d)} ${String(d.getUTCFullYear()).slice(2)}`,
        };
      });
  });

  protected dateAt(month: number): string {
    const d = addMonths(this.store.asOf, month);
    return `${monthShort(d)} ${d.getUTCFullYear()}`;
  }
  protected rateOf(id: string): string {
    return formatPct(this.debts().find((d) => d.id === id)?.annualRate ?? 0);
  }
  protected balanceOf(id: string): number {
    return this.debts().find((d) => d.id === id)?.balance ?? 0;
  }
}
