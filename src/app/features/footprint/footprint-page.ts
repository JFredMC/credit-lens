import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import { formatDate } from '../../domain/format';
import { footprint } from '../../domain/footprint';
import { SOURCES } from '../../domain/legal';

@Component({
  selector: 'app-footprint-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Huella de consulta</p>
        <h1>¿Quién ha consultado tu historial?</h1>
        <p class="lead">
          Cada vez que una entidad estudia una solicitud tuya, queda una huella. Muchas en poco
          tiempo pueden leerse como búsqueda urgente de crédito.
        </p>
      </div>
    </header>
    @let f = fp();
    <section class="kpis">
      <article class="card">
        <span class="kpi-label">Entidades · últimos 6 meses</span
        ><span class="kpi-value" data-testid="fp-6">{{ f.last6 }}</span
        ><span class="small muted">{{ f.entities6 }} entidad(es) distinta(s)</span>
      </article>
      <article class="card">
        <span class="kpi-label">Entidades · últimos 12 meses</span
        ><span class="kpi-value">{{ f.last12 }}</span
        ><span class="small muted">{{ f.entity.length }} en los últimos 24 meses</span>
      </article>
      <article class="card">
        <span class="kpi-label">Consultas tuyas</span
        ><span class="kpi-value">{{ f.self.length }}</span
        ><span class="small muted">No afectan tu puntaje</span>
      </article>
      <article class="card" [class]="'tone-' + factor().status">
        <span class="kpi-label">Impacto en tu puntaje</span
        ><span class="kpi-value">{{ factor().points }} / {{ factor().maxPoints }}</span
        ><span class="small muted">Factor «Solicitudes recientes»</span>
      </article>
    </section>

    <div class="grid-2">
      <article class="card">
        <h2>Consultas de entidades</h2>
        <ol class="tl">
          @for (q of f.entity; track q.date + q.entity) {
            <li [class.recent]="isRecent(q.date)">
              <span class="small muted">{{ date(q.date) }}</span>
              <strong>{{ q.entity }}</strong>
              <span class="small">{{ q.purpose }}</span>
              @if (isRecent(q.date)) {
                <span class="chip warn">Cuenta para tu puntaje</span>
              }
            </li>
          } @empty {
            <li class="muted">Ninguna entidad ha consultado tu historial en 24 meses.</li>
          }
        </ol>
        @if (f.self.length) {
          <h3>Tus consultas</h3>
          <ul class="self small muted">
            @for (q of f.self; track q.date) {
              <li>{{ date(q.date) }} · consulta propia</li>
            }
          </ul>
        }
      </article>

      <article class="card explain">
        <h2>Cómo te afecta</h2>
        <ul>
          <li>
            <strong>Tus propias consultas no cuentan.</strong> Por ley, consultar tu historial es
            gratis siempre y revisarlo no puede bajar tu calificación.
          </li>
          <li>
            <strong>Las de entidades sí pueden pesar.</strong> En el modelo educativo de Credit
            Lens, cada consulta de una entidad en los últimos 6 meses resta puntos del factor
            «Solicitudes recientes» (10 % del puntaje); después de 6 meses deja de contar. Cada
            central real usa su propio modelo.
          </li>
          <li>
            <strong>Compara ofertas en pocos días</strong> y solo solicita cuando tengas buenas
            probabilidades de aprobación.
          </li>
          <li>
            <strong>¿No reconoces una consulta?</strong> Puedes pedir información sobre los usuarios
            que han accedido a tus datos y reclamar si hay suplantación.
          </li>
        </ul>
        <div class="row">
          <a class="btn primary" routerLink="/reclamos">Presentar un reclamo</a>
          <a class="btn" routerLink="/simulador">Simular más solicitudes</a>
        </div>
        <p class="small muted">
          Ley 1266 de 2008, art. 10 par. 2 (mod. Ley 2157 de 2021) y art. 6 num. 1.4 ·
          <a [href]="src.url" target="_blank" rel="noopener noreferrer">ver texto</a> ·
          <a routerLink="/fuentes">Fuentes</a>
        </p>
      </article>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
    .page-head {
      margin: 0;
    }
    .kpis {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 1000px) {
      .kpis {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
      }
    }
    .kpis .card {
      display: flex;
      flex-direction: column;
      padding: 0.9rem;
      border-top: 3px solid var(--line);
    }
    .kpis .tone-good {
      border-top-color: var(--good);
    }
    .kpis .tone-warn {
      border-top-color: var(--warn);
    }
    .kpis .tone-bad {
      border-top-color: var(--bad);
    }
    .tl {
      list-style: none;
      margin: 0 0 0.6rem;
      padding: 0 0 0 1rem;
      border-left: 2px solid var(--line);
      display: grid;
      gap: 0.8rem;
    }
    .tl li {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.1rem;
    }
    .tl li::before {
      content: '';
      position: absolute;
      left: -1.4rem;
      top: 0.3rem;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--muted);
    }
    .tl li.recent::before {
      background: var(--warn);
    }
    .self {
      margin: 0;
      padding-left: 1.1rem;
    }
    .explain ul {
      margin: 0 0 1rem;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.6rem;
      font-size: 0.9rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.8rem;
    }
    .explain p {
      margin: 0;
    }
  `,
})
export class FootprintPage {
  private readonly store = inject(DemoStore);
  protected readonly date = formatDate;
  protected readonly src = SOURCES.ley1266;
  protected readonly fp = computed(() =>
    footprint(this.store.persona().inquiries, this.store.asOf),
  );
  protected readonly factor = computed(() =>
    this.store.score().factors.find((f) => f.id === 'inquiries')!,
  );
  protected isRecent(iso: string): boolean {
    const d = new Date(iso + 'T00:00:00Z');
    const a = this.store.asOf;
    return (a.getUTCFullYear() - d.getUTCFullYear()) * 12 + a.getUTCMonth() - d.getUTCMonth() < 6;
  }
}
