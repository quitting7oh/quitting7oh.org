import assert from 'node:assert/strict';
import test from 'node:test';
import {
  changePace,
  cuttableDays,
  holdToday,
  measureHint,
  niceStep,
  planPosition,
  readSavedPlan,
  startPlan,
  type PlanInput,
} from '../src/lib/taper-plan.ts';

const input: PlanInput = {
  compound: '7oh',
  perDose: 15,
  dosesPerDay: 4,
  jumpOff: 5,
  days: 30,
  measure: { kind: 'powder' },
};

test('A started plan is dated day by day from the start date', () => {
  const plan = startPlan(input, '2026-11-01')!;
  assert.equal(plan.days.length, 30);
  assert.equal(plan.days[0].date, '2026-11-01');
  assert.equal(plan.days[29].date, '2026-11-30');
  assert.equal(plan.days[0].perDose, 15);
  assert.equal(plan.days[29].totalDaily, 5);
});

test('Holding keeps earlier days and today repeats yesterday', () => {
  const plan = startPlan(input, '2026-11-01')!;
  const held = holdToday(plan, 5);
  assert.deepEqual(held.days.slice(0, 5), plan.days.slice(0, 5));
  assert.equal(held.days[5].totalDaily, plan.days[4].totalDaily);
  assert.equal(held.days[5].date, '2026-11-06');
  assert.equal(held.days.length, 31);
  assert.equal(held.days[held.days.length - 1].totalDaily, 5);
  assert.equal(held.changes.at(-1)?.kind, 'hold');
});

test('Slowing down keeps today and earlier days, and never raises a day', () => {
  const plan = startPlan(input, '2026-11-01')!;
  const slow = changePace(plan, 4, 7);
  assert.deepEqual(slow.days.slice(0, 5), plan.days.slice(0, 5));
  assert.equal(slow.days.length, 37);
  for (let i = 1; i < slow.days.length; i++) {
    assert.ok(slow.days[i].totalDaily <= slow.days[i - 1].totalDaily + 1e-9, `day ${i + 1}`);
  }
  const fast = changePace(plan, 4, -5);
  assert.equal(fast.days.length, 25);
  assert.equal(fast.days[4].totalDaily, plan.days[4].totalDaily);
});

test('Plan position before, during, and after', () => {
  const plan = startPlan(input, '2026-11-10')!;
  assert.deepEqual(planPosition(plan, '2026-11-08'), { kind: 'before', inDays: 2 });
  assert.deepEqual(planPosition(plan, '2026-11-12'), { kind: 'during', index: 2 });
  assert.deepEqual(planPosition(plan, '2026-12-20'), { kind: 'after' });
});

test('Big doses step in round numbers and powder rounds to weighable amounts', () => {
  assert.equal(niceStep(1000), 50);
  assert.equal(niceStep(15), 0.5);
  assert.equal(niceStep(2), 0.25);
  const big = startPlan({ ...input, perDose: 1000, dosesPerDay: 3, days: 45 }, '2026-11-01')!;
  for (const d of big.days.slice(1, -1)) {
    if (d.perDose >= 200) assert.equal(d.perDose % 5, 0, `${d.date}: ${d.perDose}`);
  }
});

test('Tablet hints name quarter tablets or say to weigh', () => {
  assert.equal(measureHint(11.25, { kind: 'tablet', size: 15 }, 'mg'), '¾ tablet (15 mg each)');
  assert.equal(measureHint(30, { kind: 'tablet', size: 15 }, 'mg'), '2 tablets (15 mg each)');
  assert.match(measureHint(13.5, { kind: 'tablet', size: 15 }, 'mg'), /weigh or dissolve 13\.5 mg/);
  const plan = startPlan({ ...input, measure: { kind: 'tablet', size: 15 } }, '2026-11-01')!;
  assert.ok(cuttableDays(plan.days, plan.measure) > 0);
});

test('Saved plans round-trip and junk is rejected', () => {
  const plan = startPlan(input, '2026-11-01')!;
  assert.deepEqual(readSavedPlan(JSON.parse(JSON.stringify(plan))), plan);
  assert.equal(readSavedPlan({ v: 2 }), null);
  assert.equal(readSavedPlan(null), null);
});
