import { Injectable, computed, inject, signal } from '@angular/core';
import { buildAlerts } from '../domain/alerts';
import { DemoStore } from './demo-store';

const READ_KEY = 'cl-alerts-read';
const THRESHOLD_KEY = 'cl-alerts-threshold';

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

/** Alert feed + read state (per persona) persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly demo = inject(DemoStore);
  private readonly readMap = signal<Record<string, string[]>>(load(READ_KEY, {}));
  readonly threshold = signal<number>(load(THRESHOLD_KEY, 0.7));

  readonly alerts = computed(() =>
    buildAlerts(this.demo.persona(), this.demo.asOf, this.threshold()),
  );
  readonly readIds = computed(() => new Set(this.readMap()[this.demo.persona().id] ?? []));
  readonly unread = computed(() => this.alerts().filter((a) => !this.readIds().has(a.id)).length);

  setRead(id: string, read: boolean): void {
    const pid = this.demo.persona().id;
    this.readMap.update((m) => {
      const set = new Set(m[pid] ?? []);
      if (read) set.add(id);
      else set.delete(id);
      const next = { ...m, [pid]: [...set] };
      save(READ_KEY, next);
      return next;
    });
  }
  markAll(): void {
    const pid = this.demo.persona().id;
    this.readMap.update((m) => {
      const next = { ...m, [pid]: this.alerts().map((a) => a.id) };
      save(READ_KEY, next);
      return next;
    });
  }
  setThreshold(v: number): void {
    this.threshold.set(v);
    save(THRESHOLD_KEY, v);
  }
}
