import { Fragment, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
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
  /** Caveat / note shown under the form for this substance. */
  note: string;
  related: { label: string; href: string }[];
}

const SUBSTANCES: Record<SubstanceKey, SubstanceConfig> = {
  bupe: {
    label: 'Buprenorphine (Suboxone)',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 8,
    defaultDosesPerDay: 1,
    defaultJumpOff: 0.25,
    note: 'Established short-taper schedules from the Suboxone Rapid Taper page are used when the start dose and duration match (2, 4, 6, or 8 mg with 5/7/10/14/21-day options). For other start doses or durations, the calculator generates a daily percentage taper. Setting a jump-off below 0.25 mg extends the tail with volumetric sub-0.25 mg doses.',
    related: [
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'Custom Suboxone Dosing', href: '/mat-suboxone/suboxone-custom-dose' },
    ],
  },
  '7oh': {
    label: '7-OH (concentrated)',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 15,
    defaultDosesPerDay: 4,
    defaultJumpOff: 5,
    note: 'Community-observed taper patterns for concentrated 7-OH cluster around halving for the first half, then progressively slower steps. Most self-managed 7-OH tapers end with a jump-off at some low dose rather than a clean taper to zero. The calculator drops doses-per-day as the total falls; per-dose stays in a tolerable range.',
    related: [
      { label: 'Tapering Off 7-OH', href: '/for-you/tapering-7oh' },
      { label: 'SR-17 as the other community-validated path', href: '/other-tools/sr-17' },
    ],
  },
  mgm: {
    label: 'MGM-15 / MIT-A / DHM products',
    unit: 'mg',
    stepUnit: 'day',
    defaultPerDose: 10,
    defaultDosesPerDay: 3,
    defaultJumpOff: 2,
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
    note: 'The community SR-17 protocol is short by design (10–14 days total course; 4-day descending taper from 100 mg/day at the published 50 × 3 dosing). Picking "Community protocol" emits the published 100 → 75 → 50 → 25 → jump pattern scaled to your dose. The custom-percentage option exists for readers running a non-standard course.',
    related: [
      { label: 'SR-17', href: '/other-tools/sr-17' },
    ],
  },
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easier: '21 days',
  clinician: '14 days',
  harder: '10 days',
  'super-hard': '5 days',
  custom: 'Custom duration',
};

/** Difficulty → total taper duration in days. The named presets line up
 *  with the 5 / 7 / 10 / 14 / 21-day columns on the Suboxone Rapid Taper
 *  page so that, for matching bupe start doses, the difficulty maps cleanly
 *  to a published schedule. For other substances or non-matching bupe doses,
 *  the calculator derives the per-day percentage from the chosen duration:
 *  pct = 1 − (jumpOff / totalStart)^(1/days). */
const DIFFICULTY_DAYS: Record<Exclude<Difficulty, 'custom'>, number> = {
  easier: 21,
  clinician: 14,
  harder: 10,
  'super-hard': 5,
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

/* ───────────────────────── SR-17 community protocol ───────────────────────── */

function sr17CommunityTotals(totalStart: number, jumpOffTotal: number): number[] {
  // Published 4-day descending pattern (100 → 75 → 50 → 25 → jump) scaled to
  // the reader's total daily dose. Each step is one day.
  const totals: number[] = [];
  let total = totalStart;
  const cut = totalStart / 4;
  while (total > jumpOffTotal) {
    totals.push(total);
    total -= cut;
  }
  totals.push(jumpOffTotal);
  return totals;
}

/* ───────────────────────── Schedule generator ───────────────────────── */

interface ScheduleStep {
  perDose: number;
  dosesPerDay: number;
  totalDaily: number;
}

type ScheduleSource =
  | 'bupe-established'
  | 'bupe-percent'
  | 'sr17-protocol'
  | 'percent';

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
    // and we preserve the reader's exact input rather than snapping to 0.5.
    const isLast = i === totals.length - 1;
    const n = isLast ? 1 : dosesPerDayFor(rawTotal, totalStart, n0);
    const perDose = isLast ? roundDose(rawTotal) : roundPerDose(rawTotal / n);
    return {
      totalDaily: roundDose(perDose * n),
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

/** Per-dose rounding: snap to the nearest 0.5 for everyday-sized doses
 *  (≥ 1 unit) so the math is practical at the counter — fewer "take
 *  13.7 mg" outputs. For sub-1-unit doses (e.g. bupe 0.25 → 0.05 mg
 *  in the volumetric tail), preserve precision via roundDose. */
function roundPerDose(x: number): number {
  if (x >= 1) return Math.round(x * 2) / 2;
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
    jumpOff <= 0
  ) {
    return { steps: [], source: 'percent', totalMedication: 0 };
  }
  if (jumpOff >= totalStart) {
    return {
      steps: [{ totalDaily: totalStart, perDose, dosesPerDay: n0 }],
      source: 'percent',
      totalMedication: round2(totalStart),
    };
  }

  const days =
    difficulty === 'custom'
      ? Math.max(1, Math.round(customDays))
      : DIFFICULTY_DAYS[difficulty as Exclude<Difficulty, 'custom'>];

  if (substance === 'bupe') {
    // Bupe established schedules assume 1×/day sublingual. Try (start, days)
    // against the published table first; fall through to % math otherwise.
    if (BUPE_SCHEDULES[totalStart]?.[days]) {
      const main = BUPE_SCHEDULES[totalStart][days];
      let mainTrimmed = main;
      let tail: number[] = [];
      if (jumpOff > 0.25) {
        mainTrimmed = [];
        for (const d of main) {
          if (d <= jumpOff) {
            mainTrimmed.push(jumpOff);
            break;
          }
          mainTrimmed.push(d);
        }
      } else {
        tail = extendBupeTailToJumpOff(jumpOff);
      }
      const totals = [...mainTrimmed, ...tail];
      const steps: ScheduleStep[] = totals.map((d) => ({
        totalDaily: d,
        dosesPerDay: 1,
        perDose: d,
      }));
      return {
        steps,
        source: 'bupe-established',
        totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
      };
    }
    const pct = pctFromDuration(totalStart, jumpOff, days);
    const totals = percentTotalsSchedule(totalStart, jumpOff, pct);
    const steps = buildSteps(totals, totalStart, n0);
    return {
      steps,
      source: 'bupe-percent',
      totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
    };
  }

  if (substance === 'sr17' && difficulty !== 'custom') {
    const totals = sr17CommunityTotals(totalStart, jumpOff);
    const steps = buildSteps(totals, totalStart, n0);
    return {
      steps,
      source: 'sr17-protocol',
      totalMedication: round2(steps.reduce((a, s) => a + s.totalDaily, 0)),
    };
  }

  const pct = pctFromDuration(totalStart, jumpOff, days);
  const totals = percentTotalsSchedule(totalStart, jumpOff, pct);
  const steps = buildSteps(totals, totalStart, n0);
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
  const [substance, setSubstance] = useState<SubstanceKey>('bupe');
  const cfg = SUBSTANCES[substance];

  const [perDose, setPerDose] = useState<number>(cfg.defaultPerDose);
  const [dosesPerDay, setDosesPerDay] = useState<number>(cfg.defaultDosesPerDay);
  const [jumpOff, setJumpOff] = useState<number>(cfg.defaultJumpOff);
  const [difficulty, setDifficulty] = useState<Difficulty>('clinician');
  /** Custom mode source of truth: total taper duration in days. */
  const [customDays, setCustomDays] = useState<number>(14);

  const totalDaily = useMemo(() => perDose * dosesPerDay, [perDose, dosesPerDay]);

  /** Custom mode derived display: the per-day percentage cut that descends
   *  from totalDaily to jumpOff over customDays days. Updates live whenever
   *  the dose, jump-off, or duration change. */
  const customPctDisplay = useMemo(() => {
    if (totalDaily <= jumpOff || customDays <= 0) return 0;
    const ratio = jumpOff / totalDaily;
    const pct = (1 - Math.pow(ratio, 1 / customDays)) * 100;
    return Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0;
  }, [totalDaily, jumpOff, customDays]);

  const handleSubstanceChange = (next: SubstanceKey) => {
    setSubstance(next);
    setPerDose(SUBSTANCES[next].defaultPerDose);
    setDosesPerDay(SUBSTANCES[next].defaultDosesPerDay);
    setJumpOff(SUBSTANCES[next].defaultJumpOff);
    if (next === 'sr17' && difficulty !== 'clinician' && difficulty !== 'custom') {
      setDifficulty('clinician');
    }
  };

  /** Edit the % directly; recompute the duration that produces it. */
  const handleCustomPctChange = (newPct: number) => {
    if (!Number.isFinite(newPct) || newPct <= 0 || newPct >= 100) return;
    if (totalDaily <= jumpOff) return;
    const ratio = jumpOff / totalDaily;
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
    <div className="not-prose my-6 space-y-6">
      {/* Form */}
      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
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
              {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(
                ([key, label]) => {
                  if (substance === 'sr17' && key !== 'clinician' && key !== 'custom') {
                    return null;
                  }
                  const displayLabel =
                    substance === 'sr17' && key === 'clinician'
                      ? 'Community protocol (10–14 days)'
                      : label;
                  return (
                    <SelectItem key={key} value={key}>
                      {displayLabel}
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
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                          <td className="py-2 pr-4 text-foreground">{s.perDose}</td>
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
        </>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Enter a per-dose amount and times-per-day larger than the jump-off
          dose to see a schedule.
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-4">
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
    case 'sr17-protocol':
      return 'Community protocol';
    case 'percent':
      return 'Percentage taper';
  }
}
