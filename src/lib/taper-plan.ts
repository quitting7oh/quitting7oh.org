/**
 * Saved taper plans for the taper planner.
 *
 * A plan is built once, when the reader starts it, and saved as concrete
 * dated days. Nothing recomputes it later. Changes (holding a dose, slowing
 * down, speeding up, restarting from a different dose) rebuild only the days
 * from the change on; earlier days stay exactly as they were. Logged doses are
 * stored by calendar date, separate from the plan, so editing a plan can never
 * move or hide them.
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

/** Tablets: every dose is whole quarter pieces of a tablet of `size` mg.
 *  Powder: amounts are what the scale reads; `strengthPct` (optional) is the
 *  active content on the label, used only to show the active amount. */
export type Measure =
  | { kind: 'tablet'; size: number }
  | { kind: 'powder'; strengthPct?: number };

export interface PlanInput {
  compound: PlannerCompound;
  /** mg per dose (tablets: tablet count × strength). */
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

export type ChangeKind = 'start' | 'hold' | 'extend' | 'slower' | 'faster' | 'restart';

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
  /** As set up: 0 means the plan ends with a stop day. */
  jumpOff: number;
  /** The last dosing day's total, kept so later changes end at the same dose. */
  endTotal: number;
  /** Day 1 of the original plan, kept so rebuilt days drop doses per day at the
   *  same points. */
  anchor: { total: number; doses: number };
  days: PlanDay[];
  changes: PlanChange[];
}

/** Dose slots logged per date. Independent of any plan. */
export type DoseLog = Record<string, number[]>;

export function isoPlus(iso: string, offset: number): string {
  const d = addDaysToIso(iso, offset);
  return d ? formatLocalIsoDate(d) : iso;
}

function scheduleOptions(measure: Measure, anchor?: { total: number; doses: number }) {
  return measure.kind === 'tablet'
    ? { tabletPieces: measure.size, anchor }
    : { powder: true, anchor };
}

function datedFrom(
  steps: { perDose: number; dosesPerDay: number; totalDaily: number }[],
  start: string,
): PlanDay[] {
  return steps.map((s, i) => ({
    date: isoPlus(start, i),
    perDose: s.perDose,
    dosesPerDay: s.dosesPerDay,
    totalDaily: s.totalDaily,
  }));
}

/** Days for a plan input, dated from `startDate`, plus why none came out. */
export function previewDays(
  input: PlanInput,
  startDate: string,
): { days: PlanDay[]; reason?: 'end-not-below-start' } {
  const r = generateSchedule(
    input.compound,
    input.perDose,
    input.dosesPerDay,
    input.jumpOff,
    input.days,
    scheduleOptions(input.measure),
  );
  return { days: datedFrom(r.steps, startDate), reason: r.reason };
}

export function buildDays(input: PlanInput, startDate: string): PlanDay[] {
  return previewDays(input, startDate).days;
}

export function startPlan(input: PlanInput, startDate: string): SavedPlan | null {
  const days = buildDays(input, startDate);
  if (days.length === 0) return null;
  const lastDose = [...days].reverse().find((d) => d.totalDaily > 0) ?? days[0];
  return {
    v: 1,
    compound: input.compound,
    measure: input.measure,
    jumpOff: input.jumpOff,
    endTotal: lastDose.totalDaily,
    anchor: { total: days[0].totalDaily, doses: days[0].dosesPerDay },
    days,
    changes: [{ kind: 'start', from: startDate, deltaDays: 0 }],
  };
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

export function lastDoseDay(days: PlanDay[]): PlanDay {
  return [...days].reverse().find((d) => d.totalDaily > 0) ?? days[0];
}

/**
 * The days from `from` on, starting at `start` and ending at the plan's end
 * dose (plus a stop day when the plan has one), `length` days in all.
 */
function tail(
  plan: SavedPlan,
  fromDate: string,
  start: { perDose: number; dosesPerDay: number },
  length: number,
): PlanDay[] {
  const withStop = plan.jumpOff === 0;
  const dosing = Math.max(1, length - (withStop ? 1 : 0));
  const startTotal = exactProduct(start.perDose, start.dosesPerDay);
  let steps: { perDose: number; dosesPerDay: number; totalDaily: number }[];
  if (startTotal <= plan.endTotal + 1e-9 || dosing === 1) {
    // Already at the end dose: hold it for the days left.
    steps = Array.from({ length: dosing }, () => ({ ...start, totalDaily: startTotal }));
  } else {
    steps = generateSchedule(
      plan.compound,
      start.perDose,
      start.dosesPerDay,
      plan.endTotal,
      Math.max(2, dosing),
      scheduleOptions(plan.measure, plan.anchor),
    ).steps;
  }
  if (withStop) steps = [...steps, { perDose: 0, dosesPerDay: 1, totalDaily: 0 }];
  return datedFrom(steps, fromDate);
}

function dateAt(plan: SavedPlan, index: number): string {
  return plan.days[index]?.date ?? isoPlus(plan.days[0].date, index);
}

/** Insert `repeat` as day `at` and push everything from `at` back a day. */
function insertDay(plan: SavedPlan, at: number, repeat: PlanDay, kind: ChangeKind): SavedPlan {
  const date = dateAt(plan, at);
  const shifted = plan.days.slice(at).map((d, i) => ({ ...d, date: isoPlus(date, i + 1) }));
  return {
    ...plan,
    days: [...plan.days.slice(0, at), { ...repeat, date }, ...shifted],
    changes: [
      ...plan.changes.map((c) => (c.from >= date && c.kind !== 'start' ? { ...c, from: isoPlus(c.from, 1) } : c)),
      { kind, from: date, deltaDays: 1 },
    ],
  };
}

/**
 * Stay on the previous day's dose on day `from`, then carry on with the rest
 * of the plan one day later. Nothing is recalculated. Only when the previous
 * day's dose was higher.
 */
export function holdAt(plan: SavedPlan, from: number): SavedPlan | null {
  if (from <= 0 || from >= plan.days.length) return null;
  const prev = plan.days[from - 1];
  if (prev.totalDaily <= plan.days[from].totalDaily) return null;
  return insertDay(plan, from, prev, 'hold');
}

/**
 * Take day `at`'s dose one more day: repeat it the next day and push the rest
 * back. Works on a plateau and on the last dosing day.
 */
export function extendAt(plan: SavedPlan, at: number): SavedPlan | null {
  const day = plan.days[at];
  if (!day || day.totalDaily <= 0) return null;
  return insertDay(plan, at + 1, day, 'extend');
}

/** Fewest days a rebuilt tail may have (start, end, and the stop day). */
function minTail(plan: SavedPlan): number {
  return plan.jumpOff === 0 ? 3 : 2;
}

/**
 * Spread the days from `from` on over `deltaDays` more (or fewer) days,
 * starting at that day's dose and ending at the plan's end dose. Returns null
 * when the change isn't possible (a stop day, or too few days left).
 */
export function changePaceAt(plan: SavedPlan, from: number, deltaDays: number): SavedPlan | null {
  const start = plan.days[from];
  if (!start || start.totalDaily === 0 || deltaDays === 0) return null;
  const left = plan.days.length - from;
  const length = Math.min(365 - from, left + deltaDays);
  if (length < minTail(plan) || length === left) return null;
  if (start.totalDaily <= plan.endTotal + 1e-9) return null;
  const days = [...plan.days.slice(0, from), ...tail(plan, start.date, start, length)];
  const applied = days.length - plan.days.length;
  if (applied === 0) return null;
  return {
    ...plan,
    days,
    changes: [
      ...plan.changes.filter((c) => c.from <= start.date || c.kind === 'start'),
      { kind: applied > 0 ? 'slower' : 'faster', from: start.date, deltaDays: applied },
    ],
  };
}

/** Restart from `from` at a dose the reader names, over `length` days. */
export function restartAt(
  plan: SavedPlan,
  from: number,
  dose: { perDose: number; dosesPerDay: number },
  length: number,
): SavedPlan | null {
  if (dose.perDose <= 0 || dose.dosesPerDay < 1 || from < 0 || from > plan.days.length) return null;
  const date = dateAt(plan, from);
  // The reader is starting over from what they take now: anchor to it.
  const anchored: SavedPlan = {
    ...plan,
    anchor: { total: exactProduct(dose.perDose, dose.dosesPerDay), doses: dose.dosesPerDay },
  };
  const days = [
    ...plan.days.slice(0, from),
    ...tail(anchored, date, dose, Math.max(minTail(plan), Math.min(365 - from, length))),
  ];
  return {
    ...anchored,
    days,
    changes: [
      ...plan.changes.filter((c) => c.from < date || c.kind === 'start'),
      { kind: 'restart', from: date, deltaDays: days.length - plan.days.length },
    ],
  };
}

/** Largest one-day drop in daily total from `from` on, as a fraction. */
export function largestCut(days: PlanDay[], from = 1): { pct: number; date: string } | null {
  let best: { pct: number; date: string } | null = null;
  for (let i = Math.max(1, from); i < days.length; i++) {
    if (days[i].totalDaily <= 0 || days[i - 1].totalDaily <= 0) continue;
    const pct = 1 - days[i].totalDaily / days[i - 1].totalDaily;
    if (!best || pct > best.pct) best = { pct, date: days[i].date };
  }
  return best;
}

/* ---------- measuring ---------- */

/** Quarter-tablet pieces in a dose, or null when it isn't whole pieces. */
export function tabletPieces(perDose: number, size: number): number | null {
  const q = (perDose / size) * 4;
  const r = Math.round(q);
  return r >= 1 && Math.abs(q - r) < 1e-6 ? r : null;
}

const FRACTIONS = ['', '¼', '½', '¾'];

function tabletAmount(pieces: number): string {
  const whole = Math.floor(pieces / 4);
  const frac = FRACTIONS[pieces % 4];
  if (whole === 0) return `${frac} of a tablet`;
  if (!frac) return `${whole} ${whole === 1 ? 'tablet' : 'tablets'}`;
  return `${whole}${frac} tablets`;
}

/** Active amount in a powder dose, rounded to what's worth reading: whole mg from 10 mg up. */
export function activeAmount(perDose: number, strengthPct: number): number {
  const a = (perDose * strengthPct) / 100;
  return a >= 10 ? Math.round(a) : Math.round(a * 10) / 10;
}

/** How to take one dose: a short line and a plain instruction. */
export function measureHint(perDose: number, measure: Measure, unit: string): { main: string; how: string } {
  if (perDose <= 0) return { main: '', how: '' };
  if (measure.kind === 'powder') {
    const active =
      measure.strengthPct && measure.strengthPct > 0
        ? ` (about ${formatAmount(activeAmount(perDose, measure.strengthPct))} ${unit} active at ${measure.strengthPct}%)`
        : '';
    return {
      main: `Weigh ${formatAmount(perDose)} ${unit} of powder`,
      how: `What your scale reads for each dose${active}.`,
    };
  }
  const pieces = tabletPieces(perDose, measure.size);
  if (pieces === null) {
    return {
      main: `About ${formatNumber(perDose / measure.size)} tablets`,
      how: `${formatAmount(perDose)} ${unit} with ${measure.size} ${unit} tablets.`,
    };
  }
  const whole = Math.floor(pieces / 4);
  const rest = pieces % 4;
  let how: string;
  if (rest === 0) how = `${whole === 1 ? 'One whole tablet' : `${whole} whole tablets`} (${measure.size} ${unit} each).`;
  else if (whole === 0) how = `Cut a tablet into 4 equal pieces and take ${rest}.`;
  else
    how = `${whole === 1 ? 'One whole tablet' : `${whole} whole tablets`}, plus ${rest} ${rest === 1 ? 'piece' : 'pieces'} from a tablet cut into 4.`;
  return { main: tabletAmount(pieces), how };
}

/** A short tablet label for tables: "¾ tab", "1¼ tabs". */
export function shortTablets(perDose: number, size: number): string {
  const pieces = tabletPieces(perDose, size);
  if (pieces === null) return `≈ ${formatNumber(perDose / size)} tabs`;
  const whole = Math.floor(pieces / 4);
  const frac = FRACTIONS[pieces % 4];
  const n = whole === 0 ? frac : `${whole}${frac}`;
  return `${n} ${pieces <= 4 ? 'tab' : 'tabs'}`;
}

/** Tablets needed for a set of days, rounded up to whole tablets. */
export function tabletsNeeded(days: PlanDay[], size: number): number {
  const pieces = days.reduce((a, d) => a + (tabletPieces(d.perDose, size) ?? Math.ceil((d.perDose / size) * 4)) * d.dosesPerDay, 0);
  return Math.ceil(pieces / 4);
}

/** A number without float noise, never prefixed. */
export function formatNumber(x: number): string {
  const e = exactProduct(x, 1);
  if (Math.abs(e * 1000 - Math.round(e * 1000)) <= 1e-6) return String(e);
  return String(e >= 1 ? Math.round(e * 100) / 100 : Number(e.toPrecision(2)));
}

/** An amount without float noise; repeating splits show "≈". */
export function formatAmount(x: number): string {
  const e = exactProduct(x, 1);
  if (Math.abs(e * 1000 - Math.round(e * 1000)) <= 1e-6) return String(e);
  return `≈ ${e >= 1 ? Math.round(e * 100) / 100 : Number(e.toPrecision(2))}`;
}

/** A +/- step that's about 5% of the amount, on a round number. */
export function niceStep(amount: number): number {
  const target = Math.max(1, amount * 0.05);
  const steps = [1, 2, 5, 10, 25, 50, 100, 250];
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
    measure: { kind: 'tablet', size: cfg.defaultTabletSize ?? 15 },
  };
}

/* ---------- storage ---------- */

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
  const m = p.measure as Measure | undefined;
  const measure: Measure =
    m && m.kind === 'tablet' && typeof m.size === 'number' && m.size > 0
      ? { kind: 'tablet', size: m.size }
      : m && m.kind === 'powder' && typeof m.strengthPct === 'number' && m.strengthPct > 0
        ? { kind: 'powder', strengthPct: m.strengthPct }
        : { kind: 'powder' };
  const last = lastDoseDay(days);
  return {
    v: 1,
    compound: p.compound,
    measure,
    jumpOff: typeof p.jumpOff === 'number' ? p.jumpOff : 0,
    endTotal: typeof p.endTotal === 'number' ? p.endTotal : last.totalDaily,
    anchor:
      p.anchor && typeof p.anchor.total === 'number' && typeof p.anchor.doses === 'number'
        ? p.anchor
        : { total: days[0].totalDaily, doses: days[0].dosesPerDay },
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
