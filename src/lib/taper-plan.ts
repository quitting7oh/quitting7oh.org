/**
 * Saved taper plans for the taper planner.
 *
 * A plan is built once, when the reader starts it, and saved as concrete
 * dated days. Nothing recomputes it later. Changes (holding a dose, slowing
 * down, speeding up) rebuild only the days from today on; earlier days stay
 * exactly as they were. Logged doses are stored by calendar date, separate
 * from the plan, so editing a plan can never move or hide them.
 */
import {
  SUBSTANCES,
  addDaysToIso,
  daysBetweenIso,
  exactProduct,
  formatLocalIsoDate,
  generateSchedule,
  type SubstanceKey,
} from './taper-schedule.ts';

export type PlannerCompound = Extract<SubstanceKey, '7oh' | 'mgm' | 'pseudo'>;

export type Measure = { kind: 'tablet'; size: number } | { kind: 'powder' };

export interface PlanInput {
  compound: PlannerCompound;
  perDose: number;
  dosesPerDay: number;
  /** Daily total on the last day. 0 adds a stop day. */
  jumpOff: number;
  /** Number of days in the schedule (stop day included when jumpOff is 0). */
  days: number;
  measure: Measure;
}

export interface PlanDay {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  perDose: number;
  dosesPerDay: number;
  totalDaily: number;
}

export type ChangeKind = 'start' | 'hold' | 'slower' | 'faster';

export interface PlanChange {
  kind: ChangeKind;
  /** First date the change applies to. */
  from: string;
  /** Days added (+) or removed (-) from the end. */
  deltaDays: number;
}

export interface SavedPlan {
  v: 1;
  compound: PlannerCompound;
  measure: Measure;
  jumpOff: number;
  days: PlanDay[];
  changes: PlanChange[];
}

/** Dose slots logged per date. Independent of any plan. */
export type DoseLog = Record<string, number[]>;

function isoPlus(iso: string, offset: number): string {
  const d = addDaysToIso(iso, offset);
  return d ? formatLocalIsoDate(d) : iso;
}

/** Days for a plan input, dated from `startDate`. */
export function buildDays(input: PlanInput, startDate: string): PlanDay[] {
  const steps = generateSchedule(
    input.compound,
    input.perDose,
    input.dosesPerDay,
    input.jumpOff,
    input.days,
    input.measure.kind === 'tablet' ? { tabletSize: input.measure.size } : { powder: true },
  ).steps;
  return steps.map((s, i) => ({
    date: isoPlus(startDate, i),
    perDose: s.perDose,
    dosesPerDay: s.dosesPerDay,
    totalDaily: s.totalDaily,
  }));
}

export function startPlan(input: PlanInput, startDate: string): SavedPlan | null {
  const days = buildDays(input, startDate);
  if (days.length === 0) return null;
  return {
    v: 1,
    compound: input.compound,
    measure: input.measure,
    jumpOff: input.jumpOff,
    days,
    changes: [{ kind: 'start', from: startDate, deltaDays: 0 }],
  };
}

/** Index of `date` in the plan, or null when the date falls outside it. */
export function dayIndex(plan: SavedPlan, date: string): number | null {
  const diff = daysBetweenIso(plan.days[0].date, date);
  if (diff === null || diff < 0 || diff >= plan.days.length) return null;
  return diff;
}

/** Where today sits relative to the plan. */
export function planPosition(
  plan: SavedPlan,
  today: string,
): { kind: 'before'; inDays: number } | { kind: 'during'; index: number } | { kind: 'after' } {
  const diff = daysBetweenIso(plan.days[0].date, today) ?? 0;
  if (diff < 0) return { kind: 'before', inDays: -diff };
  if (diff >= plan.days.length) return { kind: 'after' };
  return { kind: 'during', index: diff };
}

/** Days left counting today (today included). */
export function daysLeft(plan: SavedPlan, index: number): number {
  return plan.days.length - index;
}

/**
 * Rebuild the plan from `index` (today) on. Earlier days are kept as they
 * are. `startFrom` is the dose the rebuilt part starts at; `length` is how
 * many days the rebuilt part runs.
 */
function rebuildFrom(
  plan: SavedPlan,
  index: number,
  startFrom: { perDose: number; dosesPerDay: number },
  length: number,
): PlanDay[] {
  const kept = plan.days.slice(0, index);
  const from = plan.days[index]?.date ?? isoPlus(plan.days[0].date, index);
  // Nothing left to taper: hold the dose for the days left.
  if (plan.jumpOff > 0 && startFrom.perDose * startFrom.dosesPerDay <= plan.jumpOff + 1e-9) {
    const hold = Array.from({ length: Math.max(1, length) }, (_, i) => ({
      date: isoPlus(from, i),
      perDose: startFrom.perDose,
      dosesPerDay: startFrom.dosesPerDay,
      totalDaily: exactProduct(startFrom.perDose, startFrom.dosesPerDay),
    }));
    return kept.concat(hold);
  }
  const rest = buildDays(
    {
      compound: plan.compound,
      perDose: startFrom.perDose,
      dosesPerDay: startFrom.dosesPerDay,
      jumpOff: plan.jumpOff,
      days: Math.max(2, length),
      measure: plan.measure,
    },
    from,
  );
  return kept.concat(rest);
}

/** Stay on yesterday's dose today, then continue the taper from there. The
 *  plan gets one day longer. */
export function holdToday(plan: SavedPlan, index: number): SavedPlan {
  if (index <= 0) return plan;
  const yesterday = plan.days[index - 1];
  const length = daysLeft(plan, index) + 1;
  return {
    ...plan,
    days: rebuildFrom(plan, index, yesterday, length),
    changes: [...plan.changes, { kind: 'hold', from: plan.days[index].date, deltaDays: 1 }],
  };
}

/** Change how many days are left, starting from today's current dose. */
export function changePace(plan: SavedPlan, index: number, deltaDays: number): SavedPlan {
  const today = plan.days[index];
  const left = daysLeft(plan, index);
  const length = Math.max(2, left + deltaDays);
  const applied = length - left;
  if (applied === 0) return plan;
  return {
    ...plan,
    days: rebuildFrom(plan, index, today, length),
    changes: [
      ...plan.changes,
      { kind: applied > 0 ? 'slower' : 'faster', from: today.date, deltaDays: applied },
    ],
  };
}

/** Tablet count for a dose, when it's a whole number of quarter tablets. */
export function quarterTablets(perDose: number, size: number): number | null {
  const q = (perDose / size) * 4;
  const r = Math.round(q);
  return r >= 1 && Math.abs(q - r) < 1e-6 ? r : null;
}

const FRACTIONS = ['', '¼', '½', '¾'];

export function formatQuarters(quarters: number): string {
  const whole = Math.floor(quarters / 4);
  const frac = FRACTIONS[quarters % 4];
  return whole === 0 ? frac : `${whole}${frac}`;
}

/** How to measure one dose, in words. */
export function measureHint(perDose: number, measure: Measure, unit: string): string {
  if (perDose <= 0) return '';
  if (measure.kind === 'powder') return `Weigh ${formatAmount(perDose)} ${unit}`;
  const q = quarterTablets(perDose, measure.size);
  if (q !== null) {
    return `${formatQuarters(q)} ${q <= 4 ? 'tablet' : 'tablets'} (${measure.size} ${unit} each)`;
  }
  return `Between tablet quarters: weigh or dissolve ${formatAmount(perDose)} ${unit}`;
}

/** Days in the plan whose dose can be cut from tablets as quarters. */
export function cuttableDays(days: PlanDay[], measure: Measure): number {
  if (measure.kind !== 'tablet') return days.length;
  return days.filter((d) => d.totalDaily === 0 || quarterTablets(d.perDose, measure.size) !== null)
    .length;
}

/** An amount without float noise; repeating splits show "≈". */
export function formatAmount(x: number): string {
  const e = exactProduct(x, 1);
  if (Math.abs(e * 1000 - Math.round(e * 1000)) <= 1e-6) return String(e);
  return `≈ ${e >= 1 ? Math.round(e * 100) / 100 : Number(e.toPrecision(2))}`;
}

/** A +/- step that's about 5% of the amount, on a round number. */
export function niceStep(amount: number): number {
  const target = Math.max(0.25, amount * 0.05);
  const steps = [0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 250];
  let best = steps[0];
  for (const s of steps) if (s <= target) best = s;
  return best;
}

export function defaultsFor(compound: PlannerCompound): PlanInput {
  const cfg = SUBSTANCES[compound];
  return {
    compound,
    perDose: cfg.defaultPerDose,
    dosesPerDay: cfg.defaultDosesPerDay,
    jumpOff: cfg.defaultJumpOff,
    days: cfg.defaultDurationDays,
    measure: { kind: 'powder' },
  };
}

/** Validate a saved plan read from storage. */
export function readSavedPlan(raw: unknown): SavedPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<SavedPlan>;
  if (p.v !== 1 || !Array.isArray(p.days) || p.days.length === 0) return null;
  if (p.compound !== '7oh' && p.compound !== 'mgm' && p.compound !== 'pseudo') return null;
  const days = p.days.filter(
    (d): d is PlanDay =>
      !!d &&
      typeof d.date === 'string' &&
      typeof d.perDose === 'number' &&
      typeof d.dosesPerDay === 'number' &&
      typeof d.totalDaily === 'number',
  );
  if (days.length === 0) return null;
  const measure: Measure =
    p.measure && p.measure.kind === 'tablet' && typeof p.measure.size === 'number' && p.measure.size > 0
      ? { kind: 'tablet', size: p.measure.size }
      : { kind: 'powder' };
  return {
    v: 1,
    compound: p.compound,
    measure,
    jumpOff: typeof p.jumpOff === 'number' ? p.jumpOff : 0,
    days,
    changes: Array.isArray(p.changes) ? p.changes : [],
  };
}

export function readDoseLog(raw: unknown): DoseLog {
  if (!raw || typeof raw !== 'object') return {};
  const out: DoseLog = {};
  for (const [date, slots] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(slots)) continue;
    const clean = slots.filter((x): x is number => Number.isInteger(x) && x >= 0);
    if (clean.length > 0) out[date] = clean;
  }
  return out;
}
