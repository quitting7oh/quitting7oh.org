export const SIMPLE_SR17_TAPER_DAYS = [7, 10, 14] as const;

export type SimpleSr17TaperDays = (typeof SIMPLE_SR17_TAPER_DAYS)[number];
export type SimpleSr17Phase = 'cross-taper' | 'hold' | 'sr-taper';

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
  sevenOhStopDay: number;
}

interface SimpleDaySpec {
  phase: SimpleSr17Phase;
  sevenOhFactor: number;
  srFrequencyDrop: number;
  srDoseFactor: number;
}

function roundDose(value: number): number {
  return Math.round(value * 100) / 100;
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
        srFrequencyDrop: 0,
        srDoseFactor: 1,
      },
      days,
    );
  const srTaper = (
    days: number,
    srFrequencyDrop: number,
    srDoseFactor = 1,
  ) =>
    repeat(
      {
        phase: 'sr-taper',
        sevenOhFactor: 0,
        srFrequencyDrop,
        srDoseFactor,
      },
      days,
    );
  const crossTaper = (sevenOhFactor: number) => ({
    phase: 'cross-taper' as const,
    sevenOhFactor,
    srFrequencyDrop: 0,
    srDoseFactor: 1,
  });

  if (durationDays === 7) {
    return [
      crossTaper(0.5),
      crossTaper(0.25),
      ...hold(1),
      ...srTaper(2, 1),
      ...srTaper(1, 2),
      ...srTaper(1, Number.POSITIVE_INFINITY, 0.5),
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
      ...srTaper(2, 2),
      ...srTaper(1, Number.POSITIVE_INFINITY, 0.5),
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
    ...srTaper(2, Number.POSITIVE_INFINITY),
    ...srTaper(1, Number.POSITIVE_INFINITY, 0.5),
  ];
}

export function recommendedSr17PerDose(
  sevenOhPerDose: number,
  highDoseSr17 = 100,
): number | null {
  if (!Number.isFinite(sevenOhPerDose) || sevenOhPerDose <= 0) return null;
  if (sevenOhPerDose < 100) return 25;
  if (sevenOhPerDose < 300) return 50;
  if (sevenOhPerDose < 1000) return 75;
  return Math.min(100, Math.max(75, highDoseSr17));
}

export function buildSimpleSr17Schedule(
  sevenOhPerDose: number,
  srPerDose: number,
  dosesPerDay: number,
  durationDays: SimpleSr17TaperDays,
): SimpleSr17Schedule {
  if (!SIMPLE_SR17_TAPER_DAYS.includes(durationDays)) {
    throw new Error('Simple SR-17 plan must be 7, 10, or 14 days.');
  }

  const normalizedSevenOhDose = Math.max(0, sevenOhPerDose);
  const normalizedSrDose = Math.max(0, srPerDose);
  const normalizedFrequency = Math.min(
    24,
    Math.max(1, Math.round(dosesPerDay)),
  );
  const specs = daySpecs(durationDays);
  const dailySteps = specs.map((spec, index): SimpleSr17Step => {
    const srDosesPerDay = Number.isFinite(spec.srFrequencyDrop)
      ? Math.max(1, normalizedFrequency - spec.srFrequencyDrop)
      : 1;
    const currentSevenOhDose = roundDose(
      normalizedSevenOhDose * spec.sevenOhFactor,
    );
    const currentSrDose = roundDose(normalizedSrDose * spec.srDoseFactor);

    return {
      startDay: index + 1,
      endDay: index + 1,
      phase: spec.phase,
      sevenOhPercent: spec.sevenOhFactor * 100,
      sevenOhPerDose: currentSevenOhDose,
      sevenOhDosesPerDay:
        currentSevenOhDose === 0 ? 0 : normalizedFrequency,
      sevenOhTotalDaily: roundDose(
        currentSevenOhDose * normalizedFrequency,
      ),
      srPerDose: currentSrDose,
      srDosesPerDay,
      srTotalDaily: roundDose(currentSrDose * srDosesPerDay),
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

  return {
    steps,
    totalDurationDays: durationDays,
    totalSrMg: roundDose(
      dailySteps.reduce((total, step) => total + step.srTotalDaily, 0),
    ),
    sevenOhStopDay,
  };
}
