import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import { BANDS, SCORE_MAX } from '../../domain/score';
import { ScoreGauge } from '../../shared/score-gauge';

@Component({
  selector: 'app-score',
  imports: [ScoreGauge, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Mi puntaje</p>
        <h1>Por qué tienes {{ store.score().score }} puntos</h1>
        <p class="lead">
          Tu puntaje se arma con cinco factores. Aquí ves cuántos puntos aporta cada uno, cuántos
          podría aportar y qué hacer para subirlo.
        </p>
      </div>
    </header>

    <div class="layout">
      <aside class="card side">
        <app-score-gauge [score]="store.score().score" [band]="store.score().band" />
        <ol class="bands" aria-label="Rangos del puntaje">
          @for (b of bands; track b.id; let i = $index) {
            <li [class.current]="b.id === store.score().band.id">
              <span class="sw" [class]="b.status"></span>
              <span>{{ b.label }}</span>
              <span class="num muted"
                >{{ b.min }}–{{ i < bands.length - 1 ? bands[i + 1].min - 1 : max }}</span
              >
            </li>
          }
        </ol>
        <a class="btn primary" routerLink="/simulador">Simular cambios</a>
      </aside>

      <section class="factors" aria-label="Factores del puntaje">
        @for (f of store.score().factors; track f.id) {
          <article class="card factor" [attr.data-testid]="'factor-' + f.id">
            <div class="f-head">
              <div>
                <h2>{{ f.label }}</h2>
                <span class="small muted">Peso {{ f.weight * 100 }} %</span>
              </div>
              <div class="pts">
                <span class="num"
                  ><strong>{{ f.points }}</strong> / {{ f.maxPoints }}</span
                >
                <span class="chip" [class]="f.status">{{ statusLabel[f.status] }}</span>
              </div>
            </div>
            <div class="bar" role="img" [attr.aria-label]="(f.value * 100).toFixed(0) + ' %'">
              <span [style.width.%]="f.value * 100" [class]="f.status"></span>
            </div>
            <p>{{ f.detail }}</p>
            <p class="tip"><strong>Qué hacer:</strong> {{ f.tip }}</p>
          </article>
        }
        <div class="callout small">
          <strong>Sobre este modelo.</strong> Es un modelo educativo y transparente de Credit Lens,
          no el de una central de riesgo. Por ley, consultar tu propio historial es gratis y no
          puede bajar tu calificación (Ley 1266 de 2008, art. 10, modificado por la Ley 2157 de
          2021). <a routerLink="/fuentes">Ver fuentes</a>
        </div>
      </section>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      gap: 1rem;
    }
    @media (min-width: 1000px) {
      .layout {
        grid-template-columns: 320px 1fr;
        align-items: start;
      }
      .side {
        position: sticky;
        top: 3rem;
      }
    }
    .side {
      display: grid;
      gap: 1rem;
    }
    .bands {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.25rem;
      font-size: 0.85rem;
    }
    .bands li {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.5rem;
      align-items: center;
      padding: 0.3rem 0.5rem;
      border-radius: 8px;
    }
    .bands li.current {
      background: var(--brand-soft);
      font-weight: 700;
    }
    .sw {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .sw.good {
      background: var(--good);
    }
    .sw.warn {
      background: var(--warn);
    }
    .sw.bad {
      background: var(--bad);
    }
    .factors {
      display: grid;
      gap: 0.8rem;
    }
    .f-head {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 0.6rem;
    }
    .f-head h2 {
      margin: 0;
    }
    .pts {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .bar span.good {
      background: var(--good);
    }
    .bar span.warn {
      background: var(--warn);
    }
    .bar span.bad {
      background: var(--bad);
    }
    .factor p {
      margin: 0.6rem 0 0;
      font-size: 0.9rem;
    }
    .tip {
      color: var(--muted);
    }
  `,
})
export class Score {
  protected readonly store = inject(DemoStore);
  protected readonly bands = BANDS;
  protected readonly max = SCORE_MAX;
  protected readonly statusLabel = { good: 'Bien', warn: 'Mejorable', bad: 'Crítico' };
}
