import assert from 'node:assert/strict';
import test from 'node:test';
import {
  changePaceAt,
  extendAt,
  holdAt,
  largestCut,
  measureHint,
  niceStep,
  planPosition,
  readSavedPlan,
  restartAt,
  startPlan,
  tabletPieces,
  type PlanInput,
  type SavedPlan,
} from '../src/lib/taper-plan.ts';

const powder: PlanInput = {
  compound: '7oh',
  perDose: 15,
  dosesPerDay: 4,
  jumpOff: 5,
  days: 30,
  measure: { kind: 'powder' },
};
const tablets: PlanInput = { ...powder, measure: { kind: 'tablet', size: 15 } };

function neverRises(plan: SavedPlan) {
  for (let i = 1; i < plan.days.length; i++) {
    assert.ok(plan.days[i].totalDaily <= plan.days[i - 1].totalDaily + 1e-9, `rises on ${plan.days[i].date}`);
  }
}

test('A started plan is dated day by day from the start date', () => {
  const plan = startPlan(powder, '2026-11-01')!;
  assert.equal(plan.days.length, 30);
  assert.equal(plan.days[0].date, '2026-11-01');
  assert.equal(plan.days[29].date, '2026-11-30');
  assert.equal(plan.days[0].perDose, 15);
  // 5 mg/day over 2 doses is 2.5 mg, which a 1 mg scale can't read: it rounds to 3 x 2.
  assert.equal(plan.days[29].totalDaily, plan.endTotal);
  assert.equal(plan.endTotal, 6);
  for (const d of plan.days) assert.equal(d.perDose % 1, 0, `${d.date}: ${d.perDose}`);
});

test('A restart keeps the dose and frequency the reader entered, with no cliff after', () => {
  for (const measure of [{ kind: 'powder' } as const, { kind: 'tablet', size: 15 } as const]) {
    const plan = startPlan({ ...powder, measure }, '2026-11-01')!;
    for (const dose of [
      { perDose: measure.kind === 'tablet' ? 7.5 : 7, dosesPerDay: 6 },
      { perDose: measure.kind === 'tablet' ? 7.5 : 10, dosesPerDay: 4 },
    ]) {
      const r = restartAt(plan, 5, dose, 14)!;
      assert.equal(r.days[5].perDose, dose.perDose);
      assert.equal(r.days[5].dosesPerDay, dose.dosesPerDay);
      const cut = largestCut(r.days, 6);
      assert.ok(!cut || cut.pct < 0.55, `${measure.kind} ${dose.perDose}x${dose.dosesPerDay}: ${cut && Math.round(cut.pct * 100)}%`);
    }
  }
});

test('Slowing down keeps the first rebuilt day at its planned dose', () => {
  const plan = startPlan(tablets, '2026-11-01')!;
  const slow = changePaceAt(plan, 4, 7)!;
  assert.equal(slow.days[4].perDose, plan.days[4].perDose);
  assert.equal(slow.days[4].dosesPerDay, plan.days[4].dosesPerDay);
});

test('An end dose that rounds up to the start gives no schedule, not a one-day plan', () => {
  const p = startPlan({ ...tablets, perDose: 7.5, dosesPerDay: 2, jumpOff: 14, measure: { kind: 'tablet', size: 30 } }, '2026-11-01');
  assert.equal(p, null);
});

test('Holding repeats the previous day and shifts the rest without recalculating', () => {
  const plan = startPlan(powder, '2026-11-01')!;
  const held = holdAt(plan, 5)!;
  assert.deepEqual(held.days.slice(0, 5), plan.days.slice(0, 5));
  assert.equal(held.days[5].totalDaily, plan.days[4].totalDaily);
  assert.equal(held.days[5].date, '2026-11-06');
  assert.equal(held.days.length, 31);
  for (let i = 5; i < plan.days.length; i++) {
    assert.equal(held.days[i + 1].totalDaily, plan.days[i].totalDaily);
  }
  assert.equal(holdAt(plan, 0), null);
});

test('One more day repeats that day and shifts the rest', () => {
  const plan = startPlan(powder, '2026-11-01')!;
  const ext = extendAt(plan, 0)!;
  assert.equal(ext.days.length, 31);
  assert.deepEqual({ ...ext.days[1], date: '' }, { ...plan.days[0], date: '' });
  assert.equal(ext.days[1].date, '2026-11-02');
  for (let i = 1; i < plan.days.length; i++) assert.equal(ext.days[i + 1].totalDaily, plan.days[i].totalDaily);
  assert.equal(ext.changes.at(-1)!.kind, 'extend');
  const stop = startPlan({ ...powder, jumpOff: 0 }, '2026-11-01')!;
  assert.equal(extendAt(stop, stop.days.length - 1), null);
});

test('Pace changes keep earlier days, keep the end dose, and never raise a day', () => {
  for (const input of [powder, tablets, { ...powder, jumpOff: 0 }, { ...powder, perDose: 1000, dosesPerDay: 3 }]) {
    const plan = startPlan(input, '2026-11-01')!;
    const slow = changePaceAt(plan, 10, 7)!;
    assert.deepEqual(slow.days.slice(0, 10), plan.days.slice(0, 10));
    assert.equal(slow.days.length, plan.days.length + 7);
    const lastDose = [...slow.days].reverse().find((d) => d.totalDaily > 0)!;
    assert.equal(lastDose.totalDaily, plan.endTotal);
    neverRises(slow);
    const fast = changePaceAt(plan, 10, -5)!;
    assert.equal(fast.days.length, plan.days.length - 5);
    neverRises(fast);
  }
});

test('No pace change on a stop day, none that leaves too few days, none that does nothing', () => {
  const stop = startPlan({ ...powder, jumpOff: 0 }, '2026-11-01')!;
  assert.equal(changePaceAt(stop, stop.days.length - 1, 7), null);
  assert.equal(changePaceAt(stop, stop.days.length - 2, -5), null);
  const plan = startPlan(powder, '2026-11-01')!;
  assert.equal(changePaceAt(plan, plan.days.length - 1, -5), null);
  assert.equal(changePaceAt(plan, 3, 0), null);
});

test('Restarting from a named dose rebuilds from that day only', () => {
  const plan = startPlan(powder, '2026-11-01')!;
  const r = restartAt(plan, 8, { perDose: 14, dosesPerDay: 4 }, 25)!;
  assert.deepEqual(r.days.slice(0, 8), plan.days.slice(0, 8));
  assert.equal(r.days[8].perDose, 14);
  assert.equal(r.days.length, 8 + 25);
  neverRises({ ...r, days: r.days.slice(8) });
});

test('Tablet plans use whole quarter pieces every day', () => {
  const plan = startPlan(tablets, '2026-11-01')!;
  for (const d of plan.days) {
    if (d.totalDaily > 0) assert.notEqual(tabletPieces(d.perDose, 15), null, `${d.date}: ${d.perDose}`);
  }
  assert.deepEqual(measureHint(11.25, { kind: 'tablet', size: 15 }, 'mg'), {
    main: '¾ of a tablet',
    how: 'Cut a tablet into 4 equal pieces and take 3.',
  });
  assert.equal(measureHint(18.75, { kind: 'tablet', size: 15 }, 'mg').main, '1¼ tablets');
});

test('Powder amounts are scale readings, with the active amount when strength is known', () => {
  const hint = measureHint(1000, { kind: 'powder', strengthPct: 83 }, 'mg');
  assert.equal(hint.main, 'Weigh 1000 mg of powder');
  assert.match(hint.how, /830 mg active at 83%/);
  const big = startPlan({ ...powder, perDose: 1000, dosesPerDay: 3, days: 45 }, '2026-11-01')!;
  for (const d of big.days.slice(1, -1)) {
    if (d.perDose >= 200) assert.equal(d.perDose % 5, 0, `${d.date}: ${d.perDose}`);
    else assert.equal(d.perDose % 1, 0, `${d.date}: ${d.perDose}`);
  }
  assert.equal(niceStep(1000), 50);
  assert.equal(niceStep(15), 1);
});

test('Plan position and largest cut', () => {
  const plan = startPlan(powder, '2026-11-10')!;
  assert.deepEqual(planPosition(plan, '2026-11-08'), { kind: 'before', inDays: 2 });
  assert.deepEqual(planPosition(plan, '2026-11-12'), { kind: 'during', index: 2 });
  assert.deepEqual(planPosition(plan, '2026-12-20'), { kind: 'after' });
  assert.ok(largestCut(plan.days)!.pct <= 0.25);
});

test('Saved plans round-trip and junk is rejected', () => {
  const plan = startPlan(powder, '2026-11-01')!;
  assert.deepEqual(readSavedPlan(JSON.parse(JSON.stringify(plan))), plan);
  assert.equal(readSavedPlan({ v: 2 }), null);
  assert.equal(readSavedPlan(null), null);
});
