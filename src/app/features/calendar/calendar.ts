import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DemoStore } from '../../core/demo-store';
import { buildIcs, monthGrid, monthSchedule } from '../../domain/calendar';
import { formatCOP } from '../../domain/format';
import { PRODUCT_LABEL } from '../../domain/models';
import { saveBlob } from '../../shared/save-file';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Calendario de pagos</p>
        <h1>Tus fechas de pago</h1>
        <p class="lead">
          Todas tus cuotas en un solo lugar. Descárgalas a tu calendario con un recordatorio dos
          días antes.
        </p>
      </div>
      <button type="button" class="btn primary" (click)="downloadIcs()" data-testid="download-ics">
        Agregar a mi calendario (.ics)
      </button>
    </header>

    <div class="layout">
      <article class="card">
        <div class="month-head">
          <button
            type="button"
            class="icon-btn"
            (click)="move(-1)"
            [disabled]="offset() <= 0"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h2 data-testid="month-title">{{ title() }}</h2>
          <button
            type="button"
            class="icon-btn"
            (click)="move(1)"
            [disabled]="offset() >= 11"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
        <table class="cal" aria-label="Calendario del mes">
          <thead>
            <tr>
              @for (d of weekdays; track d) {
                <th scope="col">
                  <abbr [title]="d">{{ d.slice(0, 2) }}</abbr>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (w of grid(); track $index) {
              <tr>
                @for (d of w; track $index) {
                  <td [class.out]="!d" [class.today]="d && isToday(d)">
                    @if (d) {
                      <span class="d">{{ d.getUTCDate() }}</span>
                      @if (byDay().get(d.getUTCDate()); as items) {
                        <span class="dots">
                          @for (s of items; track s.product.id) {
                            <span
                              class="dot"
                              [class.late]="s.overdue > 0"
                              [title]="s.product.entity"
                            ></span>
                          }
                        </span>
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </article>

      <article class="card">
        <div class="list-head">
          <h2>Pagos de {{ monthName() }}</h2>
          <strong class="num" data-testid="month-total">{{ cop(total()) }}</strong>
        </div>
        <ul class="list">
          @for (s of schedule(); track s.product.id) {
            <li [class.past]="s.date < store.asOf">
              <span class="day num">{{ s.date.getUTCDate() }}</span>
              <div class="who">
                <strong>{{ s.product.entity }}</strong>
                <span class="small muted">{{ typeLabel[s.product.type] }}</span>
                @if (s.overdue) {
                  <span class="chip bad">incluye {{ cop(s.overdue) }} vencidos</span>
                }
              </div>
              <strong class="num amt">{{ cop(s.amount) }}</strong>
            </li>
          } @empty {
            <li class="muted">No hay pagos este mes.</li>
          }
        </ul>
        <p class="small muted">
          Montos ficticios. Las cuotas de los meses futuros son iguales a la actual; lo vencido solo
          se suma en el mes en curso.
        </p>
      </article>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      gap: 1rem;
    }
    @media (min-width: 1000px) {
      .layout {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        align-items: start;
      }
    }
    .month-head,
    .list-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }
    .month-head h2,
    .list-head h2 {
      margin: 0;
    }
    .month-head h2::first-letter {
      text-transform: uppercase;
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--card);
      color: var(--ink);
      font-size: 1.2rem;
      cursor: pointer;
    }
    .icon-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .cal {
      table-layout: fixed;
      width: 100%;
    }
    .cal th,
    .cal td {
      white-space: normal;
      text-align: center;
      padding: 0.25rem 0;
      border: 0;
    }
    .cal abbr {
      text-decoration: none;
    }
    .cal td {
      height: 54px;
      vertical-align: top;
      border-radius: 10px;
    }
    .cal td.today {
      background: var(--brand-soft);
    }
    .cal td.today .d {
      color: var(--brand-strong);
      font-weight: 800;
    }
    .d {
      display: block;
      font-size: 0.85rem;
    }
    .dots {
      display: flex;
      justify-content: center;
      gap: 3px;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--brand);
    }
    .dot.late {
      background: var(--bad);
    }
    .list {
      list-style: none;
      margin: 0 0 0.8rem;
      padding: 0;
      display: grid;
      gap: 0.7rem;
    }
    .list li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.7rem;
      align-items: center;
    }
    .list li.past {
      opacity: 0.55;
    }
    .day {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: var(--brand-soft);
      color: var(--brand-strong);
      font-weight: 800;
    }
    .who {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 0;
    }
    .who .chip {
      margin-top: 0.2rem;
      white-space: normal;
    }
    .amt {
      text-align: right;
    }
  `,
})
export class Calendar {
  protected readonly store = inject(DemoStore);
  protected readonly cop = formatCOP;
  protected readonly typeLabel = PRODUCT_LABEL;
  protected readonly weekdays = [
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
    'domingo',
  ];
  protected readonly offset = signal(0);

  private readonly ym = computed(() => {
    const m = this.store.asOf.getUTCMonth() + this.offset();
    return { y: this.store.asOf.getUTCFullYear() + Math.floor(m / 12), m: m % 12 };
  });
  protected readonly monthName = computed(() => MONTHS[this.ym().m]);
  protected readonly title = computed(() => `${this.monthName()} ${this.ym().y}`);
  protected readonly grid = computed(() => monthGrid(this.ym().y, this.ym().m));
  protected readonly schedule = computed(() =>
    monthSchedule(this.store.persona().products, this.ym().y, this.ym().m, this.store.asOf),
  );
  protected readonly total = computed(() => this.schedule().reduce((s, x) => s + x.amount, 0));
  protected readonly byDay = computed(() => {
    const map = new Map<number, ReturnType<typeof this.schedule>>();
    for (const s of this.schedule()) {
      const d = s.date.getUTCDate();
      map.set(d, [...(map.get(d) ?? []), s]);
    }
    return map;
  });

  protected move(n: number): void {
    this.offset.update((o) => Math.min(11, Math.max(0, o + n)));
  }
  protected isToday(d: Date): boolean {
    return d.getTime() === this.store.asOf.getTime();
  }
  protected downloadIcs(): void {
    const ics = buildIcs(this.store.persona().products, this.store.asOf);
    saveBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'credit-lens-pagos.ics');
  }
}
