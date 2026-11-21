export type SubstanceKey = 'bupe' | '7oh' | 'mgm' | 'pseudo' | 'leaf';
export type LegacyDifficulty =
  | 'easier'
  | 'clinician'
  | 'harder'
  | 'super-hard'
  | 'custom';

export interface SubstanceConfig {
  label: string;
  shortLabel: string;
  tagline: string;
  unit: string;
  stepUnit: 'day' | 'week';
  defaultPerDose: number;
  defaultDosesPerDay: number;
  /** Floor on doses-per-day as the schedule descends. Short half-life
   *  substances (7-OH especially) keep at least 2×/day when the reader
   *  starts at 2+ doses so inter-dose gaps don't stretch overnight. */
  minDosesPerDay: number;
  defaultJumpOff: number;
  /** Default tablet / capsule size for the substance. null for bupe
   *  (bupe uses commercial 8 / 4 / 2 mg strip fractions instead). */
  defaultTabletSize: number | null;
  tabletPresets: number[];
  frequencyPresets: number[];
  durationPresets: { days: number; label: string }[];
  defaultDurationDays: number;
  sliderMinDays: number;
  sliderMaxDays: number;
  tabletUnitName: string;
  note: string;
  related: { label: string; href: string }[];
}

export const SUBSTANCES: Record<SubstanceKey, SubstanceConfig> = {
  '7oh': {
    label: '7-OH',
    shortLabel: '7-OH',
    tagline: 'Short-acting · keeps ≥2 doses/day',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 15,
    defaultDosesPerDay: 4,
    minDosesPerDay: 2,
    defaultJumpOff: 5,
    defaultTabletSize: 15,
    tabletPresets: [15, 20, 30],
    frequencyPresets: [1, 2, 3, 4],
    durationPresets: [
      { days: 21, label: '21d' },
      { days: 30, label: '30d' },
      { days: 60, label: '60d' },
      { days: 90, label: '90d' },
    ],
    defaultDurationDays: 30,
    sliderMinDays: 7,
    sliderMaxDays: 90,
    tabletUnitName: 'tablet',
    note: 'Community-observed 7-OH tapers often cut faster in the first half, then slow down near the bottom. A plan can end at a low jump-off dose rather than zero. As the daily total falls, this calculator reduces doses per day so each dose stays practical to measure.',
    related: [
      { label: 'Tapering Off 7-OH', href: '/for-you/tapering-7oh' },
      { label: 'Quit 7-OH with Kratom Leaf', href: '/medications-supplements/quit-7-oh-with-kratom-leaf' },
      { label: 'Helper Medications', href: '/medications-supplements/helper-meds' },
      { label: 'Suboxone for 7-OH', href: '/mat-suboxone/suboxone-for-7oh' },
    ],
  },
  bupe: {
    label: 'Buprenorphine (Suboxone)',
    shortLabel: 'Suboxone',
    tagline: 'Published rapid tapers + custom math',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 8,
    defaultDosesPerDay: 1,
    minDosesPerDay: 1,
    defaultJumpOff: 0.25,
    defaultTabletSize: null,
    tabletPresets: [],
    frequencyPresets: [1, 2],
    durationPresets: [
      { days: 5, label: '5d' },
      { days: 7, label: '7d' },
      { days: 10, label: '10d' },
      { days: 14, label: '14d' },
      { days: 21, label: '21d' },
    ],
    defaultDurationDays: 14,
    sliderMinDays: 5,
    sliderMaxDays: 45,
    tabletUnitName: 'strip',
    note: 'The Suboxone Rapid Taper page publishes once-a-day schedules for some starting doses: 2 mg over 5 days, 4 mg over 5 or 7, 6 mg over 5, 7, or 10, and 8 mg over 5, 7, 10, 14, or 21. When your dose matches one, you can follow it as published or switch to a custom percentage taper. On a published table, a jump-off below 0.25 mg extends the tail with volumetric sub-0.25 mg steps.',
    related: [
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'Custom Suboxone Dosing', href: '/mat-suboxone/suboxone-custom-dose' },
    ],
  },
  mgm: {
    label: 'MGM-15 / MIT-A / DHM',
    shortLabel: 'MGM-15 / MIT-A',
    tagline: 'Long-acting · 9 to 15 h duration',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 10,
    defaultDosesPerDay: 3,
    minDosesPerDay: 1,
    defaultJumpOff: 2,
    defaultTabletSize: 10,
    tabletPresets: [10, 15],
    frequencyPresets: [1, 2, 3, 4],
    durationPresets: [
      { days: 21, label: '21d' },
      { days: 30, label: '30d' },
      { days: 60, label: '60d' },
      { days: 90, label: '90d' },
    ],
    defaultDurationDays: 30,
    sliderMinDays: 7,
    sliderMaxDays: 90,
    tabletUnitName: 'tablet',
    note: 'MGM-15 (also sold as MIT-A or DHM) lasts roughly 9 to 15 hours by community reports, with no published human PK data. There is no standardized schedule. Treat this percentage curve as a starting plan. Withdrawal runs harder than 7-OH, and Suboxone induction needs a longer washout.',
    related: [
      { label: 'MGM-15', href: '/compounds/mgm15' },
      { label: 'MIT-A and DHM Products', href: '/compounds/mit-a-dhm' },
      { label: 'Quit 7-OH with Kratom Leaf', href: '/medications-supplements/quit-7-oh-with-kratom-leaf' },
      { label: 'Helper Medications', href: '/medications-supplements/helper-meds' },
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
    ],
  },
  pseudo: {
    label: 'Pseudo (mitragynine pseudoindoxyl)',
    shortLabel: 'Pseudo',
    tagline: 'Binds tightly · little human data',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 7,
    defaultDosesPerDay: 3,
    minDosesPerDay: 1,
    defaultJumpOff: 1,
    defaultTabletSize: 5,
    tabletPresets: [5, 10],
    frequencyPresets: [1, 2, 3, 4],
    durationPresets: [
      { days: 21, label: '21d' },
      { days: 30, label: '30d' },
      { days: 60, label: '60d' },
      { days: 90, label: '90d' },
    ],
    defaultDurationDays: 30,
    sliderMinDays: 7,
    sliderMaxDays: 90,
    tabletUnitName: 'tablet',
    note: 'Pseudoindoxyl binds the mu receptor tighter than buprenorphine. Human pharmacology data is thin and schedules are not standardized. Treat these numbers as directional, slow down if symptoms spike, and compare notes with the community before committing to a jump-off.',
    related: [
      { label: 'Pseudo (mitragynine pseudoindoxyl)', href: '/compounds/mitragynine-pseudoindoxyl' },
      { label: 'Helper Medications', href: '/medications-supplements/helper-meds' },
      { label: 'Quit 7-OH with Kratom Leaf', href: '/medications-supplements/quit-7-oh-with-kratom-leaf' },
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
    ],
  },
  leaf: {
    label: 'Kratom leaf (plain powder)',
    shortLabel: 'Kratom leaf',
    tagline: 'Plain powder · grams per day',
    unit: 'g',
    stepUnit: 'day',
    defaultPerDose: 4,
    defaultDosesPerDay: 4,
    minDosesPerDay: 2,
    defaultJumpOff: 1,
    defaultTabletSize: 0.5,
    tabletPresets: [0.5, 1],
    frequencyPresets: [1, 2, 3, 4],
    durationPresets: [
      { days: 21, label: '21d' },
      { days: 30, label: '30d' },
      { days: 60, label: '60d' },
      { days: 90, label: '90d' },
    ],
    defaultDurationDays: 30,
    sliderMinDays: 7,
    sliderMaxDays: 90,
    tabletUnitName: 'capsule',
    note: 'Alkaloid strength shifts between batches and vendors, so grams are an approximation. A leaf taper can jump off around 1 to 2 g/day instead of going all the way to zero.',
    related: [
      { label: 'Quit 7-OH with Kratom Leaf', href: '/medications-supplements/quit-7-oh-with-kratom-leaf' },
    ],
  },
};

export function legacyDifficultyToDays(
  substance: SubstanceKey,
  difficulty: LegacyDifficulty,
  customDays?: number,
): number {
  if (difficulty === 'custom' && typeof customDays === 'number' && customDays >= 1) {
    return Math.round(customDays);
  }
  if (substance === 'bupe') {
    const map: Record<Exclude<LegacyDifficulty, 'custom'>, number> = {
      easier: 21,
      clinician: 14,
      harder: 10,
      'super-hard': 5,
    };
    return map[difficulty === 'custom' ? 'clinician' : difficulty];
  }
  const map: Record<Exclude<LegacyDifficulty, 'custom'>, number> = {
    easier: 90,
    clinician: 60,
    harder: 30,
    'super-hard': 21,
  };
  return map[difficulty === 'custom' ? 'harder' : difficulty];
}

/* ───────────────────────── Bupe established schedules ───────────────────────── */

export const BUPE_SCHEDULES: Record<number, Record<number, number[]>> = {
  2: { 5: [2, 1.5, 1, 0.5, 0.25] },
  4: {
    5: [4, 2, 1, 0.5, 0.25],
    7: [4, 4, 3, 2, 1, 0.5, 0.25],
  },
  6: {
    5: [6, 4, 2, 1, 0.25],
    7: [6, 6, 4, 3, 2, 1, 0.25],
    10: [6, 6, 6, 4, 4, 3, 2, 1, 0.5, 0.25],
  },
  8: {
    5: [8, 5, 3, 1.5, 0.25],
    7: [8, 8, 6, 4, 2, 1, 0.25],
    10: [8, 8, 6, 5, 4, 3, 2, 1, 0.5, 0.25],
    14: [8, 8, 7, 6, 6, 5, 4, 4, 3, 2, 1.5, 1, 0.5, 0.25],
    21: [8, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 1.5, 1, 0.75, 0.5, 0.5, 0.25, 0.25],
  },
};

const BUPE_SUB025_TAIL: number[] = [0.1, 0.05, 0.02];

function extendBupeTailToJumpOff(jumpOff: number): number[] {
  if (jumpOff >= 0.25) return [];
  const tail: number[] = [];
  for (const dose of BUPE_SUB025_TAIL) {
    if (jumpOff > dose) {
      tail.push(jumpOff);
      return tail;
    }
    tail.push(dose);
    if (dose === jumpOff) return tail;
  }
  if (jumpOff < BUPE_SUB025_TAIL[BUPE_SUB025_TAIL.length - 1]) {
    tail.push(jumpOff);
  }
  return tail;
}

/* ───────────────────────── Rounding & math ───────────────────────── */

export function roundDose(x: number): number {
  if (x >= 10) return Math.round(x * 10) / 10;
  if (x >= 1) return Math.round(x * 100) / 100;
  if (x >= 0.1) return Math.round(x * 1000) / 1000;
  return Math.round(x * 10000) / 10000;
}

export function roundPerDose(x: number): number {
  if (x >= 0.25) return Math.round(x * 4) / 4;
  return roundDose(x);
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Product of a rounded dose and a count, free of float noise. */
export function exactProduct(a: number, b: number): number {
  return Math.round(a * b * 10000) / 10000;
}

export function effectiveJumpOffFor(
  substance: SubstanceKey,
  totalStart: number,
  jumpOff: number,
): number {
  if (jumpOff > 0) return jumpOff;
  if (substance === 'bupe') return totalStart > 0.02 ? 0.02 : exactProduct(totalStart * 0.1, 1);
  // Floor of 0.5 (or 2% of the start), kept below a very small start so the
  // curve still descends.
  const floorDose = Math.max(0.5, totalStart * 0.02);
  return floorDose < totalStart ? floorDose : exactProduct(totalStart * 0.1, 1);
}

export function pctFromDuration(
  totalStart: number,
  effectiveJumpOff: number,
  days: number,
): number {
  if (totalStart <= effectiveJumpOff || days <= 1) return 0;
  const ratio = effectiveJumpOff / totalStart;
  const pct = (1 - Math.pow(ratio, 1 / (days - 1))) * 100;
  return Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0;
}

export function daysFromPct(
  totalStart: number,
  effectiveJumpOff: number,
  pct: number,
): number | null {
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return null;
  if (totalStart <= effectiveJumpOff) return null;
  const ratio = effectiveJumpOff / totalStart;
  const days = Math.log(ratio) / Math.log(1 - pct / 100) + 1;
  if (!Number.isFinite(days) || days < 1) return null;
  return Math.max(2, Math.min(365, Math.round(days)));
}

/* ───────────────────────── Schedule generator ───────────────────────── */

export interface ScheduleStep {
  day: number;
  perDose: number;
  dosesPerDay: number;
  totalDaily: number;
}

export type ScheduleSource = 'bupe-established' | 'bupe-percent' | 'percent';

export interface ScheduleResult {
  steps: ScheduleStep[];
  source: ScheduleSource;
  totalMedication: number;
  /** Set when no schedule came out because the end dose, rounded to what
   *  can be measured (tablet pieces, scale steps), isn't below the start. */
  reason?: 'end-not-below-start';
}

export interface SchedulePhase {
  dosesPerDay: number;
  startDay: number;
  endDay: number;
  dayCount: number;
  maxTotal: number;
  minTotal: number;
}

export interface ScheduleWeek {
  weekIndex: number;
  startDay: number;
  endDay: number;
  steps: ScheduleStep[];
  firstTotal: number;
  lastTotal: number;
  dropToFreq: number | null;
  /** Every frequency drop inside the week, in order. */
  drops: { day: number; freq: number }[];
}

function dosesPerDayFor(
  total: number,
  totalStart: number,
  n0: number,
  minDoses: number,
): number {
  const floor = Math.min(n0, Math.max(1, minDoses));
  if (n0 <= 1) return 1;
  if (total <= 0) return floor;
  const scaled = Math.ceil((n0 * total) / totalStart);
  return Math.max(floor, Math.min(n0, scaled));
}

function percentTotalsSchedule(
  start: number,
  jumpOff: number,
  days: number,
): number[] {
  if (start <= jumpOff) return [start];
  if (days <= 1) return [jumpOff];
  if (days === 2) return [start, jumpOff];
  const ratio = jumpOff / start;
  const totals: number[] = [start];
  for (let k = 1; k < days - 1; k++) {
    totals.push(start * Math.pow(ratio, k / (days - 1)));
  }
  totals.push(jumpOff);
  return totals;
}

/** Rounds, floors, or ceils a per-dose amount to a measurable step. */
type QuantizeMode = 'round' | 'floor' | 'ceil';
type Quantizer = (x: number, mode: QuantizeMode) => number;

const EPS = 1e-9;

function toStep(x: number, perUnit: number, mode: QuantizeMode): number {
  const v = x * perUnit;
  const q = mode === 'round' ? Math.round(v) : mode === 'floor' ? Math.floor(v + EPS) : Math.ceil(v - EPS);
  return q / perUnit;
}

const quarterQuantizer: Quantizer = (x, mode) => {
  if (x >= 0.25) return toStep(x, 4, mode);
  return mode === 'round' ? roundDose(x) : toStep(x, 1000, mode);
};

/** Suboxone: 0.5 mg steps from 2 mg up, so doses stay on 8 mg strip
 *  sixteenths; 0.125 mg steps (sixteenths of a 2 mg strip) below that. */
const bupeQuantizer: Quantizer = (x, mode) => {
  if (x >= 2) return toStep(x, 2, mode);
  if (x >= 0.125) return toStep(x, 8, mode);
  return quarterQuantizer(x, mode);
};

/** Kratom leaf is weighed on a 0.01 g scale: 0.1 g steps from 1 g up,
 *  0.05 g below, so low days don't stall in 0.25 g holds. */
const leafQuantizer: Quantizer = (x, mode) => {
  if (x >= 1) return toStep(x, 10, mode);
  return toStep(x, 20, mode);
};

function buildSteps(
  totals: number[],
  totalStart: number,
  n0: number,
  minDoses: number,
  quantize: Quantizer = quarterQuantizer,
  /** When set, a day only uses `quantize` (e.g. quarter tablets) if the step
   *  stays close to the planned curve; otherwise it uses this one (mg). */
  fallback?: Quantizer,
  anchor?: { total: number; doses: number },
): ScheduleStep[] {
  const floor = Math.min(n0, Math.max(1, minDoses));
  const target = totals[totals.length - 1];
  const maxPerDose = totalStart / n0;
  const isMeasurable = (x: number) => Math.abs(quantize(x, 'round') - x) < 1e-6;
  /**
   * Fewest doses for the jump-off day that don't make a single dose bigger
   * than day 1's: prefer a measurable split, then any split, then the floor.
   */
  const lastDayDoses = (jump: number, prevDoses: number): number => {
    const top = Math.max(floor, Math.min(prevDoses, n0));
    const options: number[] = [];
    for (let m = floor; m <= top; m++) options.push(m);
    const small = (m: number) => jump / m <= maxPerDose + 1e-9;
    return (
      options.find((m) => small(m) && isMeasurable(jump / m)) ??
      options.find(small) ??
      floor
    );
  };
  const steps: ScheduleStep[] = [];
  let holdRun = 1; // days in a row at the latest total
  totals.forEach((rawTotal, i) => {
    const isLast = i === totals.length - 1;
    const prevStep = steps[i - 1];
    // Doses per day only ever step down.
    let n = isLast
      ? lastDayDoses(rawTotal, prevStep?.dosesPerDay ?? n0)
      : Math.min(
          anchor && i > 0
            ? Math.min(n0, dosesPerDayFor(rawTotal, anchor.total, anchor.doses, minDoses))
            : dosesPerDayFor(rawTotal, totalStart, n0, minDoses),
          prevStep?.dosesPerDay ?? n0,
        );
    // Day 1 is exactly what the reader entered, and the last day is exactly
    // the jump-off they set (1.75 mg split 2 ways is 0.875 × 2, not 1 × 2).
    const exactDay = i === 0 || isLast;
    const prevTotal = steps[i - 1]?.totalDaily ?? Infinity;
    // Quarter tablets only while they track the curve: the tablet amount has
    // to land within half a planned daily step of the curve, can't rise, can't
    // cut more than 1.5x the planned daily cut, and can't hold a dose more
    // than 2 days running. Otherwise use mg steps.
    let q = quantize;
    if (fallback && !exactDay && i > 0) {
      const candidate = exactProduct(quantize(rawTotal / n, 'round'), n);
      const plannedStep = totals[i - 1] - rawTotal;
      const offCurve = Math.abs(candidate - rawTotal) > 0.5 * plannedStep + 1e-9;
      const rises = candidate > prevTotal + 1e-9;
      const isHold = Math.abs(candidate - prevTotal) < 1e-9;
      const plannedCut = 1 - rawTotal / totals[i - 1];
      const tooSteep = 1 - candidate / prevTotal > 1.5 * plannedCut + 1e-9;
      if (offCurve || rises || tooSteep || (isHold && holdRun >= 2)) q = fallback;
    }
    let perDose = exactDay ? exactProduct(rawTotal / n, 1) : q(rawTotal / n, 'round');
    let total = exactDay ? exactProduct(rawTotal, 1) : exactProduct(perDose, n);
    // Every day stays at or below the day before (rounding after a frequency
    // drop can't raise the total) and middle days stay at or above the
    // jump-off (so rounding can't drag the last day under it).
    const fits = (t: number) =>
      t <= prevTotal + 1e-9 && (exactDay || t >= target - 1e-9);
    if (i > 0 && (!fits(total) || perDose > maxPerDose + 1e-9)) {
      // The bound search uses the finer mg steps when tablets are hybrid,
      // so a bound never forces a big quarter-tablet jump.
      const bq = fallback ?? q;
      const measurableFor = (m: number): number | undefined => {
        const raw = rawTotal / m;
        return [bq(raw, 'round'), bq(raw, 'ceil'), bq(raw, 'floor')]
          .sort((x, y) => Math.abs(x - raw) - Math.abs(y - raw))
          .concat([bq(maxPerDose, 'floor'), bq(prevTotal / m, 'floor'), bq(target / m, 'ceil')])
          .find((c) => c > 0 && c <= maxPerDose + 1e-9 && fits(exactProduct(c, m)));
      };
      // Try this frequency, then fewer doses a day (down to the floor), then
      // holding more doses (up to yesterday's count) before settling for an
      // amount nobody can measure, like 0.6667 × 3.
      const prevDoses = prevStep?.dosesPerDay ?? n0;
      const order: number[] = [];
      for (let m = n; m >= floor; m--) order.push(m);
      for (let m = n + 1; m <= prevDoses; m++) order.push(m);
      let ok: number | undefined;
      for (const m of order) {
        ok = measurableFor(m);
        if (ok !== undefined) {
          n = m;
          break;
        }
      }
      if (ok !== undefined) {
        perDose = ok;
        total = exactProduct(ok, n);
      } else {
        // No measurable dose fits between the bounds: use the bound exactly,
        // on the fewest doses (up to yesterday's count) that keep a single
        // dose at or under day 1's. Yesterday's split always qualifies.
        const bound = total > prevTotal ? prevTotal : target;
        let m = n;
        while (m < prevDoses && bound / m > maxPerDose + 1e-9) m++;
        n = m;
        perDose = exactProduct(bound / n, 1);
        total = exactProduct(bound, 1);
      }
    }
    holdRun = i > 0 && Math.abs(total - prevTotal) < 1e-9 ? holdRun + 1 : 1;
    steps.push({
      day: i + 1,
      // Totals stay exact so a row reads 14.25 × 3 = 42.75, not 42.8.
      totalDaily: total,
      dosesPerDay: n,
      perDose,
    });
  });
  return steps;
}

export interface ScheduleOptions {
  /** Tablet strength. When set for a tablet substance, middle-day doses
   *  round to quarter tablets so every dose can be cut. */
  tabletSize?: number;
  /** Suboxone: follow a matching published table, or a custom curve. */
  bupeMode?: 'published' | 'custom';
  /** Weighed powder: round each dose to a step a scale can weigh at that
   *  size (1 mg for small doses up to 10 mg for doses near 1000 mg). */
  powder?: boolean;
  /** Tablets, cuttable doses only: every dose is a whole number of
   *  quarter-tablet pieces (value: tablet strength). */
  tabletPieces?: number;
  /** Where doses per day were anchored originally (a rebuilt tail keeps the
   *  original plan's points where doses per day drop). */
  anchor?: { total: number; doses: number };
}

/** Rounding step a reader can weigh, scaled to the dose (about 1-2%). */
export function scaleStepFor(x: number): number {
  // A typical milligram scale reads in 1 mg steps.
  if (x < 200) return 1;
  if (x < 1000) return 5;
  return 10;
}

const scaleQuantizer: Quantizer = (x, mode) => {
  const step = scaleStepFor(x);
  return exactProduct(toStep(x, 1 / step, mode), 1);
};

/** Durations with a published once-a-day Suboxone table for this start. */
export function publishedBupeDurations(perDose: number, dosesPerDay: number): number[] {
  if (Math.round(dosesPerDay) !== 1) return [];
  const table = BUPE_SCHEDULES[perDose * dosesPerDay];
  return table ? Object.keys(table).map(Number).sort((a, b) => a - b) : [];
}

/** Every dose is whole quarter-tablet pieces; never below one piece. */
function tabletPiecesQuantizer(tabletSize: number): Quantizer {
  const piece = tabletSize / 4;
  return (x, mode) => exactProduct(Math.max(1, toStep(x / piece, 1, mode)) * piece, 1);
}

function quarterTabletQuantizer(tabletSize: number): Quantizer {
  const piece = tabletSize / 4;
  return (x, mode) => {
    if (x < piece) return quarterQuantizer(x, mode);
    return exactProduct(toStep(x / piece, 1, mode) * piece, 1);
  };
}

export function generateSchedule(
  substance: SubstanceKey,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  durationDays: number,
  options: ScheduleOptions = {},
): ScheduleResult {
  const totalStart = perDose * dosesPerDay;
  const n0 = Math.max(1, Math.round(dosesPerDay));
  const minDoses = SUBSTANCES[substance].minDosesPerDay;

  if (
    !Number.isFinite(perDose) ||
    !Number.isFinite(dosesPerDay) ||
    !Number.isFinite(jumpOff) ||
    perDose <= 0 ||
    dosesPerDay <= 0 ||
    jumpOff < 0
  ) {
    return { steps: [], source: 'percent', totalMedication: 0 };
  }
  // A stopping dose at or above the starting total isn't a taper. Return an
  // empty schedule so the UI can explain the problem instead of drawing a
  // one-day "taper" that goes up.
  if (jumpOff > 0 && jumpOff >= totalStart) {
    return { steps: [], source: 'percent', totalMedication: 0 };
  }

  const wantsAbsoluteZero = jumpOff === 0;
  const effectiveJumpOff = effectiveJumpOffFor(substance, totalStart, jumpOff);
  // A taper needs at least a start day and an end day; one day would replace
  // the entered dose with the jump-off dose.
  const days = Math.max(2, Math.min(365, Math.round(durationDays)));

  function withZeroIfRequested(steps: ScheduleStep[]): ScheduleStep[] {
    if (!wantsAbsoluteZero) return steps;
    return [
      ...steps,
      { day: steps.length + 1, totalDaily: 0, dosesPerDay: 1, perDose: 0 },
    ];
  }

  if (substance === 'bupe') {
    // Published columns are once-a-day schedules. Split dosing falls through
    // to the percentage curve so the reader's chosen frequency is kept.
    if (options.bupeMode !== 'custom' && n0 === 1 && BUPE_SCHEDULES[totalStart]?.[days]) {
      const main = BUPE_SCHEDULES[totalStart][days];
      let mainTrimmed = main;
      let tail: number[] = [];
      if (effectiveJumpOff > 0.25) {
        mainTrimmed = [];
        for (const d of main) {
          if (d <= effectiveJumpOff) {
            mainTrimmed.push(effectiveJumpOff);
            break;
          }
          mainTrimmed.push(d);
        }
      } else {
        tail = extendBupeTailToJumpOff(effectiveJumpOff);
      }
      const totals = [...mainTrimmed, ...tail];
      const baseSteps: ScheduleStep[] = totals.map((d, i) => ({
        day: i + 1,
        totalDaily: d,
        dosesPerDay: 1,
        perDose: d,
      }));
      const steps = withZeroIfRequested(baseSteps);
      return {
        steps,
        source: 'bupe-established',
        totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
      };
    }
    const descendDays = wantsAbsoluteZero ? Math.max(2, days - 1) : days;
    const totals = percentTotalsSchedule(totalStart, effectiveJumpOff, descendDays);
    const steps = withZeroIfRequested(
      buildSteps(totals, totalStart, n0, minDoses, bupeQuantizer),
    );
    return {
      steps,
      source: 'bupe-percent',
      totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
    };
  }

  const descendDays = wantsAbsoluteZero ? Math.max(2, days - 1) : days;
  let endTotal = effectiveJumpOff;
  if (options.powder) {
    const floorN = Math.min(n0, Math.max(1, minDoses));
    const per = effectiveJumpOff / floorN;
    endTotal = exactProduct(Math.max(1, toStep(per, 1 / scaleStepFor(per), 'round')), floorN);
    if (endTotal >= totalStart - 1e-9) {
      return { steps: [], source: 'percent', totalMedication: 0, reason: 'end-not-below-start' };
    }
  }
  const totals = percentTotalsSchedule(totalStart, endTotal, descendDays);
  const tabletSize = options.tabletSize ?? 0;
  const useTablets = tabletSize > 0 && SUBSTANCES[substance].tabletUnitName === 'tablet';
  if (options.tabletPieces && options.tabletPieces > 0) {
    // Cuttable doses only: the end dose rounds to whole pieces too.
    const piece = options.tabletPieces / 4;
    const floorN = Math.min(n0, Math.max(1, minDoses));
    const endPer = Math.max(piece, Math.round(effectiveJumpOff / floorN / piece) * piece);
    const end = exactProduct(endPer, floorN);
    if (end >= totalStart - 1e-9) {
      return { steps: [], source: 'percent', totalMedication: 0, reason: 'end-not-below-start' };
    }
    const pieceTotals = percentTotalsSchedule(totalStart, end, descendDays);
    const pieceSteps = withZeroIfRequested(
      buildSteps(
        pieceTotals,
        totalStart,
        n0,
        minDoses,
        tabletPiecesQuantizer(options.tabletPieces),
        undefined,
        options.anchor,
      ),
    );
    return {
      steps: pieceSteps,
      source: 'percent',
      totalMedication: round2(pieceSteps.reduce((a, st) => a + st.totalDaily, 0)),
    };
  }
  const steps = withZeroIfRequested(
    useTablets
      ? buildSteps(
          totals,
          totalStart,
          n0,
          minDoses,
          quarterTabletQuantizer(tabletSize),
          options.powder ? scaleQuantizer : quarterQuantizer,
        )
      : buildSteps(
          totals,
          totalStart,
          n0,
          minDoses,
          substance === 'leaf' ? leafQuantizer : options.powder ? scaleQuantizer : quarterQuantizer,
          undefined,
          options.anchor,
        ),
  );
  return {
    steps,
    source: 'percent',
    totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
  };
}

export function buildPhases(steps: ScheduleStep[]): SchedulePhase[] {
  const phases: SchedulePhase[] = [];
  for (const s of steps) {
    if (s.totalDaily === 0) continue;
    const prev = phases[phases.length - 1];
    if (!prev || prev.dosesPerDay !== s.dosesPerDay) {
      phases.push({
        dosesPerDay: s.dosesPerDay,
        startDay: s.day,
        endDay: s.day,
        dayCount: 1,
        maxTotal: s.totalDaily,
        minTotal: s.totalDaily,
      });
    } else {
      prev.endDay = s.day;
      prev.dayCount += 1;
      prev.maxTotal = Math.max(prev.maxTotal, s.totalDaily);
      prev.minTotal = Math.min(prev.minTotal, s.totalDaily);
    }
  }
  return phases;
}

export function buildWeeks(steps: ScheduleStep[]): ScheduleWeek[] {
  const weeks: ScheduleWeek[] = [];
  for (let i = 0; i < steps.length; i += 7) {
    const chunk = steps.slice(i, i + 7);
    const nonStop = chunk.filter((s) => s.totalDaily > 0);
    const prevStep = i > 0 ? steps[i - 1] : null;
    let dropToFreq: number | null = null;
    const drops: { day: number; freq: number }[] = [];
    for (let j = 0; j < chunk.length; j++) {
      const cur = chunk[j];
      if (cur.totalDaily === 0) continue;
      const before = j === 0 ? prevStep : chunk[j - 1];
      if (before && before.totalDaily > 0 && before.dosesPerDay !== cur.dosesPerDay) {
        dropToFreq = cur.dosesPerDay;
        drops.push({ day: cur.day, freq: cur.dosesPerDay });
      }
    }
    weeks.push({
      weekIndex: weeks.length,
      startDay: chunk[0].day,
      endDay: chunk[chunk.length - 1].day,
      steps: chunk,
      firstTotal: nonStop.length > 0 ? nonStop[0].totalDaily : 0,
      lastTotal: chunk[chunk.length - 1].totalDaily,
      dropToFreq,
      drops,
    });
  }
  return weeks;
}

export function sourceLabel(source: ScheduleSource): string {
  switch (source) {
    case 'bupe-established':
      return 'Published rapid taper';
    case 'bupe-percent':
      return 'Percentage taper';
    case 'percent':
      return 'Percentage taper';
  }
}

export function paceLabel(pct: number, source: ScheduleSource): string {
  if (source === 'bupe-established') return 'Published rapid taper';
  if (pct >= 12) return 'Fast cut';
  if (pct >= 7) return 'Moderate pace';
  if (pct >= 4) return 'Steady pace';
  return 'Gradual pace';
}

/* ───────────────────────── Tablet & strip fractions ───────────────────────── */

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatQuarterNumber(q: number): string {
  const whole = Math.floor(q);
  const frac = q - whole;
  const fracText =
    frac === 0.25 ? '¼' : frac === 0.5 ? '½' : frac === 0.75 ? '¾' : '';
  return whole === 0 ? fracText : frac === 0 ? `${whole}` : `${whole}${fracText}`;
}

function formatStripFraction(sixteenths: number, strip: number): string {
  const article = strip === 8 ? 'an' : 'a';
  if (sixteenths === 16) return `a full ${strip} mg strip`;
  if (sixteenths > 16) {
    const whole = Math.floor(sixteenths / 16);
    const remainder = sixteenths - whole * 16;
    if (remainder === 0) return `${whole} strips of ${strip} mg`;
    const g = gcd(remainder, 16);
    return `${whole} ${remainder / g}/${16 / g} strips of ${strip} mg`;
  }
  const g = gcd(sixteenths, 16);
  return `${sixteenths / g}/${16 / g} of ${article} ${strip} mg strip`;
}

export function bupeStripEquivalents(perDose: number): string {
  const strips = [8, 4, 2];
  const lines: string[] = [];
  for (const strip of strips) {
    const sixteenths = (perDose / strip) * 16;
    const rounded = Math.round(sixteenths);
    if (rounded >= 1 && Math.abs(sixteenths - rounded) < 1e-6) {
      lines.push(formatStripFraction(rounded, strip));
    }
  }
  if (lines.length === 0) {
    return perDose < 0.125
      ? 'Below 1/16 of a 2 mg strip. Use volumetric dosing.'
      : "Doesn't split evenly on 2, 4, or 8 mg strips. Use volumetric dosing.";
  }
  return lines.join(' · ');
}

function sixteenthsLabel(sixteenths: number, strip: number): string {
  const whole = Math.floor(sixteenths / 16);
  const rem = sixteenths - whole * 16;
  // Non-breaking spaces keep "8 mg" together when a badge wraps.
  const mg = `${strip}\u00A0mg`;
  if (rem === 0) return whole === 1 ? `1 × ${mg} strip` : `${whole} × ${mg} strips`;
  const g = gcd(rem, 16);
  const frac = `${rem / g}/${16 / g}`;
  return whole === 0 ? `${frac} of ${mg}` : `${whole} ${frac} × ${mg}`;
}

/**
 * Short strip label that follows the Suboxone Rapid Taper page: cut 8 mg
 * strips down to sixteenths (0.5 mg pieces); for anything that doesn't land
 * there, use 2 mg strips down to their sixteenths (0.125 mg); below that,
 * volumetric dosing.
 */
export function bupeStripShortLabel(perDose: number, preferSmallStrip = false): string {
  if (perDose <= 0) return '';
  for (const strip of preferSmallStrip ? [2, 8] : [8, 2]) {
    const q = (perDose / strip) * 16;
    const rounded = Math.round(q);
    if (rounded >= 1 && Math.abs(q - rounded) < 1e-6) return sixteenthsLabel(rounded, strip);
  }
  return 'Volumetric';
}

/**
 * Day from which a Suboxone plan should stay on 2 mg strips: the first dose
 * that doesn't land on an 8 mg sixteenth. Once a reader switches to 2 mg
 * strips, labels don't send them back to 1/16-of-8 mg slivers.
 */
export function bupeSmallStripFromDay(steps: ScheduleStep[]): number {
  for (const s of steps) {
    if (s.perDose <= 0) continue;
    const q = s.perDose * 2;
    if (Math.abs(q - Math.round(q)) > 1e-6) return s.day;
  }
  return Infinity;
}

export function tabletShortLabel(
  perDose: number,
  tabletSize: number,
  tabletUnitName: string,
  unit = 'g',
): string {
  if (!Number.isFinite(tabletSize) || tabletSize <= 0 || perDose <= 0) return '';
  const shortNoun = tabletUnitName === 'tablet' ? 'tab' : tabletUnitName === 'capsule' ? 'cap' : tabletUnitName;
  const raw = perDose / tabletSize;
  if (tabletUnitName === 'capsule') {
    // Capsules can't be split: whole capsules plus any loose powder to weigh.
    const whole = Math.floor(raw + 1e-6);
    if (whole < 1) return `< 1 ${shortNoun}`;
    const capsLabel = `${whole} ${whole === 1 ? shortNoun : `${shortNoun}s`}`;
    const rest = exactProduct(perDose - whole * tabletSize, 1);
    return rest > 1e-6 ? `${capsLabel} + ${rest} ${unit}` : capsLabel;
  }
  if (raw < 0.25) return `< ¼ ${shortNoun}`;
  const exact = Math.round(raw * 4) / 4;
  if (Math.abs(raw - exact) < 1e-6) {
    return `${formatQuarterNumber(exact)} ${exact <= 1 ? shortNoun : `${shortNoun}s`}`;
  }
  // Between quarters: show both neighbours so the count still tapers.
  const lower = Math.floor(raw * 4) / 4;
  const upper = Math.ceil(raw * 4) / 4;
  return `${formatQuarterNumber(lower)}–${formatQuarterNumber(upper)} ${
    upper <= 1 ? shortNoun : `${shortNoun}s`
  }`;
}

export function tabletEquivalents(
  perDose: number,
  tabletSize: number,
  unit: string,
  tabletUnitName: string,
): string {
  if (!Number.isFinite(tabletSize) || tabletSize <= 0) {
    return `Enter a ${tabletUnitName} size to see the breakdown.`;
  }
  if (perDose <= 0) return `0 ${tabletUnitName}s`;
  const raw = perDose / tabletSize;
  const tabletNote = `${tabletSize} ${unit} per ${tabletUnitName}`;

  if (tabletUnitName === 'capsule') {
    // Matches the short label: whole capsules plus weighed loose powder.
    const whole = Math.floor(raw + 1e-6);
    const noun = (n: number) => (n === 1 ? 'capsule' : 'capsules');
    if (whole < 1) {
      return `Less than 1 capsule (${tabletNote}). Weigh ${exactProduct(perDose, 1)} ${unit} of loose powder on a 0.01 g scale.`;
    }
    const rest = exactProduct(perDose - whole * tabletSize, 1);
    if (rest <= 1e-6) {
      return `${whole} ${noun(whole)} = ${exactProduct(whole, tabletSize)} ${unit} (${tabletNote})`;
    }
    return `${whole} ${noun(whole)} (${exactProduct(whole, tabletSize)} ${unit}) plus ${rest} ${unit} of loose powder, weighed (${tabletNote})`;
  }

  if (raw < 0.25) {
    return `Less than ¼ ${tabletUnitName} (${tabletNote}). Measure by weight or volume, or switch to a lower-strength ${tabletUnitName}.`;
  }

  const lower = Math.floor(raw * 4) / 4;
  const upper = Math.ceil(raw * 4) / 4;

  const line = (q: number) => {
    const number = formatQuarterNumber(q);
    const noun = q <= 1 ? tabletUnitName : `${tabletUnitName}s`;
    return `${number} ${noun} = ${exactProduct(q, tabletSize)} ${unit}`;
  };

  if (lower === upper) {
    return `${line(lower)} (${tabletNote})`;
  }
  return `Between ${line(lower)} and ${line(upper)}. Weigh or dissolve to measure it exactly (${tabletNote}).`;
}

/* ───────────────────────── Local calendar date helpers ───────────────────────── */

export function formatLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

export function addDaysToIso(iso: string, offsetDays: number): Date | null {
  const base = parseLocalIsoDate(iso);
  if (!base) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays);
}

/** Whole calendar days from `fromIso` to `toIso` (local dates). */
export function daysBetweenIso(fromIso: string, toIso: string): number | null {
  const a = parseLocalIsoDate(fromIso);
  const b = parseLocalIsoDate(toIso);
  if (!a || !b) return null;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

export function formatShortDate(iso: string, dayOffset: number): string {
  const dt = addDaysToIso(iso, dayOffset);
  if (!dt) return '';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekdayDate(iso: string, dayOffset: number): string {
  const dt = addDaysToIso(iso, dayOffset);
  if (!dt) return '';
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
