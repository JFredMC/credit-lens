import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DemoStore } from '../../core/demo-store';
import { formatCOP, formatPct } from '../../domain/format';
import { cardUsage } from '../../domain/utilization';

@Component({
  selector: 'app-utilization',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Uso de cupos</p>
        <h1>¿Cuánto de tus tarjetas estás usando?</h1>
        <p class="lead">
          Usar menos del 30 % de tu cupo total es una de las formas más rápidas de mejorar tu
          puntaje.
        </p>
      </div>
    </header>
    @let u = usage();
    @if (u.cards.length) {
      <article class="card total">
        <div class="t-head">
          <div>
            <span class="kpi-label">Uso total</span>
            <span class="kpi-value" data-testid="util-total">{{ pct(u.ratio) }}</span>
            <span class="small muted num">{{ cop(u.balance) }} de {{ cop(u.limit) }}</span>
          </div>
          <span class="chip" [class]="tone(u.ratio)">{{
            u.ratio <= 0.3 ? 'Saludable' : u.ratio <= 0.5 ? 'Alto' : 'Muy alto'
          }}</span>
        </div>
        <div class="meter" role="img" [attr.aria-label]="'Uso total ' + pct(u.ratio)">
          <span class="fill" [class]="tone(u.ratio)" [style.width.%]="min(u.ratio, 1) * 100"></span>
          <span class="mark" style="left: 30%"><span>30 %</span></span>
        </div>
        @if (u.toTarget > 0) {
          <p class="callout">
            Abona <strong class="num">{{ cop(u.toTarget) }}</strong> en total para quedar en
            30&nbsp;%. Empieza por la tarjeta más llena.
          </p>
        } @else {
          <p class="callout">
            Vas muy bien: estás por debajo del 30&nbsp;%. Si puedes, mantente cerca del 10&nbsp;%.
          </p>
        }
      </article>
      <section class="grid-2">
        @for (c of u.cards; track c.product.id) {
          <article class="card">
            <div class="t-head">
              <div>
                <strong>{{ c.product.entity }}</strong
                ><span class="small muted"> · cupo {{ cop(c.limit) }}</span>
              </div>
              <span class="chip num" [class]="tone(c.ratio)">{{ pct(c.ratio) }}</span>
            </div>
            <div class="meter sm">
              <span
                class="fill"
                [class]="tone(c.ratio)"
                [style.width.%]="min(c.ratio, 1) * 100"
              ></span
              ><span class="mark" style="left: 30%"></span>
            </div>
            <p class="small muted num">
              Saldo {{ cop(c.balance)
              }}{{
                c.toTarget
                  ? ' · abona ' + cop(c.toTarget) + ' para llegar a 30 %'
                  : ' · dentro de la meta'
              }}
            </p>
          </article>
        }
      </section>
    } @else {
      <p class="card muted">Este perfil no tiene tarjetas de crédito abiertas.</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .page-head {
      margin: 0;
    }
    .total {
      display: grid;
      gap: 1rem;
    }
    .t-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.6rem;
    }
    .t-head > div {
      display: flex;
      flex-direction: column;
    }
    .t-head > div:has(strong) {
      display: block;
    }
    .meter {
      position: relative;
      height: 16px;
      border-radius: 999px;
      background: var(--soft);
      margin: 0.6rem 0 1.1rem;
    }
    .meter.sm {
      height: 10px;
      margin: 0.7rem 0 0.4rem;
    }
    .fill {
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: inherit;
      background: var(--good);
    }
    .fill.warn {
      background: var(--warn);
    }
    .fill.bad {
      background: var(--bad);
    }
    .mark {
      position: absolute;
      top: -4px;
      bottom: -4px;
      width: 2px;
      background: var(--ink);
      opacity: 0.6;
    }
    .mark span {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.68rem;
      color: var(--muted);
      white-space: nowrap;
      margin-top: 4px;
    }
    p {
      margin: 0;
    }
  `,
})
export class Utilization {
  private readonly store = inject(DemoStore);
  protected readonly usage = computed(() => cardUsage(this.store.persona().products));
  protected readonly cop = formatCOP;
  protected readonly pct = formatPct;
  protected readonly min = Math.min;
  protected tone(r: number): string {
    return r <= 0.3 ? 'good' : r <= 0.5 ? 'warn' : 'bad';
  }
}
