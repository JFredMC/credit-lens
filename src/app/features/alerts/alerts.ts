import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertsStore } from '../../core/alerts-store';
import { AlertKind, KIND_LABEL } from '../../domain/alerts';
import { formatDate } from '../../domain/format';

type KindFilter = 'all' | AlertKind;

@Component({
  selector: 'app-alerts',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Alertas</p>
        <h1>Lo que cambió en tu crédito</h1>
        <p class="lead">
          Consultas a tu historial, pagos próximos o vencidos, cupos altos y novedades en tu
          reporte.
        </p>
      </div>
      <button
        type="button"
        class="btn"
        (click)="store.markAll()"
        [disabled]="!store.unread()"
        data-testid="mark-all"
      >
        Marcar todas como leídas
      </button>
    </header>

    <div class="toolbar">
      <div class="seg" role="group" aria-label="Filtrar por tipo">
        @for (k of kinds; track k.id) {
          <button type="button" [attr.aria-pressed]="kind() === k.id" (click)="kind.set(k.id)">
            {{ k.label }} <span class="muted">{{ countOf(k.id) }}</span>
          </button>
        }
      </div>
      <label class="check">
        <input
          type="checkbox"
          [checked]="onlyUnread()"
          (change)="onlyUnread.set($any($event.target).checked)"
          data-testid="only-unread"
        />
        Solo sin leer ({{ store.unread() }})
      </label>
    </div>

    <ul class="feed" aria-label="Alertas">
      @for (a of list(); track a.id) {
        @let read = store.readIds().has(a.id);
        <li class="card alert" [class.unread]="!read" [attr.data-testid]="'alert-' + a.kind">
          <span class="sev" [class]="a.severity" aria-hidden="true"></span>
          <div class="body">
            <div class="meta">
              <span
                class="chip"
                [class]="
                  a.severity === 'critical' ? 'bad' : a.severity === 'warn' ? 'warn' : 'brand'
                "
                >{{ kindLabel[a.kind] }}</span
              >
              <span class="small muted">{{ date(a.date) }}</span>
              @if (!read) {
                <span class="new">Nueva</span>
              }
            </div>
            <strong>{{ a.title }}</strong>
            <p class="small muted">{{ a.body }}</p>
            <div class="actions">
              @if (a.link) {
                <a [routerLink]="a.link" (click)="store.setRead(a.id, true)" class="small"
                  >Ver detalle</a
                >
              }
              <button type="button" class="link small" (click)="store.setRead(a.id, !read)">
                {{ read ? 'Marcar como no leída' : 'Marcar como leída' }}
              </button>
            </div>
          </div>
        </li>
      } @empty {
        <li class="card muted">No hay alertas con estos filtros.</li>
      }
    </ul>

    <article class="card settings">
      <h2>Preferencias</h2>
      <div class="field">
        <label for="thr">Avisarme cuando una tarjeta supere este uso de cupo</label>
        <input
          id="thr"
          type="range"
          min="0.3"
          max="0.95"
          step="0.05"
          [value]="store.threshold()"
          (input)="store.setThreshold(+$any($event.target).value)"
        />
        <span class="hint num">{{ pct() }} %</span>
      </div>
      <p class="small muted">
        Alertas generadas con los datos ficticios de la demo. Por ley, las centrales deben ofrecer
        un aplicativo gratuito que te avise por correo cuando se reporte una obligación nueva a tu
        nombre (Ley 2157 de 2021, art. 10).
      </p>
    </article>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .page-head {
      margin: 0;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      justify-content: space-between;
    }
    .check {
      display: flex;
      gap: 0.45rem;
      align-items: center;
      font-size: 0.86rem;
      font-weight: 600;
    }
    .check input {
      accent-color: var(--brand);
    }
    .feed {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.6rem;
    }
    .alert {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 0.8rem;
      padding: 0.9rem 1rem;
    }
    .alert.unread {
      border-color: color-mix(in srgb, var(--brand) 45%, var(--line));
    }
    .sev {
      width: 4px;
      border-radius: 4px;
      background: var(--brand);
    }
    .sev.warn {
      background: var(--warn);
    }
    .sev.critical {
      background: var(--bad);
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.3rem;
    }
    .new {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--brand-strong);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .body p {
      margin: 0.2rem 0 0.4rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .actions a {
      font-weight: 700;
      text-decoration: none;
    }
    .link {
      background: none;
      border: 0;
      padding: 0;
      color: var(--muted);
      cursor: pointer;
      text-decoration: underline;
    }
    .settings p {
      margin: 0;
    }
  `,
})
export class Alerts {
  protected readonly store = inject(AlertsStore);
  protected readonly date = formatDate;
  protected readonly kindLabel = KIND_LABEL;
  protected readonly kind = signal<KindFilter>('all');
  protected readonly onlyUnread = signal(false);
  protected readonly kinds: { id: KindFilter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pago', label: 'Pagos' },
    { id: 'consulta', label: 'Consultas' },
    { id: 'cupo', label: 'Cupos' },
    { id: 'reporte', label: 'Reporte' },
  ];
  protected readonly pct = computed(() => Math.round(this.store.threshold() * 100));
  protected readonly list = computed(() =>
    this.store
      .alerts()
      .filter((a) => this.kind() === 'all' || a.kind === this.kind())
      .filter((a) => !this.onlyUnread() || !this.store.readIds().has(a.id)),
  );
  protected countOf(k: KindFilter): number {
    return this.store.alerts().filter((a) => k === 'all' || a.kind === k).length;
  }
}
