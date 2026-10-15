import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IBC_CONSUMO_OCT_2026,
  SOURCES,
  SourceId,
  USURY_CONSUMO_OCT_2026,
  USURY_VALID_LABEL,
} from '../../domain/legal';

interface Lesson {
  id: string;
  title: string;
  minutes: number;
  points: string[];
  cite?: { text: string; source: SourceId };
  link?: { path: string; label: string };
}

interface Myth {
  claim: string;
  truth: string;
  cite: string;
  source: SourceId;
}

/** Percent with two decimals (rates must not be rounded: 28,59 %, not 29 %). */
export function pct2(f: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(f)
    .replace(/\u00a0/g, ' ')
    .replace(/(\d)%/, '$1 %');
}

/** E.A. → monthly effective rate: (1 + EA)^(1/12) − 1. */
export function monthlyFromEa(ea: number): number {
  return Math.pow(1 + ea, 1 / 12) - 1;
}

@Component({
  selector: 'app-learn-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Aprende</p>
        <h1>Lo básico del crédito, sin letra pequeña</h1>
        <p class="lead">
          Lecciones cortas con la norma que las respalda. Información educativa, no asesoría legal
          ni financiera.
        </p>
      </div>
    </header>

    <section class="lessons">
      @for (l of lessons; track l.id) {
        <details
          class="card lesson"
          [open]="l.id === 'quien'"
          [attr.data-testid]="'lesson-' + l.id"
        >
          <summary>
            <span>{{ l.title }}</span>
            <span class="chip">{{ l.minutes }} min</span>
          </summary>
          <ul>
            @for (p of l.points; track p) {
              <li>{{ p }}</li>
            }
          </ul>
          <p class="small muted foot">
            @if (l.cite; as c) {
              {{ c.text }} ·
              <a [href]="sources[c.source].url" target="_blank" rel="noopener noreferrer"
                >ver texto</a
              >
            }
            @if (l.link; as k) {
              @if (l.cite) {
                ·
              }
              <a [routerLink]="k.path">{{ k.label }}</a>
            }
          </p>
        </details>
      }
    </section>

    <article class="card">
      <h2>Convierte una tasa efectiva anual</h2>
      <p class="small muted">
        Las tasas en Colombia suelen expresarse en efectivo anual (E.A.). Para saber cuánto pagas
        cada mes, convierte así: mensual = (1 + E.A.)^(1/12) − 1.
      </p>
      <div class="rate">
        <div class="field">
          <label for="ea">Tasa efectiva anual (%)</label>
          <input
            id="ea"
            type="number"
            inputmode="decimal"
            min="0"
            max="200"
            step="0.01"
            [value]="ea()"
            (input)="ea.set(+$any($event.target).value)"
            data-testid="ea"
          />
        </div>
        <div class="out">
          <span class="kpi-label">Equivale a</span>
          <span class="kpi-value" data-testid="mv">{{ monthly() }} mensual</span>
          <span class="chip" [class]="overUsury() ? 'bad' : 'good'" data-testid="usury">
            {{ overUsury() ? 'Supera' : 'No supera' }} la usura de consumo ({{ usury }} E.A.)
          </span>
        </div>
      </div>
      <p class="small muted">
        Usura para crédito de consumo y ordinario, vigencia {{ usuryValid }}: {{ usury }} E.A.
        (interés bancario corriente {{ ibc }} E.A. × 1,5). ·
        <a [href]="sources.sfcIbc.url" target="_blank" rel="noopener noreferrer"
          >ver certificación</a
        >
      </p>
    </article>

    <article class="card">
      <h2>Mitos frecuentes</h2>
      <div class="myths">
        @for (m of myths; track m.claim) {
          <div class="myth">
            <p><span class="chip bad">Mito</span> {{ m.claim }}</p>
            <p><span class="chip good">Realidad</span> {{ m.truth }}</p>
            <p class="small muted">
              {{ m.cite }} ·
              <a [href]="sources[m.source].url" target="_blank" rel="noopener noreferrer"
                >ver texto</a
              >
            </p>
          </div>
        }
      </div>
      <p class="small muted">
        Todas las normas citadas están en <a routerLink="/fuentes">Fuentes</a>.
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
    .lessons {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: minmax(0, 1fr);
      align-items: start;
    }
    @media (min-width: 1000px) {
      .lessons {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .lesson summary {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      gap: 0.6rem;
      align-items: center;
      font-weight: 700;
      list-style: none;
    }
    .lesson summary::-webkit-details-marker {
      display: none;
    }
    .lesson summary::after {
      content: '+';
      color: var(--muted);
      font-size: 1.2rem;
      margin-left: auto;
    }
    .lesson summary > span:first-child {
      flex: 1;
    }
    .lesson[open] summary::after {
      content: '−';
    }
    .lesson ul {
      margin: 0.8rem 0 0.6rem;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.45rem;
      font-size: 0.92rem;
    }
    .foot {
      margin: 0;
    }
    .rate {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr);
      align-items: center;
      margin: 0.6rem 0;
    }
    @media (min-width: 800px) {
      .rate {
        grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
      }
    }
    .rate .field {
      margin: 0;
    }
    .out {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      align-items: flex-start;
    }
    .myths {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr);
    }
    @media (min-width: 1000px) {
      .myths {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .myth p {
      margin: 0 0 0.35rem;
      font-size: 0.92rem;
    }
  `,
})
export class LearnPage {
  protected readonly sources = SOURCES;
  protected readonly usury = pct2(USURY_CONSUMO_OCT_2026);
  protected readonly ibc = pct2(IBC_CONSUMO_OCT_2026);
  protected readonly usuryValid = USURY_VALID_LABEL;
  protected readonly ea = signal(25);
  protected readonly monthly = computed(() => pct2(monthlyFromEa(Math.max(0, this.ea()) / 100)));
  protected readonly overUsury = computed(() => this.ea() / 100 > USURY_CONSUMO_OCT_2026);

  protected readonly lessons: Lesson[] = [
    {
      id: 'quien',
      title: '¿Quién es quién en tu historial?',
      minutes: 2,
      points: [
        'Fuente: la entidad con la que tienes la obligación (banco, operador de telefonía, almacén). Es quien reporta y responde por la calidad del dato.',
        'Operador: la central de riesgo que recibe los datos de muchas fuentes y los pone a disposición de los usuarios.',
        'Usuario: quien consulta tu información para estudiar una relación comercial, por ejemplo al pedir un crédito.',
        'Tú eres el titular: tienes derecho a conocer, actualizar y rectificar tu información.',
      ],
      cite: { text: 'Ley 1266 de 2008, arts. 1 y 3', source: 'ley1266fp' },
    },
    {
      id: 'puntaje',
      title: 'Qué mueve tu puntaje',
      minutes: 3,
      points: [
        'Pagar a tiempo es lo que más pesa. Un atraso reciente pesa más que uno antiguo.',
        'Usar poco de tus cupos ayuda: intenta mantenerte por debajo del 30 %.',
        'Varias solicitudes de crédito en poco tiempo restan; consultar tu propio historial no.',
        'Cada central usa su propio modelo. En Credit Lens verás un modelo educativo con pesos públicos.',
      ],
      link: { path: '/puntaje', label: 'Ver los factores de tu puntaje' },
    },
    {
      id: 'negativo',
      title: 'Si tienes un reporte negativo',
      minutes: 3,
      points: [
        'Antes de reportarte, la entidad debe avisarte con 20 días calendario de anticipación.',
        'Al pagar, el dato negativo permanece el doble del tiempo de la mora, máximo 4 años; y caduca a los 8 años desde que empezó la mora.',
        'Cuando el dato sale, cualquier puntaje que dependa de él debe actualizarse al mismo tiempo.',
        'Un reporte negativo no basta para negarte un crédito: puedes pedir por escrito las razones del rechazo a la entidad financiera.',
      ],
      cite: {
        text: 'Ley 1266 de 2008, arts. 10 par. 1, 12 y 13 (mod. Ley 2157 de 2021)',
        source: 'ley2157',
      },
      link: { path: '/permanencia', label: 'Calcular cuándo sale' },
    },
    {
      id: 'suplantacion',
      title: 'Protégete de la suplantación',
      minutes: 2,
      points: [
        'Revisa tu historial con frecuencia: es gratis siempre y no baja tu puntaje.',
        'Las centrales deben ofrecer un aplicativo gratuito que te avisa por correo, dentro de 5 días hábiles, cuando reportan una obligación nueva a tu nombre.',
        'Si te suplantaron, presenta una petición de corrección ante la fuente con tus soportes; debe cotejar los documentos en 10 días.',
        'Tu registro debe reflejar que no adquiriste la obligación, con la leyenda «Víctima de Falsedad Personal».',
      ],
      cite: { text: 'Ley 2157 de 2021, arts. 5, 7 y 10', source: 'ley2157' },
      link: { path: '/huella', label: 'Revisar tu huella de consulta' },
    },
    {
      id: 'reclamar',
      title: 'Cómo reclamar',
      minutes: 2,
      points: [
        'Puedes reclamar ante la fuente o ante la central de riesgo, por escrito y con tus soportes.',
        'En máximo 2 días hábiles debe aparecer la leyenda «reclamo en trámite».',
        'Deben responderte en 15 días hábiles, prorrogables 8 más; si no responden a tiempo, se entiende que la solicitud fue aceptada.',
        'Si no quedas conforme, acude a la SIC o, si la entidad es vigilada por ella, a la Superintendencia Financiera.',
      ],
      cite: { text: 'Ley 1266 de 2008, arts. 16 y 17', source: 'ley1266' },
      link: { path: '/reclamos', label: 'Escribir un derecho de petición' },
    },
    {
      id: 'tasas',
      title: 'Tasas de interés y usura',
      minutes: 2,
      points: [
        'Compara créditos por la tasa efectiva anual (E.A.), no por la cuota.',
        'La Superintendencia Financiera certifica cada mes el interés bancario corriente; la tasa de usura es 1,5 veces ese valor.',
        `En octubre de 2026, la usura para crédito de consumo y ordinario es ${pct2(USURY_CONSUMO_OCT_2026)} E.A.`,
        'Ningún interés remuneratorio ni de mora puede superar ese tope.',
      ],
      cite: {
        text: 'Superfinanciera, Resolución 1472 de 2026; Código de Comercio art. 884',
        source: 'sfcIbc',
      },
    },
  ];

  protected readonly myths: Myth[] = [
    {
      claim: 'Consultar mi historial baja mi puntaje.',
      truth: 'Tu propia consulta es gratis siempre y no puede disminuir tu calificación.',
      cite: 'Ley 1266 de 2008, art. 10 par. 2',
      source: 'ley2157',
    },
    {
      claim: 'Si pago, el reporte negativo desaparece al día siguiente.',
      truth: 'Permanece el doble del tiempo de la mora, con un máximo de 4 años desde el pago.',
      cite: 'Ley 1266 de 2008, art. 13',
      source: 'ley1266',
    },
    {
      claim: 'Estar en una central de riesgo es malo.',
      truth:
        'Las centrales también guardan tu información positiva, que permanece indefinidamente y te ayuda a acceder a crédito.',
      cite: 'Ley 1266 de 2008, art. 13',
      source: 'ley1266',
    },
    {
      claim: 'Me pueden reportar sin avisarme.',
      truth:
        'Deben avisarte antes y esperar 20 días calendario. Sin ese aviso, el reporte debe retirarse.',
      cite: 'Ley 1266 de 2008, art. 12 y par.',
      source: 'ley2157',
    },
  ];
}
