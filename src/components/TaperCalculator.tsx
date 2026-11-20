import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  HelpCircle,
  Printer,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Input } from '~/components/ui/input';
import { NumberInput } from '~/components/ui/number-input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
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
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '~/components/ui/chart';
import {
  SUBSTANCES,
  buildPhases,
  buildWeeks,
  bupeStripEquivalents,
  bupeStripShortLabel,
  daysBetweenIso,
  daysFromPct,
  effectiveJumpOffFor,
  formatLocalIsoDate,
  formatShortDate,
  formatWeekdayDate,
  generateSchedule,
  legacyDifficultyToDays,
  paceLabel,
  pctFromDuration,
  publishedBupeDurations,
  bupeSmallStripFromDay,
  exactProduct,
  round2,
  sourceLabel,
  tabletEquivalents,
  tabletShortLabel,
  type LegacyDifficulty,
  type ScheduleResult,
  type ScheduleStep,
  type SubstanceConfig,
  type SubstanceKey,
} from '~/lib/taper-schedule';

/* ─── localStorage persistence ─── */
const LEGACY_STORAGE_KEY = 'taper-calculator-v1';
const STORAGE_KEY = 'taper-calculator-v2';
const STORAGE_VERSION = 2;

type BreakdownView = 'weeks' | 'table';
/** Checked dose slots per schedule day. */
type DayChecks = Record<number, number[]>;
/** Checkmarks keyed by a hash of the schedule they were made on. */
type ChecksByPlan = Record<string, DayChecks>;
const EMPTY_DAY_CHECKS: DayChecks = {};

/** Everything Reset, Clear and Re-plan can undo. */
interface Snapshot {
  substance: SubstanceKey;
  perDose: number;
  dosesPerDay: number;
  showCustomFreq: boolean;
  jumpOff: number;
  tabletSize: number;
  showCustomTablet: boolean;
  durationDays: number;
  startDate: string;
  checksByPlan: ChecksByPlan;
  bupeMode: 'published' | 'custom';
  edited: boolean;
  activeDay: number;
}
const MAX_SAVED_PLANS = 4;

/* Shared segmented-control styling (matches the compound switcher). */
const SEG_GROUP = 'grid gap-1 rounded-lg border border-border bg-muted/65 p-1';
const SEG_BTN =
  'inline-flex min-h-11 items-center justify-center rounded-md px-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs aria-pressed:ring-1 aria-pressed:ring-border';

/** Display a dose without float noise or 1-decimal rounding (42.75, not 42.8). */
function exact(x: number): number {
  return exactProduct(x, 1);
}

/** Range, "< ¼", "+ loose powder", or volumetric labels need the mg spelled out. */
function measureNeedsDetail(short: string): boolean {
  return /–|<|\+|Volumetric/.test(short);
}

/** "¾ tab per dose", or "measure volumetrically" for Volumetric. */
function measurePhrase(short: string): string {
  return short === 'Volumetric' ? 'measure volumetrically' : `${short} per dose`;
}

/** A dose as shown: exact when it has a short decimal, "≈ 1.37" when the
 *  split repeats (4.1 mg over 3 doses is 1.3667 each). */
function formatDose(x: number): string {
  const e = exact(x);
  if (Math.abs(e * 1000 - Math.round(e * 1000)) <= 1e-6) return String(e);
  // Keep tiny Suboxone tail doses readable (0.0049, not "0").
  return `≈ ${e >= 1 ? round2(e) : Number(e.toPrecision(2))}`;
}

/** Which Suboxone mode an older saved plan was effectively using. */
function inferBupeMode(perDose: unknown, dosesPerDay: unknown, days: unknown): 'published' | 'custom' {
  if (typeof perDose !== 'number' || typeof dosesPerDay !== 'number' || typeof days !== 'number') {
    return 'published';
  }
  return publishedBupeDurations(perDose, dosesPerDay).includes(Math.round(days))
    ? 'published'
    : 'custom';
}

function plural(n: number, noun: string): string {
  return n === 1 ? noun : `${noun}s`;
}

function defaultViewFor(cfg: SubstanceConfig): BreakdownView {
  return cfg.defaultDurationDays > 14 ? 'weeks' : 'table';
}

function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function sanitizeChecks(raw: unknown): ChecksByPlan {
  if (!raw || typeof raw !== 'object') return {};
  const out: ChecksByPlan = {};
  for (const [plan, days] of Object.entries(raw as Record<string, unknown>)) {
    if (!days || typeof days !== 'object') continue;
    const dayOut: DayChecks = {};
    for (const [day, slots] of Object.entries(days as Record<string, unknown>)) {
      const n = Number(day);
      if (!Number.isInteger(n) || n < 1 || !Array.isArray(slots)) continue;
      const clean = slots.filter((x): x is number => Number.isInteger(x) && x >= 0);
      if (clean.length > 0) dayOut[n] = clean;
    }
    if (Object.keys(dayOut).length > 0) out[plan] = dayOut;
  }
  return out;
}

/** Supply totals: whole units once they're large, otherwise two decimals. */
function formatSupply(total: number): string {
  // Same basis as the tablet/capsule count, so "165.25 g (≈ 331 capsules)"
  // adds up.
  return String(round2(total));
}

function DayCheckbox({
  checked,
  taken = 0,
  label,
  onToggle,
  disabled = false,
}: {
  disabled?: boolean;
  checked: boolean;
  /** Doses logged on a day that isn't complete yet (shows a mixed state). */
  taken?: number;
  label: string;
  onToggle: () => void;
}) {
  const mixed = !checked && taken > 0;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked ? true : mixed ? 'mixed' : false}
      aria-label={mixed ? `${label} (${taken} ${taken === 1 ? 'dose' : 'doses'} logged)` : label}
      onClick={onToggle}
      disabled={disabled}
      className="group -m-2 inline-flex size-11 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 items-center justify-center rounded-md"
    >
      <span
        className={`inline-flex size-6 items-center justify-center rounded border text-[0.65rem] font-bold transition-colors ${
          checked
            ? 'border-success bg-success text-success-foreground'
            : mixed
              ? 'border-success bg-success/15 text-foreground'
              : 'border-muted-foreground/70 bg-card group-hover:border-primary'
        }`}
        aria-hidden="true"
      >
        {checked ? <Check className="size-3.5 stroke-[3]" /> : mixed ? taken : null}
      </span>
    </button>
  );
}

/* ───────────────────────── Hover detection ───────────────────────── */

function useHasHover(): boolean {
  const [hasHover, setHasHover] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHasHover(mql.matches);
    const handler = (e: MediaQueryListEvent) => setHasHover(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return hasHover;
}

function DoseMeasureBadge({
  hasHover,
  shortLabel,
  ariaLabel,
  detail,
}: {
  hasHover: boolean;
  shortLabel: string;
  ariaLabel: string;
  detail: string;
}) {
  const trigger = (
    <button
      type="button"
      className={`relative inline-flex min-h-7 items-center gap-1 rounded-full border border-border bg-muted/65 px-2.5 py-0.5 text-left text-xs font-semibold text-muted-foreground transition-colors after:absolute after:-inset-2 after:content-[''] hover:border-primary/60 hover:text-foreground sm:whitespace-nowrap max-sm:rounded-md print:border-0 print:bg-transparent print:px-0`}
      aria-label={ariaLabel}
    >
      <span className="print:before:content-['('] print:after:content-[')']">{shortLabel}</span>
      <HelpCircle
        className="size-3 shrink-0 opacity-70 print:hidden"
        aria-hidden="true"
      />
    </button>
  );

  if (hasHover) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm leading-snug">
          {detail}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-xs text-sm leading-snug">
        {detail}
      </PopoverContent>
    </Popover>
  );
}

/* ───────────────────────── Component ───────────────────────── */

const chartConfig = {
  totalDaily: {
    label: 'Total daily',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface TaperCalculatorProps {
  substances?: SubstanceKey[];
  storageSuffix?: string;
}

const ALL_SUBSTANCES: SubstanceKey[] = ['7oh', 'mgm', 'pseudo', 'bupe', 'leaf'];

export function TaperCalculator({
  substances = ALL_SUBSTANCES,
  storageSuffix = 'all',
}: TaperCalculatorProps = {}) {
  const storageKey = `${STORAGE_KEY}-${storageSuffix}`;
  const legacyKey = `${LEGACY_STORAGE_KEY}-${storageSuffix}`;

  const [substance, setSubstance] = useState<SubstanceKey>(substances[0]);
  const cfg = SUBSTANCES[substance];

  const [perDose, setPerDose] = useState<number>(cfg.defaultPerDose);
  const [dosesPerDay, setDosesPerDay] = useState<number>(cfg.defaultDosesPerDay);
  const [showCustomFreq, setShowCustomFreq] = useState<boolean>(false);
  const [jumpOff, setJumpOff] = useState<number>(cfg.defaultJumpOff);
  const [tabletSize, setTabletSize] = useState<number>(0);
  const [showCustomTablet, setShowCustomTablet] = useState<boolean>(false);
  const [durationDays, setDurationDays] = useState<number>(cfg.defaultDurationDays);
  const [showExactPace, setShowExactPace] = useState<boolean>(false);
  const [showMoreSettings, setShowMoreSettings] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [todayIso, setTodayIso] = useState<string>('');
  const [checksByPlan, setChecksByPlan] = useState<ChecksByPlan>({});
  const [activeDay, setActiveDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<BreakdownView>(defaultViewFor(cfg));
  const [openWeeks, setOpenWeeks] = useState<number[]>([0]);
  const [copied, setCopied] = useState<'prompt' | 'schedule' | null>(null);
  // hasSavedPlan is fixed at load time (it controls mobile ordering, which
  // must not jump while someone is typing). `edited` tracks any change.
  const [hasSavedPlan, setHasSavedPlan] = useState<boolean>(false);
  const [edited, setEdited] = useState<boolean>(false);
  const editedRef = useRef(false);
  editedRef.current = edited;
  const [hydrated, setHydrated] = useState<boolean>(false);
  const hasHover = useHasHover();
  const todayCardRef = useRef<HTMLElement>(null);
  const todayHeadingRef = useRef<HTMLHeadingElement>(null);
  const baselineInputsRef = useRef<string | null>(null);
  const [resetNonce, setResetNonce] = useState<number>(0);
  const [dayAnnouncement, setDayAnnouncement] = useState<string>('');
  // Remounts the % field on blur so it shows the cut the schedule applied
  // (whole days can't hit every percentage exactly).
  const [pctFieldKey, setPctFieldKey] = useState<number>(0);
  // Suboxone: follow a matching published table, or a custom percentage curve.
  const [bupeMode, setBupeMode] = useState<'published' | 'custom'>('published');
  // Fields whose text can't be used yet (blank or not a number).
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  // Undo for Reset, Clear checkmarks and Re-plan.
  const [undo, setUndo] = useState<{ message: string; snapshot: Snapshot } | null>(null);
  // Phones: a returning reader's settings start collapsed behind a summary.
  const [settingsOpen, setSettingsOpen] = useState<boolean>(true);
  const [showReplanHelp, setShowReplanHelp] = useState<boolean>(false);
  // Today's step before a mid-plan length change, so the card can say when
  // the change moved today's dose and offer to keep it.
  const [todayBefore, setTodayBefore] = useState<ScheduleStep | null>(null);
  const todayChecksBeforeRef = useRef<number[] | null>(null);
  const settingsSummaryRef = useRef<HTMLButtonElement>(null);
  // A plan carried over from the old calculator, recalculated with the new
  // math. Shown until the reader dismisses it or edits the plan.
  const [migratedNotice, setMigratedNotice] = useState<boolean>(false);

  // Hydrate saved inputs from localStorage (migrating v1 if present) and read
  // the local date client-side so SSR output stays deterministic.
  useEffect(() => {
    const today = formatLocalIsoDate(new Date());
    let loadedStart = today;
    let saved = false;
    try {
      const rawV2 = localStorage.getItem(storageKey);
      if (rawV2) {
        const d = JSON.parse(rawV2);
        if (d && d.v === STORAGE_VERSION) {
          const validSub =
            d.substance &&
            substances.includes(d.substance) &&
            SUBSTANCES[d.substance as SubstanceKey]
              ? (d.substance as SubstanceKey)
              : substances[0];
          const subCfg = SUBSTANCES[validSub];
          setSubstance(validSub);
          if (typeof d.perDose === 'number' && d.perDose >= 0) setPerDose(d.perDose);
          if (typeof d.dosesPerDay === 'number' && d.dosesPerDay >= 1) {
            setDosesPerDay(d.dosesPerDay);
            if (!subCfg.frequencyPresets.includes(d.dosesPerDay)) setShowCustomFreq(true);
          }
          if (typeof d.jumpOff === 'number' && d.jumpOff >= 0) setJumpOff(d.jumpOff);
          if (typeof d.tabletSize === 'number' && d.tabletSize >= 0) {
            setTabletSize(d.tabletSize);
            if (d.tabletSize > 0 && !subCfg.tabletPresets.includes(d.tabletSize)) {
              setShowCustomTablet(true);
            }
          }
          if (typeof d.durationDays === 'number' && d.durationDays >= 1) {
            setDurationDays(Math.max(2, d.durationDays));
          }
          saved = d.edited === true;
          // Restore the start date (including a deliberately blank one) only
          // for plans the reader touched. An untouched example starts today.
          if (saved && typeof d.startDate === 'string') loadedStart = d.startDate;
          setChecksByPlan(sanitizeChecks(d.checksByPlan));
          if (d.viewMode === 'weeks' || d.viewMode === 'table') setViewMode(d.viewMode);
          if (d.bupeMode === 'published' || d.bupeMode === 'custom') {
            setBupeMode(d.bupeMode);
          } else if (validSub === 'bupe') {
            setBupeMode(inferBupeMode(d.perDose, d.dosesPerDay, d.durationDays));
          }
          if (d.migratedNotice === true) setMigratedNotice(true);
        }
      } else {
        const rawV1 = localStorage.getItem(legacyKey);
        if (rawV1) {
          const d = JSON.parse(rawV1);
          if (d && d.v === 1) {
            const validSub =
              d.substance &&
              substances.includes(d.substance) &&
              SUBSTANCES[d.substance as SubstanceKey]
                ? (d.substance as SubstanceKey)
                : substances[0];
            const subCfg = SUBSTANCES[validSub];
            setSubstance(validSub);
            if (typeof d.perDose === 'number' && d.perDose >= 0) setPerDose(d.perDose);
            if (typeof d.dosesPerDay === 'number' && d.dosesPerDay >= 1) {
              setDosesPerDay(d.dosesPerDay);
              if (!subCfg.frequencyPresets.includes(d.dosesPerDay)) setShowCustomFreq(true);
            }
            if (typeof d.jumpOff === 'number' && d.jumpOff >= 0) setJumpOff(d.jumpOff);
            if (typeof d.tabletSize === 'number' && d.tabletSize >= 0) {
              setTabletSize(d.tabletSize);
              if (d.tabletSize > 0 && !subCfg.tabletPresets.includes(d.tabletSize)) {
                setShowCustomTablet(true);
              }
            }
            const migratedDays = Math.max(
              2,
              d.difficulty
                ? legacyDifficultyToDays(validSub, d.difficulty as LegacyDifficulty, d.customDays)
                : subCfg.defaultDurationDays,
            );
            setDurationDays(migratedDays);
            if (validSub === 'bupe') {
              // The old calculator used a published table only on an exact
              // match; keep other saved plans on their custom curve and length.
              setBupeMode(inferBupeMode(d.perDose, d.dosesPerDay, migratedDays));
            }
            // The old calculator saved on every visit, so only treat the record
            // as the reader's own plan if it differs from the defaults. v1 had
            // no start date; leave it blank rather than guessing "today".
            saved =
              validSub !== substances[0] ||
              d.perDose !== subCfg.defaultPerDose ||
              d.dosesPerDay !== subCfg.defaultDosesPerDay ||
              d.jumpOff !== subCfg.defaultJumpOff ||
              migratedDays !== subCfg.defaultDurationDays ||
              (typeof d.tabletSize === 'number' && d.tabletSize > 0);
            if (saved) {
              loadedStart = '';
              setMigratedNotice(true);
            }
          }
        }
      }
    } catch {
      // Ignore blocked storage or corrupt JSON.
    }
    setTodayIso(today);
    setStartDate(loadedStart);
    setHasSavedPlan(saved);
    setSettingsOpen(!saved);
    setEdited(saved);
    setHydrated(true);
  }, [legacyKey, storageKey, substances]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const blob = JSON.stringify({
        v: STORAGE_VERSION,
        substance,
        perDose,
        dosesPerDay,
        jumpOff,
        tabletSize,
        durationDays,
        startDate,
        checksByPlan,
        viewMode,
        bupeMode,
        edited,
        migratedNotice,
      });
      if (localStorage.getItem(storageKey) !== blob) localStorage.setItem(storageKey, blob);
    } catch {
      // Ignore quota / blocked storage.
    }
  }, [
    hydrated,
    storageKey,
    substance,
    perDose,
    dosesPerDay,
    jumpOff,
    tabletSize,
    durationDays,
    startDate,
    checksByPlan,
    viewMode,
    bupeMode,
    edited,
    migratedNotice,
  ]);

  // Another open tab saved: take its checkmarks, so a stale tab can't
  // overwrite doses logged elsewhere when it next saves.
  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        const d = JSON.parse(e.newValue);
        if (!d || d.v !== STORAGE_VERSION) return;
        // Take the other tab's whole saved state, so this tab can't later
        // write back stale settings or checkmarks.
        if (d.substance && substances.includes(d.substance)) setSubstance(d.substance);
        if (typeof d.perDose === 'number' && d.perDose >= 0) setPerDose(d.perDose);
        if (typeof d.dosesPerDay === 'number' && d.dosesPerDay >= 1) setDosesPerDay(d.dosesPerDay);
        if (typeof d.jumpOff === 'number' && d.jumpOff >= 0) setJumpOff(d.jumpOff);
        if (typeof d.tabletSize === 'number' && d.tabletSize >= 0) setTabletSize(d.tabletSize);
        if (typeof d.durationDays === 'number' && d.durationDays >= 1) {
          setDurationDays(Math.max(2, d.durationDays));
        }
        if (typeof d.startDate === 'string') setStartDate(d.startDate);
        if (d.bupeMode === 'published' || d.bupeMode === 'custom') setBupeMode(d.bupeMode);
        if (d.viewMode === 'weeks' || d.viewMode === 'table') setViewMode(d.viewMode);
        if (typeof d.edited === 'boolean') {
          setEdited(d.edited);
          if (!d.edited) {
            baselineInputsRef.current = null;
            setResetNonce((n) => n + 1);
          }
        }
        const incomingSub: SubstanceKey =
          d.substance && substances.includes(d.substance) ? d.substance : substance;
        if (typeof d.dosesPerDay === 'number') {
          setShowCustomFreq(!SUBSTANCES[incomingSub].frequencyPresets.includes(d.dosesPerDay));
        }
        if (typeof d.tabletSize === 'number') {
          setShowCustomTablet(
            d.tabletSize > 0 && !SUBSTANCES[incomingSub].tabletPresets.includes(d.tabletSize),
          );
        }
        const incoming = sanitizeChecks(d.checksByPlan);
        setChecksByPlan((prev) =>
          JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming,
        );
      } catch {
        // Ignore malformed writes.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, storageKey]);

  // Phones keep tabs alive for days. Re-read the local date when the page
  // becomes visible again and at the next local midnight.
  useEffect(() => {
    if (!hydrated) return;
    const refresh = () => {
      const now = formatLocalIsoDate(new Date());
      setTodayIso(now);
      // An untouched example plan always starts today.
      if (!editedRef.current) setStartDate(now);
    };
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    scheduleMidnight();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', refresh);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const totalDaily = useMemo(() => perDose * dosesPerDay, [perDose, dosesPerDay]);

  const effectiveJump = useMemo(
    () => effectiveJumpOffFor(substance, totalDaily, jumpOff),
    [substance, totalDaily, jumpOff],
  );

  // Suboxone published tables come in fixed lengths. In published mode the
  // schedule uses the table length nearest the saved duration, without
  // rewriting the saved duration (typing "20" passes through "2", whose only
  // table is 5 days).
  const publishedDurations =
    substance === 'bupe' ? publishedBupeDurations(perDose, dosesPerDay) : [];
  const usingPublished = bupeMode === 'published' && publishedDurations.length > 0;
  const scheduleDays = usingPublished
    ? publishedDurations.reduce((best, d) =>
        Math.abs(d - durationDays) < Math.abs(best - durationDays) ? d : best,
      )
    : durationDays;

  const rawResult = useMemo(
    () =>
      generateSchedule(substance, perDose, dosesPerDay, jumpOff, scheduleDays, {
        tabletSize,
        bupeMode,
      }),
    [substance, perDose, dosesPerDay, jumpOff, scheduleDays, tabletSize, bupeMode],
  );
  // Typing "15" passes through "1", which can briefly sit below the stopping
  // dose. Keep showing the last valid schedule until the input settles so the
  // layout doesn't collapse under the reader's finger.
  const rawEmpty = rawResult.steps.length === 0;
  const [emptySettled, setEmptySettled] = useState<boolean>(false);
  useEffect(() => {
    if (!rawEmpty) {
      setEmptySettled(false);
      return;
    }
    const t = setTimeout(() => setEmptySettled(true), 700);
    return () => clearTimeout(t);
  }, [rawEmpty]);
  const lastValidResultRef = useRef(rawResult);
  if (!rawEmpty) lastValidResultRef.current = rawResult;
  const result =
    rawEmpty && !emptySettled && lastValidResultRef.current.steps.length > 0
      ? lastValidResultRef.current
      : rawResult;

  const rawDailyPct = useMemo(
    () =>
      pctFromDuration(
        totalDaily,
        effectiveJump,
        // The stop day isn't part of the descent.
        jumpOff === 0 ? Math.max(2, durationDays - 1) : durationDays,
      ),
    [totalDaily, effectiveJump, durationDays, jumpOff],
  );
  // While the schedule is held mid-typing, keep its pace label too.
  const lastValidPctRef = useRef(rawDailyPct);
  if (result === rawResult) lastValidPctRef.current = rawDailyPct;
  const dailyPct = result === rawResult ? rawDailyPct : lastValidPctRef.current;

  const phases = useMemo(() => buildPhases(result.steps), [result.steps]);
  const weeks = useMemo(() => buildWeeks(result.steps), [result.steps]);
  const transitionDays = useMemo(() => {
    const list: { day: number; freq: number }[] = [];
    for (let i = 1; i < result.steps.length; i++) {
      const cur = result.steps[i];
      const prev = result.steps[i - 1];
      if (cur.totalDaily > 0 && prev.totalDaily > 0 && cur.dosesPerDay !== prev.dosesPerDay) {
        list.push({ day: cur.day, freq: cur.dosesPerDay });
      }
    }
    return list;
  }, [result.steps]);

  const totalSteps = result.steps.length;

  // Checkmarks belong to the exact schedule they were made on. Changing the
  // plan shows a clean slate; changing it back brings the old ticks back.
  const planKey = useMemo(
    () =>
      hashString(
        `${substance}|${result.steps.map((s) => `${s.perDose}x${s.dosesPerDay}`).join(',')}`,
      ),
    [substance, result.steps],
  );
  const doseChecks = checksByPlan[planKey] ?? EMPTY_DAY_CHECKS;

  // After a re-plan, put today's already-logged doses on the new day 1.
  const carryTodayRef = useRef<number[] | null>(null);
  useEffect(() => {
    const carry = carryTodayRef.current;
    if (!carry || carry.length === 0) return;
    carryTodayRef.current = null;
    setChecksByPlan((prev) => ({
      ...prev,
      [planKey]: { ...(prev[planKey] ?? {}), 1: carry },
    }));
  }, [planKey]);

  // Any change to the plan inputs (tablet size included) after load marks the
  // plan as the reader's own. Reset re-baselines through resetNonce.
  const inputsSig = `${substance}|${perDose}|${dosesPerDay}|${jumpOff}|${durationDays}|${tabletSize}|${bupeMode}`;
  useEffect(() => {
    if (!hydrated) return;
    if (baselineInputsRef.current === null) {
      baselineInputsRef.current = inputsSig;
      return;
    }
    if (inputsSig !== baselineInputsRef.current) {
      setEdited(true);
      setMigratedNotice(false);
    }
  }, [hydrated, inputsSig, resetNonce]);

  const calendarDay = useMemo(() => {
    if (!startDate || !todayIso) return null;
    const diff = daysBetweenIso(startDate, todayIso);
    return diff === null ? null : diff + 1;
  }, [startDate, todayIso]);

  const clampDay = (day: number) => Math.min(Math.max(1, day), Math.max(1, totalSteps));

  const selectDay = (day: number, opts: { reveal?: boolean } = {}) => {
    const bounded = clampDay(day);
    setActiveDay(bounded);
    const weekIdx = Math.floor((bounded - 1) / 7);
    setOpenWeeks((prev) => (prev.includes(weekIdx) ? prev : [...prev, weekIdx]));
    if (opts.reveal) {
      requestAnimationFrame(() => {
        const card = todayCardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        if (rect.top < 64 || rect.top > window.innerHeight - 160) {
          const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          card.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
        }
        todayHeadingRef.current?.focus({ preventScroll: true });
      });
    }
  };

  // Announce the selected day in a polite live region (focus stays put).
  const announceDay = (day: number) => {
    const step = result.steps[day - 1];
    if (!step) return;
    const date = startDate ? `, ${formatWeekdayDate(startDate, day - 1)}` : '';
    setDayAnnouncement(
      step.totalDaily === 0
        ? `Day ${day}${date}: stop day`
        : `Day ${day}${date}: ${formatDose(step.perDose)} ${cfg.unit}, ${step.dosesPerDay} ${
            step.dosesPerDay === 1 ? 'dose' : 'doses'
          }`,
    );
  };

  // Previous / Next keep focus on the button and announce the new day.
  const stepDay = (delta: number) => {
    const next = clampDay(activeDay + delta);
    if (next === activeDay) return;
    selectDay(next);
    announceDay(next);
  };

  // Schedule rows select the day without scrolling, and say so.
  const pickRowDay = (day: number) => {
    selectDay(day);
    announceDay(day);
  };

  // Follow the calendar when the page loads, the date rolls over, or the
  // start date changes. Plan edits only clamp, so a reader looking at another
  // day stays there while adjusting the duration.
  const calendarSyncedRef = useRef(false);
  const skipCalendarSyncRef = useRef(false);
  useEffect(() => {
    if (!hydrated || calendarDay === null) return;
    if (skipCalendarSyncRef.current) {
      skipCalendarSyncRef.current = false;
      return;
    }
    if (!calendarSyncedRef.current) {
      // First sync: open only today's week, not week 1 as well.
      calendarSyncedRef.current = true;
      setOpenWeeks([Math.floor((clampDay(calendarDay) - 1) / 7)]);
    }
    selectDay(calendarDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, calendarDay]);

  // With no start date, open on the first day that isn't checked off.
  const openedOnFirstUndoneRef = useRef(false);
  useEffect(() => {
    if (!hydrated || openedOnFirstUndoneRef.current || totalSteps === 0) return;
    openedOnFirstUndoneRef.current = true;
    if (startDate) return;
    const first = result.steps.find((st) => !isDayDone(st));
    if (first) selectDay(first.day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, totalSteps]);

  useEffect(() => {
    if (totalSteps === 0) return;
    setActiveDay((prev) => clampDay(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSteps]);

  const handleSubstanceChange = (next: SubstanceKey) => {
    if (next === substance) return;
    const nextCfg = SUBSTANCES[next];
    if (edited) offerUndo(`Switched to ${nextCfg.shortLabel}.`, takeSnapshot());
    // A new compound starts as a fresh example plan with its own calendar.
    baselineInputsRef.current = null;
    setResetNonce((n) => n + 1);
    setEdited(false);
    setTodayBefore(null);
    setStartDate(todayIso || formatLocalIsoDate(new Date()));
    setBupeMode('published');
    setSubstance(next);
    setPerDose(nextCfg.defaultPerDose);
    setDosesPerDay(nextCfg.defaultDosesPerDay);
    setShowCustomFreq(false);
    setJumpOff(nextCfg.defaultJumpOff);
    setTabletSize(0);
    setShowCustomTablet(false);
    setDurationDays(nextCfg.defaultDurationDays);
    setViewMode(defaultViewFor(nextCfg));
  };

  const takeSnapshot = (): Snapshot => ({
    substance,
    perDose,
    dosesPerDay,
    showCustomFreq,
    jumpOff,
    tabletSize,
    showCustomTablet,
    durationDays,
    startDate,
    checksByPlan,
    bupeMode,
    edited,
    activeDay,
  });

  const restoreSnapshot = (snap: Snapshot) => {
    setTodayBefore(null);
    skipCalendarSyncRef.current = snap.startDate !== startDate;
    baselineInputsRef.current = null;
    setResetNonce((n) => n + 1);
    setSubstance(snap.substance);
    setPerDose(snap.perDose);
    setDosesPerDay(snap.dosesPerDay);
    setShowCustomFreq(snap.showCustomFreq);
    setJumpOff(snap.jumpOff);
    setTabletSize(snap.tabletSize);
    setShowCustomTablet(snap.showCustomTablet);
    setDurationDays(snap.durationDays);
    setStartDate(snap.startDate);
    setChecksByPlan(snap.checksByPlan);
    setBupeMode(snap.bupeMode);
    setEdited(snap.edited);
    setActiveDay(snap.activeDay);
    setOpenWeeks((prev) => {
      const w = Math.floor((snap.activeDay - 1) / 7);
      return prev.includes(w) ? prev : [...prev, w];
    });
  };

  const offerUndo = (message: string, snapshot: Snapshot) => setUndo({ message, snapshot });

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 10_000);
    return () => clearTimeout(t);
  }, [undo]);

  const handleResetAll = () => {
    setTodayBefore(null);
    offerUndo('Settings reset to the defaults.', takeSnapshot());
    try {
      // Keep the current entry (it holds checkmarks); the save effect writes
      // the reset settings into it. Only the retired v1 key is dropped.
      localStorage.removeItem(legacyKey);
    } catch {}
    const first = substances[0];
    const firstCfg = SUBSTANCES[first];
    baselineInputsRef.current = null;
    setResetNonce((n) => n + 1);
    setSubstance(first);
    setPerDose(firstCfg.defaultPerDose);
    setDosesPerDay(firstCfg.defaultDosesPerDay);
    setShowCustomFreq(false);
    setJumpOff(firstCfg.defaultJumpOff);
    setTabletSize(0);
    setShowCustomTablet(false);
    setDurationDays(firstCfg.defaultDurationDays);
    setShowExactPace(false);
    setShowMoreSettings(false);
    setStartDate(todayIso || formatLocalIsoDate(new Date()));
    setActiveDay(1);
    setOpenWeeks([0]);
    setViewMode(defaultViewFor(firstCfg));
    setBupeMode('published');
    setEdited(false);
  };

  // Restart the schedule today from the dose on the selected day. This is how
  // a reader holds a dose or slows down mid-taper without the calendar or a
  // longer duration changing today's dose underneath them. The old plan's
  // checkmarks stay saved under the old plan.
  const replanFromActiveDay = () => {
    if (!activeStep || activeStep.totalDaily <= 0) return;
    offerUndo(
      `Plan restarted today at ${formatDose(activeStep.perDose)} ${cfg.unit} × ${activeStep.dosesPerDay}.`,
      takeSnapshot(),
    );
    setTodayBefore(null);
    const remaining = Math.max(2, totalSteps - activeStep.day + 1);
    // Doses already logged today carry over to day 1 of the new plan.
    if (calendarDay === activeStep.day) {
      carryTodayRef.current = doseChecks[activeStep.day] ?? null;
    }
    setPerDose(activeStep.perDose);
    setDosesPerDay(activeStep.dosesPerDay);
    setShowCustomFreq(!cfg.frequencyPresets.includes(activeStep.dosesPerDay));
    setDurationDays(remaining);
    if (substance === 'bupe') setBupeMode('custom');
    setStartDate(todayIso || formatLocalIsoDate(new Date()));
    setEdited(true);
    selectDay(1, { reveal: true });
  };

  // On a plan already underway, a new length re-spreads the whole plan from
  // its start date, which can move today's dose. Remember today's step first.
  const changeDuration = (days: number) => {
    if (todayInRange && calendarDay !== null && calendarDay > 1 && !todayBefore) {
      const step = result.steps[calendarDay - 1];
      if (step) {
        setTodayBefore(step);
        todayChecksBeforeRef.current = doseChecks[calendarDay] ?? null;
      }
    }
    setDurationDays(days);
  };

  // Keep today's dose: restart from today at the dose today had before the
  // length change, over what's left of the new length.
  const keepTodayDose = () => {
    if (!todayBefore) return;
    const base = todayBefore;
    offerUndo(
      `Kept today at ${formatDose(base.perDose)} ${cfg.unit} × ${base.dosesPerDay}.`,
      takeSnapshot(),
    );
    // The checks were captured before the length change moved the plan key.
    carryTodayRef.current = todayChecksBeforeRef.current;
    todayChecksBeforeRef.current = null;
    setPerDose(base.perDose);
    setDosesPerDay(base.dosesPerDay);
    setShowCustomFreq(!cfg.frequencyPresets.includes(base.dosesPerDay));
    setDurationDays(Math.max(2, totalSteps - base.day + 1));
    if (substance === 'bupe') setBupeMode('custom');
    setStartDate(todayIso || formatLocalIsoDate(new Date()));
    setEdited(true);
    setTodayBefore(null);
    selectDay(1);
  };

  // The notice is about a length change; any other plan edit retires it.
  const nonDurationSig = `${substance}|${perDose}|${dosesPerDay}|${jumpOff}|${tabletSize}|${startDate}|${bupeMode}`;
  const lastNonDurationSigRef = useRef(nonDurationSig);
  useEffect(() => {
    if (lastNonDurationSigRef.current === nonDurationSig) return;
    lastNonDurationSigRef.current = nonDurationSig;
    setTodayBefore(null);
    todayChecksBeforeRef.current = null;
  }, [nonDurationSig]);

  const handleCustomPctChange = (newPct: number) => {
    // Leaving the field without editing hands back the displayed (rounded)
    // cut; that must not nudge the duration.
    if (Math.abs(newPct - dailyPct) < 1e-9) return;
    const nextDays = daysFromPct(totalDaily, effectiveJump, newPct);
    if (nextDays !== null) {
      // With a stop day, the descent runs one day shorter than the plan.
      changeDuration(jumpOff === 0 ? Math.min(365, nextDays + 1) : nextDays);
    }
  };

  const slotsFor = (s: ScheduleStep) => (s.totalDaily > 0 ? Math.max(1, s.dosesPerDay) : 1);
  const isDayDone = (s: ScheduleStep) => (doseChecks[s.day]?.length ?? 0) >= slotsFor(s);

  const updateChecks = (fn: (cur: DayChecks) => DayChecks) => {
    setEdited(true);
    setChecksByPlan((prev) => {
      const nextCur = fn(prev[planKey] ?? {});
      const others = Object.entries(prev).filter(([k]) => k !== planKey);
      const entries = [...others, [planKey, nextCur] as [string, DayChecks]]
        .filter(([, v]) => Object.keys(v).length > 0)
        .slice(-MAX_SAVED_PLANS);
      return Object.fromEntries(entries);
    });
  };

  const toggleDayDone = (s: ScheduleStep) =>
    updateChecks((cur) => {
      const next = { ...cur };
      if ((cur[s.day]?.length ?? 0) >= slotsFor(s)) delete next[s.day];
      else next[s.day] = Array.from({ length: slotsFor(s) }, (_, i) => i);
      return next;
    });

  const toggleDoseSlot = (day: number, slotIndex: number) =>
    updateChecks((cur) => {
      const list = cur[day] ?? [];
      const nextList = list.includes(slotIndex)
        ? list.filter((i) => i !== slotIndex)
        : [...list, slotIndex].sort((a, b) => a - b);
      const next = { ...cur };
      if (nextList.length > 0) next[day] = nextList;
      else delete next[day];
      return next;
    });

  const clearChecks = () => {
    offerUndo('Checkmarks cleared for this plan.', takeSnapshot());
    updateChecks(() => ({}));
  };

  const setFieldValid = (field: string) => (valid: boolean) =>
    setInvalidFields((prev) =>
      valid ? prev.filter((f) => f !== field) : prev.includes(field) ? prev : [...prev, field],
    );

  const toggleWeekOpen = (weekIdx: number) => {
    setOpenWeeks((prev) =>
      prev.includes(weekIdx) ? prev.filter((w) => w !== weekIdx) : [...prev, weekIdx],
    );
  };

  const copyToClipboard = async (text: string, which: 'prompt' | 'schedule') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(which);
      } catch {}
      document.body.removeChild(ta);
    }
  };

  const handleCopyPrompt = () =>
    copyToClipboard(
      buildPromptText(cfg, perDose, dosesPerDay, jumpOff, tabletSize, startDate, result),
      'prompt',
    );

  const handleCopySchedule = () =>
    copyToClipboard(
      buildScheduleText(cfg, perDose, dosesPerDay, jumpOff, tabletSize, startDate, result),
      'schedule',
    );

  const handlePrint = () => {
    const html = buildPrintHTML(
      cfg,
      perDose,
      dosesPerDay,
      jumpOff,
      tabletSize,
      startDate,
      result,
    );
    const win = window.open('', '_blank');
    if (!win) {
      window.print();
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const chartData = useMemo(
    () =>
      result.steps.map((s) => ({
        day: s.day,
        totalDaily: s.totalDaily,
        perDose: s.perDose,
        dosesPerDay: s.dosesPerDay,
        dateLabel: startDate ? formatShortDate(startDate, s.day - 1) : '',
      })),
    [result.steps, startDate],
  );

  const frequencyIsCustom = showCustomFreq || !cfg.frequencyPresets.includes(dosesPerDay);
  const activeStep = result.steps[Math.min(activeDay, totalSteps) - 1] ?? null;
  const lastDoseStep = [...result.steps].reverse().find((s) => s.totalDaily > 0) ?? null;
  const lastDoseDateLabel =
    startDate && lastDoseStep ? formatShortDate(startDate, lastDoseStep.day - 1) : '';
  const totalTabletsNeeded =
    cfg.defaultTabletSize !== null && tabletSize > 0
      ? Math.ceil(result.totalMedication / tabletSize)
      : null;

  const doneCount = result.steps.filter(isDayDone).length;
  const donePct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const anyChecks = Object.keys(doseChecks).length > 0;

  const inputsPending = invalidFields.length > 0 || result !== rawResult;
  const settingsExpanded = settingsOpen || rawResult.steps.length === 0;
  const settingsSummary = [
    substances.length > 1 ? cfg.shortLabel : null,
    `${exact(perDose)} ${cfg.unit} × ${dosesPerDay} a day`,
    `${totalSteps || scheduleDays} days`,
  ]
    .filter(Boolean)
    .join(' · ');
  const settingsSubSummary = [
    startDate
      ? `${calendarDay !== null && calendarDay < 1 ? 'Starts' : 'Started'} ${formatWeekdayDate(startDate, 0)}`
      : 'No start date',
    jumpOff > 0 ? `jump-off ${exact(jumpOff)} ${cfg.unit}` : 'tapers to a stop day',
  ].join(' · ');


  const jumpOffSplitsMultiple =
    cfg.minDosesPerDay > 1 && dosesPerDay > 1 && jumpOff > 0;
  const jumpOffTooHigh =
    jumpOff > 0 && totalDaily > 0 && jumpOff >= totalDaily && emptySettled;
  const moreSettingsOpen = showMoreSettings || jumpOffTooHigh;
  const scheduleLengthDiffers = totalSteps > 0 && totalSteps !== scheduleDays;
  const sliderMin = Math.min(cfg.sliderMinDays, durationDays);
  const sliderMax = Math.max(cfg.sliderMaxDays, durationDays);
  const todayInRange = calendarDay !== null && calendarDay >= 1 && calendarDay <= totalSteps;
  const isViewingToday = todayInRange && activeDay === calendarDay;
  const hasTabletHelper = cfg.defaultTabletSize !== null;
  const tabletNoun = cfg.tabletUnitName;
  const moreSummary = [
    `Jump-off ${exact(jumpOff)} ${cfg.unit}/day`,
    hasTabletHelper
      ? tabletSize > 0
        ? `${tabletSize} ${cfg.unit} ${tabletNoun}s`
        : `no ${tabletNoun} size`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const chartSummary = useMemo(() => {
    if (totalSteps === 0) return '';
    const first = result.steps[0];
    const lastDose = [...result.steps].reverse().find((s) => s.totalDaily > 0) ?? first;
    const drops = transitionDays
      .map((t) => `${t.freq} ${plural(t.freq, 'dose')} a day from day ${t.day}`)
      .join(', ');
    return `Taper curve. Daily total falls from ${first.totalDaily} ${cfg.unit} on day 1 to ${lastDose.totalDaily} ${cfg.unit} on day ${lastDose.day}${
      drops ? `. Dosing drops to ${drops}` : ''
    }.`;
  }, [result.steps, totalSteps, transitionDays, cfg.unit]);

  const smallStripFromDay = useMemo(
    () => (substance === 'bupe' ? bupeSmallStripFromDay(result.steps) : Infinity),
    [substance, result.steps],
  );

  const measureInfo = (step: ScheduleStep): { short: string; detail: string } | null => {
    if (step.totalDaily <= 0) return null;
    if (substance === 'bupe') {
      return {
        short: bupeStripShortLabel(step.perDose, step.day >= smallStripFromDay),
        detail: bupeStripEquivalents(step.perDose),
      };
    }
    if (hasTabletHelper && tabletSize > 0) {
      const short = tabletShortLabel(step.perDose, tabletSize, cfg.tabletUnitName, cfg.unit);
      if (!short) return null;
      return {
        short,
        detail: tabletEquivalents(step.perDose, tabletSize, cfg.unit, cfg.tabletUnitName),
      };
    }
    return null;
  };

  const savedFirstOnMobile = hasSavedPlan;
  const largestCut = (() => {
    let best: { day: number; pct: number } | null = null;
    for (let i = 1; i < result.steps.length; i++) {
      const cur = result.steps[i];
      const prev = result.steps[i - 1];
      if (cur.totalDaily <= 0 || prev.totalDaily <= 0) continue;
      const pct = (1 - cur.totalDaily / prev.totalDaily) * 100;
      if (!best || pct > best.pct) best = { day: cur.day, pct };
    }
    return best;
  })();
  const showLargestCut =
    !!largestCut && result.source !== 'bupe-established' && largestCut.pct > dailyPct * 1.5 + 1;
  const todayNow = calendarDay !== null ? result.steps[calendarDay - 1] : undefined;
  const todayShift =
    todayBefore &&
    todayNow &&
    calendarDay === todayBefore.day &&
    (Math.abs(todayNow.perDose - todayBefore.perDose) > 1e-9 ||
      todayNow.dosesPerDay !== todayBefore.dosesPerDay)
      ? { from: todayBefore, to: todayNow }
      : null;
  const todayShiftNotice = todayShift ? (
    <div
      role="status"
      className="mt-3 rounded-lg border border-signal/50 bg-signal/10 px-3.5 py-2.5 text-sm text-foreground"
    >
      <p className="m-0">
        The new length re-spreads the plan from {formatWeekdayDate(startDate, 0)}, so
        today changed from {formatDose(todayShift.from.perDose)} {cfg.unit} ×{' '}
        {todayShift.from.dosesPerDay} to {formatDose(todayShift.to.perDose)} {cfg.unit} ×{' '}
        {todayShift.to.dosesPerDay}.
      </p>
      <button
        type="button"
        onClick={keepTodayDose}
        className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-2 hover:underline"
      >
        Keep today at {formatDose(todayShift.from.perDose)} {cfg.unit} ×{' '}
        {todayShift.from.dosesPerDay} and restart from today
      </button>
    </div>
  ) : null;
  const planFinished =
    calendarDay !== null && calendarDay > totalSteps && activeDay === totalSteps;
  const activeMeasure = activeStep ? measureInfo(activeStep) : null;
  const activePrev = activeStep && activeStep.day > 1 ? result.steps[activeStep.day - 2] : null;
  const activeDropFrom =
    activeStep &&
    activePrev &&
    activeStep.totalDaily > 0 &&
    activePrev.totalDaily > 0 &&
    activePrev.dosesPerDay > activeStep.dosesPerDay
      ? activePrev
      : null;
  const activeTaken = activeStep ? (doseChecks[activeStep.day]?.length ?? 0) : 0;
  // Re-planning only makes sense once a plan is underway (or stuck).
  // Re-planning only makes sense once a plan is underway, and only from a
  // day still above the jump-off (re-planning from the jump-off itself would
  // leave nothing to taper).
  const showReplan =
    !!activeStep &&
    activeStep.totalDaily > 0 &&
    activeStep.totalDaily > jumpOff + 1e-9 &&
    edited &&
    !(startDate && startDate === todayIso && activeStep.day === 1);

  const settingsCard = (
    <section
      aria-labelledby="taper-settings-title"
      className="field-card overflow-hidden lg:col-start-1 lg:row-span-2 lg:row-start-1"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/75 px-5 py-3">
        <h2 id="taper-settings-title" className="eyebrow m-0">
          Taper settings
        </h2>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetAll}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground ${
              settingsExpanded ? '' : 'max-lg:hidden'
            }`}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </button>
          {hasSavedPlan && settingsExpanded && rawResult.steps.length > 0 && (
            <button
              type="button"
              aria-expanded
              aria-controls={settingsExpanded ? 'taper-settings-body' : undefined}
              onClick={() => {
                setSettingsOpen(false);
                requestAnimationFrame(() => settingsSummaryRef.current?.focus());
              }}
              className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary lg:hidden"
            >
              Done
              <ChevronDown className="size-4 rotate-180" aria-hidden="true" />
            </button>
          )}
        </span>
      </div>

      {/* Phones, returning reader: a one-line summary instead of the form. */}
      {!settingsExpanded && (
        <button
          ref={settingsSummaryRef}
          type="button"
          aria-expanded={false}
          aria-controls={undefined}
          onClick={() => {
            setSettingsOpen(true);
            requestAnimationFrame(() => document.getElementById('per-dose')?.focus());
          }}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left focus-visible:-outline-offset-3 lg:hidden"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{settingsSummary}</span>
            <span className="block text-xs text-muted-foreground">{settingsSubSummary}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
            Edit
            <ChevronDown className="size-4" aria-hidden="true" />
          </span>
        </button>
      )}

      <div
        id="taper-settings-body"
        className={`space-y-5 p-5 ${settingsExpanded ? '' : 'max-lg:hidden'}`}
      >
        {Object.keys(checksByPlan).length > 0 && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Changing these settings starts a fresh set of checkmarks. Changing them back
            brings the old ones back.
          </p>
        )}
        {/* Compound switcher (hidden for single-substance pages) */}
        {substances.length > 1 && (
          <div>
            <span id="compound-label" className="block text-sm font-medium text-foreground">
              Compound
            </span>
            <div
              role="group"
              aria-labelledby="compound-label"
              className={`${SEG_GROUP} mt-1.5 grid-cols-3`}
            >
              {substances.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={substance === key}
                  onClick={() => handleSubstanceChange(key)}
                  className={`${SEG_BTN} leading-tight`}
                >
                  {SUBSTANCES[key].shortLabel}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{cfg.tagline}</p>
          </div>
        )}

        {/* Per-dose + frequency */}
        <div className="space-y-3.5">
          <div>
            <Label htmlFor="per-dose">Amount per dose ({cfg.unit})</Label>
            <div className="relative mt-1.5">
              <NumberInput
                id="per-dose"
                inputMode="decimal"
                min={0}
                step="any"
                value={perDose}
                onValueChange={setPerDose}
                onDraftValidityChange={setFieldValid('per-dose')}
                aria-invalid={jumpOffTooHigh || undefined}
                aria-describedby={jumpOffTooHigh ? 'start-total-note' : undefined}
                className="pr-12 font-semibold"
              />
              <span
                className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-muted-foreground"
                aria-hidden="true"
              >
                {cfg.unit}
              </span>
            </div>
          </div>

          <div>
            <span id="freq-label" className="block text-sm font-medium text-foreground">
              Times per day
            </span>
            <div
              role="group"
              aria-labelledby="freq-label"
              className={`${SEG_GROUP} mt-1.5 ${
                cfg.frequencyPresets.length === 2 ? 'grid-cols-3' : 'grid-cols-5'
              }`}
            >
              {cfg.frequencyPresets.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={!frequencyIsCustom && dosesPerDay === n}
                  onClick={() => {
                    setShowCustomFreq(false);
                    setDosesPerDay(n);
                  }}
                  className={`${SEG_BTN} min-h-11 text-sm`}
                >
                  {n}×
                </button>
              ))}
              <button
                type="button"
                aria-pressed={frequencyIsCustom}
                aria-expanded={frequencyIsCustom}
                aria-controls={frequencyIsCustom ? 'doses-per-day' : undefined}
                onClick={() => setShowCustomFreq(true)}
                className={`${SEG_BTN} min-h-11`}
              >
                More
              </button>
            </div>
            {frequencyIsCustom && (
              <div className="mt-2.5 flex items-center gap-2">
                <Label htmlFor="doses-per-day" className="text-xs text-muted-foreground">
                  Times per day (1 to 12)
                </Label>
                <NumberInput
                  id="doses-per-day"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  step={1}
                  integer
                  value={dosesPerDay}
                  onValueChange={setDosesPerDay}
                  onDraftValidityChange={setFieldValid('doses-per-day')}
                  className="h-10 w-20 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/55 px-3.5 py-2.5 text-sm">
            <span className="text-muted-foreground">Starting daily total</span>
            <span className="font-bold text-foreground">
              {exact(totalDaily)} {cfg.unit}{' '}
              <span className="font-normal text-muted-foreground">
                ({exact(perDose)} × {dosesPerDay})
              </span>
            </span>
          </div>
          {rawResult.steps.length > 0 && !savedFirstOnMobile && (
            <a
              href="#taper-day-card"
              className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border px-3.5 py-2 text-sm text-foreground lg:hidden"
            >
              <span className="min-w-0">
                {activeStep
                  ? `${isViewingToday && edited ? 'Today' : `Day ${activeStep.day}`}: ${
                      activeStep.totalDaily > 0
                        ? `${formatDose(activeStep.perDose)} ${cfg.unit} × ${activeStep.dosesPerDay}`
                        : 'stop day'
                    } · ${totalSteps} days`
                  : ''}
              </span>
              <span className="shrink-0 font-semibold text-primary">See schedule ↓</span>
            </a>
          )}
          {jumpOffTooHigh && (
            <div
              id="start-total-note"
              role="alert"
              className="rounded-lg border border-signal/50 bg-signal/10 px-3.5 py-2.5 text-sm text-foreground"
            >
              <p className="m-0">
                Your jump-off dose ({exact(jumpOff)} {cfg.unit}) is at or above this starting
                total, so there's nothing to taper.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowMoreSettings(true);
                  requestAnimationFrame(() => document.getElementById('jump-off')?.focus());
                }}
                className="mt-1.5 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                Change the jump-off dose
              </button>
            </div>
          )}
        </div>

        {/* Duration: published Suboxone table, or slider + presets + exact pace */}
        <div className="border-t border-border/75 pt-4">
          {publishedDurations.length > 0 && (
            <div className="mb-4">
              <span id="bupe-mode-label" className="block text-sm font-medium text-foreground">
                Schedule
              </span>
              <div
                role="group"
                aria-labelledby="bupe-mode-label"
                className={`${SEG_GROUP} mt-1.5 grid-cols-2`}
              >
                <button
                  type="button"
                  aria-pressed={usingPublished}
                  onClick={() => setBupeMode('published')}
                  className={SEG_BTN}
                >
                  Published table
                </button>
                <button
                  type="button"
                  aria-pressed={!usingPublished}
                  onClick={() => setBupeMode('custom')}
                  className={SEG_BTN}
                >
                  Custom taper
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {usingPublished
                  ? (
                      <>
                        Day-by-day doses from the{' '}
                        <a
                          href="/mat-suboxone/suboxone-rapid-taper"
                          className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                        >
                          Suboxone Rapid Taper
                        </a>{' '}
                        page.
                      </>
                    )
                  : 'An even daily percentage cut over any number of days.'}
              </p>
            </div>
          )}

          {usingPublished ? (
            <div>
              <span id="published-days-label" className="block text-sm font-medium text-foreground">
                Duration
              </span>
              <div
                role="group"
                aria-labelledby="published-days-label"
                className={`${SEG_GROUP} mt-1.5`}
                style={{
                  gridTemplateColumns: `repeat(${publishedDurations.length}, minmax(0, 1fr))`,
                }}
              >
                {publishedDurations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={scheduleDays === d}
                    onClick={() => changeDuration(d)}
                    className={SEG_BTN}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              {scheduleLengthDiffers && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  With this jump-off dose the table runs {totalSteps} days.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  <Label htmlFor="duration-slider" className="inline">
                    Duration
                  </Label>
                  :{' '}
                  <span className="font-bold" aria-hidden="true">
                    {durationDays} {durationDays === 1 ? 'day' : 'days'}
                  </span>
                </span>
                {result.steps.length > 0 && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                    −{dailyPct}% / day
                  </span>
                )}
              </div>
              {scheduleLengthDiffers && (
                <p className="mt-1 text-xs text-muted-foreground">
                  The schedule runs {totalSteps} days.
                </p>
              )}

              <input
                id="duration-slider"
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={1}
                value={durationDays}
                onChange={(e) => changeDuration(Number(e.target.value))}
                aria-valuetext={`${durationDays} days, ${dailyPct}% cut per day`}
                className="taper-range mt-2 w-full"
              />

              <div
                className="flex justify-between text-[0.7rem] text-muted-foreground"
                aria-hidden="true"
              >
                <span>{sliderMin}d (faster)</span>
                <span>{sliderMax}d (slower)</span>
              </div>

              <div
                role="group"
                aria-label="Duration presets"
                className={`${SEG_GROUP} mt-3 ${
                  cfg.durationPresets.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
                }`}
              >
                {cfg.durationPresets.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    aria-pressed={durationDays === preset.days}
                    onClick={() => changeDuration(preset.days)}
                    className={SEG_BTN}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowExactPace((v) => !v)}
                aria-expanded={showExactPace}
                aria-controls={showExactPace ? 'exact-pace' : undefined}
                className="mt-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                {showExactPace ? 'Hide exact days and % per day' : 'Set exact days or % per day'}
              </button>

              {showExactPace && (
                <div
                  id="exact-pace"
                  className="mt-1.5 grid grid-cols-2 gap-2.5 rounded-lg border border-border/75 bg-muted/40 p-3"
                >
                  <div>
                    <Label htmlFor="exact-days" className="text-xs">
                      Exact days
                    </Label>
                    <NumberInput
                      id="exact-days"
                      inputMode="numeric"
                      min={2}
                      max={365}
                      step={1}
                      integer
                      commitOnBlur
                      value={durationDays}
                      onValueChange={changeDuration}
                      className="mt-1 h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exact-pct" className="text-xs">
                      Cut % per day
                    </Label>
                    <NumberInput
                      key={pctFieldKey}
                      id="exact-pct"
                      onBlur={() => setPctFieldKey((k) => k + 1)}
                      inputMode="decimal"
                      min={0.1}
                      max={99}
                      step="0.5"
                      commitOnBlur
                      value={dailyPct}
                      onValueChange={handleCustomPctChange}
                      className="mt-1 h-10 text-sm"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Press Enter or leave the field to apply.
                  </p>
                </div>
              )}
            </>
          )}
          {todayShiftNotice}
        </div>

        {/* Start date */}
        <div className="border-t border-border/75 pt-4">
          <Label htmlFor="start-date">
            Start date <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setEdited(true);
              setStartDate(e.target.value);
            }}
            className="mt-1.5 min-w-0 text-sm font-medium"
          />
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Adds calendar dates and keeps the day card on today. Clear it to drop
            dates.
          </p>
        </div>

        {/* More settings: jump-off dose + tablet size */}
        <div className="border-t border-border/75 pt-3">
          <button
            type="button"
            aria-expanded={moreSettingsOpen}
            aria-controls={moreSettingsOpen ? 'more-settings' : undefined}
            onClick={() => setShowMoreSettings((v) => !v)}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md text-left"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">
                More settings
              </span>
              <span className="block text-xs text-muted-foreground">{moreSummary}</span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 ${
                moreSettingsOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {moreSettingsOpen && (
            <div id="more-settings" className="mt-3 space-y-5">
              <div>
                <Label htmlFor="jump-off">Jump-off dose ({cfg.unit} per day)</Label>
                <div className="relative mt-1.5">
                  <NumberInput
                    id="jump-off"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={jumpOff}
                    onValueChange={setJumpOff}
                    onDraftValidityChange={setFieldValid('jump-off')}
                    aria-invalid={jumpOffTooHigh || undefined}
                    aria-describedby="jump-off-help"
                    className="pr-10 font-semibold"
                  />
                  <span
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted-foreground"
                    aria-hidden="true"
                  >
                    {cfg.unit}
                  </span>
                </div>
                <p
                  id="jump-off-help"
                  className={`mt-1.5 text-xs leading-relaxed ${
                    jumpOffTooHigh ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {jumpOffTooHigh
                    ? `This needs to be lower than your starting total of ${exact(totalDaily)} ${cfg.unit}/day.`
                    : jumpOff === 0
                      ? 'Tapers to a low floor, then adds a final stop day.'
                      : jumpOffSplitsMultiple
                        ? `The daily total on your last day before stopping, split across ${lastDoseStep?.dosesPerDay ?? cfg.minDosesPerDay} doses for ${cfg.shortLabel}. Set 0 to add a stop day.`
                        : 'The daily total on your last day before stopping. Set 0 to add a stop day.'}
                </p>
              </div>

              {hasTabletHelper && (
                <div>
                  <span
                    id="tablet-size-label"
                    className="block text-sm font-medium text-foreground"
                  >
                    {tabletNoun.charAt(0).toUpperCase() + tabletNoun.slice(1)} size{' '}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </span>
                  <div
                    role="group"
                    aria-labelledby="tablet-size-label"
                    className={`${SEG_GROUP} mt-1.5`}
                    style={{
                      gridTemplateColumns: `repeat(${cfg.tabletPresets.length + 2}, minmax(0, 1fr))`,
                    }}
                  >
                    <button
                      type="button"
                      aria-pressed={tabletSize === 0 && !showCustomTablet}
                      onClick={() => {
                        setTabletSize(0);
                        setShowCustomTablet(false);
                      }}
                      className={SEG_BTN}
                    >
                      Off
                    </button>
                    {cfg.tabletPresets.map((size) => (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={tabletSize === size && !showCustomTablet}
                        onClick={() => {
                          setTabletSize(size);
                          setShowCustomTablet(false);
                        }}
                        className={SEG_BTN}
                      >
                        {size} {cfg.unit}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-pressed={showCustomTablet}
                      aria-expanded={showCustomTablet}
                      aria-controls={showCustomTablet ? 'tablet-size' : undefined}
                      onClick={() => setShowCustomTablet(true)}
                      className={SEG_BTN}
                    >
                      Other
                    </button>
                  </div>
                  {showCustomTablet && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Label htmlFor="tablet-size" className="text-xs text-muted-foreground">
                        {tabletNoun.charAt(0).toUpperCase() + tabletNoun.slice(1)} strength (
                        {cfg.unit})
                      </Label>
                      <NumberInput
                        id="tablet-size"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={tabletSize}
                        onValueChange={setTabletSize}
                        onDraftValidityChange={setFieldValid('tablet-size')}
                        emptyWhenZero
                        placeholder={`e.g. ${cfg.defaultTabletSize}`}
                        className="h-10 w-24 text-sm"
                      />
                    </div>
                  )}
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {tabletNoun === 'capsule'
                      ? tabletSize > 0
                        ? 'Shows whole-capsule counts. Weigh loose powder for exact amounts.'
                        : 'Pick a capsule size to see capsule counts in the schedule and supply estimate.'
                      : tabletSize > 0
                        ? `Days in the middle use quarter-${tabletNoun} doses where they fit the plan; other days show the ${cfg.unit} to weigh. Potency varies between batches.`
                        : `Pick your ${tabletNoun} strength to see quarter-${tabletNoun} counts in the schedule and supply estimate.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const dayOrEmptyCard =
    result.steps.length === 0 ? (
      <div
        className="field-card p-6 text-sm leading-relaxed text-foreground lg:col-start-2 lg:row-start-1"
        role="status"
      >
        {jumpOffTooHigh
          ? `Your jump-off dose (${exact(jumpOff)} ${cfg.unit}) is at or above your starting total (${exact(totalDaily)} ${cfg.unit}). Lower it under More settings, or raise the amount per dose.`
          : 'Enter an amount per dose and how many times a day you take it to see a schedule.'}
      </div>
    ) : activeStep ? (
      <section
        ref={todayCardRef}
        id="taper-day-card"
        aria-labelledby="day-card-heading"
        aria-busy={inputsPending || undefined}
        className="field-card scroll-mt-24 overflow-hidden lg:col-start-2 lg:row-start-1"
      >
        <div
          className={`px-5 py-5 transition-opacity sm:px-6 ${inputsPending ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <h2
              id="day-card-heading"
              ref={todayHeadingRef}
              tabIndex={-1}
              className="eyebrow m-0 min-w-0 flex-1 pt-1 outline-none"
            >
              {!edited
                ? `Example · Day ${activeStep.day} of ${totalSteps}`
                : `${isViewingToday ? 'Scheduled today · ' : ''}Day ${activeStep.day} of ${totalSteps}${
                    startDate ? ` · ${formatWeekdayDate(startDate, activeStep.day - 1)}` : ''
                  }`}
            </h2>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-disabled={activeDay <= 1}
                onClick={() => stepDay(-1)}
                className="aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:border-border aria-disabled:hover:bg-card"
                aria-label="Previous day"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-disabled={activeDay >= totalSteps}
                onClick={() => stepDay(1)}
                className="aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:border-border aria-disabled:hover:bg-card"
                aria-label="Next day"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {!edited && !anyChecks && (
            <p className="mt-2 text-xs text-muted-foreground">
              Example plan with default doses. Change the taper settings to match yours.
            </p>
          )}
          {migratedNotice && (
            <div className="mt-2 flex items-start justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-foreground">
              <p className="m-0 leading-relaxed">
                Your saved settings came from the earlier version of this calculator. The
                days are recalculated with updated rounding, so some doses may differ from
                a schedule you printed before. Check the days ahead before following them.
              </p>
              <button
                type="button"
                onClick={() => setMigratedNotice(false)}
                aria-label="Dismiss note"
                className="-m-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          )}

          {planFinished && (
            <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">
              This schedule ended {formatWeekdayDate(startDate, totalSteps - 1)}.
            </p>
          )}
          {activeStep.totalDaily === 0 ? (
            !planFinished && (
              <p className="mt-1.5 font-display text-3xl font-semibold text-foreground">
                Stop day. No dose.
              </p>
            )
          ) : (
            <>
              {planFinished && (
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  Last day&apos;s dose
                </p>
              )}
              <p
                className={
                  planFinished
                    ? 'mt-0.5 text-lg font-semibold text-foreground'
                    : 'mt-1.5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'
                }
              >
                {formatDose(activeStep.perDose)} {cfg.unit}{' '}
                <span
                  className={`font-sans font-semibold text-muted-foreground ${
                    planFinished ? 'text-base' : 'text-xl sm:text-2xl'
                  }`}
                >
                  × {activeStep.dosesPerDay}{' '}
                  {activeStep.dosesPerDay === 1 ? 'dose' : 'doses'}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeStep.totalDaily} {cfg.unit} for the day
                {activeMeasure ? ` · ${measurePhrase(activeMeasure.short)}` : ''}
              </p>
              {activeMeasure && measureNeedsDetail(activeMeasure.short) && (
                <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
                  {activeMeasure.detail}
                </p>
              )}
              {activeDropFrom && (
                <p className="mt-2 rounded-lg bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
                  {isViewingToday ? 'From today' : `From day ${activeStep.day}`}:{' '}
                  {activeStep.dosesPerDay} {plural(activeStep.dosesPerDay, 'dose')} a day instead
                  of {activeDropFrom.dosesPerDay}.
                  {activeStep.perDose > activeDropFrom.perDose + 1e-9
                    ? ' Each dose is larger'
                    : ''}
                  {activeStep.perDose > activeDropFrom.perDose + 1e-9 ? ', and the' : ' The'}{' '}
                  day&apos;s total{' '}
                  {activeStep.totalDaily < activeDropFrom.totalDaily - 1e-9
                    ? `is lower (${activeDropFrom.totalDaily} → ${activeStep.totalDaily} ${cfg.unit}).`
                    : `stays at ${activeStep.totalDaily} ${cfg.unit}.`}
                </p>
              )}
            </>
          )}

          {calendarDay !== null && calendarDay < 1 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Your schedule starts {formatWeekdayDate(startDate, 0)}, in {1 - calendarDay}{' '}
              {1 - calendarDay === 1 ? 'day' : 'days'}.
            </p>
          )}
          {!startDate && (
            <p className="mt-2 text-xs text-muted-foreground">
              Set a start date to open on today&apos;s dose automatically.
            </p>
          )}
          {todayInRange && !isViewingToday && (
            <button
              type="button"
              onClick={() => selectDay(calendarDay!, { reveal: true })}
              className="mt-1.5 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Back to today (Day {calendarDay})
            </button>
          )}
          {inputsPending && (
            <p className="mt-2 text-sm font-medium text-foreground" role="status">
              Finish the setting you&apos;re editing to update this schedule.
            </p>
          )}

          {/* Per-dose checkoffs */}
          {activeStep.totalDaily > 0 && (
            <div
              role="group"
              aria-label={`Doses taken on day ${activeStep.day}`}
              className="mt-4 flex flex-wrap gap-2"
            >
              {Array.from({ length: activeStep.dosesPerDay }, (_, slotIdx) => {
                const isDone = (doseChecks[activeStep.day] ?? []).includes(slotIdx);
                return (
                  <button
                    key={slotIdx}
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    disabled={inputsPending}
                    onClick={() => toggleDoseSlot(activeStep.day, slotIdx)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                      isDone
                        ? 'border-success/70 bg-success/12 text-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary hover:bg-accent/50'
                    }`}
                  >
                    <span
                      className={`inline-flex size-5 items-center justify-center rounded-full border ${
                        isDone
                          ? 'border-success bg-success text-success-foreground'
                          : 'border-muted-foreground/70 bg-card'
                      }`}
                      aria-hidden="true"
                    >
                      {isDone && <Check className="size-3 stroke-[3]" />}
                    </span>
                    Dose {slotIdx + 1}
                  </button>
                );
              })}
            </div>
          )}
          {activeStep.totalDaily === 0 && (
            <div className="mt-4">
              <button
                type="button"
                role="checkbox"
                aria-checked={isDayDone(activeStep)}
                disabled={inputsPending}
                onClick={() => toggleDayDone(activeStep)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isDayDone(activeStep)
                    ? 'border-success/70 bg-success/12 text-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary hover:bg-accent/50'
                }`}
              >
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full border ${
                    isDayDone(activeStep)
                      ? 'border-success bg-success text-success-foreground'
                      : 'border-muted-foreground/70 bg-card'
                  }`}
                  aria-hidden="true"
                >
                  {isDayDone(activeStep) && <Check className="size-3 stroke-[3]" />}
                </span>
                Stop day done
              </button>
            </div>
          )}

          {showReplan && (
            <div className="mt-4 border-t border-border/75 pt-2">
              <button
                type="button"
                aria-expanded={showReplanHelp}
                aria-controls={showReplanHelp ? 'replan-help' : undefined}
                onClick={() => setShowReplanHelp((v) => !v)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                Holding a dose or slowing down
                <ChevronDown
                  className={`size-4 transition-transform ${showReplanHelp ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {showReplanHelp && (
                <div id="replan-help" className="pb-1">
                  <p className="m-0 text-sm text-muted-foreground">
                    Use the arrows to pick the dose you&apos;re on, then restart the schedule
                    from today. It keeps the {Math.max(2, totalSteps - activeStep.day + 1)} days
                    left, and you can change the length after.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={replanFromActiveDay}
                    disabled={inputsPending}
                    className="mt-2"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Restart from today at {formatDose(activeStep.perDose)} {cfg.unit} ×{' '}
                    {activeStep.dosesPerDay}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {anyChecks ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/75 bg-muted/35 px-5 py-2 text-xs text-muted-foreground sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                role="progressbar"
                aria-label="Days checked off"
                aria-valuemin={0}
                aria-valuemax={totalSteps}
                aria-valuenow={doneCount}
                aria-valuetext={`${doneCount} of ${totalSteps} days checked off`}
                className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-border/70"
              >
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-200"
                  style={{ width: `${donePct}%` }}
                />
              </div>
              <span>
                {activeTaken > 0 && activeTaken < slotsFor(activeStep)
                  ? `${activeTaken} of ${slotsFor(activeStep)} doses on day ${activeStep.day} · `
                  : ''}
                {doneCount} of {totalSteps} days done
              </span>
            </div>
            <button
              type="button"
              onClick={clearChecks}
              className="inline-flex min-h-11 items-center rounded-md px-1 font-medium underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear checkmarks
            </button>
          </div>
        ) : null}
      </section>
    ) : null;

  const planCard = (
    <section
      aria-labelledby="plan-summary-heading"
      className="field-card overflow-hidden lg:col-start-2 lg:row-start-2"
    >
      <div className="flex flex-col gap-3 border-b border-border/75 px-5 py-4 sm:px-6">
        <div>
          <p className="eyebrow m-0">
            {result.source === 'bupe-established'
              ? scheduleLengthDiffers
                ? `Published ${scheduleDays}-day table, ${totalSteps} days with this jump-off`
                : `Published ${totalSteps}-day taper`
              : `${totalSteps}-day ${cfg.shortLabel} taper`}
          </p>
          <h2
            id="plan-summary-heading"
            className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground"
          >
            {result.steps[0]?.totalDaily} → {result.steps[result.steps.length - 1]?.totalDaily}{' '}
            {cfg.unit}{' '}
            <span className="font-sans text-sm font-medium text-muted-foreground">
              per day
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paceLabel(dailyPct, result.source)}
            {result.source !== 'bupe-established' && ` · −${dailyPct}% per day`}
            {lastDoseDateLabel && ` · Last dose ${lastDoseDateLabel}`}
            {showLargestCut &&
              ` · Largest single-day cut ${Math.round(largestCut!.pct)}% (day ${largestCut!.day}), where doses can't split finer`}
          </p>
        </div>

        <dl className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-border/80 bg-muted/50 px-3 py-2">
            <dt className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Total supply
            </dt>
            <dd className="m-0 mt-0.5 font-display text-lg font-semibold text-foreground">
              {formatSupply(result.totalMedication)} {cfg.unit}
              {totalTabletsNeeded !== null && ' '}
              {totalTabletsNeeded !== null && (
                <span className="font-sans text-xs font-normal text-muted-foreground">
                  (≈ {totalTabletsNeeded} {plural(totalTabletsNeeded, tabletNoun)})
                </span>
              )}
            </dd>
          </div>
          {phases.length > 1 && (
            <div className="rounded-lg border border-border/80 bg-muted/50 px-3 py-2">
              <dt className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Doses per day
              </dt>
              <dd className="m-0 mt-0.5 font-display text-lg font-semibold text-foreground">
                {phases.map((p) => `${p.dosesPerDay}×`).join(' → ')}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div
          className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full bg-primary" />
            Daily total ({cfg.unit})
          </span>
          {transitionDays.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-0 border-l-2 border-dashed border-muted-foreground" />
              Fewer doses per day
            </span>
          )}
          {jumpOff > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0 w-3.5 border-t-2 border-dashed border-success" />
              Jump-off
            </span>
          )}
          <span className="ml-auto">Tap or click the curve to pick a day</span>
        </div>

        <div role="img" aria-label={chartSummary}>
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <AreaChart
              data={chartData}
              accessibilityLayer={false}
              margin={{ left: 0, right: 12, top: 20, bottom: 4 }}
              onClick={(chartState) => {
                const raw = chartState?.activeLabel;
                const clickedDay = typeof raw === 'number' ? raw : Number(raw);
                if (Number.isFinite(clickedDay) && clickedDay >= 1) {
                  selectDay(clickedDay, { reveal: true });
                }
              }}
            >
              <defs>
                <linearGradient id="taperFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
                tickFormatter={(d) => `D${d}`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                width={38}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as
                    | (typeof chartData)[number]
                    | undefined;
                  if (!row) return null;
                  const badge = measureInfo({
                    day: row.day,
                    perDose: row.perDose,
                    dosesPerDay: row.dosesPerDay,
                    totalDaily: row.totalDaily,
                  });
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-bold text-foreground">
                        Day {row.day}
                        {row.dateLabel ? ` · ${row.dateLabel}` : ''}
                      </p>
                      {row.totalDaily === 0 ? (
                        <p className="mt-1 font-semibold text-foreground">Stop day</p>
                      ) : (
                        <>
                          <p className="mt-1 text-foreground">
                            <span className="font-semibold">
                              {formatDose(row.perDose)} {cfg.unit} × {row.dosesPerDay}
                            </span>{' '}
                            <span className="text-muted-foreground">
                              = {row.totalDaily} {cfg.unit}
                            </span>
                          </p>
                          {badge && (
                            <p className="mt-0.5 text-muted-foreground">
                              {measurePhrase(badge.short)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                }}
              />
              {jumpOff > 0 && (
                <ReferenceLine
                  y={jumpOff}
                  stroke="hsl(var(--success))"
                  strokeDasharray="4 4"
                  strokeWidth={1.25}
                />
              )}
              {transitionDays.map((t) => (
                <ReferenceLine
                  key={t.day}
                  x={t.day}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.7}
                  strokeDasharray="3 3"
                  strokeWidth={1.25}
                  label={{
                    value: `${t.freq}×`,
                    position: 'top',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              ))}
              {activeStep && (
                <ReferenceLine
                  x={activeStep.day}
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                />
              )}
              <Area
                type="stepAfter"
                dataKey="totalDaily"
                stroke="hsl(var(--primary))"
                strokeWidth={2.2}
                fill="url(#taperFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </section>
  );

  // Until saved settings load, show placeholders rather than the example
  // plan: a returning reader shouldn't glimpse a dose that isn't theirs, and
  // the cards shouldn't reorder under them.
  if (!hydrated) {
    return (
      <div className="not-prose my-6" aria-busy="true">
        <span className="sr-only">Loading the taper calculator…</span>
        <div className="grid items-start gap-5 lg:grid-cols-[21.5rem_minmax(0,1fr)]">
          <div className="field-card h-[28rem] animate-pulse bg-muted/35 motion-reduce:animate-none" />
          <div className="space-y-5">
            <div className="field-card h-56 animate-pulse bg-muted/35 motion-reduce:animate-none" />
            <div className="field-card h-80 animate-pulse bg-muted/35 motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="not-prose my-6 space-y-6 tabular-nums [overflow-wrap:normal]">
        <span className="sr-only" aria-live="polite">
          {dayAnnouncement}
        </span>
        <span className="sr-only" aria-live="polite">
          {undo ? `${undo.message} Undo is available for 10 seconds.` : ''}
        </span>
        {undo && (
          <div
            className="fixed inset-x-4 bottom-20 z-50 sm:bottom-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-foreground shadow-lg sm:left-auto sm:right-6 sm:w-96 print:hidden"
          >
            <span>{undo.message}</span>
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  restoreSnapshot(undo.snapshot);
                  setUndo(null);
                }}
                className="inline-flex min-h-11 items-center rounded-md px-2 font-semibold text-primary underline-offset-2 hover:underline"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => setUndo(null)}
                aria-label="Dismiss"
                className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {copied === 'schedule'
            ? 'Schedule copied to clipboard'
            : copied === 'prompt'
              ? 'AI prompt copied to clipboard'
              : ''}
        </span>

        {/* Print-only summary header */}
        {result.steps.length > 0 && (
          <div className="hidden print:block">
            <h2 className="m-0 font-display text-2xl font-semibold text-foreground">
              Taper schedule: {cfg.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {exact(perDose)} {cfg.unit} × {dosesPerDay}/day ({exact(totalDaily)}{' '}
              {cfg.unit}/day){' '}
              {jumpOff === 0 ? 'to a stop day' : `to ${exact(jumpOff)} ${cfg.unit} jump-off`} over{' '}
              {totalSteps} {totalSteps === 1 ? 'day' : 'days'}
            </p>
          </div>
        )}

        {/* ─── Workbench: settings (left rail) + today card and curve (right) ─── */}
        <div className="grid items-start gap-5 lg:grid-cols-[21.5rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] print:hidden">
          {/* DOM order matches visual order: a returning reader's day card
              comes first so keyboard and screen-reader order agree. */}
          {savedFirstOnMobile ? (
            <>
              {dayOrEmptyCard}
              {settingsCard}
            </>
          ) : (
            <>
              {settingsCard}
              {dayOrEmptyCard}
            </>
          )}
          {result.steps.length > 0 && planCard}
        </div>

        {/* ─── Schedule breakdown (By week / Full table) ─── */}
        {result.steps.length > 0 && (
          <section
            aria-labelledby="schedule-breakdown-heading"
            className="field-card overflow-hidden print:border-0 print:shadow-none"
          >
            <div className="flex flex-col gap-3 border-b border-border/75 bg-muted/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
              <div>
                <p className="eyebrow m-0">Schedule</p>
                <h2
                  id="schedule-breakdown-heading"
                  className="mt-0.5 font-display text-xl font-semibold text-foreground"
                >
                  {viewMode === 'weeks'
                    ? `Week by week (${weeks.length} ${weeks.length === 1 ? 'week' : 'weeks'})`
                    : `All ${totalSteps} days`}
                </h2>
              </div>

              <div
                role="group"
                aria-label="Schedule view"
                className={`${SEG_GROUP} grid-cols-2 self-start sm:w-56`}
              >
                {(
                  [
                    ['weeks', 'By week'],
                    ['table', 'Every day'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={SEG_BTN}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── By week ── */}
            {viewMode === 'weeks' && (
              <div className="divide-y divide-border/75 print:hidden">
                {weeks.map((wk) => {
                  const isOpen = openWeeks.includes(wk.weekIndex);
                  const wkDone = wk.steps.filter(isDayDone).length;
                  const startLbl = startDate ? formatShortDate(startDate, wk.startDay - 1) : '';
                  const endLbl = startDate ? formatShortDate(startDate, wk.endDay - 1) : '';
                  return (
                    <div key={wk.weekIndex}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? `week-${wk.weekIndex}-days` : undefined}
                        onClick={() => toggleWeekOpen(wk.weekIndex)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/35 focus-visible:-outline-offset-3 sm:px-6"
                      >
                        <span className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
                          <span className="min-w-28">
                            <span className="block text-sm font-bold text-foreground">
                              Week {wk.weekIndex + 1}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {wk.startDay === wk.endDay
                                ? startLbl || `Day ${wk.startDay}`
                                : startLbl && endLbl
                                  ? `${startLbl} – ${endLbl}`
                                  : `Days ${wk.startDay}–${wk.endDay}`}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {wk.firstTotal === 0 && wk.lastTotal === 0
                              ? 'Stop day'
                              : wk.firstTotal === wk.lastTotal
                              ? `${wk.firstTotal} ${cfg.unit}/day`
                              : `${wk.firstTotal} → ${wk.lastTotal} ${cfg.unit}/day`}
                            {wk.drops.length > 0 && ' '}
                            {wk.drops.length > 0 && (
                              <span className="ml-1 inline-flex items-center rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 text-xs font-semibold text-foreground">
                                {wk.drops
                                  .map((d) => `${d.freq}×/day from Day ${d.day}`)
                                  .join(', ')}
                              </span>
                            )}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                          <span>
                            {wkDone}/{wk.steps.length}
                            <span className="sr-only"> days checked off</span>
                          </span>
                          <ChevronDown
                            className={`size-4 transition-transform duration-150 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </span>
                      </button>

                      {isOpen && (
                        <ul
                          id={`week-${wk.weekIndex}-days`}
                          className="m-0 list-none border-t border-border/60 bg-muted/20 p-0"
                        >
                          {wk.steps.map((s) => {
                            const prev = s.day > 1 ? result.steps[s.day - 2] : null;
                            const isStopDay = s.totalDaily === 0;
                            const isTransition =
                              !isStopDay &&
                              prev !== null &&
                              prev.totalDaily > 0 &&
                              prev.dosesPerDay !== s.dosesPerDay;
                            const isLast = s.day === totalSteps && !isStopDay;
                            const isDone = isDayDone(s);
                            const isCurrent = s.day === activeDay;
                            const isToday = calendarDay === s.day;
                            const m = measureInfo(s);

                            return (
                              <Fragment key={s.day}>
                                {isTransition && (
                                  <li className="border-b border-border/60 bg-accent/60 px-5 py-2 text-xs font-semibold text-accent-foreground sm:px-6">
                                    From Day {s.day}: {s.dosesPerDay}{' '}
                                    {plural(s.dosesPerDay, 'dose')} a day
                                  </li>
                                )}
                                <li
                                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-border/60 px-5 py-2.5 last:border-b-0 sm:px-6 ${
                                    isCurrent ? 'bg-accent/45' : isStopDay || isLast ? 'bg-success/8' : ''
                                  }`}
                                >
                                  <DayCheckbox
                                    checked={isDone}
                                    taken={doseChecks[s.day]?.length ?? 0}
                                    label={`Day ${s.day} done`}
                                    onToggle={() => toggleDayDone(s)}
                                    disabled={inputsPending}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => pickRowDay(s.day)}
                                    aria-current={isCurrent ? 'true' : undefined}
                                    className="min-h-11 min-w-0 rounded-md text-left"
                                  >
                                    <span className="flex flex-wrap items-baseline gap-x-2">
                                      <span
                                        className={`text-sm font-bold ${
                                          isCurrent ? 'text-primary' : 'text-foreground'
                                        }`}
                                      >
                                        Day {s.day}
                                      </span>{' '}
                                      {startDate && (
                                        <span className="text-xs text-muted-foreground">
                                          {formatShortDate(startDate, s.day - 1)}{' '}
                                        </span>
                                      )}
                                      {isToday && (
                                        <span className="text-xs font-semibold text-primary">
                                          Today{' '}
                                        </span>
                                      )}
                                      {isLast && (
                                        <span className="text-xs font-semibold text-success">
                                          Jump-off
                                        </span>
                                      )}
                                    </span>
                                    <span className="mt-0.5 block text-sm text-foreground">
                                      {isStopDay ? (
                                        'Stop day'
                                      ) : (
                                        <>
                                          {formatDose(s.perDose)} {cfg.unit} × {s.dosesPerDay}
                                          {m && ' '}
                                          {m && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                              ({m.short})
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </span>
                                  </button>
                                  <span className="text-right text-sm font-bold whitespace-nowrap text-foreground">
                                    {isStopDay ? '0' : s.totalDaily} {cfg.unit}
                                  </span>
                                </li>
                              </Fragment>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Every day (also always rendered for print) ── */}
            <div className={viewMode === 'table' ? 'block' : 'hidden print:block'}>
              <div
                className="overflow-x-auto focus-visible:-outline-offset-3"
                role="region"
                aria-label="Day-by-day schedule"
                tabIndex={0}
              >
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/55 text-left text-[0.7rem] font-bold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground">
                    <tr>
                      <th className="w-11 py-2.5 pl-3 pr-0 sm:w-14 sm:pl-5 print:hidden">
                        <span className="sr-only">Done</span>
                      </th>
                      <th className="py-2.5 pr-2 pl-1 sm:pr-3 print:pl-4">Day</th>
                      <th className="py-2.5 pr-2 sm:pr-3">
                        <span className="sm:hidden">{cfg.unit} × doses</span>
                        <span className="hidden sm:inline">Dose ({cfg.unit}) × times a day</span>
                      </th>
                      <th className="py-2.5 pr-3 text-right sm:pr-6">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/75">
                    {result.steps.map((s, i) => {
                      const prev = i > 0 ? result.steps[i - 1] : null;
                      const isStopDay = s.totalDaily === 0;
                      const isTransition =
                        !isStopDay &&
                        prev !== null &&
                        prev.totalDaily > 0 &&
                        prev.dosesPerDay !== s.dosesPerDay;
                      const isLast = i === result.steps.length - 1 && !isStopDay;
                      const isCurrent = s.day === activeDay;
                      const isToday = calendarDay === s.day;
                      const m = measureInfo(s);
                      const subline = [
                        startDate ? formatShortDate(startDate, s.day - 1) : '',
                        isToday ? 'Today' : '',
                      ]
                        .filter(Boolean)
                        .join(' · ');

                      return (
                        <Fragment key={s.day}>
                          {isTransition && (
                            <tr className="bg-accent/60">
                              <td className="print:hidden" />
                              <td
                                colSpan={3}
                                className="py-2 pr-3 pl-1 text-xs font-semibold text-accent-foreground sm:pr-6 print:pl-4"
                              >
                                From Day {s.day}: {s.dosesPerDay}{' '}
                                {plural(s.dosesPerDay, 'dose')} a day
                              </td>
                            </tr>
                          )}
                          <tr
                            className={
                              isCurrent
                                ? 'bg-accent/45'
                                : isStopDay || isLast
                                  ? 'bg-success/8'
                                  : ''
                            }
                          >
                            <td className="py-1.5 pl-3 pr-0 sm:pl-5 print:hidden">
                              <DayCheckbox
                                checked={isDayDone(s)}
                                taken={doseChecks[s.day]?.length ?? 0}
                                label={`Day ${s.day} done`}
                                onToggle={() => toggleDayDone(s)}
                                disabled={inputsPending}
                              />
                            </td>
                            <td className="py-1.5 pr-2 pl-1 sm:pr-3 print:pl-4">
                              <button
                                type="button"
                                onClick={() => pickRowDay(s.day)}
                                aria-current={isCurrent ? 'true' : undefined}
                                className="min-h-11 rounded-md text-left"
                              >
                                <span
                                  className={`block font-bold whitespace-nowrap ${
                                    isCurrent ? 'text-primary' : 'text-foreground'
                                  }`}
                                >
                                  Day {s.day}
                                </span>
                                {(subline || isLast) && (
                                  <span className="block text-xs text-muted-foreground">
                                    {subline}
                                    {subline && isLast ? ' · ' : ''}
                                    {isLast && (
                                      <span className="font-semibold text-success">Jump-off</span>
                                    )}
                                  </span>
                                )}
                              </button>
                            </td>
                            {isStopDay ? (
                              <td
                                colSpan={2}
                                className="py-1.5 pr-3 font-semibold text-foreground sm:pr-6"
                              >
                                Stop day
                              </td>
                            ) : (
                              <>
                                <td className="py-1.5 pr-2 sm:pr-3">
                                  <span className="font-semibold whitespace-nowrap text-foreground">
                                    {formatDose(s.perDose)} × {s.dosesPerDay}
                                  </span>
                                  {m && (
                                    <>
                                      {' '}
                                      <span className="mt-0.5 block sm:mt-0 sm:ml-1.5 sm:inline-block">
                                        <DoseMeasureBadge
                                          hasHover={hasHover}
                                          shortLabel={m.short}
                                          ariaLabel={`Measuring guide for ${formatDose(s.perDose)} ${cfg.unit}: ${m.short}`}
                                          detail={m.detail}
                                        />
                                      </span>
                                    </>
                                  )}
                                </td>
                                <td className="py-1.5 pr-3 text-right font-bold whitespace-nowrap text-foreground sm:pr-6">
                                  {s.totalDaily}{' '}
                                  <span className="text-xs font-normal text-muted-foreground">
                                    {cfg.unit}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        </Fragment>
                      );
                    })}
                    <tr className="border-t-2 border-border bg-muted/35">
                      <td className="print:hidden" />
                      <td
                        colSpan={2}
                        className="py-3 pl-1 pr-2 text-xs font-bold uppercase tracking-wider text-muted-foreground print:pl-4"
                      >
                        Total across {totalSteps} {totalSteps === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3 pr-3 text-right font-bold whitespace-nowrap text-foreground sm:pr-6">
                        {formatSupply(result.totalMedication)} {cfg.unit}
                        {totalTabletsNeeded !== null && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            ≈ {totalTabletsNeeded} {plural(totalTabletsNeeded, tabletNoun)}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save and share */}
            <div className="border-t border-border/75 px-5 py-4 sm:px-6 print:hidden">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={inputsPending}
                  className="max-sm:h-11"
                >
                  <Printer className="size-3.5" aria-hidden="true" />
                  Save as PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopySchedule}
                  disabled={inputsPending}
                  className="max-sm:h-11"
                >
                  {copied === 'schedule' ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {copied === 'schedule' ? 'Copied' : 'Copy schedule'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  disabled={inputsPending}
                  className="max-sm:h-11"
                >
                  {copied === 'prompt' ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {copied === 'prompt' ? 'Copied' : 'Copy AI prompt'}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                If symptoms spike, hold the current dose for a day or two before stepping
                down. Settings and checkmarks stay in this browser. Nothing is sent to a
                server.
              </p>
            </div>
          </section>
        )}

        {/* Substance note & related links */}
        <div className="rounded-lg border border-border bg-muted/40 p-5 print:hidden">
          <p className="text-sm leading-relaxed text-foreground">{cfg.note}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            If you also use alcohol, benzodiazepines, gabapentinoids, or other sedatives, taper
            with medical supervision; the combination is where the serious risk is. The{' '}
            <a
              href="https://www.samhsa.gov/find-help/national-helpline"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              SAMHSA National Helpline
            </a>{' '}
            (1-800-662-4357) and{' '}
            <a
              href="https://findtreatment.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              findtreatment.gov
            </a>{' '}
            can help you find care.
          </p>
          {cfg.related.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {cfg.related.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
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

/* ───────────────────────── Export helpers ───────────────────────── */

/** Per-dose measuring label for exports: strip fractions for bupe, tablet or
 *  capsule counts when a size is set, otherwise nothing. */
function exportMeasure(
  cfg: SubstanceConfig,
  tabletSize: number,
  step: ScheduleStep,
  steps: ScheduleStep[],
): string {
  const perDose = step.perDose;
  if (perDose <= 0) return '';
  if (cfg.tabletUnitName === 'strip') {
    return bupeStripShortLabel(perDose, step.day >= bupeSmallStripFromDay(steps));
  }
  if (cfg.defaultTabletSize !== null && tabletSize > 0) {
    return tabletShortLabel(perDose, tabletSize, cfg.tabletUnitName, cfg.unit);
  }
  return '';
}

/** Export suffix: the short label, plus the full note where the short label
 *  alone could read as "either amount is fine" (ranges, powder, volumetric). */
function exportMeasureText(
  cfg: SubstanceConfig,
  tabletSize: number,
  step: ScheduleStep,
  steps: ScheduleStep[],
): string {
  const short = exportMeasure(cfg, tabletSize, step, steps);
  if (!short) return '';
  if (!measureNeedsDetail(short)) return measurePhrase(short);
  const detail =
    cfg.tabletUnitName === 'strip'
      ? bupeStripEquivalents(step.perDose)
      : tabletEquivalents(step.perDose, tabletSize, cfg.unit, cfg.tabletUnitName);
  return `${measurePhrase(short)}; ${detail}`;
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

function buildPrintHTML(
  cfg: SubstanceConfig,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  tabletSize: number,
  startDate: string,
  result: ScheduleResult,
): string {
  const unit = cfg.unit;
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const hasTabs = cfg.defaultTabletSize !== null && tabletSize > 0;
  const totalTabs = hasTabs ? Math.ceil(result.totalMedication / tabletSize) : null;

  const tableRows = result.steps
    .map((s, i) => {
      const prev = i > 0 ? result.steps[i - 1] : null;
      const isStopDay = s.totalDaily === 0;
      const isTransition =
        !isStopDay &&
        prev !== null &&
        prev.totalDaily > 0 &&
        prev.dosesPerDay !== s.dosesPerDay;
      const isLast = i === result.steps.length - 1;
      const dateTxt = startDate ? formatShortDate(startDate, s.day - 1) : '';
      const dateSpan = dateTxt ? ` <span class="muted">(${escHtml(dateTxt)})</span>` : '';

      if (isStopDay) {
        return `<tr class="stop-day"><td>${s.day}${dateSpan}</td><td colspan="3"><strong>Stop. Taper complete.</strong></td></tr>`;
      }
      const transitionRow = isTransition
        ? `<tr class="transition-callout"><td colspan="4">From Day ${s.day}: ${s.dosesPerDay} ${plural(s.dosesPerDay, 'dose')} a day</td></tr>`
        : '';
      const rowClass = isTransition ? 'transition' : isLast ? 'jump-off' : '';
      const dayLabel = isLast
        ? `${s.day}${dateSpan} <span class="muted">jump-off</span>`
        : `${s.day}${dateSpan}`;
      const measure = exportMeasureText(cfg, tabletSize, s, result.steps);
      const tabTxt = measure ? ` <span class="muted">(${escHtml(measure)})</span>` : '';
      return `${transitionRow}<tr class="${rowClass}"><td>${dayLabel}</td><td>${formatDose(s.perDose)}${tabTxt}</td><td>${s.dosesPerDay}×</td><td>${s.totalDaily}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Taper Schedule: ${escHtml(cfg.label)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #27221f;
    background: #fff;
    margin: 0 auto;
    padding: 2rem;
    max-width: 7.5in;
    line-height: 1.45;
    font-variant-numeric: tabular-nums;
  }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 1.5rem; margin: 0 0 0.35rem; }
  .subtitle { color: #4a433e; margin: 0 0 0.25rem; font-size: 0.95rem; }
  .generated { color: #6b625c; font-size: 0.8rem; margin: 0 0 1.4rem; }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding: 0.85rem;
    background: #faf7f2;
    border: 1px solid #dcd3c6;
    border-radius: 6px;
    margin-bottom: 1.4rem;
  }
  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6b625c;
    margin-bottom: 0.2rem;
    font-weight: 700;
  }
  .stat-value { font-size: 1rem; font-weight: 700; }
  h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #8a432f;
    margin: 0 0 0.5rem;
  }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  thead th {
    text-align: left;
    padding: 0.45rem 0.6rem;
    border-bottom: 2px solid #27221f;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #5b524c;
  }
  tbody td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #e6dfd5; }
  tbody tr.transition td { font-weight: 600; }
  tbody tr.transition-callout td {
    background: #f6ece7;
    border-top: 1px solid #c9a99d;
    border-bottom: 1px solid #c9a99d;
    font-weight: 700;
    color: #5b2a1d;
  }
  tbody tr.jump-off td { font-weight: 600; }
  tbody tr.stop-day td {
    background: #eef6ec;
    border-top: 2px solid #487338;
    border-bottom: 2px solid #487338;
    font-weight: 600;
    color: #1f3b18;
  }
  .muted { color: #6b625c; font-weight: 400; font-size: 0.82em; }
  .footer {
    margin-top: 1.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #dcd3c6;
    font-size: 0.75rem;
    color: #5b524c;
    line-height: 1.5;
  }
  .footer strong { color: #27221f; }
  @media print {
    body { padding: 0.5in; max-width: none; }
    @page { margin: 0.5in; }
    tbody tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<h1>Taper Schedule</h1>
<p class="subtitle"><strong>${escHtml(cfg.label)}</strong> · ${exact(perDose)} ${escHtml(unit)} × ${dosesPerDay}/day → ${jumpOff === 0 ? 'a stop day' : `jump-off at ${exact(jumpOff)} ${escHtml(unit)}/day`} over ${result.steps.length} ${plural(result.steps.length, 'day')}</p>
<p class="generated">Generated by quitting7oh.org · ${escHtml(today)}</p>

<div class="stats">
  <div>
    <div class="stat-label">Duration</div>
    <div class="stat-value">${result.steps.length} day${result.steps.length === 1 ? '' : 's'}</div>
  </div>
  <div>
    <div class="stat-label">Total supply</div>
    <div class="stat-value">${formatSupply(result.totalMedication)} ${escHtml(unit)}${totalTabs !== null ? ` (≈ ${totalTabs} ${escHtml(plural(totalTabs, cfg.tabletUnitName))})` : ''}</div>
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
  <strong>Reference, not a prescription.</strong> This schedule comes from the
  quitting7oh.org community calculator and is not clinical guidance. ${
    cfg.tabletUnitName === 'strip'
      ? 'If a prescriber manages your buprenorphine, bring this schedule to them before changing doses.'
      : 'For questions about pace or adjustments, ask the community on the Discord (quitting7oh.org/discord) or at reddit.com/r/stopping7oh.'
  }
</p>

<script>
  window.addEventListener('load', function () {
    window.focus();
    setTimeout(function () { window.print(); }, 100);
  });
  window.addEventListener('afterprint', function () { window.close(); });
</script>
</body>
</html>`;
}

function buildScheduleText(
  cfg: SubstanceConfig,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  tabletSize: number,
  startDate: string,
  result: ScheduleResult,
): string {
  const unit = cfg.unit;
  const totalDaily = exact(perDose * dosesPerDay);
  const durationDays = result.steps.length;
  const hasTabs = cfg.defaultTabletSize !== null && tabletSize > 0;
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const scheduleLines = result.steps
    .map((s, i) => {
      const dateStr = startDate ? ` (${formatShortDate(startDate, s.day - 1)})` : '';
      if (s.totalDaily === 0) {
        return `Day ${s.day}${dateStr}: stop (taper complete)`;
      }
      const isLast = i === result.steps.length - 1;
      const marker = isLast ? ' [jump-off]' : '';
      const measure = exportMeasureText(cfg, tabletSize, s, result.steps);
      const tabPart = measure ? ` (${measure})` : '';
      return `Day ${s.day}${dateStr}: ${formatDose(s.perDose)} ${unit} × ${s.dosesPerDay}/day = ${s.totalDaily} ${unit}/day${tabPart}${marker}`;
    })
    .join('\n');

  const supplyLine = hasTabs
    ? `${formatSupply(result.totalMedication)} ${unit} (approx. ${Math.ceil(result.totalMedication / tabletSize)} × ${tabletSize} ${unit} ${plural(Math.ceil(result.totalMedication / tabletSize), cfg.tabletUnitName)})`
    : `${formatSupply(result.totalMedication)} ${unit}`;

  return `Taper schedule: ${cfg.label}

Plan:
- Starting dose: ${exact(perDose)} ${unit} × ${dosesPerDay}/day = ${totalDaily} ${unit}/day
- Jump-off daily total: ${jumpOff === 0 ? 'none (tapers to a stop day)' : `${exact(jumpOff)} ${unit}`}
- Duration: ${durationDays} day${durationDays === 1 ? '' : 's'}
- Total supply: ${supplyLine}
- Approach: ${sourceLabel(result.source)}

Day-by-day:
${scheduleLines}

Generated by quitting7oh.org · ${today}`;
}

function buildPromptText(
  cfg: SubstanceConfig,
  perDose: number,
  dosesPerDay: number,
  jumpOff: number,
  tabletSize: number,
  startDate: string,
  result: ScheduleResult,
): string {
  const unit = cfg.unit;
  const isBupe = cfg.tabletUnitName === 'strip';
  const hasTabs = cfg.defaultTabletSize !== null && tabletSize > 0;
  const totalDaily = exact(perDose * dosesPerDay);
  const lastDoseStep = [...result.steps].reverse().find((s) => s.totalDaily > 0);
  const jumpDetail =
    jumpOff === 0
      ? '0 (taper to floor then stop)'
      : lastDoseStep && lastDoseStep.dosesPerDay > 1
        ? `${exact(jumpOff)} ${unit}/day (${formatDose(lastDoseStep.perDose)} ${unit} × ${lastDoseStep.dosesPerDay}/day)`
        : `${exact(jumpOff)} ${unit}/day`;

  const scheduleLines = result.steps
    .map((s, i) => {
      const dateStr = startDate ? ` (${formatShortDate(startDate, s.day - 1)})` : '';
      if (s.totalDaily === 0) {
        return `Day ${s.day}${dateStr}: stop (taper complete)`;
      }
      const isLast = i === result.steps.length - 1;
      const marker = isLast ? ' [jump-off]' : '';
      const measure = exportMeasureText(cfg, tabletSize, s, result.steps);
      const tabPart = measure ? ` (${measure})` : '';
      return `Day ${s.day}${dateStr}: ${formatDose(s.perDose)} ${unit} × ${s.dosesPerDay}/day = ${s.totalDaily} ${unit}/day${tabPart}${marker}`;
    })
    .join('\n');
  const durationDays = result.steps.length;

  return `I'm tapering off ${cfg.label} and want help personalizing my plan.

PLAN (generated by the quitting7oh.org taper calculator):
- Starting dose: ${exact(perDose)} ${unit} × ${dosesPerDay}/day = ${totalDaily} ${unit}/day
- Jump-off target: ${jumpDetail}
- Duration: ${durationDays} day${durationDays === 1 ? '' : 's'}
- Total medication across the taper: ${formatSupply(result.totalMedication)} ${unit}${
    hasTabs
      ? ` (about ${Math.ceil(result.totalMedication / tabletSize)} × ${tabletSize} ${unit} ${plural(Math.ceil(result.totalMedication / tabletSize), cfg.tabletUnitName)})`
      : ''
  }${hasTabs ? `\n- ${cfg.tabletUnitName.charAt(0).toUpperCase() + cfg.tabletUnitName.slice(1)} strength: ${tabletSize} ${unit}` : ''}
- Approach: ${sourceLabel(result.source)}

DAY-BY-DAY SCHEDULE:
${scheduleLines}

CONTEXT (please ask me about these before suggesting changes):
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
${
    isBupe
      ? '5. What to ask my prescriber before changing doses'
      : "5. Which of my questions a prescriber could help with (helper meds, interactions with anything I'm prescribed, medical red flags)"
  }

IMPORTANT:
- This calculator is community-derived from quitting7oh.org, not a clinical prescription
${
    isBupe
      ? "- Don't replace my prescriber; help me think through what to ask them"
      : "- If I'm on prescribed medications, flag interactions to raise with my prescriber"
  }
- Flag anything that looks dangerous given my context
- Be direct about uncertainty; published clinical literature on these compounds is thin`;
}
