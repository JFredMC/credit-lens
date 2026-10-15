import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import { addMonths, formatCOP, formatDate, formatPct, monthShort } from '../../domain/format';
import { PRODUCT_LABEL } from '../../domain/models';
import { upcomingPayments } from '../../domain/payments';
import { LineChart } from '../../shared/line-chart';
import { ScoreGauge } from '../../shared/score-gauge';

@Component({
  selector: 'app-summary',
  imports: [ScoreGauge, LineChart, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './summary.html',
  styleUrl: './summary.css',
})
export class Summary {
  protected readonly store = inject(DemoStore);
  protected readonly cop = formatCOP;
  protected readonly pct = formatPct;
  protected readonly date = formatDate;
  protected readonly month = monthShort;
  protected readonly typeLabel = PRODUCT_LABEL;

  protected readonly firstName = computed(() => this.store.persona().name.split(' ')[0]);
  protected readonly change = computed(() => {
    const t = this.store.trend();
    return t[t.length - 1] - t[t.length - 4];
  });
  protected readonly chart = computed(() =>
    this.store.trend().map((value, i, arr) => ({
      value,
      label: monthShort(addMonths(this.store.asOf, i - arr.length + 1)),
    })),
  );
  protected readonly actions = computed(() =>
    [...this.store.score().factors]
      .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points))
      .slice(0, 3)
      .map((f) => ({ ...f, gain: f.maxPoints - f.points })),
  );
  protected readonly upcoming = computed(() =>
    upcomingPayments(this.store.persona().products, this.store.asOf).slice(0, 4),
  );
  protected readonly kpis = computed(() => {
    const s = this.store.summary();
    return [
      {
        label: 'Deuda total',
        value: formatCOP(s.totalDebt),
        note: `${s.activeProducts} productos abiertos`,
        tone: '',
      },
      {
        label: 'Cuotas del mes',
        value: formatCOP(s.monthlyPayments),
        note: `${formatPct(s.debtToIncome)} de tus ingresos`,
        tone: s.debtToIncome > 0.4 ? 'bad' : s.debtToIncome > 0.3 ? 'warn' : 'good',
      },
      {
        label: 'En mora',
        value: formatCOP(s.overdue),
        note: s.overdue ? 'Requiere atención' : 'Nada vencido',
        tone: s.overdue ? 'bad' : 'good',
      },
      {
        label: 'Uso de cupos',
        value: formatPct(s.utilization),
        note: 'Meta: menos de 30 %',
        tone: s.utilization > 0.5 ? 'bad' : s.utilization > 0.3 ? 'warn' : 'good',
      },
    ];
  });
}
