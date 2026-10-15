import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import { GoalsStore } from '../../core/goals-store';
import { addMonths, formatDate, toISO } from '../../domain/format';
import {
  GOAL_LABEL,
  GOAL_TIPS,
  GoalKind,
  formatGoalValue,
  goalProgress,
  isMet,
  validateGoal,
} from '../../domain/goals';

const LINKS: Record<GoalKind, { path: string; label: string }> = {
  score: { path: '/simulador', label: 'Probar el simulador' },
  utilization: { path: '/uso-de-cupos', label: 'Ver uso de cupos' },
  overdue: { path: '/plan-deudas', label: 'Armar plan de deudas' },
};

@Component({
  selector: 'app-goals-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Metas</p>
        <h1>Tus metas de crédito</h1>
        <p class="lead">
          Define a dónde quieres llegar y mira cuánto te falta. Te sugerimos metas según tu
          situación; puedes cambiarlas.
        </p>
      </div>
    </header>

    <section class="goals">
      @for (v of view(); track v.goal.id) {
        <article class="card goal" [class.met]="v.met" data-testid="goal">
          <div class="top">
            <h2>{{ label[v.goal.kind] }}</h2>
            <span class="chip" [class]="v.met ? 'good' : 'brand'">{{
              v.met ? 'Cumplida' : pct(v.progress) + ' %'
            }}</span>
          </div>
          <div
            class="bar"
            role="progressbar"
            [attr.aria-valuenow]="pct(v.progress)"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-label]="'Progreso: ' + pct(v.progress) + ' %'"
          >
            <span [style.width.%]="pct(v.progress)"></span>
          </div>
          <dl class="nums">
            <div>
              <dt>Inicio</dt>
              <dd>{{ fmt(v.goal.kind, v.goal.start) }}</dd>
            </div>
            <div>
              <dt>Hoy</dt>
              <dd>{{ fmt(v.goal.kind, v.current) }}</dd>
            </div>
            <div>
              <dt>Meta</dt>
              <dd>{{ fmt(v.goal.kind, v.goal.target) }}</dd>
            </div>
          </dl>
          <p class="small muted">Fecha objetivo: {{ date(v.goal.deadline) }}</p>
          @if (!v.met) {
            <ul class="tips small">
              @for (t of tips[v.goal.kind]; track t) {
                <li>{{ t }}</li>
              }
            </ul>
          }
          <div class="row">
            <a class="btn" [routerLink]="links[v.goal.kind].path">{{ links[v.goal.kind].label }}</a>
            <button class="btn ghost" type="button" (click)="goals.remove(v.goal.id)">
              Quitar meta
            </button>
          </div>
        </article>
      } @empty {
        <article class="card">
          <p class="muted">No tienes metas activas. Crea una abajo o restaura las sugeridas.</p>
        </article>
      }
    </section>

    <article class="card">
      <h2>Nueva meta</h2>
      <form class="form" (submit)="$event.preventDefault(); add()">
        <label class="field"
          ><span>Tipo de meta</span>
          <select name="kind" (change)="kind.set($any($event.target).value)">
            @for (k of kinds; track k) {
              <option [value]="k" [selected]="k === kind()">{{ label[k] }}</option>
            }
          </select>
        </label>
        <label class="field"
          ><span>{{ targetLabel() }}</span>
          <input
            name="target"
            type="number"
            inputmode="numeric"
            [value]="target()"
            (input)="target.set($any($event.target).value)"
          />
        </label>
        <label class="field"
          ><span>Fecha objetivo</span>
          <select name="deadline" (change)="months.set(+$any($event.target).value)">
            @for (n of [3, 6, 12, 24]; track n) {
              <option [value]="n" [selected]="n === months()">En {{ n }} meses</option>
            }
          </select>
        </label>
        <button class="btn primary" type="submit">Guardar meta</button>
      </form>
      @if (error(); as e) {
        <p class="error small" role="alert">{{ e }}</p>
      }
      <p class="small muted">
        Hoy: {{ fmt(kind(), goals.metrics()[kind()]) }}. Si ya tienes una meta de este tipo, se
        reemplaza.
      </p>
      <button class="btn ghost" type="button" (click)="goals.reset()">
        Restaurar metas sugeridas
      </button>
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
    .goals {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr);
    }
    @media (min-width: 1000px) {
      .goals {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .goal {
      display: grid;
      gap: 0.6rem;
      align-content: start;
    }
    .goal.met {
      border-color: var(--good);
    }
    .goal.met .bar > span {
      background: var(--good);
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: center;
    }
    .top h2 {
      margin: 0;
    }
    .nums {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 0;
      gap: 0.5rem;
    }
    .nums dt {
      font-size: 0.75rem;
      color: var(--muted);
    }
    .nums dd {
      margin: 0;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .goal p {
      margin: 0;
    }
    .tips {
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.3rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .form {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
      margin-bottom: 0.6rem;
    }
    @media (min-width: 800px) {
      .form {
        grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
      }
    }
    .form .field {
      margin: 0;
    }
    .form .field > span {
      font-size: 0.82rem;
      font-weight: 700;
    }
    .error {
      color: var(--bad);
    }
  `,
})
export class GoalsPage {
  private readonly demo = inject(DemoStore);
  protected readonly goals = inject(GoalsStore);
  protected readonly label = GOAL_LABEL;
  protected readonly tips = GOAL_TIPS;
  protected readonly links = LINKS;
  protected readonly kinds: GoalKind[] = ['score', 'utilization', 'overdue'];
  protected readonly date = formatDate;
  protected readonly fmt = formatGoalValue;
  protected readonly pct = (f: number) => Math.round(f * 100);

  protected readonly kind = signal<GoalKind>('score');
  protected readonly target = signal('');
  protected readonly months = signal(6);
  protected readonly error = signal('');

  protected readonly targetLabel = computed(() =>
    this.kind() === 'score'
      ? 'Puntaje meta (150–950)'
      : this.kind() === 'utilization'
        ? 'Uso máximo de cupos (%)'
        : 'Saldo en mora meta (COP)',
  );

  protected readonly view = computed(() => {
    const m = this.goals.metrics();
    return this.goals.goals().map((goal) => {
      const current = m[goal.kind];
      return { goal, current, progress: goalProgress(goal, current), met: isMet(goal, current) };
    });
  });

  protected add(): void {
    const k = this.kind();
    const raw = Number(String(this.target()).replace(/[^\d.]/g, ''));
    const target = k === 'utilization' ? raw / 100 : raw;
    const err =
      this.target() === '' ? 'Escribe una meta.' : validateGoal(k, target, this.goals.metrics()[k]);
    this.error.set(err);
    if (err) return;
    const deadline = toISO(addMonths(this.demo.asOf, this.months())).slice(0, 8) + '01';
    this.goals.add(k, target, deadline);
    this.target.set('');
  }
}
