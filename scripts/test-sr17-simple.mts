import assert from 'node:assert/strict';

import {
  buildSimpleSr17Schedule,
  distributeSr17DailyTarget,
  recommendedDailySr17,
  type SimpleSr17TaperDays,
} from '../src/lib/sr17-simple.ts';

const recommendationCases: Array<[number, number | undefined, number | null]> = [
  [0, undefined, null],
  [99.99, undefined, 75],
  [100, undefined, 150],
  [299.99, undefined, 150],
  [300, undefined, 225],
  [999.99, undefined, 225],
  [1000, undefined, 300],
  [1000, 350, 350],
  [1000, 450, 400],
  [1000, 250, 300],
];

for (const [dailySevenOh, highDailySr17, expected] of recommendationCases) {
  assert.equal(
    recommendedDailySr17(dailySevenOh, highDailySr17),
    expected,
    `${dailySevenOh} mg/day of 7-OH should recommend ${expected ?? 'no'} SR-17 target`,
  );
}

assert.deepEqual(distributeSr17DailyTarget(225, 6), {
  targetDaily: 225,
  actualDaily: 225,
  perDose: 37.5,
  dosesPerDay: 6,
  requestedFrequency: 6,
  frequencyAdjusted: false,
});
assert.deepEqual(distributeSr17DailyTarget(225, 1), {
  targetDaily: 225,
  actualDaily: 225,
  perDose: 75,
  dosesPerDay: 3,
  requestedFrequency: 1,
  frequencyAdjusted: true,
});
assert.deepEqual(distributeSr17DailyTarget(225, 4), {
  targetDaily: 225,
  actualDaily: 250,
  perDose: 62.5,
  dosesPerDay: 4,
  requestedFrequency: 4,
  frequencyAdjusted: false,
});
assert.deepEqual(distributeSr17DailyTarget(75, 6), {
  targetDaily: 75,
  actualDaily: 75,
  perDose: 12.5,
  dosesPerDay: 6,
  requestedFrequency: 6,
  frequencyAdjusted: false,
});
assert.deepEqual(distributeSr17DailyTarget(400, 1), {
  targetDaily: 400,
  actualDaily: 400,
  perDose: 100,
  dosesPerDay: 4,
  requestedFrequency: 1,
  frequencyAdjusted: true,
});
assert.equal(distributeSr17DailyTarget(225, 24).requestedFrequency, 6);

const durationCases: Array<
  [SimpleSr17TaperDays, number, number[], number[], number]
> = [
  [7, 3, [1, 1, 1, 1, 1, 1, 1], [4, 4, 4, 3, 2, 1, 1], 925],
  [10, 4, [1, 1, 1, 1, 1, 2, 1, 1, 1], [4, 4, 4, 4, 4, 3, 2, 1, 1], 1475],
  [14, 5, [1, 1, 1, 1, 1, 2, 2, 2, 2, 1], [4, 4, 4, 4, 4, 4, 3, 2, 1, 1], 2025],
];

for (const [
  duration,
  expectedStopDay,
  expectedStepDays,
  expectedSrFrequencies,
  expectedTotalSr,
] of durationCases) {
  const schedule = buildSimpleSr17Schedule(100, 4, 50, 4, duration);
  assert.equal(schedule.totalDurationDays, duration);
  assert.equal(schedule.sevenOhStopDay, expectedStopDay);
  assert.equal(schedule.steps[0].startDay, 1);
  assert.equal(schedule.steps.at(-1)?.endDay, duration);
  assert.deepEqual(
    schedule.steps.map((step) => step.endDay - step.startDay + 1),
    expectedStepDays,
  );
  assert.deepEqual(
    schedule.steps.map((step) => step.srDosesPerDay),
    expectedSrFrequencies,
  );
  assert.equal(schedule.totalSrMg, expectedTotalSr);
  assert.equal(schedule.totalSrTablets, Math.ceil(expectedTotalSr / 50));
  assert.equal(schedule.steps.at(-1)?.srPerDose, 25);
  assert.equal(schedule.steps.at(-1)?.tabletEquivalent, 0.5);
}

const tenDay = buildSimpleSr17Schedule(200, 4, 75, 3, 10);
assert.deepEqual(
  tenDay.steps.slice(0, 4).map((step) => step.sevenOhPerDose),
  [200, 100, 50, 0],
);
assert.deepEqual(
  tenDay.steps.slice(0, 4).map((step) => step.sevenOhTotalDaily),
  [800, 400, 200, 0],
);
assert.deepEqual(
  tenDay.steps.slice(-3).map((step) => step.srTotalDaily),
  [150, 75, 37.5],
);

const sixDoseSchedule = buildSimpleSr17Schedule(100, 6, 37.5, 6, 7);
assert.deepEqual(
  sixDoseSchedule.steps.map((step) => step.srDosesPerDay),
  [6, 6, 6, 5, 3, 2, 1],
);
assert.equal(sixDoseSchedule.steps.at(-1)?.srPerDose, 25);
assert.ok(
  sixDoseSchedule.steps.every((step) => step.srPerDose % 12.5 === 0),
);
assert.equal(
  sixDoseSchedule.totalSrTablets,
  Math.ceil(sixDoseSchedule.totalSrMg / 50),
);

console.log(
  'SR-17 simple cross-taper math: all daily targets, distributions, schedules, and supply totals passed.',
);
