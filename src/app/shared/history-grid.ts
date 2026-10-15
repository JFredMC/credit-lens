import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { addMonths, monthShort } from '../domain/format';
import { MONTH_LABEL, MonthStatus } from '../domain/models';

/** 24-month payment habit strip ("hábito de pago"). */
@Component({
  selector: 'app-history-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="grid" [attr.aria-label]="'Hábito de pago de 24 meses'">
      @for (c of cells(); track $index) {
        <li [class]="c.s" [attr.title]="c.month + ': ' + c.label">
          <span class="sr">{{ c.month }}: {{ c.label }}</span>
        </li>
      }
    </ol>
    @if (showAxis()) {
      <div class="axis">
        <span>{{ cells()[0].month }}</span
        ><span>{{ cells()[cells().length - 1].month }}</span>
      </div>
    }
  `,
  styles: `
    .grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(24, 1fr);
      gap: 3px;
    }
    li {
      aspect-ratio: 1 / 1.6;
      border-radius: 3px;
      background: var(--soft);
    }
    .OK {
      background: var(--good);
      opacity: 0.85;
    }
    .M30 {
      background: #facc15;
    }
    .M60 {
      background: #f59e0b;
    }
    .M90 {
      background: #ef4444;
    }
    .M120 {
      background: #991b1b;
    }
    .axis {
      display: flex;
      justify-content: space-between;
      font-size: 0.68rem;
      color: var(--muted);
      margin-top: 0.25rem;
    }
    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
  `,
})
export class HistoryGrid {
  readonly history = input.required<MonthStatus[]>();
  readonly asOf = input.required<Date>();
  readonly showAxis = input(true);
  protected readonly cells = computed(() => {
    const h = this.history();
    return h.map((s, i) => {
      const d = addMonths(this.asOf(), i - h.length);
      return {
        s,
        label: MONTH_LABEL[s],
        month: `${monthShort(d)} ${String(d.getUTCFullYear()).slice(2)}`,
      };
    });
  });
}

export const HISTORY_LEGEND: { s: MonthStatus; label: string }[] = [
  { s: 'OK', label: 'Al día' },
  { s: 'M30', label: '30 días' },
  { s: 'M60', label: '60 días' },
  { s: 'M90', label: '90 días' },
  { s: 'M120', label: '120+ días' },
  { s: 'NA', label: 'Sin dato' },
];
