import assert from 'node:assert/strict';

import {
  buildSimpleSr17Schedule,
  recommendedSr17PerDose,
  type SimpleSr17TaperDays,
} from '../src/lib/sr17-simple.ts';

const recommendationCases: Array<[number, number | undefined, number | null]> = [
  [0, undefined, null],
  [99.99, undefined, 25],
  [100, undefined, 50],
  [299.99, undefined, 50],
  [300, undefined, 75],
  [999.99, undefined, 75],
  [1000, undefined, 100],
  [1000, 75, 75],
  [1000, 125, 100],
  [1000, 25, 75],
];

for (const [sevenOhDose, highDoseSr17, expected] of recommendationCases) {
  assert.equal(
    recommendedSr17PerDose(sevenOhDose, highDoseSr17),
    expected,
    `7-OH ${sevenOhDose} mg should recommend ${expected ?? 'no'} SR-17 dose`,
  );
}

const durationCases: Array<
  [SimpleSr17TaperDays, number, number[], number[], number]
> = [
  [7, 3, [1, 1, 1, 2, 1, 1], [4, 4, 4, 3, 2, 1], 1025],
  [10, 4, [1, 1, 1, 1, 1, 2, 2, 1], [4, 4, 4, 4, 4, 3, 2, 1], 1525],
  [14, 5, [1, 1, 1, 1, 1, 2, 2, 2, 2, 1], [4, 4, 4, 4, 4, 4, 3, 2, 1, 1], 2025],
];

for (const [
  duration,
  expectedStopDay,
  expectedStepDays,
  expectedSrFrequencies,
  expectedTotalSr,
] of durationCases) {
  const schedule = buildSimpleSr17Schedule(100, 50, 4, duration);
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
  assert.equal(schedule.steps.at(-1)?.srPerDose, 25);
  assert.equal(schedule.steps.at(-1)?.tabletEquivalent, 0.5);
}

const tenDay = buildSimpleSr17Schedule(200, 75, 4, 10);
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
  [225, 150, 37.5],
);

const customFrequency = buildSimpleSr17Schedule(300, 75, 6, 7);
assert.deepEqual(
  customFrequency.steps.slice(-3).map((step) => step.srDosesPerDay),
  [5, 4, 1],
);

console.log(
  'SR-17 simple cross-taper math: all boundaries and schedules passed.',
);
