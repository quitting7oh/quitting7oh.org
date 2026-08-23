export const SIMPLE_SR17_TAPER_DAYS = [7, 10, 14] as const;

export type SimpleSr17TaperDays = (typeof SIMPLE_SR17_TAPER_DAYS)[number];
export type SimpleSr17Phase = 'cross-taper' | 'hold' | 'sr-taper';

export interface SimpleSr17Distribution {
  targetDaily: number;
  actualDaily: number;
  perDose: number;
  dosesPerDay: number;
  requestedFrequency: number;
  frequencyAdjusted: boolean;
}

export interface SimpleSr17Step {
  startDay: number;
  endDay: number;
  phase: SimpleSr17Phase;
  sevenOhPercent: number;
  sevenOhPerDose: number;
  sevenOhDosesPerDay: number;
  sevenOhTotalDaily: number;
  srPerDose: number;
  srDosesPerDay: number;
  srTotalDaily: number;
  tabletEquivalent: number;
}

export interface SimpleSr17Schedule {
  steps: SimpleSr17Step[];
  totalDurationDays: SimpleSr17TaperDays;
  totalSrMg: number;
  totalSrTablets: number;
  sevenOhStopDay: number;
}

interface SimpleDaySpec {
  phase: SimpleSr17Phase;
  sevenOhFactor: number;
  srFrequencyStage: 0 | 1 | 2 | 3 | 4;
  srDoseFactor: number;
}

function roundDose(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToTabletQuarter(value: number): number {
  return Math.max(12.5, Math.round(value / 12.5) * 12.5);
}

function repeat(spec: SimpleDaySpec, days: number): SimpleDaySpec[] {
  return Array.from({ length: days }, () => ({ ...spec }));
}

function daySpecs(durationDays: SimpleSr17TaperDays): SimpleDaySpec[] {
  const hold = (days: number) =>
    repeat(
      {
        phase: 'hold',
        sevenOhFactor: 0,
        srFrequencyStage: 0,
        srDoseFactor: 1,
      },
      days,
    );
  const srTaper = (
    days: number,
    srFrequencyStage: 1 | 2 | 3 | 4,
    srDoseFactor = 1,
  ) =>
    repeat(
      {
        phase: 'sr-taper',
        sevenOhFactor: 0,
        srFrequencyStage,
        srDoseFactor,
      },
      days,
    );
  const crossTaper = (sevenOhFactor: number) => ({
    phase: 'cross-taper' as const,
    sevenOhFactor,
    srFrequencyStage: 0 as const,
    srDoseFactor: 1,
  });

  if (durationDays === 7) {
    return [
      crossTaper(0.5),
      crossTaper(0.25),
      ...hold(1),
      ...srTaper(1, 1),
      ...srTaper(1, 2),
      ...srTaper(1, 3),
      ...srTaper(1, 4, 0.5),
    ];
  }

  if (durationDays === 10) {
    return [
      crossTaper(1),
      crossTaper(0.5),
      crossTaper(0.25),
      crossTaper(0),
      ...hold(1),
      ...srTaper(2, 1),
      ...srTaper(1, 2),
      ...srTaper(1, 3),
      ...srTaper(1, 4, 0.5),
    ];
  }

  return [
    crossTaper(1),
    crossTaper(0.5),
    crossTaper(0.25),
    crossTaper(0.125),
    crossTaper(0),
    ...hold(2),
    ...srTaper(2, 1),
    ...srTaper(2, 2),
    ...srTaper(2, 3),
    ...srTaper(1, 4, 0.5),
  ];
}

export function recommendedDailySr17(
  dailySevenOh: number,
  highDailySr17 = 300,
): number | null {
  if (!Number.isFinite(dailySevenOh) || dailySevenOh <= 0) return null;
  if (dailySevenOh < 100) return 75;
  if (dailySevenOh < 300) return 150;
  if (dailySevenOh < 1000) return 225;
  return Math.min(400, Math.max(300, highDailySr17));
}

export function distributeSr17DailyTarget(
  targetDaily: number,
  requestedFrequency: number,
): SimpleSr17Distribution {
  const normalizedTarget = Math.max(0, targetDaily);
  const normalizedRequestedFrequency = Math.min(
    6,
    Math.max(1, Math.round(requestedFrequency)),
  );
  const minimumFrequency = Math.max(1, Math.ceil(normalizedTarget / 100));
  const dosesPerDay = Math.min(
    6,
    Math.max(normalizedRequestedFrequency, minimumFrequency),
  );
  const perDose = Math.min(
    100,
    Math.max(
      12.5,
      Math.round(normalizedTarget / dosesPerDay / 12.5) * 12.5,
    ),
  );

  return {
    targetDaily: roundDose(normalizedTarget),
    actualDaily: roundDose(perDose * dosesPerDay),
    perDose: roundDose(perDose),
    dosesPerDay,
    requestedFrequency: normalizedRequestedFrequency,
    frequencyAdjusted: dosesPerDay !== normalizedRequestedFrequency,
  };
}

function srFrequencyStages(initialFrequency: number): number[] {
  const normalized = Math.min(6, Math.max(1, Math.round(initialFrequency)));
  const stages: Record<number, number[]> = {
    1: [1, 1, 1, 1, 1],
    2: [2, 1, 1, 1, 1],
    3: [3, 2, 1, 1, 1],
    4: [4, 3, 2, 1, 1],
    5: [5, 4, 3, 2, 1],
    6: [6, 5, 3, 2, 1],
  };
  return stages[normalized];
}

export function buildSimpleSr17Schedule(
  sevenOhPerDose: number,
  sevenOhDosesPerDay: number,
  srPerDose: number,
  srDosesPerDay: number,
  durationDays: SimpleSr17TaperDays,
): SimpleSr17Schedule {
  if (!SIMPLE_SR17_TAPER_DAYS.includes(durationDays)) {
    throw new Error('Simple SR-17 plan must be 7, 10, or 14 days.');
  }

  const normalizedSevenOhDose = Math.max(0, sevenOhPerDose);
  const normalizedSrDose = Math.max(0, srPerDose);
  const normalizedSevenOhFrequency = Math.min(
    6,
    Math.max(1, Math.round(sevenOhDosesPerDay)),
  );
  const frequencies = srFrequencyStages(srDosesPerDay);
  const specs = daySpecs(durationDays);
  const dailySteps = specs.map((spec, index): SimpleSr17Step => {
    const currentSrDosesPerDay = frequencies[spec.srFrequencyStage];
    const currentSevenOhDose = roundDose(
      normalizedSevenOhDose * spec.sevenOhFactor,
    );
    const currentSrDose = roundDose(
      roundToTabletQuarter(normalizedSrDose * spec.srDoseFactor),
    );

    return {
      startDay: index + 1,
      endDay: index + 1,
      phase: spec.phase,
      sevenOhPercent: spec.sevenOhFactor * 100,
      sevenOhPerDose: currentSevenOhDose,
      sevenOhDosesPerDay:
        currentSevenOhDose === 0 ? 0 : normalizedSevenOhFrequency,
      sevenOhTotalDaily: roundDose(
        currentSevenOhDose * normalizedSevenOhFrequency,
      ),
      srPerDose: currentSrDose,
      srDosesPerDay: currentSrDosesPerDay,
      srTotalDaily: roundDose(currentSrDose * currentSrDosesPerDay),
      tabletEquivalent: roundDose(currentSrDose / 50),
    };
  });

  const steps = dailySteps.reduce<SimpleSr17Step[]>((grouped, current) => {
    const previous = grouped.at(-1);
    if (
      previous &&
      previous.phase === current.phase &&
      previous.sevenOhPercent === current.sevenOhPercent &&
      previous.srPerDose === current.srPerDose &&
      previous.srDosesPerDay === current.srDosesPerDay
    ) {
      previous.endDay = current.endDay;
      return grouped;
    }
    grouped.push({ ...current });
    return grouped;
  }, []);

  const sevenOhStopDay =
    dailySteps.find((step) => step.sevenOhPerDose === 0)?.startDay ??
    durationDays;
  const totalSrMg = roundDose(
    dailySteps.reduce((total, step) => total + step.srTotalDaily, 0),
  );

  return {
    steps,
    totalDurationDays: durationDays,
    totalSrMg,
    totalSrTablets: Math.ceil(totalSrMg / 50),
    sevenOhStopDay,
  };
}
