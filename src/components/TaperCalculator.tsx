import { useMemo, useState } from 'react';
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
  defaultStart: number;
  defaultJumpOff: number;
  /** Caveat / note shown under the form for this substance. */
  note: string;
  /** Optional inline links shown alongside the note. */
  related: { label: string; href: string }[];
}

const SUBSTANCES: Record<SubstanceKey, SubstanceConfig> = {
  bupe: {
    label: 'Buprenorphine (Suboxone)',
    unit: 'mg',
    stepUnit: 'day',
    defaultStart: 8,
    defaultJumpOff: 0.25,
    note: 'Established short-taper schedules from the Suboxone Rapid Taper page are used when the starting dose matches (2, 4, 6, or 8 mg). For other starting doses or custom speeds, the calculator generates a weekly percentage taper. Setting a jump-off below 0.25 mg extends the tail with volumetric sub-0.25 mg doses.',
    related: [
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'Custom Suboxone Dosing', href: '/mat-suboxone/suboxone-custom-dose' },
    ],
  },
  '7oh': {
    label: '7-OH (concentrated)',
    unit: 'mg',
    stepUnit: 'week',
    defaultStart: 120,
    defaultJumpOff: 5,
    note: 'Community-observed taper patterns for concentrated 7-OH cluster around halving for the first half, then progressively slower steps. Most self-managed 7-OH tapers end with a jump-off at some low dose rather than a clean taper to zero.',
    related: [
      { label: 'Tapering Off 7-OH', href: '/for-you/tapering-7oh' },
      { label: 'SR-17 as the other community-validated path', href: '/other-tools/sr-17' },
    ],
  },
  mgm: {
    label: 'MGM-15 / MIT-A / DHM products',
    unit: 'mg',
    stepUnit: 'week',
    defaultStart: 30,
    defaultJumpOff: 2,
    note: 'MGM-15 is long-acting (community-reported 9–15 hour duration; no published human PK). MIT-A and DHM are the same compound. There is no clean community-standard schedule. The calculator runs percentage math from the chosen speed. Withdrawal hits harder than 7-OH and Suboxone induction needs a longer washout.',
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
    stepUnit: 'week',
    defaultStart: 20,
    defaultJumpOff: 1,
    note: 'Pseudoindoxyl binds the mu receptor tighter than buprenorphine itself. The published human pharmacology is thin and community schedules are not standardized. Treat the output as a directional plan, not a prescription. Suboxone induction may be incomplete; SR-17 is the other community-validated path off.',
    related: [
      { label: 'Pseudo (mitragynine pseudoindoxyl)', href: '/compounds/mitragynine-pseudoindoxyl' },
      { label: 'Suboxone Rapid Taper', href: '/mat-suboxone/suboxone-rapid-taper' },
      { label: 'SR-17', href: '/other-tools/sr-17' },
    ],
  },
  leaf: {
    label: 'Kratom leaf (plain powder)',
    unit: 'g',
    stepUnit: 'week',
    defaultStart: 15,
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
    defaultStart: 100,
    defaultJumpOff: 25,
    note: 'The community SR-17 protocol is short by design (10–14 days total course; 4-day descending taper from 100 mg/day). Picking "Community protocol" emits the published 100 → 75 → 50 → 25 → jump pattern. The custom-percentage option exists for readers running a non-standard course.',
    related: [
      { label: 'SR-17', href: '/other-tools/sr-17' },
    ],
  },
};

/* ───────────────────────── Difficulty mapping ───────────────────────── */

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easier: 'Easier (5% per week)',
  clinician: 'Clinician recommended (10% per week, CDC default)',
  harder: 'Harder (20% per week)',
  'super-hard': 'Super hard mode (50% per step)',
  custom: 'Custom: I\'ll set my own percentage',
};

const DIFFICULTY_PCT: Record<Exclude<Difficulty, 'custom'>, number> = {
  easier: 5,
  clinician: 10,
  harder: 20,
  'super-hard': 50,
};

/* ───────────────────────── Bupe established schedules ───────────────────────── */

/** Established short-taper schedules from /mat-suboxone/suboxone-rapid-taper.
 *  Outer key = starting dose (mg). Inner key = total schedule length (days).
 *  All schedules end at 0.25 mg on the final day; the calculator extends the
 *  tail with volumetric sub-0.25 mg doses if the reader sets jump-off lower. */
const BUPE_SCHEDULES: Record<number, Record<number, number[]>> = {
  2: {
    5: [2, 1.5, 1, 0.5, 0.25],
  },
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

/** Pick the bupe schedule length that maps to the chosen difficulty for a
 *  given starting dose. Returns null if no established schedule exists for
 *  that (dose, difficulty) combo. */
function bupeLengthForDifficulty(start: number, difficulty: Difficulty): number | null {
  const lengths = BUPE_SCHEDULES[start];
  if (!lengths) return null;
  const available = Object.keys(lengths).map(Number).sort((a, b) => a - b);
  if (available.length === 0) return null;
  switch (difficulty) {
    case 'super-hard':
      return available[0];
    case 'harder':
      return available[1] ?? available[0];
    case 'clinician':
      return available[2] ?? available[available.length - 1];
    case 'easier':
      return available[available.length - 1];
    case 'custom':
      return null;
  }
}

/** Sub-0.25 mg volumetric tail published on the Suboxone Rapid Taper page.
 *  Used to extend bupe schedules when the reader sets a jump-off < 0.25. */
const BUPE_SUB025_TAIL: number[] = [0.1, 0.05, 0.02];

function extendBupeTailToJumpOff(jumpOff: number): number[] {
  if (jumpOff >= 0.25) return [];
  const tail: number[] = [];
  for (const dose of BUPE_SUB025_TAIL) {
    if (jumpOff > dose) {
      // Reader's jump-off lands between this row and the previous one.
      // Append the jump-off itself and stop.
      tail.push(jumpOff);
      return tail;
    }
    tail.push(dose);
    if (dose === jumpOff) return tail;
  }
  // Below 0.02; append the requested jump-off as the final step.
  if (jumpOff < BUPE_SUB025_TAIL[BUPE_SUB025_TAIL.length - 1]) tail.push(jumpOff);
  return tail;
}

/* ───────────────────────── SR-17 community protocol ───────────────────────── */

/** SR-17 taper phase published on /other-tools/sr-17 (assumes 100 mg/day
 *  maintenance dose, descends by 25 mg/day). Scales linearly to the
 *  reader's actual daily dose. */
function sr17CommunityProtocol(start: number, jumpOff: number): number[] {
  const schedule: number[] = [];
  let dose = start;
  const cutAmount = start / 4; // 25 mg/day cut at the published 100 mg start
  while (dose > jumpOff) {
    schedule.push(round(dose));
    dose -= cutAmount;
  }
  schedule.push(round(jumpOff));
  return schedule;
}

/* ───────────────────────── Generic % math ───────────────────────── */

function percentSchedule(start: number, jumpOff: number, pctPerStep: number): number[] {
  if (start <= jumpOff) return [round(start)];
  const schedule: number[] = [round(start)];
  let dose = start;
  // Safety: cap at 200 steps so a pathological input doesn't lock the UI.
  for (let i = 0; i < 200; i++) {
    dose = dose * (1 - pctPerStep / 100);
    if (dose <= jumpOff) break;
    schedule.push(round(dose));
  }
  schedule.push(round(jumpOff));
  return schedule;
}

/* ───────────────────────── Rounding ───────────────────────── */

function round(x: number): number {
  // Two significant figures for doses ≥ 0.1, three for smaller numbers.
  if (x >= 1) return Math.round(x * 10) / 10;
  if (x >= 0.1) return Math.round(x * 100) / 100;
  return Math.round(x * 1000) / 1000;
}

/* ───────────────────────── Schedule generator ───────────────────────── */

interface ScheduleResult {
  doses: number[];
  /** Per-row source so the table can label each row with units (day/week). */
  source: 'bupe-established' | 'bupe-percent' | 'sr17-protocol' | 'percent';
  /** Total amount of substance the schedule will dose. */
  total: number;
}

function generateSchedule(
  substance: SubstanceKey,
  start: number,
  jumpOff: number,
  difficulty: Difficulty,
  customPct: number,
): ScheduleResult {
  // Guardrails — invalid input returns an empty schedule.
  if (!Number.isFinite(start) || !Number.isFinite(jumpOff) || start <= 0 || jumpOff <= 0) {
    return { doses: [], source: 'percent', total: 0 };
  }
  if (jumpOff >= start) {
    return { doses: [round(start)], source: 'percent', total: round(start) };
  }

  const pct =
    difficulty === 'custom'
      ? customPct
      : DIFFICULTY_PCT[difficulty as Exclude<Difficulty, 'custom'>];

  // Bupe: prefer established schedule when start dose + difficulty maps to one.
  if (substance === 'bupe') {
    const len = bupeLengthForDifficulty(start, difficulty);
    if (len) {
      const main = BUPE_SCHEDULES[start][len];
      // If jump-off > 0.25, truncate the main schedule at the day before
      // dose drops below jump-off, then append the jump-off.
      if (jumpOff > 0.25) {
        const truncated: number[] = [];
        for (const d of main) {
          if (d <= jumpOff) {
            truncated.push(jumpOff);
            break;
          }
          truncated.push(d);
        }
        const total = truncated.reduce((a, b) => a + b, 0);
        return { doses: truncated, source: 'bupe-established', total: round2(total) };
      }
      // Standard or extended tail.
      const tail = extendBupeTailToJumpOff(jumpOff);
      const doses = [...main, ...tail];
      const total = doses.reduce((a, b) => a + b, 0);
      return { doses, source: 'bupe-established', total: round2(total) };
    }
    // No established schedule for this (dose, difficulty). Fall through to %.
    const doses = percentSchedule(start, jumpOff, pct);
    return {
      doses,
      source: 'bupe-percent',
      total: round2(doses.reduce((a, b) => a + b, 0)),
    };
  }

  // SR-17: community protocol when not on custom.
  if (substance === 'sr17' && difficulty !== 'custom') {
    const doses = sr17CommunityProtocol(start, jumpOff);
    return {
      doses,
      source: 'sr17-protocol',
      total: round2(doses.reduce((a, b) => a + b, 0)),
    };
  }

  // Everything else: percentage math.
  const doses = percentSchedule(start, jumpOff, pct);
  return {
    doses,
    source: 'percent',
    total: round2(doses.reduce((a, b) => a + b, 0)),
  };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/* ───────────────────────── Component ───────────────────────── */

const chartConfig = {
  dose: {
    label: 'Dose',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function TaperCalculator() {
  const [substance, setSubstance] = useState<SubstanceKey>('bupe');
  const cfg = SUBSTANCES[substance];

  const [startDose, setStartDose] = useState<number>(cfg.defaultStart);
  const [jumpOff, setJumpOff] = useState<number>(cfg.defaultJumpOff);
  const [difficulty, setDifficulty] = useState<Difficulty>('clinician');
  const [customPct, setCustomPct] = useState<number>(10);

  // When substance changes, snap dose/jump-off to that substance's defaults.
  // Snap difficulty to 'clinician' when switching to SR-17 since the 5/20/50
  // options are hidden for that substance.
  const handleSubstanceChange = (next: SubstanceKey) => {
    setSubstance(next);
    setStartDose(SUBSTANCES[next].defaultStart);
    setJumpOff(SUBSTANCES[next].defaultJumpOff);
    if (next === 'sr17' && difficulty !== 'clinician' && difficulty !== 'custom') {
      setDifficulty('clinician');
    }
  };

  const result = useMemo(
    () => generateSchedule(substance, startDose, jumpOff, difficulty, customPct),
    [substance, startDose, jumpOff, difficulty, customPct],
  );

  const stepLabel = cfg.stepUnit === 'day' ? 'Day' : 'Week';
  const totalSteps = result.doses.length;
  const totalDuration =
    totalSteps > 0
      ? `${totalSteps} ${cfg.stepUnit}${totalSteps === 1 ? '' : 's'}`
      : '—';

  const chartData = result.doses.map((dose, i) => ({
    step: i + 1,
    dose,
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
          <Label htmlFor="start">Current dose per day ({cfg.unit})</Label>
          <Input
            id="start"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={startDose}
            onChange={(e) => setStartDose(parseFloat(e.target.value) || 0)}
            className="mt-1.5"
          />
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
            The dose your taper lands on before stopping completely.
          </p>
        </div>

        <div className={difficulty === 'custom' ? '' : 'sm:col-span-2'}>
          <Label htmlFor="difficulty">Taper speed</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger id="difficulty" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(
                ([key, label]) => {
                  // SR-17 is a 10-day bridge by design; the weekly 5/10/20/50
                  // options don't fit. Show only "Community protocol" and
                  // "Custom" for SR-17.
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
          <div>
            <Label htmlFor="custom-pct">Custom percentage per week</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                id="custom-pct"
                type="number"
                inputMode="decimal"
                min={0.1}
                max={75}
                step="0.5"
                value={customPct}
                onChange={(e) => setCustomPct(parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">% per step</span>
            </div>
          </div>
        )}
      </div>

      {/* Output summary */}
      {result.doses.length > 0 ? (
        <>
          <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3">
            <Stat label="Total duration" value={totalDuration} />
            <Stat label="Total medication" value={`${result.total} ${cfg.unit}`} />
            <Stat label="Approach" value={sourceLabel(result.source)} />
          </div>

          {/* Chart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Schedule curve
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
                      value: stepLabel,
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
                    dataKey="dose"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#taperFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Schedule table
            </h3>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">{stepLabel}</th>
                    <th className="py-2">Dose ({cfg.unit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.doses.map((dose, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium text-foreground">{dose}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td className="py-2 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total
                    </td>
                    <td className="py-2 font-semibold text-foreground">
                      {result.total} {cfg.unit}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Enter a starting dose larger than the jump-off dose to see a schedule.
        </div>
      )}

      {/* Substance-specific note */}
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

function sourceLabel(source: ScheduleResult['source']): string {
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
