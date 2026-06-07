import { Fragment, useEffect, useMemo, useState } from 'react';
import { Copy, Check, HelpCircle, Printer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart';

/* ───────────────────────── Substance config ───────────────────────── */

type SubstanceKey = 'bupe' | '7oh' | 'mgm' | 'pseudo' | 'leaf' | 'sr17';
type Difficulty = 'easier' | 'clinician' | 'harder' | 'super-hard' | 'custom';

interface SubstanceConfig {
  label: string;
  unit: string;
  /** Day | Week — what each row in the output represents. */
  stepUnit: 'day' | 'week';
  defaultPerDose: number;
  defaultDosesPerDay: number;
  /** Default per-dose for the jump-off step (taken once daily, by convention). */
  defaultJumpOff: number;
  /** Default tablet / capsule size for the substance. null for bupe (its
   *  per-dose tooltip uses the strip-size pattern instead). */
  defaultTabletSize: number | null;
  /** Singular noun for the form factor — "tablet" for pills, "capsule" for
   *  encapsulated leaf or SR-17 powder. */
  tabletUnitName: string;
  /** Caveat / note shown under the form for this substance. */
  note: string;
  related: { label: string; href: string }[];
}

const SUBSTANCES: Record<SubstanceKey, SubstanceConfig> = {
  '7oh': {
    label: '7-OH',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 15,
    defaultDosesPerDay: 4,
    defaultJumpOff: 5,
    defaultTabletSize: 15,
    tabletUnitName: 'tablet',
    note: 'Community-observed taper patterns for concentrated 7-OH cluster around halving for the first half, then progressively slower steps. Most self-managed 7-OH tapers end with a jump-off at some low dose rather than a clean taper to zero. The calculator drops doses-per-day as the total falls; per-dose stays in a tolerable range.',
    related: [
      { label: 'Tapering Off 7-OH', href: '/for-you/tapering-7oh' },
      { label: 'SR-17 as the other community-validated path', href: '/other-tools/sr-17' },
    ],
  },
  bupe: {
    label: 'Buprenorphine (Suboxone)',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 8,
    defaultDosesPerDay: 1,
    defaultJumpOff: 0.25,
    defaultTabletSize: null,
    tabletUnitName: 'strip',
    note: 'Established short-taper schedules from the Suboxone Rapid Taper page are used when the start dose and duration match (2, 4, 6, or 8 mg with 5/7/10/14/21-day options). For other start doses or durations, the calculator generates a daily percentage taper. Setting a jump-off below 0.25 mg extends the tail with volumetric sub-0.25 mg doses.',
    related: [
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'Custom Suboxone Dosing', href: '/mat-suboxone/suboxone-custom-dose' },
    ],
  },
  mgm: {
    label: 'MGM-15 / MIT-A / DHM products',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 10,
    defaultDosesPerDay: 3,
    defaultJumpOff: 2,
    defaultTabletSize: 10,
    tabletUnitName: 'tablet',
    note: 'MGM-15 is long-acting (community-reported 9–15 hour duration; no published human PK). MIT-A and DHM are the same compound. There is no clean community-standard schedule. The calculator runs percentage math from the chosen duration. Withdrawal hits harder than 7-OH and Suboxone induction needs a longer washout.',
    related: [
      { label: 'MIT-A and DHM Products', href: '/compounds/mit-a-dhm' },
      { label: 'MGM-15', href: '/compounds/mgm15' },
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'SR-17', href: '/other-tools/sr-17' },
    ],
  },
  pseudo: {
    label: 'Pseudo (mitragynine pseudoindoxyl)',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 7,
    defaultDosesPerDay: 3,
    defaultJumpOff: 1,
    defaultTabletSize: 5,
    tabletUnitName: 'tablet',
    note: 'Pseudoindoxyl binds the mu receptor tighter than buprenorphine itself. Published human pharmacology is thin and community schedules are not standardized. Treat the output as a directional plan, not a prescription. Suboxone induction may be incomplete; SR-17 is the other community-validated path off.',
    related: [
      { label: 'Pseudo (mitragynine pseudoindoxyl)', href: '/compounds/mitragynine-pseudoindoxyl' },
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'SR-17', href: '/other-tools/sr-17' },
    ],
  },
  leaf: {
    label: 'Kratom leaf (plain powder)',
    unit: 'g',
    stepUnit: 'day',
    defaultPerDose: 4,
    defaultDosesPerDay: 4,
    defaultJumpOff: 1,
    defaultTabletSize: 0.5,
    tabletUnitName: 'capsule',
    note: 'Leaf alkaloid content varies between strains, batches, and vendors. Grams are an approximation of dose. Most community leaf tapers end with a jump-off at 1–2 g/day rather than tapering to zero.',
    related: [
      { label: 'Quit 7-OH with Kratom Leaf', href: '/other-tools/quit-7-oh-with-kratom-leaf' },
    ],
  },
  sr17: {
    label: 'SR-17 (SR-17018)',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 50,
    defaultDosesPerDay: 3,
    defaultJumpOff: 25,
    defaultTabletSize: 25,
    tabletUnitName: 'tablet',
    note: 'SR-17 protocols in the community are short by design (5 to 14 days total). The calculator runs percentage math from your chosen duration. SR-17 is more often sold as a liquid solution than as tablets; the tablet-equivalent breakdown is approximate.',
    related: [
      { label: 'SR-17', href: '/other-tools/sr-17' },
    ],
  },
};

/** Bupe presets line up with the published 5 / 7 / 10 / 14 / 21-day
 *  columns on the Suboxone Rapid Taper page so the established schedules
 *  fire when the start dose matches. */
const BUPE_DURATION_DAYS: Record<Exclude<Difficulty, 'custom'>, number> = {
  easier: 21,
  clinician: 14,
  harder: 10,
  'super-hard': 5,
};

const BUPE_DURATION_LABELS: Record<Difficulty, string> = {
  easier: '21 days',
  clinician: '14 days',
  harder: '10 days',
  'super-hard': '5 days',
  custom: 'Custom duration',
};

/** Non-bupe presets start at 21 days and stretch into months. The math
 *  backend still operates in days; the labels read in months for the
 *  longer ones because that's how most readers think about a taper that
 *  runs that long. */
const LONG_DURATION_DAYS: Record<Exclude<Difficulty, 'custom'>, number> = {
  easier: 90,
  clinician: 60,
  harder: 30,
  'super-hard': 21,
};

const LONG_DURATION_LABELS: Record<Difficulty, string> = {
  easier: '3 months',
  clinician: '2 months',
  harder: '1 month',
  'super-hard': '21 days',
  custom: 'Custom duration',
};

/** SR-17 presets mirror the community-reported course range (5–14 days).
 *  The 'super-hard' slot is hidden from the SR-17 dropdown but kept here
 *  so the Difficulty-keyed Records stay total. */
const SR17_DURATION_DAYS: Record<Exclude<Difficulty, 'custom'>, number> = {
  easier: 14,
  clinician: 10,
  harder: 5,
  'super-hard': 5,
};

const SR17_DURATION_LABELS: Record<Difficulty, string> = {
  easier: '14 days',
  clinician: '10 days',
  harder: '5 days',
  'super-hard': '5 days',
  custom: 'Custom duration',
};

function difficultyDaysFor(
  substance: SubstanceKey,
  difficulty: Exclude<Difficulty, 'custom'>,
): number {
  if (substance === 'bupe') return BUPE_DURATION_DAYS[difficulty];
  if (substance === 'sr17') return SR17_DURATION_DAYS[difficulty];
  return LONG_DURATION_DAYS[difficulty];
}

function difficultyLabelsFor(substance: SubstanceKey): Record<Difficulty, string> {
  if (substance === 'bupe') return BUPE_DURATION_LABELS;
  if (substance === 'sr17') return SR17_DURATION_LABELS;
  return LONG_DURATION_LABELS;
}

/** Default duration preset per substance.
 *   - 7-OH, MGM-15 / MIT-A, pseudo, leaf → 'harder' (1 month / 30 days),
 *     matching what the community converges on for the kratom-derived
 *     synthetics and plain leaf.
 *   - bupe → 'clinician' (14 days), the most-used column on the
 *     Suboxone Rapid Taper page.
 *   - SR-17 → 'clinician' (10 days), the middle of the 5–14 day range. */
const DEFAULT_DIFFICULTY: Record<SubstanceKey, Difficulty> = {
  '7oh': 'harder',
  bupe: 'clinician',
  mgm: 'harder',
  pseudo: 'harder',
  leaf: 'harder',
  sr17: 'clinician',
};

/* ───────────────────────── Bupe established schedules ───────────────────────── */

const BUPE_SCHEDULES: Record<number, Record<number, number[]>> = {
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

/** Convert a target duration (in days) to the equivalent per-day percentage
 *  cut that will descend from totalStart to jumpOff in exactly that many
 *  days. Inverse: log(jumpOff / totalStart) / log(1 - pct/100) = days. */
function pctFromDuration(totalStart: number, jumpOff: number, days: number): number {
  if (totalStart <= jumpOff || days <= 0) return 0;
  const ratio = jumpOff / totalStart;
  return (1 - Math.pow(ratio, 1 / days)) * 100;
}

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
  if (jumpOff < BUPE_SUB025_TAIL[BUPE_SUB025_TAIL.length - 1]) tail.push(jumpOff);
  return tail;
}

/* ───────────────────────── Schedule generator ───────────────────────── */

interface ScheduleStep {
  perDose: number;
  dosesPerDay: number;
  totalDaily: number;
}

type ScheduleSource = 'bupe-established' | 'bupe-percent' | 'percent';

interface ScheduleResult {
  steps: ScheduleStep[];
  source: ScheduleSource;
  totalMedication: number;
}

/** Given a total daily target at step i, compute a reasonable doses-per-day
 *  by scaling proportionally to the starting frequency. Floors at 1. */
function dosesPerDayFor(total: number, totalStart: number, n0: number): number {
  if (n0 <= 1) return 1;
  if (total <= 0) return 1;
  const scaled = Math.ceil((n0 * total) / totalStart);
  return Math.max(1, Math.min(n0, scaled));
}

function percentTotalsSchedule(start: number, jumpOff: number, pct: number): number[] {
  if (start <= jumpOff) return [start];
  const totals: number[] = [start];
  let dose = start;
  for (let i = 0; i < 200; i++) {
    dose = dose * (1 - pct / 100);
    if (dose <= jumpOff) break;
    totals.push(dose);
  }
  totals.push(jumpOff);
  return totals;
}

function buildSteps(totals: number[], totalStart: number, n0: number): ScheduleStep[] {
  return totals.map((rawTotal, i) => {
    // Final step is the explicit jump-off dose — convention: taken once,
    // and we preserve the reader's exact input rather than snapping to 0.25.
    const isLast = i === totals.length - 1;
    const n = isLast ? 1 : dosesPerDayFor(rawTotal, totalStart, n0);
    const perDose = isLast ? roundDose(rawTotal) : roundPerDose(rawTotal / n);
    // Total daily uses the same 0.25 grid as per-dose since it's just
    // perDose × N. Routing through roundDose's 0.1-grid branch turned
    // 35.25 into 35.3 (11.75 × 3 rounded up). Use roundPerDose so the
    // displayed total matches what the multiplication actually gives.
    return {
      totalDaily: roundPerDose(perDose * n),
      dosesPerDay: n,
      perDose,
    };
  });
}

/** General-purpose rounding: keep more precision the smaller the number. */
function roundDose(x: number): number {
  if (x >= 10) return Math.round(x * 10) / 10;
  if (x >= 1) return Math.round(x * 100) / 100;
  if (x >= 0.1) return Math.round(x * 1000) / 1000;
  return Math.round(x * 10000) / 10000;
}

/** Per-dose rounding: nearest 0.25 throughout the practical range so
 *  no day asks for a hard-to-measure dose like 13.847 or 0.996.
 *    ≥ 0.25  → nearest 0.25 (e.g. 13.7 → 13.75, 0.756 → 0.75)
 *    < 0.25  → preserve precision via roundDose (the bupe volumetric
 *              tail goes 0.1 / 0.05 / 0.02 mg). */
function roundPerDose(x: number): number {
  if (x >= 0.25) return Math.round(x * 4) / 4;
  return roundDose(x);
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function generateSchedule(
  substance: SubstanceKey,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  difficulty: Difficulty,
  customDays: number,
): ScheduleResult {
  const totalStart = perDose * dosesPerDay;
  const n0 = Math.max(1, Math.round(dosesPerDay));

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
  if (jumpOff > 0 && jumpOff >= totalStart) {
    return {
      steps: [{ totalDaily: totalStart, perDose, dosesPerDay: n0 }],
      source: 'percent',
      totalMedication: round2(totalStart),
    };
  }

  // jumpOff = 0 means "taper all the way down to zero." Multiplicative %
  // math can't reach zero in finite steps, so we run the curve to a small
  // practical floor and then append a single 0-dose day as the explicit
  // jump-off step. The floor is substance-aware: bupe goes down to the
  // documented volumetric tail (0.02 mg); other substances use a 2% fraction
  // of the starting total with a 0.5-unit floor.
  const wantsAbsoluteZero = jumpOff === 0;
  const effectiveJumpOff = wantsAbsoluteZero
    ? substance === 'bupe'
      ? 0.02
      : Math.max(0.5, totalStart * 0.02)
    : jumpOff;

  const days =
    difficulty === 'custom'
      ? Math.max(1, Math.round(customDays))
      : difficultyDaysFor(substance, difficulty as Exclude<Difficulty, 'custom'>);

  function withZeroIfRequested(steps: ScheduleStep[]): ScheduleStep[] {
    if (!wantsAbsoluteZero) return steps;
    return [...steps, { totalDaily: 0, dosesPerDay: 1, perDose: 0 }];
  }

  if (substance === 'bupe') {
    // Bupe established schedules assume 1×/day sublingual. Try (start, days)
    // against the published table first; fall through to % math otherwise.
    if (BUPE_SCHEDULES[totalStart]?.[days]) {
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
      const baseSteps: ScheduleStep[] = totals.map((d) => ({
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
    const pct = pctFromDuration(totalStart, effectiveJumpOff, days);
    const totals = percentTotalsSchedule(totalStart, effectiveJumpOff, pct);
    const steps = withZeroIfRequested(buildSteps(totals, totalStart, n0));
    return {
      steps,
      source: 'bupe-percent',
      totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
    };
  }

  const pct = pctFromDuration(totalStart, effectiveJumpOff, days);
  const totals = percentTotalsSchedule(totalStart, effectiveJumpOff, pct);
  const steps = withZeroIfRequested(buildSteps(totals, totalStart, n0));
  return {
    steps,
    source: 'percent',
    totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
  };
}

/* ───────────────────────── Component ───────────────────────── */

const chartConfig = {
  totalDaily: {
    label: 'Total daily',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function TaperCalculator() {
  const [substance, setSubstance] = useState<SubstanceKey>('7oh');
  const cfg = SUBSTANCES[substance];

  const [perDose, setPerDose] = useState<number>(cfg.defaultPerDose);
  const [dosesPerDay, setDosesPerDay] = useState<number>(cfg.defaultDosesPerDay);
  const [jumpOff, setJumpOff] = useState<number>(cfg.defaultJumpOff);
  /** Tablet / capsule size — used for the per-dose-in-tablets tooltip on
   *  non-bupe rows. Bupe uses the strip-equivalents pattern instead.
   *  Blank by default; reader fills in the size of their actual product
   *  (or leaves it blank to skip the tooltip). */
  const [tabletSize, setTabletSize] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY[substance]);
  /** Custom mode source of truth: total taper duration in days. */
  const [customDays, setCustomDays] = useState<number>(14);
  const [copied, setCopied] = useState<boolean>(false);

  // Clear "Copied!" confirmation after 2 seconds.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const totalDaily = useMemo(() => perDose * dosesPerDay, [perDose, dosesPerDay]);

  /** When jump-off is 0, the % math is undefined (log(0) = −∞). We use a
   *  substance-aware floor as the "effective" jump-off for the bidirectional
   *  custom-mode math, mirroring the rule in generateSchedule. */
  const effectiveJumpForUI = useMemo(() => {
    if (jumpOff > 0) return jumpOff;
    if (substance === 'bupe') return 0.02;
    return Math.max(0.5, totalDaily * 0.02);
  }, [jumpOff, substance, totalDaily]);

  /** Custom mode derived display: the per-day percentage cut that descends
   *  from totalDaily to jumpOff over customDays days. Updates live whenever
   *  the dose, jump-off, or duration change. */
  const customPctDisplay = useMemo(() => {
    if (totalDaily <= effectiveJumpForUI || customDays <= 0) return 0;
    const ratio = effectiveJumpForUI / totalDaily;
    const pct = (1 - Math.pow(ratio, 1 / customDays)) * 100;
    return Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0;
  }, [totalDaily, effectiveJumpForUI, customDays]);

  const handleSubstanceChange = (next: SubstanceKey) => {
    setSubstance(next);
    setPerDose(SUBSTANCES[next].defaultPerDose);
    setDosesPerDay(SUBSTANCES[next].defaultDosesPerDay);
    setJumpOff(SUBSTANCES[next].defaultJumpOff);
    setTabletSize(0);
    setDifficulty(DEFAULT_DIFFICULTY[next]);
  };

  const handleCopyPrompt = async () => {
    const text = buildPromptText(cfg, perDose, dosesPerDay, jumpOff, result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard API blocked (older browsers, insecure context). Fall back
      // to creating a hidden textarea and using execCommand('copy').
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {
        // Give up; the user can still see the prompt in the DOM if we
        // expose it elsewhere. For now, the lack of confirmation is the
        // signal that something went wrong.
      }
      document.body.removeChild(ta);
    }
  };

  const handlePrint = () => {
    const html = buildPrintHTML(cfg, perDose, dosesPerDay, jumpOff, result);
    const win = window.open('', '_blank');
    if (!win) {
      // Popup blocked. Fall back to printing the current page (uses the
      // print:hidden Tailwind classes — not as clean, but it works).
      window.print();
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  /** Edit the % directly; recompute the duration that produces it. */
  const handleCustomPctChange = (newPct: number) => {
    if (!Number.isFinite(newPct) || newPct <= 0 || newPct >= 100) return;
    if (totalDaily <= effectiveJumpForUI) return;
    const ratio = effectiveJumpForUI / totalDaily;
    const days = Math.log(ratio) / Math.log(1 - newPct / 100);
    if (Number.isFinite(days) && days >= 1) {
      setCustomDays(Math.max(1, Math.round(days)));
    }
  };

  const result = useMemo(
    () => generateSchedule(substance, perDose, dosesPerDay, jumpOff, difficulty, customDays),
    [substance, perDose, dosesPerDay, jumpOff, difficulty, customDays],
  );

  const totalSteps = result.steps.length;
  const totalDuration = totalSteps > 0 ? `${totalSteps} day${totalSteps === 1 ? '' : 's'}` : '—';

  const chartData = result.steps.map((s, i) => ({
    step: i + 1,
    totalDaily: s.totalDaily,
  }));

  return (
    <TooltipProvider delayDuration={150}>
    <div className="not-prose my-6 space-y-6">
      {/* Form */}
      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 print:hidden">
        <div className="sm:col-span-2">
          <Label htmlFor="substance">What are you tapering?</Label>
          <Select value={substance} onValueChange={(v) => handleSubstanceChange(v as SubstanceKey)}>
            <SelectTrigger id="substance" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SUBSTANCES) as [SubstanceKey, SubstanceConfig][]).map(
                ([key, c]) => (
                  <SelectItem key={key} value={key}>
                    {c.label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="per-dose">Per-dose amount ({cfg.unit})</Label>
          <Input
            id="per-dose"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={perDose}
            onChange={(e) => setPerDose(parseFloat(e.target.value) || 0)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="doses-per-day">Times per day</Label>
          <Input
            id="doses-per-day"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            step={1}
            value={dosesPerDay}
            onChange={(e) => setDosesPerDay(parseInt(e.target.value, 10) || 1)}
            className="mt-1.5"
          />
        </div>

        {cfg.defaultTabletSize !== null && (
          <div className="sm:col-span-2">
            <Label htmlFor="tablet-size">
              {cfg.tabletUnitName.charAt(0).toUpperCase() + cfg.tabletUnitName.slice(1)} size ({cfg.unit} per {cfg.tabletUnitName})
            </Label>
            <Input
              id="tablet-size"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={tabletSize || ''}
              onChange={(e) => setTabletSize(parseFloat(e.target.value) || 0)}
              placeholder={
                cfg.defaultTabletSize !== null
                  ? `e.g. ${cfg.defaultTabletSize}`
                  : undefined
              }
              className="mt-1.5 sm:w-48"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional. Fill in the size of the {cfg.tabletUnitName} you actually have. When set, the schedule table shows each per-dose as a {cfg.tabletUnitName} count (down to quarters). Real {cfg.tabletUnitName}s vary in content between products and batches. Treat the breakdown as a measuring guide, not an exact dose.
            </p>
          </div>
        )}

        <div className="sm:col-span-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total daily:</span>{' '}
          <span className="font-semibold text-foreground">
            {roundDose(totalDaily)} {cfg.unit}
          </span>
          <span className="text-muted-foreground">
            {' '}
            ({roundDose(perDose)} × {dosesPerDay})
          </span>
        </div>

        <div>
          <Label htmlFor="jump-off">Jump-off dose ({cfg.unit})</Label>
          <Input
            id="jump-off"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={jumpOff}
            onChange={(e) => setJumpOff(parseFloat(e.target.value) || 0)}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Final dose (taken once) before stopping completely.
          </p>
        </div>

        <div>
          <Label htmlFor="difficulty">Taper duration</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger id="difficulty" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(difficultyLabelsFor(substance)) as [Difficulty, string][]).map(
                ([key, label]) => {
                  // SR-17 menu is 14 / 10 / 5 days + custom — the
                  // 'super-hard' slot is a Difficulty-Record placeholder
                  // and shouldn't render as a separate UI option.
                  if (substance === 'sr17' && key === 'super-hard') return null;
                  return (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  );
                },
              )}
            </SelectContent>
          </Select>
        </div>

        {difficulty === 'custom' && (
          <div className="sm:col-span-2 grid gap-4 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="custom-days">Total duration</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="custom-days"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  step={1}
                  value={customDays || ''}
                  onChange={(e) =>
                    setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                e.g. 14, 21, 60. Editing either field updates the other.
              </p>
            </div>
            <div>
              <Label htmlFor="custom-pct">Percentage per day</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="custom-pct"
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={75}
                  step="0.5"
                  value={customPctDisplay || ''}
                  onChange={(e) => handleCustomPctChange(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">% per day</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output */}
      {result.steps.length > 0 ? (
        <>
          {/* Print-only header — visible when the reader picks
              "Save as PDF". Stripped from the on-screen view. */}
          <div className="hidden print:block">
            <h1 className="m-0 text-xl font-bold text-foreground">
              Taper schedule — {cfg.label}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {roundDose(perDose)} {cfg.unit} × {dosesPerDay}/day → jump-off at{' '}
              {roundDose(jumpOff)} {cfg.unit} over {result.steps.length} days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generated by quitting7oh.org · {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3">
            <Stat label="Total duration" value={totalDuration} />
            <Stat
              label="Total medication"
              value={`${result.totalMedication} ${cfg.unit}`}
            />
            <Stat label="Approach" value={sourceLabel(result.source)} />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Schedule curve (total daily)
            </h3>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="taperFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="step"
                    label={{
                      value: 'Day',
                      position: 'insideBottom',
                      offset: -2,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    label={{
                      value: `Dose (${cfg.unit})`,
                      angle: -90,
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="stepAfter"
                    dataKey="totalDaily"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#taperFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Schedule table
            </h3>
            <div>
              <table className="w-full text-sm">
                <thead className="bg-card text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Day</th>
                    <th className="py-2 pr-4">Per dose ({cfg.unit})</th>
                    <th className="py-2 pr-4">Times/day</th>
                    <th className="py-2">Total daily ({cfg.unit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.steps.map((s, i) => {
                    const prevN = i > 0 ? result.steps[i - 1].dosesPerDay : null;
                    const isTransition = prevN !== null && prevN !== s.dosesPerDay;
                    return (
                      <Fragment key={i}>
                        {isTransition && (
                          <tr className="border-y-2 border-amber-500 bg-amber-500/15 dark:bg-amber-400/15">
                            <td
                              colSpan={4}
                              className="px-2 py-2 text-sm font-bold text-amber-900 dark:text-amber-100"
                            >
                              <span className="mr-2 text-base" aria-hidden="true">
                                ↓
                              </span>
                              Drop dosing to <span className="underline">{s.dosesPerDay}×/day</span>{' '}
                              starting Day {i + 1}
                            </td>
                          </tr>
                        )}
                        <tr
                          className={
                            isTransition
                              ? 'bg-amber-50/50 dark:bg-amber-950/20'
                              : ''
                          }
                        >
                          <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 pr-4 text-foreground">
                            {substance === 'bupe' ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded text-left text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    aria-label={`${s.perDose} mg — show strip equivalents`}
                                  >
                                    <span>{s.perDose}</span>
                                    <HelpCircle
                                      className="h-3.5 w-3.5 text-muted-foreground print:hidden"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs text-base leading-snug"
                                >
                                  {bupeStripEquivalents(s.perDose)}
                                </TooltipContent>
                              </Tooltip>
                            ) : cfg.defaultTabletSize !== null && tabletSize > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded text-left text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    aria-label={`${s.perDose} ${cfg.unit} — show ${cfg.tabletUnitName} count`}
                                  >
                                    <span>{s.perDose}</span>
                                    <HelpCircle
                                      className="h-3.5 w-3.5 text-muted-foreground print:hidden"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs text-base leading-snug"
                                >
                                  {tabletEquivalents(
                                    s.perDose,
                                    tabletSize,
                                    cfg.unit,
                                    cfg.tabletUnitName,
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              s.perDose
                            )}
                          </td>
                          <td
                            className={
                              isTransition
                                ? 'py-2 pr-4 font-bold text-amber-900 dark:text-amber-100'
                                : 'py-2 pr-4 text-foreground'
                            }
                          >
                            {s.dosesPerDay}
                          </td>
                          <td className="py-2 font-medium text-foreground">{s.totalDaily}</td>
                        </tr>
                      </Fragment>
                    );
                  })}
                  <tr className="border-t-2 border-border">
                    <td
                      className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      colSpan={3}
                    >
                      Total medication
                    </td>
                    <td className="py-2 font-semibold text-foreground">
                      {result.totalMedication} {cfg.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Export actions — hidden from print so the saved PDF doesn't
              show buttons that don't do anything in a printed page. */}
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyPrompt}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy AI prompt
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Save as PDF
            </Button>
            <p className="basis-full text-xs text-muted-foreground">
              The AI prompt copies your taper plan to your clipboard so
              you can paste it into ChatGPT, Claude, or similar and ask
              for a personalized refinement. "Save as PDF" opens a clean
              printable view in a new window — pick "Save as PDF" as the
              destination in the print dialog. (If the popup is blocked,
              your browser may print the current page instead.)
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Enter a per-dose amount and times-per-day larger than the jump-off
          dose to see a schedule.
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-4 print:hidden">
        <p className="text-sm text-foreground">{cfg.note}</p>
        {cfg.related.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {cfg.related.map((r) => (
              <a
                key={r.href}
                href={r.href}
                className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
              >
                {r.label} →
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function sourceLabel(source: ScheduleSource): string {
  switch (source) {
    case 'bupe-established':
      return 'Established schedule';
    case 'bupe-percent':
      return 'Percentage taper';
    case 'percent':
      return 'Percentage taper';
  }
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Format an integer-/16ths count against a commercial strip size as a
 *  reduced, plain-language fraction. 4/16 → "1/4", 2/16 → "1/8", 8/16 →
 *  "1/2", etc. Mixed numbers handle multi-strip doses (e.g. 6 mg on a
 *  4 mg strip = 24/16 = "1 1/2 strips of 4 mg"). */
function formatStripFraction(sixteenths: number, strip: number): string {
  const article = strip === 8 ? 'an' : 'a';
  if (sixteenths === 16) {
    return `a full ${strip} mg strip`;
  }
  if (sixteenths > 16) {
    const whole = Math.floor(sixteenths / 16);
    const remainder = sixteenths - whole * 16;
    if (remainder === 0) {
      return `${whole} strips of ${strip} mg`;
    }
    const g = gcd(remainder, 16);
    return `${whole} ${remainder / g}/${16 / g} strips of ${strip} mg`;
  }
  const g = gcd(sixteenths, 16);
  return `${sixteenths / g}/${16 / g} of ${article} ${strip} mg strip`;
}

/** For a given bupe per-dose, return the clean integer-/16ths equivalents
 *  across the three commercial Suboxone strip sizes (8 / 4 / 2 mg). A
 *  per-dose snaps cleanly to /16ths of a strip when (perDose × 16 / strip)
 *  lands on a whole number. The 8 mg strip has the biggest /16 piece
 *  (0.5 mg); the 2 mg strip the smallest (0.125 mg). Doses below 0.125 mg
 *  don't snap to any commercial /16 — those need volumetric dosing.
 *  Fractions are reduced (4/16 → 1/4, 6/16 → 3/8, etc.) so readers don't
 *  have to do the math themselves at the tablet edge. */
function bupeStripEquivalents(perDose: number): string {
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
    return 'Below 1/16 of even a 2 mg strip. Volumetric dosing recommended.';
  }
  return lines.join(' · ');
}

/** For non-bupe substances with a tablet/capsule size set, render the
 *  per-dose as a tablet count rounded to the nearest quarter. Capsules
 *  open and powder can be poured out, so quarters apply to both pills
 *  and capsules. Returns a short sentence the tooltip can display. */
function tabletEquivalents(
  perDose: number,
  tabletSize: number,
  unit: string,
  tabletUnitName: string,
): string {
  if (!Number.isFinite(tabletSize) || tabletSize <= 0) {
    return `Enter a ${tabletUnitName} size above to see the breakdown.`;
  }
  if (perDose <= 0) return `0 ${tabletUnitName}s`;
  const raw = perDose / tabletSize;
  const quarters = Math.round(raw * 4) / 4;
  if (quarters < 0.25) {
    return `Less than ¼ ${tabletUnitName} (${tabletSize} ${unit} per ${tabletUnitName}). Measure by weight or volume at this dose.`;
  }
  const whole = Math.floor(quarters);
  const frac = quarters - whole;
  const fracText = frac === 0.25 ? '¼' : frac === 0.5 ? '½' : frac === 0.75 ? '¾' : '';
  let number = '';
  if (whole === 0) number = fracText;
  else if (frac === 0) number = `${whole}`;
  else number = `${whole}${fracText}`;
  const noun = quarters === 1 ? tabletUnitName : `${tabletUnitName}s`;
  return `${number} ${noun} (${tabletSize} ${unit} per ${tabletUnitName})`;
}

function escHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]!,
  );
}

/** Build a self-contained HTML document for the print view. Opened in a
 *  popup window, isolated from the site's layout chrome (header, footer,
 *  sidebar, theme picker, etc.) so the resulting PDF is clean. */
function buildPrintHTML(
  cfg: SubstanceConfig,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  result: ScheduleResult,
): string {
  const unit = cfg.unit;
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tableRows = result.steps
    .map((s, i) => {
      const prevN = i > 0 ? result.steps[i - 1].dosesPerDay : null;
      const isTransition = prevN !== null && prevN !== s.dosesPerDay;
      const isLast = i === result.steps.length - 1;
      const transitionRow = isTransition
        ? `<tr class="transition-callout"><td colspan="4">↓ Drop dosing to ${s.dosesPerDay}×/day starting Day ${i + 1}</td></tr>`
        : '';
      const rowClass = isTransition
        ? 'transition'
        : isLast
          ? 'jump-off'
          : '';
      const dayLabel = isLast
        ? `${i + 1} <span class="muted">(jump-off)</span>`
        : `${i + 1}`;
      return `${transitionRow}<tr class="${rowClass}"><td>${dayLabel}</td><td>${s.perDose}</td><td>${s.dosesPerDay}</td><td>${s.totalDaily}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Taper Schedule — ${escHtml(cfg.label)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 2rem;
    max-width: 7.5in;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.45;
  }
  h1 { font-size: 1.4rem; margin: 0 0 0.35rem; }
  .subtitle { color: #444; margin: 0 0 0.25rem; font-size: 0.95rem; }
  .generated { color: #666; font-size: 0.8rem; margin: 0 0 1.5rem; }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding: 0.85rem;
    background: #f6f6f6;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    margin-bottom: 1.5rem;
  }
  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    margin-bottom: 0.2rem;
  }
  .stat-value { font-size: 1rem; font-weight: 600; }
  h2 {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #444;
    margin: 0 0 0.5rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  thead th {
    text-align: left;
    padding: 0.45rem 0.6rem;
    border-bottom: 2px solid #333;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #555;
  }
  tbody td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #e5e5e5;
  }
  tbody tr.transition td { background: #fff8e1; font-weight: 600; }
  tbody tr.transition-callout td {
    background: #fef3c7;
    border-top: 2px solid #f59e0b;
    border-bottom: 2px solid #f59e0b;
    font-weight: 700;
    color: #78350f;
  }
  tbody tr.jump-off td { font-weight: 600; }
  .muted { color: #666; font-weight: 400; }
  .footer {
    margin-top: 1.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e5e5;
    font-size: 0.75rem;
    color: #555;
    line-height: 1.5;
  }
  .footer strong { color: #111; }
  @media print {
    body { padding: 0.5in; max-width: none; }
    @page { margin: 0.5in; }
    tbody tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<h1>Taper Schedule</h1>
<p class="subtitle"><strong>${escHtml(cfg.label)}</strong> · ${roundDose(perDose)} ${escHtml(unit)} × ${dosesPerDay}/day → jump-off at ${roundDose(jumpOff)} ${escHtml(unit)} over ${result.steps.length} days</p>
<p class="generated">Generated by quitting7oh.org · ${escHtml(today)}</p>

<div class="stats">
  <div>
    <div class="stat-label">Total duration</div>
    <div class="stat-value">${result.steps.length} day${result.steps.length === 1 ? '' : 's'}</div>
  </div>
  <div>
    <div class="stat-label">Total medication</div>
    <div class="stat-value">${result.totalMedication} ${escHtml(unit)}</div>
  </div>
  <div>
    <div class="stat-label">Approach</div>
    <div class="stat-value">${escHtml(sourceLabel(result.source))}</div>
  </div>
</div>

<h2>Schedule</h2>
<table>
  <thead>
    <tr>
      <th>Day</th>
      <th>Per dose (${escHtml(unit)})</th>
      <th>Times / day</th>
      <th>Total daily (${escHtml(unit)})</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>

<p class="footer">
  <strong>Reference, not a prescription.</strong> This schedule is community-derived from
  quitting7oh.org and is not clinical guidance. For buprenorphine, see a prescriber. For
  the kratom-derived synthetics, the live community discussion on the Discord and at
  r/quitting7oh is genuinely ahead of the published clinical literature for path-shape
  questions.
</p>

<script>
  // Wait for layout, then print. Close the popup once the dialog is dismissed.
  window.addEventListener('load', function () {
    window.focus();
    setTimeout(function () { window.print(); }, 100);
  });
  window.addEventListener('afterprint', function () { window.close(); });
</script>
</body>
</html>`;
}

/** Build the AI-prompt text the reader copies into ChatGPT / Claude / etc.
 *  The reader fills in the bracketed CONTEXT section themselves. */
function buildPromptText(
  cfg: SubstanceConfig,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  result: ScheduleResult,
): string {
  const unit = cfg.unit;
  const totalDaily = roundDose(perDose * dosesPerDay);
  const scheduleLines = result.steps
    .map((s, i) => {
      const day = i + 1;
      const isLast = i === result.steps.length - 1;
      const marker = isLast ? ' (jump-off)' : '';
      return `Day ${day}: ${s.perDose} ${unit} × ${s.dosesPerDay}/day = ${s.totalDaily} ${unit}/day${marker}`;
    })
    .join('\n');
  const durationDays = result.steps.length;

  return `I'm tapering off ${cfg.label} and want help personalizing my plan.

PLAN (generated by the quitting7oh.org taper calculator):
- Starting dose: ${perDose} ${unit} × ${dosesPerDay}/day = ${totalDaily} ${unit}/day
- Jump-off dose: ${jumpOff} ${unit} (one final dose before stopping completely)
- Duration: ${durationDays} day${durationDays === 1 ? '' : 's'}
- Total medication across the taper: ${result.totalMedication} ${unit}
- Approach: ${sourceLabel(result.source)}

DAY-BY-DAY SCHEDULE:
${scheduleLines}

CONTEXT — please ask me about these before suggesting changes:
- How long I've been on this substance and at what doses
- Other medications, medical conditions, and any polysubstance use
- Work, family, and support obligations during the taper
- What I have access to: helper meds, telehealth, vitamins, etc.
- Past taper attempts and what worked or didn't

WHAT I NEED HELP WITH:
1. Whether this schedule fits my situation or needs adjustment
2. Helper meds, supplements, or comfort measures that fit
3. Symptoms to expect at each phase
4. When to slow down, stabilize, or abort
5. When to bring in a clinician

IMPORTANT:
- This calculator is community-derived from quitting7oh.org — not a clinical prescription
- Don't replace a prescriber; help me think through what to ask one
- Flag anything that looks dangerous given my context
- Be honest about uncertainty; the published clinical literature on these compounds is thin`;
}
