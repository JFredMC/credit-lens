import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DemoStore } from '../../core/demo-store';
import { formatCOP } from '../../domain/format';
import { PRODUCT_LABEL, ProductType } from '../../domain/models';
import { SimAction, simulate } from '../../domain/simulator';
import { ScoreGauge } from '../../shared/score-gauge';

@Component({
  selector: 'app-simulator',
  imports: [ScoreGauge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulator.html',
  styleUrl: './simulator.css',
})
export class Simulator {
  protected readonly store = inject(DemoStore);
  protected readonly cop = formatCOP;
  protected readonly typeLabel = PRODUCT_LABEL;

  protected readonly pay = signal<Record<string, number>>({});
  protected readonly catchUp = signal<Record<string, boolean>>({});
  protected readonly close = signal<Record<string, boolean>>({});
  protected readonly miss = signal('');
  protected readonly inquiries = signal(0);
  protected readonly newLoan = signal(false);
  protected readonly loanType = signal<ProductType>('CONSUMER');
  protected readonly loanAmount = signal(10_000_000);

  protected readonly open = computed(() =>
    this.store.persona().products.filter((p) => p.status !== 'CERRADA'),
  );
  protected readonly payable = computed(() => this.open().filter((p) => p.balance > 0));
  protected readonly late = computed(() => this.open().filter((p) => p.status === 'EN_MORA'));

  protected readonly actions = computed<SimAction[]>(() => {
    const a: SimAction[] = [];
    for (const [productId, amount] of Object.entries(this.pay()))
      if (amount > 0) a.push({ kind: 'pay', productId, amount });
    for (const [productId, on] of Object.entries(this.catchUp()))
      if (on) a.push({ kind: 'catchUp', productId });
    for (const [productId, on] of Object.entries(this.close()))
      if (on) a.push({ kind: 'close', productId });
    if (this.miss()) a.push({ kind: 'miss', productId: this.miss() });
    if (this.inquiries()) a.push({ kind: 'inquiries', count: this.inquiries() });
    if (this.newLoan())
      a.push({ kind: 'newLoan', type: this.loanType(), amount: this.loanAmount() });
    return a;
  });

  protected readonly result = computed(() =>
    simulate(this.store.persona(), this.actions(), this.store.asOf),
  );
  protected readonly factorDiff = computed(() => {
    const r = this.result();
    return r.after.factors.map((f, i) => ({
      label: f.label,
      diff: f.points - r.before.factors[i].points,
    }));
  });

  constructor() {
    // Reset when the demo persona changes.
    effect(() => {
      this.store.persona();
      this.reset();
    });
  }

  protected setPay(id: string, v: string): void {
    this.pay.update((m) => ({ ...m, [id]: Number(v) }));
  }
  protected toggle(sig: typeof this.catchUp, id: string, on: boolean): void {
    sig.update((m) => ({ ...m, [id]: on }));
  }
  protected num(v: string): number {
    return Number(v);
  }
  protected reset(): void {
    this.pay.set({});
    this.catchUp.set({});
    this.close.set({});
    this.miss.set('');
    this.inquiries.set(0);
    this.newLoan.set(false);
  }
}
