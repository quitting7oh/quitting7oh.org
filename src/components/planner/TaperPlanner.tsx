import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, Download, Copy, RotateCcw } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { NumberInput } from '~/components/ui/number-input';
import {
  SUBSTANCES,
  formatLocalIsoDate,
  formatWeekdayDate,
  generateSchedule,
  daysBetweenIso,
} from '~/lib/taper-schedule';
import {
  changePaceAt,
  activeAmount,
  extendAt,
  formatNumber,
  previewDays,
  defaultsFor,
  formatAmount,
  holdAt,
  isoPlus,
  largestCut,
  lastDoseDay,
  measureHint,
  niceStep,
  planPosition,
  readDoseLog,
  readSavedPlan,
  restartAt,
  shortTablets,
  startPlan,
  tabletPieces,
  tabletsNeeded,
  type DoseLog,
  type Measure,
  type PlanChange,
  type PlanDay,
  type PlannerCompound,
  type SavedPlan,
} from '~/lib/taper-plan';

const STORAGE_KEY = 'taper-planner-v1-7oh-syn';
const OLD_CALCULATOR_KEY = 'taper-calculator-v2-7oh-syn';
const COMPOUNDS: PlannerCompound[] = ['7oh', 'mgm', 'pseudo'];
const LENGTH_PRESETS = [7, 14, 21, 30, 45, 60, 90];
const TABLET_PRESETS = [5, 10, 15, 20, 30];
const UNIT = 'mg';
const STEEP_CUT = 0.3;

const SEG_GROUP = 'grid gap-1 rounded-lg border border-border bg-muted/65 p-1';
const SEG_BTN =
  'inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs aria-pressed:ring-1 aria-pressed:ring-border disabled:cursor-not-allowed disabled:opacity-45';
const CHOICE =
  'w-full rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/60 aria-pressed:border-primary aria-pressed:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50';
const NAV_BTN =
  'inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-xs aria-[current=page]:ring-1 aria-[current=page]:ring-border';
const LINK_BTN =
  'inline-flex min-h-11 items-center font-semibold text-primary underline-offset-2 hover:underline';

type View = 'setup' | 'today' | 'schedule' | 'change';
type ChangeKind = 'hold' | 'extend' | 'slower' | 'faster' | 'restart';

interface Draft {
  compound: PlannerCompound;
  measureKind: 'tablet' | 'powder';
  tabletSize: number;
  tabletsPerDose: number;
  powderPerDose: number;
  strengthPct: number;
  dosesPerDay: number;
  days: number;
  jumpOff: number;
  startWhen: 'today' | 'tomorrow';
}

function plural(n: number, noun: string): string {
  return n === 1 ? noun : `${noun}s`;
}

function draftDefaults(compound: PlannerCompound): Draft {
  const d = defaultsFor(compound);
  const size = SUBSTANCES[compound].defaultTabletSize ?? 15;
  return {
    compound,
    measureKind: 'tablet',
    tabletSize: size,
    tabletsPerDose: Math.max(0.25, Math.round((d.perDose / size) * 4) / 4),
    powderPerDose: d.perDose,
    strengthPct: 0,
    dosesPerDay: d.dosesPerDay,
    days: d.days,
    jumpOff: d.jumpOff,
    startWhen: 'today',
  };
}

function draftMeasure(d: Draft): Measure {
  return d.measureKind === 'tablet'
    ? { kind: 'tablet', size: d.tabletSize }
    : d.strengthPct > 0
      ? { kind: 'powder', strengthPct: d.strengthPct }
      : { kind: 'powder' };
}

function draftPerDose(d: Draft): number {
  return d.measureKind === 'tablet' ? d.tabletsPerDose * d.tabletSize : d.powderPerDose;
}

function draftFromPlan(plan: SavedPlan, today: string): Draft {
  const pos = planPosition(plan, today);
  const day = pos.kind === 'during' ? plan.days[pos.index] : plan.days[0];
  const base = draftDefaults(plan.compound);
  const dose = day.totalDaily > 0 ? day : plan.days[0];
  return {
    ...base,
    measureKind: plan.measure.kind,
    tabletSize: plan.measure.kind === 'tablet' ? plan.measure.size : base.tabletSize,
    tabletsPerDose:
      plan.measure.kind === 'tablet' ? Math.max(0.25, Math.round((dose.perDose / plan.measure.size) * 4) / 4) : base.tabletsPerDose,
    powderPerDose: dose.perDose,
    strengthPct: plan.measure.kind === 'powder' ? plan.measure.strengthPct ?? 0 : 0,
    dosesPerDay: dose.dosesPerDay,
    jumpOff: plan.jumpOff,
  };
}

/** Prefill from the older calculator on this device, at today's dose. */
function draftFromOldCalculator(today: string): (Draft & { fromText: string }) | null {
  try {
    const raw = localStorage.getItem(OLD_CALCULATOR_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d?.edited !== true || typeof d.perDose !== 'number' || d.perDose <= 0) return null;
    const compound: PlannerCompound = COMPOUNDS.includes(d.substance) ? d.substance : '7oh';
    const base = draftDefaults(compound);
    const steps = generateSchedule(compound, d.perDose, d.dosesPerDay ?? base.dosesPerDay, d.jumpOff ?? base.jumpOff, d.durationDays ?? base.days, {
      tabletSize: d.tabletSize > 0 ? d.tabletSize : undefined,
    }).steps;
    let idx = 0;
    if (typeof d.startDate === 'string' && d.startDate) {
      idx = Math.max(0, daysBetweenIso(d.startDate, today) ?? 0);
    }
    if (idx >= steps.length || steps[idx].totalDaily <= 0) return null;
    const step = steps[idx];
    const size = d.tabletSize > 0 ? d.tabletSize : base.tabletSize;
    return {
      ...base,
      measureKind: d.tabletSize > 0 ? 'tablet' : 'powder',
      tabletSize: size,
      tabletsPerDose: Math.max(0.25, Math.round((step.perDose / size) * 4) / 4),
      powderPerDose: step.perDose,
      dosesPerDay: step.dosesPerDay,
      jumpOff: typeof d.jumpOff === 'number' ? d.jumpOff : base.jumpOff,
      days: Math.max(2, steps.length - idx),
      fromText: `${formatAmount(step.perDose)} mg × ${step.dosesPerDay}`,
    };
  } catch {
    return null;
  }
}

function changeText(c: PlanChange): string {
  const date = formatWeekdayDate(c.from, 0);
  const n = Math.abs(c.deltaDays);
  if (c.kind === 'hold') return `Stayed on the day before's dose on ${date}. The plan is 1 day longer.`;
  if (c.kind === 'extend') return `Took the same dose one more day on ${date}. The plan is 1 day longer.`;
  if (c.kind === 'slower') return `Slowed down from ${date}: ${n} ${plural(n, 'day')} added.`;
  if (c.kind === 'faster') return `Sped up from ${date}: ${n} ${plural(n, 'day')} taken off.`;
  if (c.kind === 'restart') return `Restarted from ${date} at a new dose.`;
  return '';
}

export function TaperPlanner() {
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState('');
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [log, setLog] = useState<DoseLog>({});
  const [view, setView] = useState<View>('setup');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => draftDefaults('7oh'));
  const [prefilled, setPrefilled] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [customFreq, setCustomFreq] = useState(false);
  const [changeKind, setChangeKind] = useState<ChangeKind | null>(null);
  const [slowerBy, setSlowerBy] = useState(7);
  const [fasterBy, setFasterBy] = useState(3);
  const [restart, setRestart] = useState({ perDose: 0, doses: 1, days: 14 });
  const [undo, setUndo] = useState<{ message: string; plan: SavedPlan | null } | null>(null);
  const [undoPaused, setUndoPaused] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const [flash, setFlash] = useState<'copied' | 'pdf' | 'pdf-failed' | null>(null);
  const [announce, setAnnounce] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const say = (msg: string) => {
    setAnnounce('');
    requestAnimationFrame(() => setAnnounce(msg));
  };
  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());
  const go = (next: View) => {
    setView(next);
    setConfirmReset(false);
    focusHeading();
  };

  /* ---------- load, save, sync ---------- */

  useEffect(() => {
    const now = formatLocalIsoDate(new Date());
    setToday(now);
    let loaded: SavedPlan | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        loaded = readSavedPlan(d.plan);
        setLog(readDoseLog(d.log));
      }
    } catch {
      // Ignore blocked or corrupt storage.
    }
    if (loaded) {
      setPlan(loaded);
      setView('today');
    } else {
      const old = draftFromOldCalculator(now);
      if (old) {
        const { fromText, ...rest } = old;
        setDraft(rest);
        setPrefilled(fromText);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const blob = JSON.stringify({ v: 1, plan, log });
      if (localStorage.getItem(STORAGE_KEY) !== blob) localStorage.setItem(STORAGE_KEY, blob);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [hydrated, plan, log]);

  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const d = JSON.parse(e.newValue);
        const next = readSavedPlan(d.plan);
        setPlan(next);
        setLog(readDoseLog(d.log));
        if (!next) {
          setView('setup');
          setStep(1);
        }
      } catch {
        // Ignore malformed writes.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

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

  useEffect(() => {
    if (!undo || undoPaused) return;
    const t = setTimeout(() => setUndo(null), 20_000);
    return () => clearTimeout(t);
  }, [undo, undoPaused]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  // Schedule: bring the relevant row into view.
  useEffect(() => {
    if (view !== 'schedule' || !scrollTo) return;
    requestAnimationFrame(() => {
      document.getElementById(`day-${scrollTo}`)?.scrollIntoView({ block: 'center' });
      setScrollTo(null);
    });
  }, [view, scrollTo]);

  /* ---------- setup ---------- */

  const perDose = draftPerDose(draft);
  const draftTotal = perDose * draft.dosesPerDay;
  const jumpTooHigh = draft.jumpOff > 0 && draft.jumpOff >= draftTotal;
  const startDate = draft.startWhen === 'tomorrow' && today ? isoPlus(today, 1) : today;
  const previewResult = useMemo(() => {
    if (!today || jumpTooHigh || perDose <= 0 || (draft.measureKind === 'tablet' && draft.tabletSize <= 0)) {
      return { days: [] as PlanDay[] };
    }
    return previewDays(
      { compound: draft.compound, perDose, dosesPerDay: draft.dosesPerDay, jumpOff: draft.jumpOff, days: draft.days, measure: draftMeasure(draft) },
      startDate,
    );
  }, [today, jumpTooHigh, perDose, draft, startDate]);
  const preview = previewResult.days;
  const roundedEnd = preview.length > 0 ? lastDoseDay(preview) : null;
  const previewFacts = useMemo(() => {
    if (preview.length === 0) return null;
    const firstDrop = preview.findIndex((d, i) => i > 0 && d.totalDaily > 0 && d.dosesPerDay < preview[i - 1].dosesPerDay);
    const max = preview[0].totalDaily || 1;
    const points = preview
      .map((d, i) => `${((i / Math.max(1, preview.length - 1)) * 316 + 2).toFixed(1)},${(86 - (d.totalDaily / max) * 78).toFixed(1)}`)
      .join(' ');
    const cut = largestCut(preview);
    const supply = preview.reduce((a, d) => a + d.totalDaily, 0);
    return { firstDrop: firstDrop > 0 ? firstDrop : null, cut, last: lastDoseDay(preview), points, supply };
  }, [preview]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const nextStep = (n: number) => {
    setStep(n);
    focusHeading();
  };

  const startTheplan = () => {
    const p = startPlan(
      { compound: draft.compound, perDose, dosesPerDay: draft.dosesPerDay, jumpOff: draft.jumpOff, days: draft.days, measure: draftMeasure(draft) },
      startDate,
    );
    if (!p) return;
    if (plan) setUndo({ message: 'New plan started. Your logged doses are kept.', plan });
    setPlan(p);
    setPrefilled('');
    go('today');
    say(plan ? 'New plan started. Undo is available.' : 'Plan started.');
  };

  /* ---------- running plan ---------- */

  const position = plan && today ? planPosition(plan, today) : null;
  const index = position?.kind === 'during' ? position.index : null;
  const todayDay: PlanDay | null = plan && index !== null ? plan.days[index] : null;
  const yesterday: PlanDay | null = plan && index !== null && index > 0 ? plan.days[index - 1] : null;
  const tomorrow: PlanDay | null = plan && index !== null ? plan.days[index + 1] ?? null : null;
  const last = plan ? lastDoseDay(plan.days) : null;
  const nextDrop =
    plan && index !== null
      ? plan.days.findIndex((d, i) => i > index && d.totalDaily > 0 && d.dosesPerDay < plan.days[i - 1].dosesPerDay)
      : -1;
  const todayLogged = todayDay ? (log[todayDay.date]?.length ?? 0) > 0 : false;
  // Holding works from today even after logging (logs are by date and still
  // count). Pace changes and restarts start tomorrow once today has logged
  // doses, so they can't change the amount under doses already taken.
  const holdPlan = plan && index !== null ? holdAt(plan, index) : null;
  const extendPlan = plan && index !== null ? extendAt(plan, index) : null;
  const canHold = !!holdPlan;
  const paceFromRaw = index !== null ? index + (todayLogged ? 1 : 0) : null;
  const changeFrom = plan && paceFromRaw !== null && paceFromRaw < plan.days.length ? paceFromRaw : null;
  const everLogged = Object.keys(log).length > 0;
  const measure: Measure = plan && view !== 'setup' ? plan.measure : draftMeasure(draft);
  const activeCompound = view === 'setup' || !plan ? draft.compound : plan.compound;

  const toggleSlot = (date: string, slot: number) =>
    setLog((prev) => {
      const cur = prev[date] ?? [];
      const nextSlots = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot].sort((a, b) => a - b);
      const next = { ...prev };
      if (nextSlots.length) next[date] = nextSlots;
      else delete next[date];
      return next;
    });

  const restartDose =
    measure.kind === 'tablet' ? restart.perDose : restart.perDose;
  const changed = useMemo(() => {
    if (!plan || !changeKind) return null;
    if (changeKind === 'hold') return holdPlan;
    if (changeKind === 'extend') return extendPlan;
    if (changeFrom === null) return null;
    if (changeKind === 'slower') return changePaceAt(plan, changeFrom, slowerBy);
    if (changeKind === 'faster') return changePaceAt(plan, changeFrom, -fasterBy);
    if (measure.kind === 'tablet' && tabletPieces(restartDose, measure.size) === null) return null;
    if (measure.kind === 'powder' && restartDose < 1) return null;
    return restartAt(plan, changeFrom, { perDose: restartDose, dosesPerDay: restart.doses }, restart.days);
  }, [plan, changeFrom, changeKind, slowerBy, fasterBy, restart, restartDose, holdPlan, extendPlan, measure]);
  const fasterOptions = [3, 5, 7].map((n) => ({ n, ok: !!(plan && changeFrom !== null && changePaceAt(plan, changeFrom, -n)) }));
  const slowerOptions = [3, 7, 14].map((n) => ({ n, ok: !!(plan && changeFrom !== null && changePaceAt(plan, changeFrom, n)) }));
  const cmpFrom = changeKind === 'hold' || changeKind === 'extend' ? index : changeFrom;
  const changedCut = changed && cmpFrom !== null ? largestCut(changed.days, cmpFrom) : null;

  const pickKind = (kind: ChangeKind) => {
    setChangeKind(kind);
    if (kind === 'slower' && !slowerOptions.find((o) => o.n === slowerBy)?.ok) {
      const first = slowerOptions.find((o) => o.ok);
      if (first) setSlowerBy(first.n);
    }
    if (kind === 'faster' && !fasterOptions.find((o) => o.n === fasterBy)?.ok) {
      const first = fasterOptions.find((o) => o.ok);
      if (first) setFasterBy(first.n);
    }
  };

  const openChange = (kind: ChangeKind | null) => {
    const first: ChangeKind | null =
      kind ??
      (slowerOptions.some((o) => o.ok) ? 'slower' : canHold ? 'hold' : extendPlan ? 'extend' : changeFrom !== null ? 'restart' : null);
    if (first) pickKind(first);
    else setChangeKind(null);
    if (todayDay && plan && index !== null) {
      const base = plan.days[changeFrom ?? index] ?? todayDay;
      setRestart({
        perDose: base.perDose || todayDay.perDose,
        doses: base.dosesPerDay || 1,
        days: Math.max(3, plan.days.length - (changeFrom ?? index)),
      });
    }
    go('change');
  };

  const applyChange = () => {
    if (!changed || !plan) return;
    setUndo({ message: 'Plan changed.', plan });
    setPlan(changed);
    setChangeKind(null);
    go('today');
    say('Plan changed. Undo is available.');
  };

  const beginReset = () => {
    setConfirmReset(true);
  };
  const confirmStartOver = () => {
    // Keep the current plan until a new one is started.
    if (plan) setDraft(draftFromPlan(plan, today));
    setStep(1);
    setConfirmReset(false);
    go('setup');
  };

  const copySchedule = async () => {
    if (!plan) return;
    const lines = plan.days.map((d, i) => {
      const dose = d.totalDaily === 0 ? 'stop day' : `${formatAmount(d.perDose)} ${UNIT} x ${d.dosesPerDay} = ${formatAmount(d.totalDaily)} ${UNIT}`;
      const hint = d.totalDaily > 0 ? ` (${measureHint(d.perDose, plan.measure, UNIT).main})` : '';
      const logged = log[d.date]?.length ? ` [logged ${log[d.date].length} of ${d.dosesPerDay}]` : '';
      return `Day ${i + 1}, ${formatWeekdayDate(d.date, 0)}: ${dose}${hint}${logged}`;
    });
    const text = `Taper schedule: ${SUBSTANCES[plan.compound].label}\n\n${lines.join('\n')}\n\nFrom the quitting7oh.org taper planner (preview). Reference, not a prescription.`;
    try {
      await navigator.clipboard.writeText(text);
      setFlash('copied');
      say('Schedule copied.');
    } catch {
      say('Copying is blocked in this browser. Try Save PDF instead.');
    }
  };

  const savePdf = async () => {
    if (!plan) return;
    try {
      const [{ plannerPdf }, { downloadPdf }] = await Promise.all([import('~/lib/planner-pdf'), import('~/lib/simple-pdf')]);
      const generatedOn = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      downloadPdf(plannerPdf(plan, log, generatedOn), `taper-schedule-${today}.pdf`);
      setFlash('pdf');
      say('PDF saved.');
    } catch {
      setFlash('pdf-failed');
      say('The PDF could not be made in this browser.');
    }
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

  const doseLine = (d: PlanDay, m: Measure = measure) =>
    d.totalDaily === 0
      ? 'Stop day'
      : m.kind === 'tablet'
        ? `${shortTablets(d.perDose, m.size)} × ${d.dosesPerDay}`
        : `${formatAmount(d.perDose)} ${UNIT} × ${d.dosesPerDay}`;
  const cfg = SUBSTANCES[activeCompound];
  const toolbar = plan && view !== 'setup' ? (
    <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center justify-start gap-x-1 text-sm">
            <button type="button" onClick={savePdf} className={`${LINK_BTN} gap-1.5 px-2`}>
              <Download className="size-4" aria-hidden="true" />
              {flash === 'pdf' ? 'Saved' : flash === 'pdf-failed' ? 'PDF failed' : 'Save PDF'}
            </button>
            <button type="button" onClick={copySchedule} className={`${LINK_BTN} gap-1.5 px-2`}>
              <Copy className="size-4" aria-hidden="true" />
              {flash === 'copied' ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={beginReset} aria-expanded={confirmReset} className={`${LINK_BTN} gap-1.5 px-2`}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Start over
            </button>
          </div>
          {confirmReset && (
            <div role="group" aria-label="Start over" className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="m-0">
                Set up a new plan? This one stays in place until you start the new one, and your logged
                doses are kept.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" onClick={confirmStartOver}>
                  Set up a new plan
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmReset(false)}>
                  Keep this plan
                </Button>
              </div>
            </div>
          )}
    </div>
  ) : null;

  return (
    <div className="not-prose my-6 tabular-nums [overflow-wrap:normal]">
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>

      {plan && view !== 'setup' && (
        <div className="mb-5 space-y-2">
          <nav aria-label="Planner" className={`${SEG_GROUP} grid-cols-3`}>
            {(
              [
                ['today', 'Today'],
                ['schedule', 'Schedule'],
                ['change', 'Change plan'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-current={view === v ? 'page' : undefined}
                onClick={() => (v === 'change' ? openChange(null) : (setScrollTo(v === 'schedule' ? today : null), go(v)))}
                className={NAV_BTN}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {saveError && plan && (
        <p role="alert" className="m-0 rounded-lg border border-border bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
          This browser isn&apos;t saving your plan, so it will be gone when you close the page. Use Save PDF to keep a copy.
        </p>
      )}

      {/* ===================== SETUP ===================== */}
      {view === 'setup' && (
        <section aria-labelledby="planner-heading" className="field-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/75 px-5 py-3">
            <p className="eyebrow m-0">Set up · Step {step} of 3</p>
            {plan && (
              <button type="button" onClick={() => go('today')} className={`${LINK_BTN} px-2 text-sm`}>
                Back to my plan
              </button>
            )}
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {prefilled && step === 1 && (
              <p className="m-0 rounded-lg bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
                We filled this in from the calculator you used before on this device. There, today was{' '}
                {prefilled}. Check each step before you start, especially how you measure.
              </p>
            )}

            {step === 1 && (
              <>
                <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
                  Compound and measuring
                </h2>
                <div>
                  <span id="compound-label" className="block text-sm font-medium">
                    Compound
                  </span>
                  <div role="group" aria-labelledby="compound-label" className={`${SEG_GROUP} mt-1.5 grid-cols-3`}>
                    {COMPOUNDS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={draft.compound === c}
                        onClick={() => setDraft((d) => ({ ...draftDefaults(c), measureKind: d.measureKind, startWhen: d.startWhen }))}
                        className={`${SEG_BTN} leading-tight`}
                      >
                        {SUBSTANCES[c].shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
                <div role="group" aria-label="How you measure" className="space-y-2">
                  <span className="block text-sm font-medium">How you measure it</span>
                  <button type="button" aria-pressed={draft.measureKind === 'tablet'} onClick={() => patch({ measureKind: 'tablet' })} className={CHOICE}>
                    <span className="block font-bold">Tablets</span>
                    <span className="block text-sm text-muted-foreground">
                      Every dose comes out as whole tablets or pieces of a tablet cut into 4.
                    </span>
                  </button>
                  <button type="button" aria-pressed={draft.measureKind === 'powder'} onClick={() => patch({ measureKind: 'powder' })} className={CHOICE}>
                    <span className="block font-bold">Powder, with a scale</span>
                    <span className="block text-sm text-muted-foreground">
                      Every dose is a weight your scale can read, in mg.
                    </span>
                  </button>
                </div>
                {draft.measureKind === 'tablet' ? (
                  <div>
                    <Label htmlFor="planner-tablet">Strength of each tablet ({UNIT})</Label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <NumberInput id="planner-tablet" inputMode="decimal" min={0} step="any" value={draft.tabletSize} onValueChange={(v) => patch({ tabletSize: v })} className="h-11 w-28 text-base font-semibold" />
                      {TABLET_PRESETS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={draft.tabletSize === t}
                          onClick={() => patch({ tabletSize: t })}
                          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-accent/60"
                        >
                          {t} {UNIT}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Check the label. Strength varies between brands and batches.</p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="planner-strength">
                      Strength on the label (%) <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <NumberInput id="planner-strength" inputMode="decimal" min={0} max={100} step="any" emptyWhenZero value={draft.strengthPct} onValueChange={(v) => patch({ strengthPct: v })} placeholder="e.g. 83" className="mt-1.5 h-11 w-28 text-base font-semibold" />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      83% means 830 mg is active in 1000 mg of powder. The plan works on what your scale reads;
                      the strength only shows how much of that is active. Use the same product throughout.
                    </p>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
                  Your dose now
                </h2>
                {draft.measureKind === 'tablet' ? (
                  <div>
                    <span id="tablets-label" className="block text-sm font-medium">
                      Tablets each time
                    </span>
                    <div role="group" aria-labelledby="tablets-label" className="mt-1.5 flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" aria-label="A quarter tablet less" onClick={() => patch({ tabletsPerDose: Math.max(0.25, draft.tabletsPerDose - 0.25) })}>
                        −
                      </Button>
                      <NumberInput
                        id="planner-tablets"
                        aria-labelledby="tablets-label"
                        inputMode="decimal"
                        min={0.25}
                        step="0.25"
                        value={draft.tabletsPerDose}
                        onValueChange={(v) => patch({ tabletsPerDose: Math.max(0.25, Math.round(v * 4) / 4) })}
                        className="h-14 flex-1 text-center font-display text-2xl font-semibold"
                      />
                      <Button type="button" variant="outline" size="icon" aria-label="A quarter tablet more" onClick={() => patch({ tabletsPerDose: draft.tabletsPerDose + 0.25 })}>
                        +
                      </Button>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {measureHint(perDose, { kind: 'tablet', size: draft.tabletSize }, UNIT).main}, {formatAmount(perDose)} {UNIT} each time.
                      Type a number like 2.5 or use − and + for quarters.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="planner-amount">Powder on your scale each time ({UNIT})</Label>
                    <p id="planner-amount-help" className="m-0 mt-1 text-xs text-muted-foreground">
                      Put your powder on the scale and enter what it reads. This is the weight of the powder, not the
                      active amount.
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" aria-label={`${niceStep(draft.powderPerDose)} ${UNIT} less`} onClick={() => patch({ powderPerDose: Math.max(1, draft.powderPerDose - niceStep(draft.powderPerDose)) })}>
                        −
                      </Button>
                      <div className="relative flex-1">
                        <NumberInput id="planner-amount" aria-describedby="planner-amount-help" inputMode="decimal" min={0} step="any" value={draft.powderPerDose} onValueChange={(v) => patch({ powderPerDose: v })} className="h-14 pr-12 text-center font-display text-2xl font-semibold" />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted-foreground" aria-hidden="true">
                          {UNIT}
                        </span>
                      </div>
                      <Button type="button" variant="outline" size="icon" aria-label={`${niceStep(draft.powderPerDose)} ${UNIT} more`} onClick={() => patch({ powderPerDose: draft.powderPerDose + niceStep(draft.powderPerDose) })}>
                        +
                      </Button>
                    </div>
                    {draft.strengthPct > 0 && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        About {formatAmount(activeAmount(draft.powderPerDose, draft.strengthPct))} {UNIT} active at {draft.strengthPct}%.
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <span id="times-label" className="block text-sm font-medium">
                    Times a day
                  </span>
                  <div role="group" aria-labelledby="times-label" className={`${SEG_GROUP} mt-1.5 grid-cols-4 sm:grid-cols-7`}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <button key={n} type="button" aria-pressed={!customFreq && draft.dosesPerDay === n} onClick={() => (setCustomFreq(false), patch({ dosesPerDay: n }))} className={SEG_BTN}>
                        {n}×
                      </button>
                    ))}
                    <button type="button" aria-pressed={customFreq || draft.dosesPerDay > 6} onClick={() => setCustomFreq(true)} className={SEG_BTN}>
                      More
                    </button>
                  </div>
                  {(customFreq || draft.dosesPerDay > 6) && (
                    <div className="mt-2 flex items-center gap-2">
                      <Label htmlFor="planner-times" className="text-xs text-muted-foreground">
                        Times a day (up to 12)
                      </Label>
                      <NumberInput id="planner-times" inputMode="numeric" min={1} max={12} step={1} integer value={draft.dosesPerDay} onValueChange={(v) => patch({ dosesPerDay: v })} className="h-10 w-20 text-sm" />
                    </div>
                  )}
                </div>
                <p className="m-0 flex justify-between rounded-lg bg-muted/55 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">That&apos;s</span>
                  <span className="font-bold">
                    {formatAmount(draftTotal)} {UNIT} a day
                  </span>
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  Already partway through a taper? Enter what you take now, then pick the days you want left.
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
                  Pace and start
                </h2>
                <div>
                  <span id="length-label" className="block text-sm font-medium">
                    Days to taper over
                  </span>
                  <div role="group" aria-labelledby="length-label" className={`${SEG_GROUP} mt-1.5 grid-cols-4 sm:grid-cols-7`}>
                    {LENGTH_PRESETS.map((n) => (
                      <button key={n} type="button" aria-pressed={draft.days === n} onClick={() => patch({ days: n })} className={SEG_BTN}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Label htmlFor="planner-days" className="text-xs text-muted-foreground">
                      Or exactly
                    </Label>
                    <NumberInput id="planner-days" inputMode="numeric" min={2} max={365} step={1} integer value={draft.days} onValueChange={(v) => patch({ days: v })} className="h-10 w-20 text-sm" />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="planner-jump">
                    Last day&apos;s total{draft.measureKind === 'powder' ? ', powder on the scale' : ''} ({UNIT})
                  </Label>
                  <NumberInput
                    id="planner-jump"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={draft.jumpOff}
                    onValueChange={(v) => patch({ jumpOff: v })}
                    aria-invalid={jumpTooHigh || undefined}
                    aria-describedby="planner-jump-help"
                    className="mt-1.5 h-11 w-32 text-base font-semibold"
                  />
                  <p id="planner-jump-help" className={`mt-1.5 text-xs ${jumpTooHigh ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {jumpTooHigh
                      ? `This needs to be below your ${formatAmount(draftTotal)} ${UNIT} a day now.`
                      : 'Your jump-off dose: the day total before you stop. Set 0 to end with a stop day.'}
                  </p>
                  {roundedEnd && draft.jumpOff > 0 && Math.abs(roundedEnd.totalDaily - draft.jumpOff) > 1e-9 && (
                    <p className="m-0 mt-1 text-xs font-semibold">
                      Rounded to what you can measure, the last day is {doseLine(roundedEnd)} ({formatAmount(roundedEnd.totalDaily)} {UNIT}).
                    </p>
                  )}
                  {draft.measureKind === 'powder' && draft.strengthPct > 0 && draft.jumpOff > 0 && (
                    <p className="m-0 mt-1 text-xs text-muted-foreground">
                      About {formatAmount(activeAmount(draft.jumpOff, draft.strengthPct))} {UNIT} active at {draft.strengthPct}%.
                    </p>
                  )}
                  {previewResult.reason === 'end-not-below-start' && (
                    <p role="alert" className="m-0 mt-2 rounded-lg border border-signal/50 bg-signal/10 px-3 py-2 text-sm">
                      Rounded to what you can measure, the last day comes out no lower than today, so there&apos;s nothing to
                      taper.{' '}
                      {draft.measureKind === 'tablet'
                        ? 'Lower the last day’s total, set it to 0 to end with a stop day, or use a lower-strength tablet.'
                        : 'Lower the last day’s total, or set it to 0 to end with a stop day.'}
                    </p>
                  )}
                </div>
                <div>
                  <span id="start-label" className="block text-sm font-medium">
                    Day 1 is
                  </span>
                  <div role="group" aria-labelledby="start-label" className={`${SEG_GROUP} mt-1.5 grid-cols-2`}>
                    <button type="button" aria-pressed={draft.startWhen === 'today'} onClick={() => patch({ startWhen: 'today' })} className={SEG_BTN}>
                      Today, {today ? formatWeekdayDate(today, 0) : ''}
                    </button>
                    <button type="button" aria-pressed={draft.startWhen === 'tomorrow'} onClick={() => patch({ startWhen: 'tomorrow' })} className={SEG_BTN}>
                      Tomorrow
                    </button>
                  </div>
                </div>

                {previewFacts && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label={`Daily total falls from ${formatAmount(preview[0].totalDaily)} to ${formatAmount(previewFacts.last.totalDaily)} ${UNIT} over ${preview.length} days`}>
                      <line x1="0" y1="86" x2="320" y2="86" stroke="hsl(var(--border))" strokeWidth="1" />
                      <polyline points={previewFacts.points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <dl className="m-0 mt-3 grid gap-1.5 text-sm">
                      <Fact k="Day 1" v={doseLine(preview[0])} />
                      {previewFacts.firstDrop !== null && <Fact k="First change in doses a day" v={`Day ${previewFacts.firstDrop + 1}: ${preview[previewFacts.firstDrop].dosesPerDay} a day`} />}
                      <Fact k="Last dose" v={`${formatWeekdayDate(previewFacts.last.date, 0)}, ${formatAmount(previewFacts.last.totalDaily)} ${UNIT} for the day`} />
                      {previewFacts.cut && <Fact k="Biggest one-day cut" v={`${Math.round(previewFacts.cut.pct * 100)}%`} />}
                      <Fact
                        k="Total needed"
                        v={
                          draft.measureKind === 'tablet'
                            ? `About ${tabletsNeeded(preview, draft.tabletSize)} tablets`
                            : previewFacts.supply >= 1000
                              ? `About ${formatAmount(Math.ceil(previewFacts.supply / 100) / 10)} g`
                              : `About ${Math.ceil(previewFacts.supply)} ${UNIT}`
                        }
                      />
                    </dl>
                    {previewFacts.cut && previewFacts.cut.pct > STEEP_CUT && (
                      <p className="m-0 mt-3 rounded-lg bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
                        On {formatWeekdayDate(previewFacts.cut.date, 0)} the day total drops {Math.round(previewFacts.cut.pct * 100)}%.
                        {draft.measureKind === 'tablet'
                          ? ' Tablet pieces get big near the end. A lower-strength tablet, or a few more days, makes it smoother.'
                          : ' A few more days makes it smoother.'}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/75 pt-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => nextStep(step - 1)}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <Button type="button" disabled={(step === 1 && draft.measureKind === 'tablet' && draft.tabletSize <= 0) || (step === 2 && perDose <= 0)} onClick={() => nextStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="button" disabled={preview.length === 0} onClick={startTheplan}>
                  {plan ? 'Replace my plan with this one' : 'Start this plan'}
                </Button>
              )}
            </div>
            {step === 3 && (
              <p className="m-0 text-xs leading-relaxed text-muted-foreground">
                Starting saves the schedule day by day. Later changes, like holding a dose or slowing down, start
                from the day you make them. Earlier days and the doses you&apos;ve logged never move.
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
              <p className="eyebrow m-0">Starts soon</p>
              <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-1.5 font-display text-2xl font-semibold outline-none">
                Day 1 is {formatWeekdayDate(plan.days[0].date, 0)}.
              </h2>
              <p className="m-0 mt-2 text-sm text-muted-foreground">
                Day 1: {doseLine(plan.days[0])}. {measureHint(plan.days[0].perDose, measure, UNIT).main}.
              </p>
            </div>
          )}

          {position?.kind === 'after' && last && (
            <div className="field-card p-5 sm:p-6">
              <p className="eyebrow m-0">Schedule complete</p>
              <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-1.5 font-display text-2xl font-semibold outline-none">
                Your last scheduled dose was {formatWeekdayDate(last.date, 0)}.
              </h2>
              <p className="m-0 mt-2 text-sm text-muted-foreground">
                You logged doses on {plan.days.filter((d) => (log[d.date]?.length ?? 0) > 0).length} of {plan.days.length} days.
              </p>
              <p className="m-0 mt-3 text-sm">
                The weeks after a taper bring their own symptoms. The{' '}
                <a href="/post-acute" className="font-medium text-primary underline decoration-primary/40 underline-offset-2">
                  post-acute guides
                </a>{' '}
                cover what to expect and what helps.
              </p>
            </div>
          )}

          {todayDay && index !== null && (
            <div className="field-card overflow-hidden">
              <div className="p-5 sm:p-6">
                <p className="eyebrow m-0">
                  Today · {formatWeekdayDate(todayDay.date, 0)} · Day {index + 1} of {plan.days.length}
                </p>
                <p className="m-0 mt-1 text-xs text-muted-foreground">
                  {SUBSTANCES[plan.compound].shortLabel} ·{' '}
                  {plan.measure.kind === 'tablet' ? `${plan.measure.size} ${UNIT} tablets` : 'powder on a scale'}
                </p>
                {todayDay.totalDaily === 0 ? (
                  <>
                    <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-2 font-display text-4xl font-semibold outline-none">
                      Stop day. No dose.
                    </h2>
                    <p className="m-0 mt-2 text-sm text-muted-foreground">
                      If today is too hard, you can stay on yesterday&apos;s dose and stop a day later.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 mt-2 font-display text-3xl font-semibold tracking-tight outline-none sm:text-5xl">
                      {measure.kind === 'tablet' ? measureHint(todayDay.perDose, measure, UNIT).main : `${formatAmount(todayDay.perDose)} ${UNIT}`}{' '}
                      <span className="block font-sans text-xl font-semibold text-muted-foreground sm:inline sm:text-2xl">
                        × {todayDay.dosesPerDay} {plural(todayDay.dosesPerDay, 'dose')}
                      </span>
                    </h2>
                    <p className="m-0 mt-2 text-base">{measureHint(todayDay.perDose, measure, UNIT).how}</p>
                    <p className="m-0 mt-1 text-sm text-muted-foreground">
                      {formatAmount(todayDay.totalDaily)} {UNIT} for the day
                    </p>
                    {yesterday && yesterday.totalDaily > 0 && yesterday.dosesPerDay > todayDay.dosesPerDay && (
                      <p className="m-0 mt-3 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
                        From today: {todayDay.dosesPerDay} {plural(todayDay.dosesPerDay, 'dose')} a day instead of {yesterday.dosesPerDay}.
                        {todayDay.perDose > yesterday.perDose ? ' Each dose is larger, and the' : ' The'} day&apos;s total{' '}
                        {todayDay.totalDaily < yesterday.totalDaily
                          ? `goes from ${formatAmount(yesterday.totalDaily)} to ${formatAmount(todayDay.totalDaily)} ${UNIT}.`
                          : `stays at ${formatAmount(todayDay.totalDaily)} ${UNIT}.`}
                      </p>
                    )}
                    <DoseChecks day={todayDay} log={log} onToggle={toggleSlot} label="Doses taken today" />
                  </>
                )}
              </div>
              <div className="grid gap-2 border-t border-border/75 bg-muted/30 p-4 sm:grid-cols-2 sm:p-5">
                {canHold ? (
                  <Button type="button" variant="outline" onClick={() => openChange('hold')}>
                    Stay on yesterday’s dose
                  </Button>
                ) : (
                  <Button type="button" variant="outline" disabled={!extendPlan} onClick={() => openChange('extend')}>
                    One more day at this dose
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => openChange(null)}>
                  Change the plan
                </Button>
              </div>
            </div>
          )}

          {todayDay && index !== null && (
            <div className="field-card p-5">
              <h3 className="m-0 text-sm font-bold text-muted-foreground">Coming up</h3>
              <dl className="m-0 mt-2 grid gap-1.5 text-sm">
                {tomorrow && <Fact k="Tomorrow" v={doseLine(tomorrow)} />}
                {nextDrop > 0 && <Fact k={formatWeekdayDate(plan.days[nextDrop].date, 0)} v={`Down to ${plan.days[nextDrop].dosesPerDay} ${plural(plan.days[nextDrop].dosesPerDay, 'dose')} a day`} />}
                {last && <Fact k="Last dose" v={`${formatWeekdayDate(last.date, 0)}, ${formatAmount(last.totalDaily)} ${UNIT}`} />}
              </dl>
              {everLogged && yesterday && yesterday.totalDaily > 0 && (log[yesterday.date]?.length ?? 0) < yesterday.dosesPerDay && (
                <p className="m-0 mt-3 text-sm text-muted-foreground">
                  Yesterday: {log[yesterday.date]?.length ?? 0} of {yesterday.dosesPerDay} doses logged.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(yesterday.date);
                      setScrollTo(yesterday.date);
                      go('schedule');
                    }}
                    className={LINK_BTN}
                  >
                    Log yesterday
                  </button>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ===================== CHANGE ===================== */}
      {plan && view === 'change' && (
        <section aria-labelledby="planner-heading" className="field-card p-5 sm:p-6">
          <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-3xl font-semibold tracking-tight outline-none">
            Change the plan
          </h2>
          {index === null || !todayDay ? (
            <p className="m-0 mt-3 text-sm">
              {position?.kind === 'before'
                ? 'This plan hasn’t started yet. To change it, use Start over and set it up again.'
                : 'This plan has ended. Use Start over to set up a new one.'}
            </p>
          ) : (
            <>
              <p className="m-0 mt-1.5 text-sm text-muted-foreground">
                {changeFrom === null
                  ? 'Today is the last day of the plan.'
                  : todayLogged
                    ? `You've logged doses today, so a new pace or a new amount starts tomorrow, ${formatWeekdayDate(plan.days[changeFrom].date, 0)}.`
                    : 'Changes start today.'}{' '}
                Earlier days and the doses you&apos;ve logged stay as they are.
              </p>
              <div role="group" aria-label="Kind of change" className="mt-4 space-y-2">
                {canHold && (
                  <button type="button" aria-pressed={changeKind === 'hold'} onClick={() => pickKind('hold')} className={CHOICE}>
                    <span className="block font-bold">Stay on yesterday&apos;s dose today</span>
                    <span className="block text-sm text-muted-foreground">
                      Take {doseLine(plan.days[index - 1])} today, then carry on with the plan a day later.
                    </span>
                  </button>
                )}
                <button type="button" aria-pressed={changeKind === 'extend'} disabled={!extendPlan} onClick={() => pickKind('extend')} className={CHOICE}>
                  <span className="block font-bold">One more day at today&apos;s dose</span>
                  <span className="block text-sm text-muted-foreground">
                    {extendPlan
                      ? `Take ${doseLine(todayDay)} tomorrow too, then carry on a day later.`
                      : 'There’s no dose today to repeat.'}
                  </span>
                </button>
                <button type="button" aria-pressed={changeKind === 'slower'} disabled={!slowerOptions.some((o) => o.ok)} onClick={() => pickKind('slower')} className={CHOICE}>
                  <span className="block font-bold">Slow down</span>
                  <span className="block text-sm text-muted-foreground">Spread the rest over more days, ending at the same dose.</span>
                </button>
                {changeKind === 'slower' && <DayCountPicker sign="+" value={slowerBy} options={slowerOptions} onChange={setSlowerBy} />}
                <button type="button" aria-pressed={changeKind === 'faster'} disabled={!fasterOptions.some((o) => o.ok)} onClick={() => pickKind('faster')} className={CHOICE}>
                  <span className="block font-bold">Speed up</span>
                  <span className="block text-sm text-muted-foreground">Finish sooner, ending at the same dose.</span>
                </button>
                {changeKind === 'faster' && <DayCountPicker sign="−" value={fasterBy} options={fasterOptions} onChange={setFasterBy} />}
                <button type="button" aria-pressed={changeKind === 'restart'} disabled={changeFrom === null} onClick={() => pickKind('restart')} className={CHOICE}>
                  <span className="block font-bold">I&apos;m taking a different amount</span>
                  <span className="block text-sm text-muted-foreground">Restart the rest of the plan from what you take now.</span>
                </button>
                {changeKind === 'restart' && (
                  <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-3">
                    {measure.kind === 'tablet' ? (
                      <div>
                        <Label htmlFor="restart-dose" className="text-xs">
                          Tablets each time
                        </Label>
                        <NumberInput
                          id="restart-dose"
                          inputMode="decimal"
                          min={0.25}
                          step="0.25"
                          value={Math.round((restart.perDose / measure.size) * 4) / 4}
                          onValueChange={(v) => setRestart((r) => ({ ...r, perDose: Math.max(0.25, Math.round(v * 4) / 4) * measure.size }))}
                          className="mt-1 h-11 text-base"
                        />
                        <p className="m-0 mt-1 text-xs text-muted-foreground">
                          {measureHint(restart.perDose, measure, UNIT).main}, {formatAmount(restart.perDose)} {UNIT}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="restart-dose" className="text-xs">
                          Powder on your scale each time ({UNIT})
                        </Label>
                        <NumberInput id="restart-dose" inputMode="decimal" min={1} step="any" value={restart.perDose} onValueChange={(v) => setRestart((r) => ({ ...r, perDose: v }))} className="mt-1 h-11 text-base" />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="restart-times" className="text-xs">
                        Times a day
                      </Label>
                      <NumberInput id="restart-times" inputMode="numeric" min={1} max={12} step={1} integer value={restart.doses} onValueChange={(v) => setRestart((r) => ({ ...r, doses: v }))} className="mt-1 h-11 text-base" />
                    </div>
                    <div>
                      <Label htmlFor="restart-days" className="text-xs">
                        Days left
                      </Label>
                      <NumberInput id="restart-days" inputMode="numeric" min={3} max={365} step={1} integer value={restart.days} onValueChange={(v) => setRestart((r) => ({ ...r, days: v }))} className="mt-1 h-11 text-base" />
                    </div>
                  </div>
                )}
              </div>

              {changed && cmpFrom !== null && (
                <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="m-0 text-sm font-bold text-muted-foreground">Before and after</h3>
                  <table className="mt-2 w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th scope="col" className="pb-1 font-semibold">
                          <span className="sr-only">Day</span>
                        </th>
                        <th scope="col" className="pb-1 font-semibold">
                          Now
                        </th>
                        <th scope="col" className="pb-1 text-right font-semibold">
                          After
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 1, 2].map((k) => {
                        const i = cmpFrom + k;
                        const before = plan.days[i];
                        const after = changed.days[i];
                        if (!before && !after) return null;
                        return (
                          <CompareRow
                            key={k}
                            k={formatWeekdayDate((after ?? before).date, 0)}
                            before={before ? doseLine(before) : 'Done'}
                            after={after ? doseLine(after) : 'Done'}
                          />
                        );
                      })}
                      <CompareRow k="Days left" before={String(plan.days.length - index)} after={String(changed.days.length - index)} />
                      <CompareRow k="Last dose" before={last ? formatWeekdayDate(last.date, 0) : ''} after={formatWeekdayDate(lastDoseDay(changed.days).date, 0)} />
                    </tbody>
                  </table>
                  {changedCut && changedCut.pct > STEEP_CUT && (
                    <p className="m-0 mt-3 rounded-lg bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
                      On {formatWeekdayDate(changedCut.date, 0)} the day total would drop {Math.round(changedCut.pct * 100)}%.{' '}
                      {changeKind === 'faster'
                        ? 'Taking fewer days off keeps the steps smaller.'
                        : changeKind === 'restart'
                          ? 'More days left keeps the steps smaller.'
                          : measure.kind === 'tablet'
                            ? 'Tablet pieces get big near the end; a lower-strength tablet makes the last steps smaller.'
                            : 'Adding more days keeps the steps smaller.'}
                    </p>
                  )}
                  <Button type="button" className="mt-4 w-full sm:w-auto" onClick={applyChange}>
                    Make this change
                  </Button>
                </div>
              )}
              {changeKind === 'restart' && !changed && (
                <p className="m-0 mt-4 text-sm text-muted-foreground">
                  {measure.kind === 'powder' ? 'Enter at least 1 mg per dose.' : 'Enter how many tablets you take each time.'}
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* ===================== SCHEDULE ===================== */}
      {plan && view === 'schedule' && (
        <section aria-labelledby="planner-heading" className="field-card overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/75 px-5 py-4">
            <h2 id="planner-heading" ref={headingRef} tabIndex={-1} className="m-0 font-display text-2xl font-semibold outline-none">
              Schedule
            </h2>
            <span className="text-sm text-muted-foreground">
              {SUBSTANCES[plan.compound].shortLabel} · {plan.days.length} days
              {plan.measure.kind === 'tablet' ? ` · about ${tabletsNeeded(plan.days, plan.measure.size)} tablets` : ''}
            </span>
          </div>
          <ul className="m-0 list-none p-0 pb-16">
            {plan.days.map((d, i) => {
              const changes = plan.changes.filter((c) => c.kind !== 'start' && c.from === d.date);
              const logged = log[d.date]?.length ?? 0;
              const isToday = d.date === today;
              const loggable = d.totalDaily > 0 && (index !== null ? i <= index : position?.kind === 'after');
              const prev = plan.days[i - 1];
              const drop = prev && prev.totalDaily > 0 && d.totalDaily > 0 && prev.dosesPerDay > d.dosesPerDay;
              const open = expanded === d.date;
              return (
                <li key={d.date} id={`day-${d.date}`} className="scroll-mt-24">
                  {changes.map((c, ci) => (
                    <p key={`${c.kind}-${c.from}-${ci}`} className="m-0 bg-accent/60 px-5 py-2 text-xs font-semibold text-accent-foreground">
                      {changeText(c)}
                    </p>
                  ))}
                  {drop && (
                    <p className="m-0 bg-muted/50 px-5 py-1.5 text-xs font-semibold text-muted-foreground">
                      From here: {d.dosesPerDay} {plural(d.dosesPerDay, 'dose')} a day
                    </p>
                  )}
                  <div className={`border-t border-border/60 ${isToday ? 'border-l-4 border-l-primary bg-accent/45' : ''}`}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-2.5">
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {isToday ? 'Today · ' : ''}Day {i + 1}
                        </span>
                        <span className="block text-xs text-muted-foreground">{formatWeekdayDate(d.date, 0)}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-semibold">
                          {d.totalDaily === 0 ? 'Stop day' : plan.measure.kind === 'tablet' ? `${shortTablets(d.perDose, plan.measure.size)} × ${d.dosesPerDay}` : doseLine(d)}
                        </span>
                        {d.totalDaily > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            {formatAmount(d.totalDaily)} {UNIT} for the day
                          </span>
                        )}
                      </span>
                    </div>
                    {loggable && (
                      <div className="px-5 pb-2.5">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={open ? `log-${d.date}` : undefined}
                          onClick={() => setExpanded(open ? null : d.date)}
                          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
                        >
                          {logged >= d.dosesPerDay ? (
                            <Check className="size-4 text-success" aria-hidden="true" />
                          ) : null}
                          {logged} of {d.dosesPerDay} doses logged
                          <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                        {open && (
                          <div id={`log-${d.date}`}>
                            <DoseChecks day={d} log={log} onToggle={toggleSlot} label={`Doses taken on ${formatWeekdayDate(d.date, 0)}`} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {toolbar}

      {undo && (
        <div
          className="fixed inset-x-4 bottom-24 z-50 flex items-center justify-between gap-3 rounded-lg border border-border bg-popover px-4 py-3 text-sm shadow-lg sm:left-auto sm:right-24 sm:w-96"
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
                setUndo(null);
                go(undo.plan ? 'today' : 'setup');
                say('Undone.');
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

      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-5 text-sm leading-relaxed">
        <p className="m-0">{cfg.note}</p>
        <p className="m-0 mt-3">
          If you also use alcohol, benzodiazepines, gabapentinoids, or other sedatives, taper with medical
          supervision. Mixing them raises overdose risk. The{' '}
          <a href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2">
            SAMHSA National Helpline
          </a>{' '}
          (1-800-662-4357) and{' '}
          <a href="https://findtreatment.gov/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2">
            findtreatment.gov
          </a>{' '}
          can help you find care. Plans and logged doses stay in this browser; Save PDF keeps a copy.
        </p>
      </div>
    </div>
  );
}

function DoseChecks({
  day,
  log,
  onToggle,
  label,
}: {
  day: PlanDay;
  log: DoseLog;
  onToggle: (date: string, slot: number) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="mt-3 flex flex-wrap gap-2">
      {Array.from({ length: day.dosesPerDay }, (_, i) => {
        const on = (log[day.date] ?? []).includes(i);
        return (
          <button
            key={i}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onToggle(day.date, i)}
            className={`inline-flex min-h-12 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
              on ? 'border-success/70 bg-success/12' : 'border-muted-foreground/60 bg-background hover:border-primary'
            }`}
          >
            <span aria-hidden="true" className={`inline-flex size-5 items-center justify-center rounded-full border ${on ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/70'}`}>
              {on && <Check className="size-3 stroke-[3]" />}
            </span>
            Dose {i + 1}
          </button>
        );
      })}
    </div>
  );
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
  const same = before === after;
  return (
    <tr>
      <th scope="row" className="py-1 pr-3 text-left font-normal text-muted-foreground">
        {k}
      </th>
      <td className={`py-1 pr-3 text-muted-foreground ${same ? '' : 'line-through'}`}>{same ? 'No change' : before}</td>
      <td className="py-1 text-right font-bold">{after}</td>
    </tr>
  );
}

function DayCountPicker({
  sign,
  value,
  options,
  onChange,
}: {
  sign: '+' | '−';
  value: number;
  options: { n: number; ok: boolean }[];
  onChange: (n: number) => void;
}) {
  return (
    <div role="group" aria-label={sign === '+' ? 'Days to add' : 'Days to take off'} className={`${SEG_GROUP} grid-cols-3`}>
      {options.map(({ n, ok }) => (
        <button key={n} type="button" aria-pressed={value === n} disabled={!ok} onClick={() => onChange(n)} className={SEG_BTN}>
          {sign}
          {n} {plural(n, 'day')}
        </button>
      ))}
    </div>
  );
}
