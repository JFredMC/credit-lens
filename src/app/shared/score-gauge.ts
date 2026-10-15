import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SCORE_MAX, SCORE_MIN, ScoreBand } from '../domain/score';

/** Semicircular gauge 150–950. */
@Component({
  selector: 'app-score-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure
      class="gauge"
      [attr.aria-label]="'Puntaje ' + score() + ' de ' + max + ', ' + band().label"
    >
      <svg viewBox="0 0 200 118" role="img" aria-hidden="true">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" x2="1">
            <stop offset="0" stop-color="#ef4444" />
            <stop offset="0.45" stop-color="#f59e0b" />
            <stop offset="0.75" stop-color="#10b981" />
            <stop offset="1" stop-color="#14b8a6" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" class="track" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          class="value"
          [attr.stroke]="'url(#' + gid + ')'"
          [attr.stroke-dasharray]="len"
          [attr.stroke-dashoffset]="offset()"
        />
        <circle [attr.cx]="dot().x" [attr.cy]="dot().y" r="7" class="dot" />
      </svg>
      <figcaption>
        <span class="num score" data-testid="score-value">{{ score() }}</span>
        <span class="chip" [class]="band().status">{{ band().label }}</span>
        <span class="range">{{ min }} – {{ max }}</span>
      </figcaption>
    </figure>
  `,
  styles: `
    .gauge {
      margin: 0;
      position: relative;
      width: 100%;
      max-width: var(--gauge-w, 300px);
      margin-inline: auto;
    }
    svg {
      width: 100%;
      display: block;
    }
    .track,
    .value {
      fill: none;
      stroke-width: 14;
      stroke-linecap: round;
    }
    .track {
      stroke: var(--soft);
    }
    .value {
      transition: stroke-dashoffset 0.8s ease;
    }
    .dot {
      fill: var(--card);
      stroke: var(--ink);
      stroke-width: 3;
    }
    figcaption {
      position: absolute;
      inset: auto 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }
    .score {
      font-size: clamp(2.2rem, 9vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .range {
      font-size: 0.7rem;
      color: var(--muted);
    }
  `,
})
export class ScoreGauge {
  readonly score = input.required<number>();
  readonly band = input.required<ScoreBand>();
  protected readonly min = SCORE_MIN;
  protected readonly max = SCORE_MAX;
  protected readonly len = Math.PI * 80;
  protected readonly gid = 'g' + Math.random().toString(36).slice(2, 8);
  private readonly frac = computed(() =>
    Math.max(0, Math.min(1, (this.score() - SCORE_MIN) / (SCORE_MAX - SCORE_MIN))),
  );
  protected readonly offset = computed(() => this.len * (1 - this.frac()));
  protected readonly dot = computed(() => {
    const a = Math.PI * (1 - this.frac());
    return { x: 100 + 80 * Math.cos(a), y: 100 - 80 * Math.sin(a) };
  });
}
