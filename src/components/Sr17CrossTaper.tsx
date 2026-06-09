import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';
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

/* ──────────────────── localStorage persistence ────────────────────── */
// Bump STORAGE_VERSION when adding/removing/renaming persisted fields so
// stale blobs are discarded instead of corrupting calculator state.
const STORAGE_KEY = 'sr17-cross-taper-v1';
const STORAGE_VERSION = 1;

/* ──────────────────────── Types ──────────────────────── */

type Sr17Phase =
  | 'allergy-test'
  | 'preload'
  | 'cross-taper'
  | 'hold'
  | 'sr-taper'
  | 'jump-off'
  | 'stop';

interface Sr17Day {
  /** Sequential day number. Allergy-test day is "0" so the protocol's
   *  Day 1 matches the SR-17 page's table. */
  day: number;
  phase: Sr17Phase;
  phaseLabel: string;
  /** SR-17 dosing for this day. perDose × dosesPerDay = totalDaily. */
  srPerDose: number;
  srDosesPerDay: number;
  srTotal: number;
  /** 7-OH (or kratom-synthetic) dosing for this day. Same shape — the
   *  protocol math is identical for 7-OH, MGM-15, MIT-A, and pseudo, so
   *  the calculator treats them as one input category. */
  ohPerDose: number;
  ohDosesPerDay: number;
  ohTotal: number;
  /** Short callout — used in the table, the print PDF, and the AI prompt. */
  note: string;
}

type CrossTaperMode = 'standard' | 'custom-days';
type SrTaperMode = 'standard' | 'custom-mg' | 'custom-pct';

interface Sr17Inputs {
  /** Current per-dose mg of 7-OH (or whatever kratom synthetic you're on). */
  ohPerDose: number;
  ohDosesPerDay: number;
  includeAllergyTest: boolean;
  preloadDays: number;
  preloadPerDose: number;
  preloadDosesPerDay: number;
  crossTaperMode: CrossTaperMode;
  /** Days to drop 7-OH to zero, when crossTaperMode is 'custom-days'.
   *  Standard is 2 (half, then zero). */
  crossTaperDays: number;
  holdDays: number;
  srTaperMode: SrTaperMode;
  /** mg/day cut, when srTaperMode is 'custom-mg'. */
  srTaperMg: number;
  /** % per-day cut, when srTaperMode is 'custom-pct'. */
  srTaperPct: number;
  srJumpOff: number;
}

interface Sr17Result {
  days: Sr17Day[];
  preloadTotalDaily: number;
  holdTotalDaily: number;
  totalDurationDays: number;
}

/* ──────────────────────── Helpers ──────────────────────── */

/** Round SR doses to the nearest mg for display. SR is usually dosed
 *  with a liquid measuring cup or syringe; fractional mg below 1 add
 *  noise without precision. */
function roundSrMg(x: number): number {
  return Math.round(x);
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ──────────────────── Schedule generator ──────────────────── */

function generateSr17Protocol(inputs: Sr17Inputs): Sr17Result {
  const days: Sr17Day[] = [];
  const preloadTotal = inputs.preloadPerDose * inputs.preloadDosesPerDay;
  const ohTotal = inputs.ohPerDose * inputs.ohDosesPerDay;
  let dayN = 1;

  // ── Phase 0: allergy test (optional) ────────────────────────────────
  if (inputs.includeAllergyTest) {
    days.push({
      day: 0,
      phase: 'allergy-test',
      phaseLabel: 'Allergy test',
      srPerDose: 10,
      srDosesPerDay: 1,
      srTotal: 10,
      ohPerDose: inputs.ohPerDose,
      ohDosesPerDay: inputs.ohDosesPerDay,
      ohTotal,
      note:
        "Take ~10 mg SR-17, wait several hours, watch for any reaction. 7-OH (or whatever synthetic you're on) stays at your normal dose.",
    });
  }

  // ── Phase 1: preload ────────────────────────────────────────────────
  for (let i = 0; i < inputs.preloadDays; i++) {
    days.push({
      day: dayN++,
      phase: 'preload',
      phaseLabel: 'Preload',
      srPerDose: inputs.preloadPerDose,
      srDosesPerDay: inputs.preloadDosesPerDay,
      srTotal: preloadTotal,
      ohPerDose: inputs.ohPerDose,
      ohDosesPerDay: inputs.ohDosesPerDay,
      ohTotal,
      note:
        i === 0
          ? `Start SR-17 at full preload (${inputs.preloadPerDose} mg every 6–8 h). 7-OH stays at the same dose.`
          : '',
    });
  }

  // ── Phase 2: cross-taper (7-OH steps to zero) ───────────────────────
  let crossTotals: number[];
  if (inputs.crossTaperMode === 'standard') {
    crossTotals = [ohTotal / 2, 0];
  } else {
    const n = Math.max(1, Math.floor(inputs.crossTaperDays));
    crossTotals = [];
    for (let i = 1; i <= n; i++) {
      crossTotals.push(ohTotal * (1 - i / n));
    }
  }
  for (let i = 0; i < crossTotals.length; i++) {
    const total = crossTotals[i];
    const isStop = total === 0;
    const perDose = isStop ? 0 : total / inputs.ohDosesPerDay;
    days.push({
      day: dayN++,
      phase: 'cross-taper',
      phaseLabel: 'Cross-taper',
      srPerDose: inputs.preloadPerDose,
      srDosesPerDay: inputs.preloadDosesPerDay,
      srTotal: preloadTotal,
      ohPerDose: perDose,
      ohDosesPerDay: isStop ? 0 : inputs.ohDosesPerDay,
      ohTotal: total,
      note: isStop
        ? 'Stop 7-OH. SR-17 carries you from here.'
        : `Cut 7-OH to ${roundSrMg(total)} mg/day.`,
    });
  }

  // ── Phase 3: hold (SR only, 7-OH = 0) ──────────────────────────────
  for (let i = 0; i < inputs.holdDays; i++) {
    days.push({
      day: dayN++,
      phase: 'hold',
      phaseLabel: 'Hold',
      srPerDose: inputs.preloadPerDose,
      srDosesPerDay: inputs.preloadDosesPerDay,
      srTotal: preloadTotal,
      ohPerDose: 0,
      ohDosesPerDay: 0,
      ohTotal: 0,
      note:
        i === 0 ? 'SR-17 only. Stable dose until the SR taper begins.' : '',
    });
  }

  // ── Phase 4: SR taper down to jump-off ──────────────────────────────
  let srTotals: number[];
  if (inputs.srTaperMode === 'standard') {
    // Page protocol: 100 → 75 → 50 → 25 → jump.
    const start = 100;
    srTotals = [];
    let cur = start;
    while (cur > inputs.srJumpOff) {
      srTotals.push(cur);
      cur -= 25;
    }
    srTotals.push(inputs.srJumpOff);
  } else if (inputs.srTaperMode === 'custom-mg') {
    const cut = Math.max(1, inputs.srTaperMg);
    srTotals = [];
    let cur = preloadTotal - cut;
    while (cur > inputs.srJumpOff) {
      srTotals.push(roundSrMg(cur));
      cur -= cut;
    }
    srTotals.push(inputs.srJumpOff);
  } else {
    // custom-pct
    const pct = Math.min(0.95, Math.max(0.01, inputs.srTaperPct / 100));
    srTotals = [];
    let cur = preloadTotal * (1 - pct);
    let i = 0;
    while (cur > inputs.srJumpOff && i < 200) {
      srTotals.push(roundSrMg(cur));
      cur = cur * (1 - pct);
      i++;
    }
    srTotals.push(inputs.srJumpOff);
  }

  for (let i = 0; i < srTotals.length; i++) {
    const total = srTotals[i];
    const isJump = i === srTotals.length - 1;
    const dosesPerDay = isJump ? 1 : inputs.preloadDosesPerDay;
    const perDose = total / dosesPerDay;
    days.push({
      day: dayN++,
      phase: isJump ? 'jump-off' : 'sr-taper',
      phaseLabel: isJump ? 'Jump-off' : 'SR taper',
      srPerDose: perDose,
      srDosesPerDay: dosesPerDay,
      srTotal: total,
      ohPerDose: 0,
      ohDosesPerDay: 0,
      ohTotal: 0,
      note: isJump ? 'Last SR-17 dose before stopping completely.' : '',
    });
  }

  // ── Stop day ────────────────────────────────────────────────────────
  days.push({
    day: dayN++,
    phase: 'stop',
    phaseLabel: 'Stop',
    srPerDose: 0,
    srDosesPerDay: 0,
    srTotal: 0,
    ohPerDose: 0,
    ohDosesPerDay: 0,
    ohTotal: 0,
    note: 'Taper complete.',
  });

  return {
    days,
    preloadTotalDaily: preloadTotal,
    holdTotalDaily: preloadTotal,
    totalDurationDays: days.length,
  };
}

/* ──────────────────────── Config panel ──────────────────────── */

interface ConfigPanelProps {
  inputs: Sr17Inputs;
  setInputs: (next: Sr17Inputs) => void;
}

function ConfigPanel({ inputs, setInputs }: ConfigPanelProps) {
  const set = <K extends keyof Sr17Inputs>(k: K, v: Sr17Inputs[K]) =>
    setInputs({ ...inputs, [k]: v });
  const ohTotal = inputs.ohPerDose * inputs.ohDosesPerDay;
  const preloadTotal = inputs.preloadPerDose * inputs.preloadDosesPerDay;
  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-4 print:hidden">
      {/* Safety callout */}
      <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm dark:border-amber-400 dark:bg-amber-950/30">
        <p className="font-semibold text-foreground">
          Stacked opioid exposure during preload and cross-taper.
        </p>
        <p className="mt-1 text-foreground/85">
          During the preload and the cross-taper, you'll be on 7-OH (or
          MGM-15, MIT-A, pseudo) AND SR-17 at the same time. Keep naloxone
          (Narcan) on hand. Don't combine with alcohol, benzodiazepines,
          or other depressants. See the SR-17 page for full pharmacology
          and sourcing notes.
        </p>
      </div>

      {/* 7-OH dose */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your current 7-OH (or kratom synthetic)
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="oh-per-dose">Current per-dose (mg)</Label>
            <Input
              id="oh-per-dose"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={inputs.ohPerDose}
              onChange={(e) => set('ohPerDose', parseFloat(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="oh-doses">Times per day</Label>
            <Input
              id="oh-doses"
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              step={1}
              value={inputs.ohDosesPerDay}
              onChange={(e) =>
                set('ohDosesPerDay', parseInt(e.target.value, 10) || 1)
              }
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="mt-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Current total daily:</span>{' '}
          <span className="font-semibold text-foreground">
            {roundSrMg(ohTotal)} mg
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The SR protocol is the same shape for 7-OH, MGM-15, MIT-A, and
          pseudo.{' '}
          <strong className="text-foreground">
            If you're on the synthetics (MGM-15 / MIT-A / pseudo) or stacking
            multiple compounds, extend the preload
          </strong>{' '}
          — these run longer in the body and the 1-day preload is calibrated
          for pure 7-OH.
        </p>
      </div>

      {/* Allergy test */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 0 · Allergy test
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inputs.includeAllergyTest}
            onChange={(e) => set('includeAllergyTest', e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
          />
          <span>
            Include allergy-test day (~10 mg SR, wait several hours, watch for
            reaction)
          </span>
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Skip only if you've previously tested SR-17 from the same source and
          batch.
        </p>
      </div>

      {/* Preload */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 1 · Preload (SR ramps up, 7-OH unchanged)
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="preload-days">Preload days</Label>
            <Input
              id="preload-days"
              type="number"
              inputMode="numeric"
              min={1}
              max={14}
              step={1}
              value={inputs.preloadDays}
              onChange={(e) =>
                set('preloadDays', Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="preload-per-dose">SR per dose (mg)</Label>
            <Input
              id="preload-per-dose"
              type="number"
              inputMode="decimal"
              min={10}
              max={200}
              step={5}
              value={inputs.preloadPerDose}
              onChange={(e) =>
                set('preloadPerDose', parseFloat(e.target.value) || 0)
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="preload-doses">Doses per day</Label>
            <Input
              id="preload-doses"
              type="number"
              inputMode="numeric"
              min={2}
              max={6}
              step={1}
              value={inputs.preloadDosesPerDay}
              onChange={(e) =>
                set(
                  'preloadDosesPerDay',
                  Math.max(2, parseInt(e.target.value, 10) || 2),
                )
              }
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="mt-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Preload daily SR:</span>{' '}
          <span className="font-semibold text-foreground">
            {roundSrMg(preloadTotal)} mg
          </span>{' '}
          <span className="text-muted-foreground">
            ({roundSrMg(inputs.preloadPerDose)} × {inputs.preloadDosesPerDay},
            every {Math.round(24 / inputs.preloadDosesPerDay)} h)
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The community standard is 50 mg × 3 (every 6–8 h) for pure 7-OH.
          Some readers run higher per-dose totals early if 50 mg × 3 isn't
          holding them — raise SR, don't reach back for 7-OH.
        </p>
      </div>

      {/* Cross-taper */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 2 · 7-OH cross-taper (7-OH drops to zero; SR holds)
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cross-mode">Mode</Label>
            <Select
              value={inputs.crossTaperMode}
              onValueChange={(v) =>
                set('crossTaperMode', v as CrossTaperMode)
              }
            >
              <SelectTrigger id="cross-mode" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  Standard (cut in half, then stop — 2 days)
                </SelectItem>
                <SelectItem value="custom-days">
                  Custom: even steps over N days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {inputs.crossTaperMode === 'custom-days' && (
            <div>
              <Label htmlFor="cross-days">Cross-taper days</Label>
              <Input
                id="cross-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={7}
                step={1}
                value={inputs.crossTaperDays}
                onChange={(e) =>
                  set(
                    'crossTaperDays',
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                  )
                }
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                7-OH steps to zero in N equal cuts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hold */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 3 · Hold (SR only, 7-OH already stopped)
        </div>
        <div className="sm:w-48">
          <Label htmlFor="hold-days">Hold days</Label>
          <Input
            id="hold-days"
            type="number"
            inputMode="numeric"
            min={0}
            max={14}
            step={1}
            value={inputs.holdDays}
            onChange={(e) =>
              set('holdDays', Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Standard: 4 days at the preload total.
          </p>
        </div>
      </div>

      {/* SR taper */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 4 · SR taper down
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="sr-mode">Taper mode</Label>
            <Select
              value={inputs.srTaperMode}
              onValueChange={(v) => set('srTaperMode', v as SrTaperMode)}
            >
              <SelectTrigger id="sr-mode" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  Standard (100 → 75 → 50 → 25 → jump)
                </SelectItem>
                <SelectItem value="custom-mg">
                  Custom: cut N mg per day
                </SelectItem>
                <SelectItem value="custom-pct">
                  Custom: cut N% per day
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {inputs.srTaperMode === 'custom-mg' && (
            <div>
              <Label htmlFor="sr-cut-mg">Cut per day (mg)</Label>
              <Input
                id="sr-cut-mg"
                type="number"
                inputMode="decimal"
                min={5}
                max={100}
                step={5}
                value={inputs.srTaperMg}
                onChange={(e) =>
                  set('srTaperMg', parseFloat(e.target.value) || 0)
                }
                className="mt-1.5"
              />
            </div>
          )}
          {inputs.srTaperMode === 'custom-pct' && (
            <div>
              <Label htmlFor="sr-cut-pct">Cut per day (%)</Label>
              <Input
                id="sr-cut-pct"
                type="number"
                inputMode="decimal"
                min={1}
                max={50}
                step={1}
                value={inputs.srTaperPct}
                onChange={(e) =>
                  set('srTaperPct', parseFloat(e.target.value) || 0)
                }
                className="mt-1.5"
              />
            </div>
          )}
        </div>
        <div className="mt-3 sm:w-48">
          <Label htmlFor="sr-jump">Jump-off (mg)</Label>
          <Input
            id="sr-jump"
            type="number"
            inputMode="decimal"
            min={0}
            max={75}
            step={5}
            value={inputs.srJumpOff}
            onChange={(e) =>
              set('srJumpOff', parseFloat(e.target.value) || 0)
            }
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Final SR dose before stopping completely. Standard: 25 mg.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Output panel ──────────────────────── */

function phaseRowClass(phase: Sr17Phase): string {
  switch (phase) {
    case 'allergy-test':
      return 'bg-amber-500/10';
    case 'stop':
      return 'border-y-2 border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-400/10';
    case 'jump-off':
      return 'bg-primary/10';
    default:
      return '';
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

interface OutputProps {
  result: Sr17Result;
  onPrint: () => void;
  onCopyPrompt: () => void;
  copied: boolean;
}

function Output({ result, onPrint, onCopyPrompt, copied }: OutputProps) {
  const totalSrUsed = roundSrMg(
    result.days.reduce((a, d) => a + d.srTotal, 0),
  );
  return (
    <>
      <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3">
        <Stat
          label="Total duration"
          value={`${result.totalDurationDays} day${result.totalDurationDays === 1 ? '' : 's'}`}
        />
        <Stat label="Total SR-17" value={`${totalSrUsed} mg`} />
        <Stat label="Protocol" value="SR-17 cross-taper" />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Day-by-day schedule
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Day</th>
                <th className="py-2 pr-3">Phase</th>
                <th className="py-2 pr-3">SR-17</th>
                <th className="py-2 pr-3">7-OH</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.days.map((d, i) => {
                // 7-OH cell multiplies cleanly because the user entered both
                // inputs directly. SR cell on taper days uses total / N
                // which can be fractional (100 / 3 ≈ 33.3); render as
                // "X mg/day · N doses (~Y mg each)" to avoid misleading math.
                const srCell =
                  d.srTotal > 0
                    ? d.srDosesPerDay === 1
                      ? `${roundSrMg(d.srTotal)} mg × 1`
                      : `${roundSrMg(d.srTotal)} mg/day · ${d.srDosesPerDay} doses (~${roundSrMg(d.srPerDose)} mg each)`
                    : '—';
                const ohCell =
                  d.ohTotal > 0
                    ? `${roundSrMg(d.ohPerDose)} mg × ${d.ohDosesPerDay} = ${roundSrMg(d.ohTotal)} mg/day`
                    : d.phase === 'cross-taper' ||
                        d.phase === 'hold' ||
                        d.phase === 'sr-taper' ||
                        d.phase === 'jump-off' ||
                        d.phase === 'stop'
                      ? '—'
                      : '';
                const cls = phaseRowClass(d.phase);
                return (
                  <tr key={i} className={cls}>
                    <td className="py-2 pr-3 font-semibold text-foreground">
                      {d.day}
                    </td>
                    <td className="py-2 pr-3 text-foreground">{d.phaseLabel}</td>
                    <td className="py-2 pr-3 text-foreground">{srCell}</td>
                    <td className="py-2 pr-3 text-foreground">{ohCell}</td>
                    <td className="py-2 text-muted-foreground">{d.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          SR-17 doses are spaced every 6–8 hours. The 7-OH doses on
          cross-taper days use the same per-day frequency you entered above.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="outline" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" /> Save as PDF
        </Button>
        <Button type="button" variant="outline" onClick={onCopyPrompt}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copy AI prompt
            </>
          )}
        </Button>
      </div>
    </>
  );
}

/* ──────────────────────── Print HTML ──────────────────────── */

function buildPrintHTML(inputs: Sr17Inputs, result: Sr17Result): string {
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const rows = result.days
    .map((d) => {
      const sr =
        d.srTotal > 0
          ? d.srDosesPerDay === 1
            ? `${roundSrMg(d.srTotal)} mg × 1`
            : `${roundSrMg(d.srTotal)} mg/day · ${d.srDosesPerDay} doses (~${roundSrMg(d.srPerDose)} mg each)`
          : '—';
      const oh =
        d.ohTotal > 0
          ? `${roundSrMg(d.ohPerDose)} × ${d.ohDosesPerDay} = ${roundSrMg(d.ohTotal)} mg`
          : '—';
      const cls =
        d.phase === 'stop'
          ? 'stop-day'
          : d.phase === 'jump-off'
            ? 'jump-off'
            : '';
      return `<tr class="${cls}"><td>${d.day}</td><td>${escHtml(d.phaseLabel)}</td><td>${sr}</td><td>${oh}</td><td>${escHtml(d.note)}</td></tr>`;
    })
    .join('');
  const totalSr = roundSrMg(result.days.reduce((a, d) => a + d.srTotal, 0));
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>SR-17 Cross-taper Schedule</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; background: #fff; margin: 0; padding: 2rem; max-width: 8in; margin-left: auto; margin-right: auto; line-height: 1.45; }
  h1 { font-size: 1.4rem; margin: 0 0 0.35rem; }
  .subtitle { color: #444; margin: 0 0 0.25rem; font-size: 0.95rem; }
  .generated { color: #666; font-size: 0.8rem; margin: 0 0 1.5rem; }
  .safety { background: #fff4e0; border-left: 4px solid #d97706; padding: 0.7rem 0.85rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; padding: 0.85rem; background: #f6f6f6; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 1.5rem; }
  .stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 0.2rem; }
  .stat-value { font-size: 1rem; font-weight: 600; }
  h2 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.04em; color: #444; margin: 0 0 0.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  thead th { text-align: left; padding: 0.45rem 0.5rem; border-bottom: 2px solid #333; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
  tbody td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  tr.stop-day td { background: #ecfdf5; font-weight: 600; }
  tr.jump-off td { background: #fef3c7; }
  @media print { body { padding: 0.4in; } tbody tr { page-break-inside: avoid; } }
</style></head><body>
<h1>SR-17 Cross-taper Schedule</h1>
<p class="subtitle">7-OH: ${roundSrMg(inputs.ohPerDose * inputs.ohDosesPerDay)} mg/day · Preload: ${roundSrMg(inputs.preloadPerDose * inputs.preloadDosesPerDay)} mg/day · ${result.totalDurationDays} days total</p>
<p class="generated">Generated by quitting7oh.org · ${escHtml(today)}</p>
<div class="safety"><strong>Stacked opioid exposure during preload and cross-taper.</strong> Keep naloxone (Narcan) on hand. Don't combine with alcohol, benzodiazepines, or other depressants. SR-17 use is community-derived; see the full SR-17 page on quitting7oh.org.</div>
<div class="stats">
  <div><div class="stat-label">Total duration</div><div class="stat-value">${result.totalDurationDays} days</div></div>
  <div><div class="stat-label">Total SR-17</div><div class="stat-value">${totalSr} mg</div></div>
  <div><div class="stat-label">Protocol</div><div class="stat-value">SR-17 cross-taper</div></div>
</div>
<h2>Day-by-day</h2>
<table><thead><tr><th>Day</th><th>Phase</th><th>SR-17</th><th>7-OH</th><th>Notes</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}

/* ──────────────────────── AI prompt ──────────────────────── */

function buildPromptText(inputs: Sr17Inputs, result: Sr17Result): string {
  const lines = result.days
    .map((d) => {
      const sr =
        d.srTotal > 0
          ? d.srDosesPerDay === 1
            ? `SR-17 ${roundSrMg(d.srTotal)}mg × 1`
            : `SR-17 ${roundSrMg(d.srTotal)}mg/day in ${d.srDosesPerDay} doses (~${roundSrMg(d.srPerDose)}mg each)`
          : 'SR-17 stop';
      const oh =
        d.ohTotal > 0
          ? `7-OH ${roundSrMg(d.ohPerDose)}mg × ${d.ohDosesPerDay} = ${roundSrMg(d.ohTotal)}mg/day`
          : '7-OH stopped';
      return `Day ${d.day} (${d.phaseLabel}): ${sr}; ${oh}${d.note ? '. ' + d.note : ''}`;
    })
    .join('\n');
  const ohTotal = roundSrMg(inputs.ohPerDose * inputs.ohDosesPerDay);
  const preloadTotal = roundSrMg(
    inputs.preloadPerDose * inputs.preloadDosesPerDay,
  );

  return `I'm planning an SR-17 cross-taper off 7-OH (or another kratom synthetic — MGM-15, MIT-A, or pseudoindoxyl) and want help personalizing my plan.

PLAN (generated by the quitting7oh.org SR-17 cross-taper calculator):
- 7-OH starting dose: ${roundSrMg(inputs.ohPerDose)} mg × ${inputs.ohDosesPerDay}/day = ${ohTotal} mg/day
- Allergy test: ${inputs.includeAllergyTest ? 'yes (Day 0, ~10 mg)' : 'skipping (previously tested)'}
- Preload: ${inputs.preloadDays} day(s), SR-17 ${roundSrMg(inputs.preloadPerDose)} mg × ${inputs.preloadDosesPerDay}/day = ${preloadTotal} mg/day
- 7-OH cross-taper: ${inputs.crossTaperMode === 'standard' ? 'standard (cut in half, then stop)' : `custom — ${inputs.crossTaperDays} even cuts to zero`}
- Hold: ${inputs.holdDays} day(s) on SR-17 at ${preloadTotal} mg/day
- SR taper: ${inputs.srTaperMode === 'standard' ? 'standard step-down (100 → 75 → 50 → 25 → jump)' : inputs.srTaperMode === 'custom-mg' ? `custom — ${inputs.srTaperMg} mg/day cuts` : `custom — ${inputs.srTaperPct}%/day cuts`}
- Jump-off: ${inputs.srJumpOff} mg (final SR-17 dose before stopping)
- Total runway: ${result.totalDurationDays} days

DAY-BY-DAY SCHEDULE:
${lines}

CONTEXT — please ask me about these before suggesting changes:
- Which compound I'm actually coming off (7-OH alone, stacked, MGM-15, MIT-A, pseudo) and for how long
- Whether I'm sourcing SR-17 with a third-party COA
- Other medications, medical conditions, polysubstance use (especially alcohol or benzodiazepines)
- Whether I have naloxone (Narcan) on hand and someone who knows what I'm doing
- Past taper or detox attempts

WHAT I NEED HELP WITH:
1. Whether this protocol fits my specific situation (synthetics may need a longer preload)
2. Helper meds, supplements, or comfort measures that fit the SR-17 path specifically
3. Symptoms to expect at each phase, especially the cross-taper transition and the SR taper-down
4. When to extend the hold, slow the SR taper, or pause
5. Post-SR planning — relapse risk is documented and tolerance drops fast after stopping

IMPORTANT:
- SR-17 has never been studied in humans. All efficacy and safety data is rodent. The community protocol on quitting7oh.org is not a clinical prescription.
- Don't replace a prescriber; help me think through what to ask one. SR-17 doesn't have a prescriber path — this is off-label, community-derived.
- Flag anything that looks dangerous given my context.
- Be honest about uncertainty; the published clinical literature on SR-17 in humans is essentially nonexistent.`;
}

/* ──────────────────────── Main component ──────────────────────── */

const DEFAULTS: Sr17Inputs = {
  ohPerDose: 15,
  ohDosesPerDay: 3,
  includeAllergyTest: true,
  preloadDays: 1,
  preloadPerDose: 50,
  preloadDosesPerDay: 3,
  crossTaperMode: 'standard',
  crossTaperDays: 3,
  holdDays: 4,
  srTaperMode: 'standard',
  srTaperMg: 25,
  srTaperPct: 25,
  srJumpOff: 25,
};

export function Sr17CrossTaper() {
  const [inputs, setInputs] = useState<Sr17Inputs>(DEFAULTS);
  const [copied, setCopied] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Load saved inputs from localStorage on mount. Validate that every
  // expected field is the right type; otherwise fall back to defaults.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.v === STORAGE_VERSION && d.inputs) {
          const i = d.inputs as Partial<Sr17Inputs>;
          setInputs({
            ohPerDose: typeof i.ohPerDose === 'number' ? i.ohPerDose : DEFAULTS.ohPerDose,
            ohDosesPerDay: typeof i.ohDosesPerDay === 'number' ? i.ohDosesPerDay : DEFAULTS.ohDosesPerDay,
            includeAllergyTest: typeof i.includeAllergyTest === 'boolean' ? i.includeAllergyTest : DEFAULTS.includeAllergyTest,
            preloadDays: typeof i.preloadDays === 'number' ? i.preloadDays : DEFAULTS.preloadDays,
            preloadPerDose: typeof i.preloadPerDose === 'number' ? i.preloadPerDose : DEFAULTS.preloadPerDose,
            preloadDosesPerDay: typeof i.preloadDosesPerDay === 'number' ? i.preloadDosesPerDay : DEFAULTS.preloadDosesPerDay,
            crossTaperMode: i.crossTaperMode === 'custom-days' ? 'custom-days' : 'standard',
            crossTaperDays: typeof i.crossTaperDays === 'number' ? i.crossTaperDays : DEFAULTS.crossTaperDays,
            holdDays: typeof i.holdDays === 'number' ? i.holdDays : DEFAULTS.holdDays,
            srTaperMode: i.srTaperMode === 'custom-mg' || i.srTaperMode === 'custom-pct' ? i.srTaperMode : 'standard',
            srTaperMg: typeof i.srTaperMg === 'number' ? i.srTaperMg : DEFAULTS.srTaperMg,
            srTaperPct: typeof i.srTaperPct === 'number' ? i.srTaperPct : DEFAULTS.srTaperPct,
            srJumpOff: typeof i.srJumpOff === 'number' ? i.srJumpOff : DEFAULTS.srJumpOff,
          });
        }
      }
    } catch {
      // Bad JSON or blocked storage — silently fall back to defaults.
    }
    setHydrated(true);
  }, []);

  // Save inputs back to localStorage on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: STORAGE_VERSION, inputs }),
      );
    } catch {
      // Quota or blocked storage — silently skip.
    }
  }, [hydrated, inputs]);

  // Clear "Copied!" confirmation after 2 seconds.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const result = useMemo(() => generateSr17Protocol(inputs), [inputs]);

  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setInputs(DEFAULTS);
  };

  const handleCopyPrompt = async () => {
    const text = buildPromptText(inputs, result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {}
      document.body.removeChild(ta);
    }
  };

  const handlePrint = () => {
    const html = buildPrintHTML(inputs, result);
    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="not-prose my-6 space-y-6">
      {/* Reset row */}
      <div className="flex items-center justify-between print:hidden">
        <div className="text-xs text-muted-foreground">
          Your settings save automatically and reload next time you visit.
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:text-foreground focus-visible:underline"
          title="Clear saved settings and reset all inputs to defaults"
        >
          Reset form
        </button>
      </div>

      <ConfigPanel inputs={inputs} setInputs={setInputs} />

      <Output
        result={result}
        onPrint={handlePrint}
        onCopyPrompt={handleCopyPrompt}
        copied={copied}
      />
    </div>
  );
}
