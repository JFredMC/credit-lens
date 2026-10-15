import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DemoStore } from '../../core/demo-store';
import { buildReport, reportFileName } from '../../domain/report';
import { DocFormat } from '../../shared/report-docs';
import { saveBlob } from '../../shared/save-file';

type Busy = DocFormat | 'png' | 'share' | null;

@Component({
  selector: 'app-report-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Exportar reporte</p>
        <h1>Lleva tu reporte contigo</h1>
        <p class="lead">
          Descarga tu reporte completo en PDF, Excel o Word, o comparte una tarjeta con tu puntaje
          sin datos personales.
        </p>
      </div>
    </header>
    @let r = report();
    <div class="grid-2">
      <article class="card">
        <h2>Reporte completo</h2>
        <p class="small muted">
          Incluye datos de la persona, puntaje y factores, indicadores, obligaciones y consultas.
          Corte: {{ r.asOfLabel }}.
        </p>
        <div class="formats">
          <button
            class="btn primary"
            type="button"
            data-testid="export-pdf"
            [disabled]="busy()"
            (click)="download('pdf')"
          >
            {{ busy() === 'pdf' ? 'Generando…' : 'Descargar PDF' }}
          </button>
          <button
            class="btn"
            type="button"
            data-testid="export-xlsx"
            [disabled]="busy()"
            (click)="download('xlsx')"
          >
            {{ busy() === 'xlsx' ? 'Generando…' : 'Descargar Excel' }}
          </button>
          <button
            class="btn"
            type="button"
            data-testid="export-docx"
            [disabled]="busy()"
            (click)="download('docx')"
          >
            {{ busy() === 'docx' ? 'Generando…' : 'Descargar Word' }}
          </button>
        </div>
        <h3>Contenido</h3>
        <dl class="pairs">
          <dt>Puntaje</dt>
          <dd>{{ r.score }} · {{ r.band }}</dd>
          @for (k of r.kpis; track k[0]) {
            <dt>{{ k[0] }}</dt>
            <dd>{{ k[1] }}</dd>
          }
          <dt>Obligaciones</dt>
          <dd>{{ r.products.length }}</dd>
          <dt>Consultas</dt>
          <dd>{{ r.inquiries.length }}</dd>
        </dl>
        <p class="small muted">
          Los archivos se generan en tu navegador; nada se envía a un servidor.
        </p>
      </article>
      <article class="card">
        <h2>Tarjeta para compartir</h2>
        <p class="small muted">
          Muestra tu puntaje y cuatro indicadores. No incluye nombre, documento ni entidades.
        </p>
        @if (preview(); as src) {
          <img
            class="preview"
            [src]="src"
            alt="Vista previa de la tarjeta con el puntaje"
            data-testid="card-preview"
          />
        } @else {
          <button class="btn" type="button" (click)="showPreview()">Ver vista previa</button>
        }
        <div class="formats">
          <button
            class="btn primary"
            type="button"
            data-testid="export-png"
            [disabled]="busy()"
            (click)="downloadCard()"
          >
            Descargar imagen
          </button>
          @if (canShare) {
            <button class="btn" type="button" [disabled]="busy()" (click)="share()">
              Compartir
            </button>
          }
        </div>
      </article>
    </div>
    @if (error(); as e) {
      <p class="error" role="alert">{{ e }}</p>
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
    .formats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.8rem 0;
    }
    .pairs {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.35rem 1rem;
      margin: 0 0 0.8rem;
      font-size: 0.9rem;
    }
    .pairs dt {
      color: var(--muted);
    }
    .pairs dd {
      margin: 0;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .preview {
      width: 100%;
      max-width: 360px;
      border-radius: 16px;
      display: block;
    }
    .error {
      color: var(--bad);
    }
  `,
})
export class ReportPage {
  private readonly store = inject(DemoStore);
  protected readonly report = computed(() =>
    buildReport(this.store.persona(), this.store.score(), this.store.summary(), this.store.asOfIso),
  );
  protected readonly busy = signal<Busy>(null);
  protected readonly error = signal('');
  protected readonly preview = signal('');
  protected readonly canShare =
    typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  constructor() {
    // Drop a stale preview when the persona changes.
    effect(() => {
      this.report();
      untracked(() => this.preview.set(''));
    });
  }

  protected async download(fmt: DocFormat): Promise<void> {
    await this.run(fmt, async () => {
      const { buildReportDoc } = await import('../../shared/report-docs');
      saveBlob(await buildReportDoc(this.report(), fmt), reportFileName(this.store.persona(), fmt));
    });
  }

  protected async showPreview(): Promise<void> {
    const { drawReportCard } = await import('../../shared/report-card');
    this.preview.set(drawReportCard(this.report()).toDataURL('image/png'));
  }

  protected async downloadCard(): Promise<void> {
    await this.run('png', async () => {
      saveBlob(await this.png(), reportFileName(this.store.persona(), 'png'));
    });
  }

  protected async share(): Promise<void> {
    await this.run('share', async () => {
      const file = new File([await this.png()], reportFileName(this.store.persona(), 'png'), {
        type: 'image/png',
      });
      if (!navigator.canShare({ files: [file] })) {
        saveBlob(file, file.name);
        return;
      }
      try {
        await navigator.share({ files: [file], title: 'Mi crédito en Credit Lens' });
      } catch {
        /* user cancelled */
      }
    });
  }

  private async png(): Promise<Blob> {
    const { reportCardPng } = await import('../../shared/report-card');
    return reportCardPng(this.report());
  }

  private async run(kind: Busy, fn: () => Promise<void>): Promise<void> {
    this.busy.set(kind);
    this.error.set('');
    try {
      await fn();
    } catch {
      this.error.set('No se pudo generar el archivo. Intenta de nuevo.');
    } finally {
      this.busy.set(null);
    }
  }
}
