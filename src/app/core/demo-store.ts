import { Injectable, computed, signal } from '@angular/core';
import { parseISO } from '../domain/format';
import { Persona } from '../domain/models';
import { AS_OF, PERSONAS } from '../domain/personas';
import { scorePersona } from '../domain/score';
import { summarize } from '../domain/summary';

const KEY = 'cl-persona';

/** Demo data source: fictional personas, selection persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class DemoStore {
  readonly personas = PERSONAS;
  readonly asOf = parseISO(AS_OF);
  readonly asOfIso = AS_OF;

  private readonly id = signal(this.read());

  readonly persona = computed<Persona>(
    () => PERSONAS.find((p) => p.id === this.id()) ?? PERSONAS[0],
  );
  readonly score = computed(() => scorePersona(this.persona(), this.asOf));
  readonly summary = computed(() => summarize(this.persona()));
  /** Last 12 months; the final point is always today's computed score. */
  readonly trend = computed(() => [...this.persona().scoreTrend.slice(0, 11), this.score().score]);

  select(id: string): void {
    if (!PERSONAS.some((p) => p.id === id)) return;
    this.id.set(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }

  private read(): string {
    try {
      return localStorage.getItem(KEY) ?? PERSONAS[0].id;
    } catch {
      return PERSONAS[0].id;
    }
  }
}
