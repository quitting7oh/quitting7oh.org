import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhases,
  buildWeeks,
  bupeSmallStripFromDay,
  bupeStripShortLabel,
  daysBetweenIso,
  daysFromPct,
  formatShortDate,
  generateSchedule,
  legacyDifficultyToDays,
  pctFromDuration,
  publishedBupeDurations,
  tabletEquivalents,
  tabletShortLabel,
} from '../src/lib/taper-schedule.ts';

/** Strip labels use non-breaking spaces; compare with plain ones. */
const sp = (label: string) => label.replace(/\u00A0/g, ' ');

test('7-OH default 30-day taper descends from 60 mg to 5 mg while holding >= 2 doses/day', () => {
  const res = generateSchedule('7oh', 15, 4, 5, 30);
  assert.equal(res.steps.length, 30);
  assert.equal(res.steps[0].totalDaily, 60);
  assert.equal(res.steps[0].dosesPerDay, 4);
  assert.equal(res.steps[29].totalDaily, 5);
  assert.equal(res.steps[29].dosesPerDay, 2);
  assert.equal(res.steps[29].perDose, 2.5);
  assert.ok(res.steps.every((s) => s.dosesPerDay >= 2));

  const phases = buildPhases(res.steps);
  assert.deepEqual(
    phases.map((p) => p.dosesPerDay),
    [4, 3, 2],
  );
  assert.equal(phases[0].startDay, 1);
  assert.equal(phases[phases.length - 1].endDay, 30);
});

test('Bupe published rapid taper triggers for 8 mg over 14 days and extends volumetric tail', () => {
  const standard = generateSchedule('bupe', 8, 1, 0.25, 14);
  assert.equal(standard.source, 'bupe-established');
  assert.equal(standard.steps.length, 14);
  assert.equal(standard.steps[0].perDose, 8);
  assert.equal(standard.steps[13].perDose, 0.25);

  const volumetric = generateSchedule('bupe', 8, 1, 0.05, 14);
  assert.equal(volumetric.source, 'bupe-established');
  assert.equal(volumetric.steps.length, 16);
  assert.equal(volumetric.steps[14].perDose, 0.1);
  assert.equal(volumetric.steps[15].perDose, 0.05);
});

test('Jump-off 0 appends an explicit stop day', () => {
  const res = generateSchedule('7oh', 15, 4, 0, 21);
  assert.equal(res.steps.length, 21);
  assert.equal(res.steps[20].totalDaily, 0);
  assert.equal(res.steps[20].perDose, 0);
});

test('Week grouping splits a 30-day schedule into 5 weeks and flags frequency shifts', () => {
  const res = generateSchedule('7oh', 15, 4, 5, 30);
  const weeks = buildWeeks(res.steps);
  assert.equal(weeks.length, 5);
  assert.equal(weeks[0].steps.length, 7);
  assert.equal(weeks[4].steps.length, 2);
  assert.equal(weeks[0].dropToFreq, 3);
  assert.equal(weeks[1].dropToFreq, 2);
});

test('Duration and daily percentage stay inverse within rounding', () => {
  const pct = pctFromDuration(60, 5, 30);
  assert.equal(pct, 8.2);
  assert.equal(daysFromPct(60, 5, pct), 30);
});

test('Tablet and strip short labels format cleanly', () => {
  assert.equal(tabletShortLabel(15, 15, 'tablet'), '1 tab');
  assert.equal(tabletShortLabel(11.25, 15, 'tablet'), '¾ tab');
  assert.equal(tabletShortLabel(3, 15, 'tablet'), '< ¼ tab');
  assert.equal(tabletShortLabel(0.5, 0.5, 'capsule'), '1 cap');
  assert.equal(tabletShortLabel(3.25, 0.5, 'capsule'), '6 caps + 0.25 g');
  assert.match(tabletEquivalents(11.25, 15, 'mg', 'tablet'), /11\.25 mg/);
  assert.equal(tabletShortLabel(15.5, 15, 'tablet'), '1–1¼ tabs');
  assert.equal(tabletShortLabel(9.25, 15, 'tablet'), '½–¾ tab');
  assert.equal(sp(bupeStripShortLabel(5.75)), '2 7/8 × 2 mg');
  assert.equal(sp(bupeStripShortLabel(7.5)), '15/16 of 8 mg');
  assert.equal(sp(bupeStripShortLabel(0.75)), '3/8 of 2 mg');
  assert.equal(sp(bupeStripShortLabel(16)), '2 × 8 mg strips');
  assert.equal(sp(bupeStripShortLabel(12)), '1 1/2 × 8 mg');
  assert.equal(tabletShortLabel(3, 0.5, 'capsule'), '6 caps');
  assert.equal(sp(bupeStripShortLabel(2)), '1/4 of 8 mg');
  assert.equal(sp(bupeStripShortLabel(0.25)), '1/8 of 2 mg');
  assert.equal(sp(bupeStripShortLabel(0.05)), 'Volumetric');
});

test('Legacy v1 difficulty presets map to matching day counts', () => {
  assert.equal(legacyDifficultyToDays('7oh', 'harder'), 30);
  assert.equal(legacyDifficultyToDays('7oh', 'easier'), 90);
  assert.equal(legacyDifficultyToDays('bupe', 'clinician'), 14);
  assert.equal(legacyDifficultyToDays('7oh', 'custom', 45), 45);
});

test('Local ISO date formatting does not drift across timezones', () => {
  assert.equal(formatShortDate('2026-11-20', 0), 'Nov 20');
  assert.equal(formatShortDate('2026-11-20', 29), 'Dec 19');
});

test('Bupe published tables only apply to once-a-day dosing', () => {
  const split = generateSchedule('bupe', 4, 2, 0.25, 14);
  assert.equal(split.source, 'bupe-percent');
  assert.equal(split.steps[0].perDose, 4);
  assert.equal(split.steps[0].dosesPerDay, 2);
});

test('A stopping dose at or above the starting total yields no schedule', () => {
  assert.equal(generateSchedule('7oh', 2, 2, 5, 30).steps.length, 0);
  assert.equal(generateSchedule('7oh', 2, 2, 4, 30).steps.length, 0);
});

test('daysBetweenIso counts whole local days across month and DST edges', () => {
  assert.equal(daysBetweenIso('2026-11-01', '2026-11-20'), 19);
  assert.equal(daysBetweenIso('2026-03-07', '2026-03-09'), 2);
  assert.equal(daysBetweenIso('2026-11-20', '2026-11-18'), -2);
  assert.equal(daysBetweenIso('', '2026-11-18'), null);
});

test('Daily totals equal per-dose × frequency without re-rounding', () => {
  const res = generateSchedule('bupe', 0.5, 2, 0.05, 10);
  for (const s of res.steps) {
    const expected = Math.round(s.perDose * s.dosesPerDay * 10000) / 10000;
    assert.ok(Math.abs(s.totalDaily - expected) < 1e-3, `day ${s.day}`);
  }
});

test('Default plans: every row total equals per-dose × frequency exactly', () => {
  for (const [sub, pd, n, j, d] of [
    ['7oh', 15, 4, 5, 30],
    ['leaf', 4, 4, 1, 30],
    ['mgm', 10, 3, 2, 30],
  ] as const) {
    for (const s of generateSchedule(sub, pd, n, j, d).steps) {
      const expected = Math.round(s.perDose * s.dosesPerDay * 10000) / 10000;
      assert.equal(s.totalDaily, expected, `${sub} day ${s.day}`);
    }
  }
});

test('Day 1 keeps the entered dose and totals never rise between days', () => {
  const tiny = generateSchedule('bupe', 0.375, 1, 0.05, 10);
  assert.equal(tiny.steps[0].perDose, 0.375);
  const odd = generateSchedule('7oh', 14.25, 3, 2, 21);
  assert.equal(odd.steps[0].totalDaily, 42.75);
  for (const [sub, pd, n, j, d] of [
    ['7oh', 1.25, 3, 0.5, 14],
    ['7oh', 15, 4, 5, 30],
    ['bupe', 10, 1, 0.25, 15],
    ['leaf', 4, 4, 1, 45],
  ] as const) {
    const steps = generateSchedule(sub, pd, n, j, d).steps;
    for (let i = 1; i < steps.length; i++) {
      assert.ok(steps[i].totalDaily <= steps[i - 1].totalDaily, `${sub} day ${steps[i].day}`);
    }
  }
});

test('Custom Suboxone tapers stay on 8 mg strip sixteenths above 2 mg', () => {
  const res = generateSchedule('bupe', 8, 1, 0.25, 15);
  assert.equal(res.source, 'bupe-percent');
  for (const s of res.steps) {
    if (s.perDose >= 2) assert.equal((s.perDose * 2) % 1, 0, `day ${s.day}`);
  }
});

test('Once a Suboxone plan needs 2 mg strips, later labels stay on 2 mg', () => {
  const res = generateSchedule('bupe', 8, 1, 0.25, 21);
  const from = bupeSmallStripFromDay(res.steps);
  assert.ok(Number.isFinite(from));
  for (const s of res.steps.filter((x) => x.day >= from && x.perDose > 0)) {
    const label = sp(bupeStripShortLabel(s.perDose, true));
    assert.ok(label.includes('2 mg') || label === 'Volumetric', `day ${s.day}: ${label}`);
  }
});

test('The last day lands exactly on the jump-off, and a 1-day request still tapers', () => {
  const res = generateSchedule('7oh', 15, 4, 1.75, 30);
  const last = res.steps[res.steps.length - 1];
  assert.equal(last.totalDaily, 1.75);
  const short = generateSchedule('7oh', 15, 4, 5, 1);
  assert.equal(short.steps[0].perDose, 15);
  assert.equal(short.steps[0].dosesPerDay, 4);
  assert.equal(short.steps[short.steps.length - 1].totalDaily, 5);
});

test('A tiny start with a zero jump-off still descends', () => {
  const res = generateSchedule('leaf', 0.25, 2, 0, 14);
  assert.ok(res.steps.length > 3);
  assert.ok(res.steps[1].totalDaily < res.steps[0].totalDaily);
});

test('No day falls below the jump-off, so the plan ends exactly on it', () => {
  for (const [sub, pd, n, j, d] of [
    ['leaf', 1, 6, 5, 14],
    ['leaf', 1, 3, 2.5, 7],
    ['7oh', 0.5, 3, 1, 5],
    ['7oh', 15, 4, 2.1, 60],
    ['bupe', 8, 2, 1, 10],
  ] as const) {
    const steps = generateSchedule(sub, pd, n, j, d).steps;
    for (const s of steps) {
      assert.ok(s.totalDaily >= j - 1e-9, `${sub} ${pd}x${n} j=${j}: day ${s.day} = ${s.totalDaily}`);
    }
    assert.equal(steps[steps.length - 1].totalDaily, j, `${sub} last day`);
    for (let i = 1; i < steps.length; i++) {
      assert.ok(steps[i].totalDaily <= steps[i - 1].totalDaily, `${sub} rises on day ${steps[i].day}`);
    }
  }
});

test('Percentage-derived durations keep the two-day minimum', () => {
  assert.ok((daysFromPct(4, 3.5, 50) ?? 0) >= 2);
});

test('Middle days stay measurable and doses per day never step back up', () => {
  for (const [sub, pd, n, j, d] of [
    ['7oh', 0.75, 4, 2, 5],
    ['leaf', 1, 3, 2, 7],
    ['mgm', 10, 3, 2, 30],
  ] as const) {
    const steps = generateSchedule(sub, pd, n, j, d).steps;
    const stepsPerUnit = sub === 'leaf' ? 20 : 4; // leaf: 0.05 g; others: 0.25 mg
    for (const s of steps.slice(1, -1)) {
      if (s.perDose >= 0.25) {
        const units = s.perDose * stepsPerUnit;
        assert.ok(Math.abs(units - Math.round(units)) < 1e-6, `${sub} day ${s.day}: ${s.perDose}`);
      }
    }
    for (let i = 1; i < steps.length; i++) {
      assert.ok(steps[i].dosesPerDay <= steps[i - 1].dosesPerDay, `${sub} day ${steps[i].day}`);
    }
  }
});

test('No day asks for a bigger single dose than day 1', () => {
  for (const [sub, pd, n, j, d] of [
    ['7oh', 2, 4, 5, 30],
    ['7oh', 1.5, 4, 5, 30],
    ['leaf', 0.5, 4, 1, 30],
    ['mgm', 1.5, 2, 2, 30],
    ['7oh', 15, 4, 40, 14],
    ['leaf', 0.4, 12, 4, 7],
  ] as const) {
    const steps = generateSchedule(sub, pd, n, j, d).steps;
    for (const s of steps) assert.ok(s.perDose <= pd + 1e-9, `${sub} ${pd}x${n} day ${s.day}: ${s.perDose}`);
    assert.ok(Math.abs(steps[steps.length - 1].totalDaily - j) < 1e-3, `${sub} ends on jump-off`);
  }
  // Ordinary plans still end on the minimum dose count.
  const std = generateSchedule('7oh', 15, 4, 5, 30).steps;
  assert.equal(std[std.length - 1].dosesPerDay, 2);
});

test('With a tablet size set, quarter tablets are used only while they track the curve', () => {
  const steps = generateSchedule('7oh', 15, 4, 5, 30, { tabletSize: 15 }).steps;
  const plain = generateSchedule('7oh', 15, 4, 5, 30).steps;
  const plannedCut = 1 - Math.pow(5 / 60, 1 / 29);
  let quarterDays = 0;
  let run = 1;
  for (let i = 1; i < steps.length - 1; i++) {
    const cut = 1 - steps[i].totalDaily / steps[i - 1].totalDaily;
    assert.ok(cut <= 1.5 * plannedCut + 0.02, `day ${steps[i].day} cuts ${(cut * 100).toFixed(1)}%`);
    run = steps[i].totalDaily === steps[i - 1].totalDaily ? run + 1 : 1;
    assert.ok(run <= 2, `day ${steps[i].day} holds ${run} days`);
    if (Math.abs(steps[i].perDose / 3.75 - Math.round(steps[i].perDose / 3.75)) < 1e-6) quarterDays++;
  }
  assert.ok(quarterDays > 0, 'some days use quarter tablets');
  assert.equal(steps[0].perDose, 15);
  assert.equal(steps[steps.length - 1].totalDaily, 5);
  assert.equal(steps.length, plain.length);
});

test('Suboxone custom mode ignores the published table', () => {
  assert.equal(generateSchedule('bupe', 8, 1, 0.25, 14).source, 'bupe-established');
  assert.equal(
    generateSchedule('bupe', 8, 1, 0.25, 14, { bupeMode: 'custom' }).source,
    'bupe-percent',
  );
  assert.deepEqual(publishedBupeDurations(8, 1), [5, 7, 10, 14, 21]);
  assert.deepEqual(publishedBupeDurations(4, 2), []);
});

test('Capsule hints agree with the short label', () => {
  assert.match(tabletEquivalents(3.75, 0.5, 'g', 'capsule'), /^7 capsules \(3\.5 g\) plus 0\.25 g/);
  assert.equal(tabletShortLabel(0.75, 1, 'capsule'), '< 1 cap');
  assert.match(tabletEquivalents(0.75, 1, 'g', 'capsule'), /Weigh 0\.75 g/);
});

test('Leaf and low Suboxone doses step finely enough to avoid big late cuts', () => {
  const leaf = generateSchedule('leaf', 4, 4, 1, 30).steps;
  const sub = generateSchedule('bupe', 6, 1, 0.25, 14, { bupeMode: 'custom' }).steps;
  for (const [name, steps] of [['leaf', leaf], ['bupe', sub]] as const) {
    let worst = 0;
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].totalDaily > 0) worst = Math.max(worst, 1 - steps[i].totalDaily / steps[i - 1].totalDaily);
    }
    assert.ok(worst < 0.36, `${name} largest cut ${(worst * 100).toFixed(0)}%`);
  }
});
