import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FACTS, SOURCES } from '../../domain/legal';

@Component({
  selector: 'app-sources-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Fuentes</p>
        <h1>De dónde sale cada regla</h1>
        <p class="lead">
          Las reglas legales que usa Credit Lens se verificaron contra los textos oficiales el 14 de
          octubre de 2026. Es información educativa: no reemplaza la asesoría de un abogado.
        </p>
      </div>
    </header>
    <section class="card">
      <h2>Textos oficiales</h2>
      <ul class="sources">
        @for (s of sourceList; track s.id) {
          <li>
            <a [href]="s.url" target="_blank" rel="noopener noreferrer">{{ s.title }}</a>
            <span class="small muted">{{ s.publisher }}</span>
          </li>
        }
      </ul>
    </section>
    <section class="grid-2">
      @for (f of facts; track f.title) {
        <article class="card fact">
          <h3>{{ f.title }}</h3>
          <p>{{ f.text }}</p>
          <p class="small muted">
            {{ f.cite }} ·
            <a [href]="sources[f.source].url" target="_blank" rel="noopener noreferrer"
              >ver texto</a
            >
          </p>
        </article>
      }
    </section>
    <section class="card small muted">
      <h2>Sobre la demo</h2>
      <p>
        Credit Lens es un proyecto de portafolio con datos ficticios. No consulta ni almacena datos
        de centrales de riesgo reales, no hace scraping y no está afiliado a DataCrédito, Experian,
        TransUnion ni a ninguna entidad financiera. El puntaje es un modelo educativo propio.
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
    .sources {
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.6rem;
    }
    .sources li span {
      display: block;
    }
    .fact p {
      margin: 0.3rem 0 0;
      font-size: 0.9rem;
    }
  `,
})
export class SourcesPage {
  protected readonly sources = SOURCES;
  protected readonly sourceList = Object.values(SOURCES);
  protected readonly facts = FACTS;
}
