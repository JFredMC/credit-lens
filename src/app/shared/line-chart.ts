import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface LinePoint {
  label: string;
  value: number;
}

/** Minimal responsive SVG line/area chart. */
@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + w + ' ' + hgt"
      role="img"
      [attr.aria-label]="ariaLabel()"
      preserveAspectRatio="none"
    >
      @for (g of grid(); track g.y) {
        <line [attr.x1]="pad" [attr.x2]="w - 8" [attr.y1]="g.y" [attr.y2]="g.y" class="grid" />
        <text [attr.x]="pad - 6" [attr.y]="g.y + 3" class="axis" text-anchor="end">{{ g.v }}</text>
      }
      <path [attr.d]="area()" class="area" />
      <path [attr.d]="line()" class="line" />
      @for (p of pts(); track $index) {
        @if ($last) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4.5" class="last" />
        }
        @if ($index % labelEvery() === 0 || $last) {
          <text [attr.x]="p.x" [attr.y]="hgt - 4" class="axis" text-anchor="middle">
            {{ p.label }}
          </text>
        }
      }
    </svg>
  `,
  styles: `
    svg {
      width: 100%;
      height: var(--chart-h, 180px);
      display: block;
      overflow: visible;
    }
    .grid {
      stroke: var(--line);
      stroke-dasharray: 3 4;
    }
    .axis {
      font-size: 10px;
      fill: var(--muted);
    }
    .line {
      fill: none;
      stroke: var(--brand);
      stroke-width: 2.5;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .area {
      fill: color-mix(in srgb, var(--brand) 14%, transparent);
    }
    .last {
      fill: var(--brand);
      stroke: var(--card);
      stroke-width: 2;
    }
  `,
})
export class LineChart {
  readonly data = input.required<LinePoint[]>();
  readonly ariaLabel = input('Gráfica');
  protected readonly w = 520;
  protected readonly hgt = 180;
  protected readonly pad = 36;
  private readonly range = computed(() => {
    const v = this.data().map((d) => d.value);
    let lo = Math.min(...v);
    let hi = Math.max(...v);
    const span = Math.max(hi - lo, 1);
    lo = Math.floor((lo - span * 0.15) / 10) * 10;
    hi = Math.ceil((hi + span * 0.15) / 10) * 10;
    return { lo, hi };
  });
  protected readonly labelEvery = computed(() => Math.ceil(this.data().length / 6));
  protected readonly pts = computed(() => {
    const d = this.data();
    const { lo, hi } = this.range();
    const iw = this.w - this.pad - 8;
    const ih = this.hgt - 30;
    return d.map((p, i) => ({
      label: p.label,
      x: this.pad + (d.length === 1 ? iw / 2 : (iw * i) / (d.length - 1)),
      y: 8 + ih * (1 - (p.value - lo) / (hi - lo || 1)),
    }));
  });
  protected readonly grid = computed(() => {
    const { lo, hi } = this.range();
    const ih = this.hgt - 30;
    return [0, 0.5, 1].map((f) => ({
      y: 8 + ih * (1 - f),
      v: Math.round(lo + (hi - lo) * f).toLocaleString('es-CO'),
    }));
  });
  protected readonly line = computed(() =>
    this.pts()
      .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' '),
  );
  protected readonly area = computed(() => {
    const p = this.pts();
    if (!p.length) return '';
    const base = this.hgt - 22;
    return `${this.line()} L${p[p.length - 1].x} ${base} L${p[0].x} ${base} Z`;
  });
}
