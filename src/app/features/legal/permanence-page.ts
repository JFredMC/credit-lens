import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import { addMonths, formatDate, toISO } from '../../domain/format';
import { FACTS, SOURCES } from '../../domain/legal';
import { PRODUCT_LABEL, Product } from '../../domain/models';
import { permanence } from '../../domain/permanence';

interface Preset {
  product: Product;
  defaultStart: string;
  paidAt?: string;
}

@Component({
  selector: 'app-permanence-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Reportes negativos</p>
        <h1>¿Cuándo sale un reporte negativo?</h1>
        <p class="lead">
          Calcula la fecha estimada en que debe desaparecer un dato negativo según la Ley 1266 de
          2008, modificada por la Ley 2157 de 2021.
        </p>
      </div>
    </header>

    <div class="grid-2">
      <article class="card">
        <h2>Datos de la mora</h2>
        @if (presets().length) {
          <div class="presets">
            <span class="small muted">Usar una obligación de tu perfil:</span>
            @for (p of presets(); track p.product.id) {
              <button
                type="button"
                class="btn"
                (click)="usePreset(p)"
                [attr.data-testid]="'preset-' + p.product.id"
              >
                {{ p.product.entity }}
              </button>
            }
          </div>
        }
        <div class="field">
          <label for="start">¿Cuándo empezó la mora?</label>
          <input
            id="start"
            type="date"
            [value]="start()"
            (input)="start.set($any($event.target).value)"
            data-testid="perm-start"
          />
        </div>
        <div class="seg" role="group" aria-label="¿Ya pagaste?">
          <button type="button" [attr.aria-pressed]="paid()" (click)="paid.set(true)">
            Ya pagué
          </button>
          <button type="button" [attr.aria-pressed]="!paid()" (click)="paid.set(false)">
            Aún no he pagado
          </button>
        </div>
        @if (paid()) {
          <div class="field paidf">
            <label for="paid">¿Cuándo pagaste las cuotas vencidas?</label>
            <input
              id="paid"
              type="date"
              [value]="paidAt()"
              (input)="paidAt.set($any($event.target).value)"
              data-testid="perm-paid"
            />
          </div>
        }
      </article>

      <article class="card result" aria-live="polite">
        @let r = result();
        @if (r.error) {
          <div class="callout warn">{{ r.error }}</div>
        } @else if (r.removal) {
          <span class="kpi-label">{{
            r.alreadyRemoved ? 'Ya debió salir el' : 'Fecha estimada de salida'
          }}</span>
          <span class="big" data-testid="perm-result">{{ date(iso(r.removal)) }}</span>
          @if (!r.alreadyRemoved) {
            <span class="chip brand num">faltan {{ r.daysLeft }} días</span>
          } @else {
            <span class="chip good">Puedes pedir que lo retiren</span>
          }
          <p class="why">
            @switch (r.rule) {
              @case ('double') {
                Estuviste {{ r.arrearsDays }} días en mora, así que el dato permanece el doble ({{
                  r.arrearsDays * 2
                }}
                días) desde que pagaste.
              }
              @case ('cap4') {
                El doble de tu mora ({{ r.arrearsDays * 2 }} días) supera el tope, así que aplica el
                máximo de 4 años desde el pago.
              }
              @case ('expiry8') {
                Aplica la caducidad: el dato negativo se elimina a los 8 años de iniciada la mora,
                aunque el cálculo por pago diera una fecha posterior.
              }
              @case ('unpaid') {
                Mientras no pagues, el dato negativo se mantiene. Solo caduca a los 8 años desde el
                inicio de la mora. Ponerte al día activa el conteo del doble de la mora.
              }
            }
          </p>
          @if (r.alreadyRemoved) {
            <a class="btn primary" routerLink="/reclamos">Redactar un derecho de petición</a>
          }
        }
      </article>
    </div>

    <section class="card">
      <h2>Tus derechos, en corto</h2>
      <ul class="facts">
        @for (f of facts; track f.title) {
          <li>
            <strong>{{ f.title }}.</strong> {{ f.text }}
            <span class="cite small muted"
              >{{ f.cite }} ·
              <a [href]="sources[f.source].url" target="_blank" rel="noopener noreferrer"
                >fuente</a
              ></span
            >
          </li>
        }
      </ul>
      <p class="small muted">
        Estimación educativa. No cubre el régimen de transición de 2021 (art. 9 de la Ley 2157) ni
        casos particulares. <a routerLink="/fuentes">Ver todas las fuentes</a>
      </p>
    </section>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .page-head {
      margin: 0;
    }
    .presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .presets .btn {
      padding: 0.4rem 0.7rem;
      font-size: 0.82rem;
    }
    .paidf {
      margin-top: 0.85rem;
    }
    .result {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
      justify-content: center;
    }
    .big {
      font-size: clamp(1.6rem, 6vw, 2.2rem);
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .why {
      margin: 0.3rem 0;
      font-size: 0.92rem;
    }
    .facts {
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.7rem;
      font-size: 0.9rem;
    }
    .cite {
      display: block;
      margin-top: 0.15rem;
    }
  `,
})
export class PermanencePage {
  private readonly store = inject(DemoStore);
  protected readonly facts = FACTS.slice(1, 7);
  protected readonly sources = SOURCES;
  protected readonly date = formatDate;
  protected readonly iso = toISO;
  protected readonly typeLabel = PRODUCT_LABEL;

  protected readonly start = signal('2025-02-01');
  protected readonly paid = signal(true);
  protected readonly paidAt = signal('2025-08-01');

  protected readonly presets = computed<Preset[]>(() =>
    this.store
      .persona()
      .products.map((p) => {
        const first = p.history.findIndex((m) => m.startsWith('M'));
        if (first < 0) return null;
        const monthDate = (i: number) => toISO(addMonths(this.store.asOf, i - p.history.length));
        const defaultStart = monthDate(first);
        if (p.status === 'EN_MORA') return { product: p, defaultStart };
        if (p.closedAt) return { product: p, defaultStart, paidAt: p.closedAt };
        const lastLate = p.history.map((m) => m.startsWith('M')).lastIndexOf(true);
        return { product: p, defaultStart, paidAt: monthDate(lastLate + 1) };
      })
      .filter((x): x is Preset => !!x),
  );

  protected readonly result = computed(() =>
    permanence({
      defaultStart: this.start() || toISO(this.store.asOf),
      paidAt: this.paid() ? this.paidAt() || undefined : undefined,
      asOf: this.store.asOf,
    }),
  );

  constructor() {
    effect(() => {
      const first = this.presets()[0];
      if (first) this.usePreset(first);
    });
  }

  protected usePreset(p: Preset): void {
    this.start.set(p.defaultStart);
    this.paid.set(!!p.paidAt);
    if (p.paidAt) this.paidAt.set(p.paidAt);
  }
}
