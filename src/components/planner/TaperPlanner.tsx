import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { NumberInput } from '~/components/ui/number-input';
import { SUBSTANCES, formatLocalIsoDate, formatWeekdayDate } from '~/lib/taper-schedule';
import {
  buildDays,
  changePace,
  cuttableDays,
  defaultsFor,
  formatAmount,
  holdToday,
  measureHint,
  niceStep,
  planPosition,
  readDoseLog,
  readSavedPlan,
  startPlan,
  type DoseLog,
  type Measure,
  type PlanChange,
  type PlanDay,
  type PlanInput,
  type PlannerCompound,
  type SavedPlan,
} from '~/lib/taper-plan';

const STORAGE_KEY = 'taper-planner-v1-7oh-syn';
const OLD_CALCULATOR_KEYS = ['taper-calculator-v2-7oh-syn', 'taper-calculator-v1-7oh-syn'];
const COMPOUNDS: PlannerCompound[] = ['7oh', 'mgm', 'pseudo'];
const LENGTH_PRESETS = [14, 21, 30, 45, 60, 90];
const TABLET_PRESETS = [5, 10, 15, 20, 30];

const SEG_GROUP = 'grid gap-1 rounded-lg border border-border bg-muted/65 p-1';
const SEG_BTN =
  'inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs aria-pressed:ring-1 aria-pressed:ring-border';
const CHOICE =
  'w-full rounded-lg border px-4 py-3 text-left transition-colors aria-pressed:border-primary aria-pressed:bg-accent/60 border-border bg-card hover:border-primary/60';

type View = 'setup' | 'today' | 'schedule' | 'adjust';
type AdjustKind = 'hold' | 'slower' | 'faster';

interface Draft extends PlanInput {
  startedKind: 'today' | 'earlier';
  startDate: string;
  tabletSize: number;
}

function plural(n: number, noun: string): string {
  return n === 1 ? noun : `${noun}s`;
}

function draftFromDefaults(compound: PlannerCompound, today: string): Draft {
  return { ...defaultsFor(compound), startedKind: 'today', startDate: today, tabletSize: 15 };
}

function measureOf(d: Draft): Measure {
  return d.measure.kind === 'tablet' ? { kind: 'tablet', size: d.tabletSize } : { kind: 'powder' };
}

/** Prefill from the older calculator, if the reader used it on this device. */
function draftFromOldCalculator(today: string): { draft: Draft; startDate: string } | null {
  for (const key of OLD_CALCULATOR_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const d = JSON.parse(raw);
      const compound: PlannerCompound = COMPOUNDS.includes(d?.substance) ? d.substance : '7oh';
      const base = draftFromDefaults(compound, today);
      if (typeof d?.perDose !== 'number' || d.perDose <= 0) continue;
      const untouched =
        d.edited === false ||
        (d.perDose === base.perDose && d.dosesPerDay === base.dosesPerDay && d.jumpOff === base.jumpOff);
      if (untouched) continue;
      const startDate = typeof d.startDate === 'string' && d.startDate ? d.startDate : '';
      return {
        draft: {
          ...base,
          perDose: d.perDose,
          dosesPerDay: typeof d.dosesPerDay === 'number' ? d.dosesPerDay : base.dosesPerDay,
          jumpOff: typeof d.jumpOff === 'number' ? d.jumpOff : base.jumpOff,
          days: typeof d.durationDays === 'number' ? Math.max(2, d.durationDays) : base.days,
          measure: d.tabletSize > 0 ? { kind: 'tablet', size: d.tabletSize } : { kind: 'powder' },
          tabletSize: d.tabletSize > 0 ? d.tabletSize : 15,
          startedKind: 'earlier',
          startDate: startDate || today,
        },
        startDate,
      };
    } catch {
      // Ignore unreadable data.
    }
  }
  return null;
}

function changeText(c: PlanChange): string {
  const date = formatWeekdayDate(c.from, 0);
  if (c.kind === 'hold') return `Held the dose on ${date}. The plan got 1 day longer.`;
  if (c.kind === 'slower') return `Slowed down from ${date}: ${c.deltaDays} ${plural(c.deltaDays, 'day')} added.`;
  if (c.kind === 'faster') {
    const n = Math.abs(c.deltaDays);
    return `Sped up from ${date}: ${n} ${plural(n, 'day')} taken off.`;
  }
  return '';
}

export function TaperPlanner() {
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState('');
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [log, setLog] = useState<DoseLog>({});
  const [view, setView] = useState<View>('setup');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => draftFromDefaults('7oh', ''));
  const [prefilled, setPrefilled] = useState<'none' | 'dated' | 'undated'>('none');
  const [adjustKind, setAdjustKind] = useState<AdjustKind | null>(null);
  const [slowerBy, setSlowerBy] = useState(7);
  const [fasterBy, setFasterBy] = useState(5);
  const [undo, setUndo] = useState<{ message: string; plan: SavedPlan | null; log: DoseLog } | null>(null);
  const [undoPaused, setUndoPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const unit = 'mg';

  // Load once on the client.
  useEffect(() => {
    const now = formatLocalIsoDate(new Date());
    setToday(now);
    let loadedPlan: SavedPlan | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        loadedPlan = readSavedPlan(d.plan);
        setLog(readDoseLog(d.log));
      }
    } catch {
      // Ignore blocked or corrupt storage.
    }
    if (loadedPlan) {
      setPlan(loadedPlan);
      setView('today');
    } else {
      const old = draftFromOldCalculator(now);
      if (old) {
        setDraft(old.draft);
        setPrefilled(old.startDate ? 'dated' : 'undated');
      } else {
        setDraft(draftFromDefaults('7oh', now));
      }
    }
    setHydrated(true);
  }, []);

  // Save plan and log together.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const blob = JSON.stringify({ v: 1, plan, log });
      if (localStorage.getItem(STORAGE_KEY) !== blob) localStorage.setItem(STORAGE_KEY, blob);
    } catch {
      // Ignore quota / blocked storage.
    }
  }, [hydrated, plan, log]);

  // Another tab saved: take its plan and log.
  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const d = JSON.parse(e.newValue);
        setPlan(readSavedPlan(d.plan));
        setLog(readDoseLog(d.log));
      } catch {
        // Ignore malformed writes.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

  // Keep "today" current when the tab comes back or at midnight.
  useEffect(() => {
    if (!hydrated) return;
    const refresh = () => setToday(formatLocalIsoDate(new Date()));
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const t = setTimeout(refresh, next.getTime() - now.getTime());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [hydrated, today]);

  // Undo bar: 20 seconds, paused while hovered or focused.
  useEffect(() => {
    if (!undo || undoPaused) return;
    const t = setTimeout(() => setUndo(null), 20_000);
    return () => clearTimeout(t);
  }, [undo, undoPaused]);

  const go = (next: View) => {
    setView(next);
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: false }));
  };

  /* ---------- setup ---------- */

  const cfg = SUBSTANCES[draft.compound];
  const draftInput: PlanInput = { ...draft, measure: measureOf(draft) };
  const draftTotal = draft.perDose * draft.dosesPerDay;
  const jumpTooHigh = draft.jumpOff > 0 && draft.jumpOff >= draftTotal;
  const draftStart = draft.startedKind === 'earlier' && draft.startDate ? draft.startDate : today;
  const preview = useMemo(
    () => (today && !jumpTooHigh && draft.perDose > 0 ? buildDays(draftInput, draftStart || today) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, jumpTooHigh, draft, draftStart],
  );
  const previewFacts = useMemo(() => {
    if (preview.length === 0) return null;
    const firstDrop = preview.findIndex((d, i) => i > 0 && d.dosesPerDay < preview[i - 1].dosesPerDay);
    let worst = 0;
    for (let i = 1; i < preview.length; i++) {
      if (preview[i].totalDaily > 0) worst = Math.max(worst, 1 - preview[i].totalDaily / preview[i - 1].totalDaily);
    }
    const lastDose = [...preview].reverse().find((d) => d.totalDaily > 0) ?? preview[0];
    const max = preview[0].totalDaily || 1;
    const points = preview
      .map((d, i) => `${((i / Math.max(1, preview.length - 1)) * 316 + 2).toFixed(1)},${(86 - (d.totalDaily / max) * 78).toFixed(1)}`)
      .join(' ');
    const pos = today ? daysSince(preview[0].date, today) : 0;
    return {
      firstDrop: firstDrop > 0 ? firstDrop : null,
      worstCut: Math.round(worst * 100),
      lastDose,
      points,
      cuttable: cuttableDays(preview, measureOf(draft)),
      todayIndex: pos >= 0 && pos < preview.length ? pos : null,
    };
  }, [preview, draft, today]);

  const setDraftField = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const pickCompound = (c: PlannerCompound) =>
    setDraft((d) => ({ ...draftFromDefaults(c, today), startedKind: d.startedKind, startDate: d.startDate }));

  const startTheplan = () => {
    const p = startPlan(draftInput, draftStart);
    if (!p) return;
    setUndo(plan ? { message: 'New plan started.', plan, log } : null);
    setPlan(p);
    setPrefilled('none');
    go('today');
    setAnnounce('Plan started.');
  };

  /* ---------- running plan ---------- */

  const position = plan && today ? planPosition(plan, today) : null;
  const index = position?.kind === 'during' ? position.index : null;
  const todayDay: PlanDay | null = plan && index !== null ? plan.days[index] : null;
  const yesterday: PlanDay | null = plan && index !== null && index > 0 ? plan.days[index - 1] : null;
  const tomorrow: PlanDay | null = plan && index !== null ? plan.days[index + 1] ?? null : null;
  const lastDose = plan ? [...plan.days].reverse().find((d) => d.totalDaily > 0) ?? plan.days[0] : null;
  const nextDrop =
    plan && index !== null
      ? plan.days.findIndex((d, i) => i > index && d.totalDaily > 0 && d.dosesPerDay < plan.days[i - 1].dosesPerDay)
      : -1;
  const canHold = !!(yesterday && todayDay && yesterday.totalDaily > todayDay.totalDaily);
  const planUnitMeasure: Measure = plan?.measure ?? { kind: 'powder' };

  const toggleSlot = (date: string, slot: number) => {
    setLog((prev) => {
      const cur = prev[date] ?? [];
      const nextSlots = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot].sort();
      const next = { ...prev };
      if (nextSlots.length) next[date] = nextSlots;
      else delete next[date];
      return next;
    });
  };
  const toggleDay = (day: PlanDay) => {
    const slots = Math.max(1, day.dosesPerDay);
    setLog((prev) => {
      const next = { ...prev };
      if ((prev[day.date]?.length ?? 0) >= slots) delete next[day.date];
      else next[day.date] = Array.from({ length: slots }, (_, i) => i);
      return next;
    });
  };

  const adjusted = useMemo(() => {
    if (!plan || index === null || !adjustKind) return null;
    if (adjustKind === 'hold') return canHold ? holdToday(plan, index) : null;
    return changePace(plan, index, adjustKind === 'slower' ? slowerBy : -fasterBy);
  }, [plan, index, adjustKind, slowerBy, fasterBy, canHold]);

  const applyAdjust = () => {
    if (!adjusted || !plan) return;
    setUndo({ message: 'Plan changed from today.', plan, log });
    setPlan(adjusted);
    setAdjustKind(null);
    go('today');
    setAnnounce('Plan changed from today.');
  };

  const startOver = () => {
    setUndo({ message: 'Plan cleared. Your logged doses are kept.', plan, log });
    setPlan(null);
    setStep(1);
    setDraft(draftFromDefaults(plan?.compound ?? '7oh', today));
    go('setup');
  };

  /* ---------- render ---------- */

  if (!hydrated) {
    return (
      <div className="not-prose my-6" aria-busy="true">
        <span className="sr-only">Loading the taper planner…</span>
        <div className="field-card h-[30rem] animate-pulse bg-muted/35 motion-reduce:animate-none" />
      </div>
    );
  }

  const doseLine = (d: PlanDay) =>
    d.totalDaily === 0 ? 'Stop day' : `${formatAmount(d.perDose)} ${unit} × ${d.dosesPerDay}`;

  return (
    <div className="not-prose my-6 tabular-nums [overflow-wrap:normal]">
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      <span className="sr-only" aria-live="polite">
        {undo ? `${undo.message} Undo is available.` : ''}
      </span>

      {plan && view !== 'setup' && (
        <nav aria-label="Planner" className={`${SEG_GROUP} mb-5 grid-cols-3`}>
          {(
            [
              ['today', 'Today'],
              ['schedule', 'Schedule'],
              ['adjust', 'Change plan'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-current={view === v ? 'page' : undefined}
              onClick={() => {
                if (v === 'adjust') setAdjustKind(null);
                go(v);
              }}
              className={SEG_BTN}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {/* ===================== SETUP ===================== */}
      {view === 'setup' && (
        <section aria-labelledby="planner-heading" className="field-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/75 px-5 py-3">
            <p className="eyebrow m-0">Set up · Step {step} of 3</p>
            {plan && (
              <button
                type="button"
                onClick={() => go('today')}
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary"
              >
                Back to my plan
              </button>
            )}
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {prefilled !== 'none' && step === 1 && (
              <p className="m-0 rounded-lg bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
                We filled this in from the calculator you used before on this device. Check it,
                then tell us when you started so today&apos;s dose comes out right.
              </p>
            )}

            {step === 1 && (
              <>
                <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
                  What do you take now?
                </h2>
                <div>
                  <span id="compound-label" className="block text-sm font-medium">
                    Compound
                  </span>
                  <div role="group" aria-labelledby="compound-label" className={`${SEG_GROUP} mt-1.5 grid-cols-3`}>
                    {COMPOUNDS.map((c) => (
                      <button key={c} type="button" aria-pressed={draft.compound === c} onClick={() => pickCompound(c)} className={`${SEG_BTN} leading-tight`}>
                        {SUBSTANCES[c].shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="planner-amount">Amount each time ({unit})</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`${niceStep(draft.perDose)} ${unit} less`}
                      onClick={() => setDraftField('perDose', Math.max(niceStep(draft.perDose), draft.perDose - niceStep(draft.perDose)))}
                    >
                      −
                    </Button>
                    <div className="relative flex-1">
                      <NumberInput
                        id="planner-amount"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={draft.perDose}
                        onValueChange={(v) => setDraftField('perDose', v)}
                        className="h-14 pr-12 text-center font-display text-2xl font-semibold"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted-foreground" aria-hidden="true">
                        {unit}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`${niceStep(draft.perDose)} ${unit} more`}
                      onClick={() => setDraftField('perDose', draft.perDose + niceStep(draft.perDose))}
                    >
                      +
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Type any amount. The − and + buttons step by about 5% ({niceStep(draft.perDose)} {unit} at this dose).
                  </p>
                </div>
                <div>
                  <span id="times-label" className="block text-sm font-medium">
                    Times a day
                  </span>
                  <div role="group" aria-labelledby="times-label" className={`${SEG_GROUP} mt-1.5 grid-cols-6`}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <button key={n} type="button" aria-pressed={draft.dosesPerDay === n} onClick={() => setDraftField('dosesPerDay', n)} className={SEG_BTN}>
                        {n}×
                      </button>
                    ))}
                  </div>
                </div>
                <p className="m-0 flex justify-between rounded-lg bg-muted/55 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">That&apos;s</span>
                  <span className="font-bold">
                    {formatAmount(draftTotal)} {unit} a day
                  </span>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
                  How do you measure it?
                </h2>
                <div role="group" aria-label="How you measure" className="space-y-2">
                  <button type="button" aria-pressed={draft.measure.kind === 'tablet'} onClick={() => setDraftField('measure', { kind: 'tablet', size: draft.tabletSize })} className={CHOICE}>
                    <span className="block font-bold">Tablets</span>
                    <span className="block text-sm text-muted-foreground">
                      Enter your tablet&apos;s strength. Doses come out in quarter tablets where they can.
                    </span>
                  </button>
                  <button type="button" aria-pressed={draft.measure.kind === 'powder'} onClick={() => setDraftField('measure', { kind: 'powder' })} className={CHOICE}>
                    <span className="block font-bold">Powder, with a scale</span>
                    <span className="block text-sm text-muted-foreground">
                      Doses round to amounts a scale can weigh at that size.
                    </span>
                  </button>
                </div>
                {draft.measure.kind === 'tablet' && (
                  <div>
                    <Label htmlFor="planner-tablet">Each tablet is ({unit})</Label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <NumberInput
                        id="planner-tablet"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={draft.tabletSize}
                        onValueChange={(v) => setDraft((d) => ({ ...d, tabletSize: v, measure: { kind: 'tablet', size: v } }))}
                        className="h-11 w-28 text-base font-semibold"
                      />
                      {TABLET_PRESETS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={draft.tabletSize === t}
                          onClick={() => setDraft((d) => ({ ...d, tabletSize: t, measure: { kind: 'tablet', size: t } }))}
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-accent/60"
                        >
                          {t} {unit}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Check the label: strength varies between brands and batches.
                    </p>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
                  How fast, and when?
                </h2>
                <div>
                  <span id="length-label" className="block text-sm font-medium">
                    Taper over
                  </span>
                  <div role="group" aria-labelledby="length-label" className={`${SEG_GROUP} mt-1.5 grid-cols-3 sm:grid-cols-6`}>
                    {LENGTH_PRESETS.map((n) => (
                      <button key={n} type="button" aria-pressed={draft.days === n} onClick={() => setDraftField('days', n)} className={SEG_BTN}>
                        {n} days
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Label htmlFor="planner-days" className="text-xs text-muted-foreground">
                      Or exactly
                    </Label>
                    <NumberInput id="planner-days" inputMode="numeric" min={2} max={365} step={1} integer commitOnBlur value={draft.days} onValueChange={(v) => setDraftField('days', v)} className="h-10 w-20 text-sm" />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="planner-jump">Last day&apos;s total ({unit})</Label>
                  <NumberInput
                    id="planner-jump"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={draft.jumpOff}
                    onValueChange={(v) => setDraftField('jumpOff', v)}
                    aria-invalid={jumpTooHigh || undefined}
                    aria-describedby="planner-jump-help"
                    className="mt-1.5 h-11 w-32 text-base font-semibold"
                  />
                  <p id="planner-jump-help" className={`mt-1.5 text-xs ${jumpTooHigh ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {jumpTooHigh
                      ? `This needs to be below today's ${formatAmount(draftTotal)} ${unit} a day.`
                      : 'Your jump-off dose: the daily total on the last day before stopping. Set 0 to end with a stop day.'}
                  </p>
                </div>
                <div>
                  <span id="started-label" className="block text-sm font-medium">
                    When does it start?
                  </span>
                  <div role="group" aria-labelledby="started-label" className={`${SEG_GROUP} mt-1.5 grid-cols-2`}>
                    <button type="button" aria-pressed={draft.startedKind === 'today'} onClick={() => setDraftField('startedKind', 'today')} className={SEG_BTN}>
                      Today
                    </button>
                    <button type="button" aria-pressed={draft.startedKind === 'earlier'} onClick={() => setDraftField('startedKind', 'earlier')} className={SEG_BTN}>
                      I&apos;ve already started
                    </button>
                  </div>
                  {draft.startedKind === 'earlier' && (
                    <div className="mt-2">
                      <Label htmlFor="planner-start" className="text-xs text-muted-foreground">
                        Day 1 was
                      </Label>
                      <Input id="planner-start" type="date" value={draft.startDate} max={today} onChange={(e) => setDraftField('startDate', e.target.value)} className="mt-1 w-48 text-sm" />
                    </div>
                  )}
                </div>

                {previewFacts && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label={`Daily total falls from ${formatAmount(preview[0].totalDaily)} to ${formatAmount(previewFacts.lastDose.totalDaily)} ${unit} over ${preview.length} days`}>
                      <line x1="0" y1="86" x2="320" y2="86" stroke="hsl(var(--border))" strokeWidth="1" />
                      <polyline points={previewFacts.points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <dl className="m-0 mt-3 grid gap-1.5 text-sm">
                      <Fact k="Day 1" v={doseLine(preview[0])} />
                      {previewFacts.todayIndex !== null && previewFacts.todayIndex > 0 && (
                        <Fact k={`Today (day ${previewFacts.todayIndex + 1})`} v={doseLine(preview[previewFacts.todayIndex])} />
                      )}
                      {previewFacts.firstDrop !== null && (
                        <Fact k="First change in doses a day" v={`Day ${previewFacts.firstDrop + 1}: ${preview[previewFacts.firstDrop].dosesPerDay} a day`} />
                      )}
                      <Fact k="Last dose" v={`${formatWeekdayDate(previewFacts.lastDose.date, 0)}, ${formatAmount(previewFacts.lastDose.totalDaily)} ${unit}`} />
                      <Fact k="Largest one-day cut" v={`${previewFacts.worstCut}%`} />
                      {draft.measure.kind === 'tablet' && (
                        <Fact k="Days in whole quarter tablets" v={`${previewFacts.cuttable} of ${preview.length}`} />
                      )}
                    </dl>
                    {draft.measure.kind === 'tablet' && previewFacts.cuttable < preview.length && (
                      <p className="m-0 mt-2 text-xs text-muted-foreground">
                        On the other days the dose falls between quarters; the day card says how much to weigh or dissolve.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/75 pt-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  disabled={draft.perDose <= 0 || (step === 2 && draft.measure.kind === 'tablet' && draft.tabletSize <= 0)}
                  onClick={() => {
                    setStep(step + 1);
                    requestAnimationFrame(() => headingRef.current?.focus());
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="button" disabled={preview.length === 0} onClick={startTheplan}>
                  {previewFacts?.todayIndex ? `Save and open day ${previewFacts.todayIndex + 1}` : 'Start this plan'}
                </Button>
              )}
            </div>
            {step === 3 && (
              <p className="m-0 text-xs leading-relaxed text-muted-foreground">
                Starting saves the schedule as dated days. Later changes, like holding a dose or slowing down,
                apply from that day on. Days you&apos;ve already logged never move.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ===================== TODAY ===================== */}
      {plan && view === 'today' && (
        <section aria-labelledby="planner-heading" className="space-y-4">
          {position?.kind === 'before' && (
            <div className="field-card p-5 sm:p-6">
              <p className="eyebrow m-0">Not started yet</p>
              <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-1.5 font-display text-2xl font-semibold outline-none">
                Your plan starts {formatWeekdayDate(plan.days[0].date, 0)}, in {position.inDays} {plural(position.inDays, 'day')}.
              </h2>
              <p className="m-0 mt-2 text-sm text-muted-foreground">Day 1: {doseLine(plan.days[0])}.</p>
            </div>
          )}

          {position?.kind === 'after' && lastDose && (
            <div className="field-card p-5 sm:p-6">
              <p className="eyebrow m-0">Schedule complete</p>
              <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-1.5 font-display text-2xl font-semibold outline-none">
                Your last scheduled dose was {formatWeekdayDate(lastDose.date, 0)}.
              </h2>
              <p className="m-0 mt-2 text-sm text-muted-foreground">
                You logged doses on {plan.days.filter((d) => (log[d.date]?.length ?? 0) > 0).length} of {plan.days.length} days.
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={startOver}>
                Plan another taper
              </Button>
            </div>
          )}

          {todayDay && index !== null && (
            <div className="field-card overflow-hidden">
              <div className="p-5 sm:p-6">
                <p className="eyebrow m-0">
                  Today · {formatWeekdayDate(todayDay.date, 0)} · Day {index + 1} of {plan.days.length}
                </p>
                {todayDay.totalDaily === 0 ? (
                  <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-2 font-display text-4xl font-semibold outline-none">
                    Stop day. No dose.
                  </h2>
                ) : (
                  <>
                    <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-2 font-display text-4xl font-semibold tracking-tight outline-none sm:text-5xl">
                      {formatAmount(todayDay.perDose)} {unit}{' '}
                      <span className="font-sans text-2xl font-semibold text-muted-foreground">
                        × {todayDay.dosesPerDay} {plural(todayDay.dosesPerDay, 'dose')}
                      </span>
                    </h2>
                    <p className="m-0 mt-2 text-base text-foreground">{measureHint(todayDay.perDose, planUnitMeasure, unit)}</p>
                    <p className="m-0 mt-1 text-sm text-muted-foreground">
                      {formatAmount(todayDay.totalDaily)} {unit} for the day
                    </p>
                    {yesterday && yesterday.dosesPerDay > todayDay.dosesPerDay && (
                      <p className="m-0 mt-3 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
                        From today: {todayDay.dosesPerDay} {plural(todayDay.dosesPerDay, 'dose')} a day instead of {yesterday.dosesPerDay}.
                        {todayDay.perDose > yesterday.perDose ? ' Each dose is larger, and the' : ' The'} day&apos;s total{' '}
                        {todayDay.totalDaily < yesterday.totalDaily
                          ? `goes from ${formatAmount(yesterday.totalDaily)} to ${formatAmount(todayDay.totalDaily)} ${unit}.`
                          : `stays at ${formatAmount(todayDay.totalDaily)} ${unit}.`}
                      </p>
                    )}
                    <div role="group" aria-label="Doses taken today" className="mt-4 flex flex-wrap gap-2">
                      {Array.from({ length: todayDay.dosesPerDay }, (_, i) => {
                        const on = (log[todayDay.date] ?? []).includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleSlot(todayDay.date, i)}
                            className={`inline-flex min-h-12 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                              on ? 'border-success/70 bg-success/12' : 'border-muted-foreground/60 bg-background hover:border-primary'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`inline-flex size-5 items-center justify-center rounded-full border ${
                                on ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/70'
                              }`}
                            >
                              {on && <Check className="size-3 stroke-[3]" />}
                            </span>
                            Dose {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="grid gap-2 border-t border-border/75 bg-muted/30 p-4 sm:grid-cols-2 sm:p-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canHold}
                  onClick={() => {
                    setAdjustKind('hold');
                    go('adjust');
                  }}
                >
                  Stay on yesterday&apos;s dose
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAdjustKind('slower');
                    go('adjust');
                  }}
                >
                  Slow down or speed up
                </Button>
              </div>
            </div>
          )}

          {todayDay && index !== null && (
            <div className="field-card p-5">
              <h3 className="m-0 text-sm font-bold text-muted-foreground">Coming up</h3>
              <dl className="m-0 mt-2 grid gap-1.5 text-sm">
                {tomorrow && <Fact k="Tomorrow" v={doseLine(tomorrow)} />}
                {nextDrop > 0 && (
                  <Fact k={`${formatWeekdayDate(plan.days[nextDrop].date, 0)}`} v={`Down to ${plan.days[nextDrop].dosesPerDay} ${plural(plan.days[nextDrop].dosesPerDay, 'dose')} a day`} />
                )}
                {lastDose && <Fact k="Last dose" v={`${formatWeekdayDate(lastDose.date, 0)}, ${formatAmount(lastDose.totalDaily)} ${unit}`} />}
              </dl>
              {yesterday && (log[yesterday.date]?.length ?? 0) < yesterday.dosesPerDay && (
                <p className="m-0 mt-3 text-sm text-muted-foreground">
                  Yesterday: {log[yesterday.date]?.length ?? 0} of {yesterday.dosesPerDay} doses logged.{' '}
                  <button type="button" onClick={() => go('schedule')} className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-2 hover:underline">
                    Fix in the schedule
                  </button>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ===================== ADJUST ===================== */}
      {plan && view === 'adjust' && (
        <section aria-labelledby="planner-heading" className="field-card p-5 sm:p-6">
          <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
            Change the plan from today
          </h2>
          <p className="m-0 mt-1.5 text-sm text-muted-foreground">
            Days before today, and the doses you&apos;ve logged, stay as they are.
          </p>
          {index === null ? (
            <p className="m-0 mt-4 text-sm">Changes apply to a plan that&apos;s underway. {position?.kind === 'after' ? 'This one has ended.' : 'This one hasn’t started yet.'}</p>
          ) : (
            <>
              <div role="group" aria-label="Kind of change" className="mt-4 space-y-2">
                <button type="button" aria-pressed={adjustKind === 'hold'} disabled={!canHold} onClick={() => setAdjustKind('hold')} className={`${CHOICE} disabled:opacity-50`}>
                  <span className="block font-bold">Stay on yesterday&apos;s dose today</span>
                  <span className="block text-sm text-muted-foreground">
                    {canHold ? `Take ${doseLine(yesterday!)} again today, then continue from there. Adds a day.` : 'Today already matches yesterday, or this is day 1.'}
                  </span>
                </button>
                <button type="button" aria-pressed={adjustKind === 'slower'} onClick={() => setAdjustKind('slower')} className={CHOICE}>
                  <span className="block font-bold">Slow down</span>
                  <span className="block text-sm text-muted-foreground">Spread what&apos;s left over more days, starting from today&apos;s dose.</span>
                </button>
                {adjustKind === 'slower' && (
                  <DayCountPicker label="Add" value={slowerBy} options={[3, 7, 14]} onChange={setSlowerBy} />
                )}
                <button type="button" aria-pressed={adjustKind === 'faster'} onClick={() => setAdjustKind('faster')} className={CHOICE}>
                  <span className="block font-bold">Speed up</span>
                  <span className="block text-sm text-muted-foreground">Finish sooner, starting from today&apos;s dose.</span>
                </button>
                {adjustKind === 'faster' && (
                  <DayCountPicker label="Take off" value={fasterBy} options={[3, 5, 7]} onChange={setFasterBy} />
                )}
              </div>

              {adjusted && todayDay && (
                <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="m-0 text-sm font-bold text-muted-foreground">What changes</h3>
                  <table className="mt-2 w-full text-sm">
                    <thead className="sr-only">
                      <tr>
                        <th>Item</th>
                        <th>Now</th>
                        <th>After</th>
                      </tr>
                    </thead>
                    <tbody>
                      <CompareRow k="Today" before={doseLine(todayDay)} after={doseLine(adjusted.days[index])} />
                      <CompareRow k="Tomorrow" before={tomorrow ? doseLine(tomorrow) : 'Done'} after={adjusted.days[index + 1] ? doseLine(adjusted.days[index + 1]) : 'Done'} />
                      <CompareRow k="Days left" before={String(plan.days.length - index)} after={String(adjusted.days.length - index)} />
                      <CompareRow
                        k="Last dose"
                        before={lastDose ? formatWeekdayDate(lastDose.date, 0) : ''}
                        after={formatWeekdayDate(([...adjusted.days].reverse().find((d) => d.totalDaily > 0) ?? adjusted.days[0]).date, 0)}
                      />
                    </tbody>
                  </table>
                  <Button type="button" className="mt-4 w-full sm:w-auto" onClick={applyAdjust}>
                    {adjustKind === 'hold' ? `Stay on ${doseLine(adjusted.days[index])} today` : 'Apply from today'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ===================== SCHEDULE ===================== */}
      {plan && view === 'schedule' && (
        <section aria-labelledby="planner-heading" className="field-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/75 px-5 py-4">
            <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-2xl font-semibold outline-none">
              Schedule
            </h2>
            <span className="text-sm text-muted-foreground">
              {SUBSTANCES[plan.compound].shortLabel} · {plan.days.length} days
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {plan.days.map((d, i) => {
              const change = plan.changes.find((c) => c.kind !== 'start' && c.from === d.date);
              const logged = log[d.date]?.length ?? 0;
              const slots = Math.max(1, d.dosesPerDay);
              const isToday = d.date === today;
              const isPastOrToday = index !== null ? i <= index : position?.kind === 'after';
              const prev = plan.days[i - 1];
              const drop = prev && d.totalDaily > 0 && prev.dosesPerDay > d.dosesPerDay;
              return (
                <li key={d.date}>
                  {change && <p className="m-0 bg-accent/60 px-5 py-2 text-xs font-semibold text-accent-foreground">{changeText(change)}</p>}
                  {drop && !change && (
                    <p className="m-0 bg-muted/50 px-5 py-1.5 text-xs font-semibold text-muted-foreground">
                      From here: {d.dosesPerDay} {plural(d.dosesPerDay, 'dose')} a day
                    </p>
                  )}
                  <div className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border/60 px-5 py-2.5 ${isToday ? 'bg-accent/45' : ''}`}>
                    {isPastOrToday ? (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={logged >= slots ? true : logged > 0 ? 'mixed' : false}
                        aria-label={`${formatWeekdayDate(d.date, 0)} doses taken`}
                        onClick={() => toggleDay(d)}
                        className="-m-2 inline-flex size-11 items-center justify-center rounded-md"
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-flex size-6 items-center justify-center rounded border text-[0.65rem] font-bold ${
                            logged >= slots
                              ? 'border-success bg-success text-success-foreground'
                              : logged > 0
                                ? 'border-success bg-success/15'
                                : 'border-muted-foreground/70 bg-card'
                          }`}
                        >
                          {logged >= slots ? <Check className="size-3.5 stroke-[3]" /> : logged > 0 ? logged : null}
                        </span>
                      </button>
                    ) : (
                      <span className="inline-block size-6" aria-hidden="true" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {isToday ? 'Today · ' : ''}Day {i + 1}
                      </span>
                      <span className="block text-xs text-muted-foreground">{formatWeekdayDate(d.date, 0)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold">{doseLine(d)}</span>
                      {d.totalDaily > 0 && plan.measure.kind === 'tablet' && (
                        <span className="block text-xs text-muted-foreground">{shortTabletHint(d.perDose, plan.measure.size)}</span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2 border-t border-border/75 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => copySchedule(plan, log, unit)}>
              Copy schedule
            </Button>
            <Button type="button" variant="outline" onClick={startOver}>
              Start a new plan
            </Button>
          </div>
        </section>
      )}

      {/* Undo bar */}
      {undo && (
        <div
          className="fixed inset-x-4 bottom-20 z-50 flex items-center justify-between gap-3 rounded-lg border border-border bg-popover px-4 py-3 text-sm shadow-lg sm:bottom-4 sm:left-auto sm:right-6 sm:w-96"
          onMouseEnter={() => setUndoPaused(true)}
          onMouseLeave={() => setUndoPaused(false)}
          onFocus={() => setUndoPaused(true)}
          onBlur={() => setUndoPaused(false)}
        >
          <span>{undo.message}</span>
          <span className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => {
                setPlan(undo.plan);
                setLog(undo.log);
                setUndo(null);
                go(undo.plan ? 'today' : 'setup');
              }}
              className="inline-flex min-h-11 items-center px-2 font-semibold text-primary"
            >
              Undo
            </button>
            <button type="button" aria-label="Dismiss" onClick={() => setUndo(null)} className="inline-flex size-11 items-center justify-center text-muted-foreground">
              ×
            </button>
          </span>
        </div>
      )}

      {/* Safety */}
      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-5 text-sm leading-relaxed">
        <p className="m-0">{cfg.note}</p>
        <p className="m-0 mt-3">
          If you also use alcohol, benzodiazepines, gabapentinoids, or other sedatives, taper with medical
          supervision; the combination is where the serious risk is. The{' '}
          <a href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2">
            SAMHSA National Helpline
          </a>{' '}
          (1-800-662-4357) and{' '}
          <a href="https://findtreatment.gov/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2">
            findtreatment.gov
          </a>{' '}
          can help you find care.
        </p>
      </div>
    </div>
  );
}

function daysSince(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`);
  const b = new Date(`${toIso}T00:00:00`);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

function shortTabletHint(perDose: number, size: number): string {
  const q = (perDose / size) * 4;
  const r = Math.round(q);
  if (r >= 1 && Math.abs(q - r) < 1e-6) {
    const whole = Math.floor(r / 4);
    const frac = ['', '¼', '½', '¾'][r % 4];
    return `${whole === 0 ? frac : `${whole}${frac}`} ${r <= 4 ? 'tab' : 'tabs'}`;
  }
  return 'weigh';
}

function copySchedule(plan: SavedPlan, log: DoseLog, unit: string) {
  const lines = plan.days.map((d, i) => {
    const dose = d.totalDaily === 0 ? 'stop day' : `${formatAmount(d.perDose)} ${unit} × ${d.dosesPerDay} = ${formatAmount(d.totalDaily)} ${unit}`;
    const hint = d.totalDaily > 0 ? ` (${measureHint(d.perDose, plan.measure, unit)})` : '';
    const logged = log[d.date]?.length ? ` [logged ${log[d.date].length}/${d.dosesPerDay}]` : '';
    return `Day ${i + 1}, ${formatWeekdayDate(d.date, 0)}: ${dose}${hint}${logged}`;
  });
  const text = `Taper schedule: ${SUBSTANCES[plan.compound].label}\n\n${lines.join('\n')}\n\nFrom the quitting7oh.org taper planner preview. Reference, not a prescription.`;
  navigator.clipboard?.writeText(text).catch(() => {});
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="m-0 text-right font-semibold">{v}</dd>
    </div>
  );
}

function CompareRow({ k, before, after }: { k: string; before: string; after: string }) {
  return (
    <tr>
      <th scope="row" className="py-1 pr-3 text-left font-normal text-muted-foreground">
        {k}
      </th>
      <td className="py-1 pr-3 text-muted-foreground line-through">{before}</td>
      <td className="py-1 text-right font-bold">{after}</td>
    </tr>
  );
}

function DayCountPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (n: number) => void;
}) {
  return (
    <div role="group" aria-label={`${label} days`} className={`${SEG_GROUP} ml-4 grid-cols-3`}>
      {options.map((n) => (
        <button key={n} type="button" aria-pressed={value === n} onClick={() => onChange(n)} className={SEG_BTN}>
          {label} {n} {plural(n, 'day')}
        </button>
      ))}
    </div>
  );
}
