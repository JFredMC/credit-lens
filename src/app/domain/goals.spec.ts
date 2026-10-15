import { describe, expect, it } from 'vitest';
import { defaultGoals, goalProgress, nextScoreTarget, validateGoal } from './goals';

const asOf = new Date(Date.UTC(2026, 9, 1));

describe('goals', () => {
  it('measures progress in both directions', () => {
    expect(
      goalProgress({ id: 'a', kind: 'score', start: 500, target: 600, deadline: '' }, 550),
    ).toBe(0.5);
    expect(
      goalProgress({ id: 'b', kind: 'utilization', start: 0.9, target: 0.3, deadline: '' }, 0.6),
    ).toBeCloseTo(0.5);
    expect(goalProgress({ id: 'c', kind: 'overdue', start: 100, target: 0, deadline: '' }, 0)).toBe(
      1,
    );
    expect(
      goalProgress({ id: 'd', kind: 'score', start: 500, target: 600, deadline: '' }, 480),
    ).toBe(0);
  });
  it('suggests the next band and only relevant goals', () => {
    expect(nextScoreTarget(584)).toBe(600);
    expect(nextScoreTarget(885)).toBe(950);
    const g = defaultGoals({ score: 418, utilization: 0.95, overdue: 1000 }, 470, asOf);
    expect(g.map((x) => x.kind)).toEqual(['score', 'utilization', 'overdue']);
    expect(g[0].start).toBe(418);
    expect(g[0].deadline).toBe('2027-04-01');
    expect(defaultGoals({ score: 885, utilization: 0.1, overdue: 0 }, 860, asOf)).toHaveLength(1);
  });
  it('validates targets', () => {
    expect(validateGoal('score', 1000, 500)).toContain('150');
    expect(validateGoal('score', 400, 500)).toContain('Ya cumples');
    expect(validateGoal('utilization', 0.2, 0.5)).toBe('');
  });
});
