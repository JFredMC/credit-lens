import { Injectable, computed, inject, signal } from '@angular/core';
import { Goal, GoalKind, defaultGoals } from '../domain/goals';
import { DemoStore } from './demo-store';

const KEY = 'cl-goals';

/** Goals per persona, persisted in localStorage; seeded with suggestions on first visit. */
@Injectable({ providedIn: 'root' })
export class GoalsStore {
  private readonly demo = inject(DemoStore);
  private readonly map = signal<Record<string, Goal[]>>(this.load());

  readonly metrics = computed(() => ({
    score: this.demo.score().score,
    utilization: this.demo.summary().utilization,
    overdue: this.demo.summary().overdue,
  }));

  readonly goals = computed<Goal[]>(
    () =>
      this.map()[this.demo.persona().id] ??
      defaultGoals(this.metrics(), this.demo.persona().scoreTrend[0], this.demo.asOf),
  );

  add(kind: GoalKind, target: number, deadline: string): void {
    const start = this.metrics()[kind];
    const goal: Goal = { id: `g-${Date.now().toString(36)}`, kind, target, start, deadline };
    this.write([...this.goals().filter((g) => g.kind !== kind), goal]);
  }

  remove(id: string): void {
    this.write(this.goals().filter((g) => g.id !== id));
  }

  reset(): void {
    const pid = this.demo.persona().id;
    this.map.update((m) => {
      const next = { ...m };
      delete next[pid];
      return next;
    });
    this.persist();
  }

  private write(goals: Goal[]): void {
    const pid = this.demo.persona().id;
    this.map.update((m) => ({ ...m, [pid]: goals }));
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.map()));
    } catch {
      /* ignore */
    }
  }

  private load(): Record<string, Goal[]> {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Goal[]>;
    } catch {
      return {};
    }
  }
}
