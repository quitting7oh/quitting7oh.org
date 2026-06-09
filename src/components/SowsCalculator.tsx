import * as React from 'react';
import { Calculator, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { cn } from '~/lib/utils';

// Subjective Opiate Withdrawal Scale (Handelsman 1987 / WHO Annex 10 / SAMHSA TIP 40).
// 16 items, each scored 0 (not at all) to 4 (extremely). Total range 0-64.
// At-home induction floor for buprenorphine: SOWS ≥ 17.
const ITEMS = [
  'I feel anxious',
  'I feel like yawning',
  "I'm perspiring or sweating",
  'My eyes are tearing',
  'My nose is running',
  'I have goosebumps',
  'I am shaking',
  'I have hot flashes',
  'I have cold flashes',
  'My bones and muscles ache',
  "I feel restless (can't sit still)",
  'I feel nauseous',
  'I feel like vomiting',
  'My muscles twitch',
  'I have cramps in my stomach',
  'I feel like using right now (strong cravings)',
];

const RATING_LABELS = ['Not at all', 'A little', 'Moderately', 'Quite a bit', 'Extremely'];
// Shorter labels that fit under each button on mobile without wrapping.
const RATING_LABELS_SHORT = ['None', 'A little', 'Moderate', 'A lot', 'Extreme'];

function severityLabel(score: number): string {
  if (score <= 10) return 'Mild withdrawal';
  if (score <= 20) return 'Moderate withdrawal';
  if (score <= 30) return 'Severe withdrawal';
  return 'Very severe withdrawal';
}

interface Guidance {
  headline: string;
  body: string;
  ready: 'no' | 'maybe' | 'yes';
}

function guidanceFor(score: number, answered: number): Guidance {
  if (answered === 0) {
    return {
      headline: 'Score yourself on each item to see where you are.',
      body:
        'Each item is rated 0 (not at all) to 4 (extremely). Try to be honest both ways — not high enough so you can dose, not low enough to talk yourself out of it.',
      ready: 'no',
    };
  }
  if (answered < ITEMS.length) {
    const left = ITEMS.length - answered;
    return {
      headline: `Score so far: ${score}.`,
      body: `${left} item${left === 1 ? '' : 's'} left. Total goes up to 64.`,
      ready: 'no',
    };
  }
  if (score < 11) {
    return {
      headline: 'Probably too early.',
      body:
        'Symptoms are mild. Drink water, walk around a bit, and re-score in 60–90 minutes. The at-home induction floor is SOWS ≥ 17.',
      ready: 'no',
    };
  }
  if (score < 17) {
    return {
      headline: 'Getting close, but probably not yet.',
      body:
        'Past mild, but not quite at the at-home induction floor (SOWS ≥ 17). Re-score in an hour. If symptoms keep climbing you should hit the window soon.',
      ready: 'maybe',
    };
  }
  if (score < 21) {
    return {
      headline: 'Probably in the induction window.',
      body:
        'SOWS ≥ 17 is the at-home induction floor. If your prescriber is on board with the plan, this is when the standard approach says to consider your first dose.',
      ready: 'yes',
    };
  }
  if (score < 31) {
    return {
      headline: 'Past the threshold — no need to wait longer.',
      body:
        "Standard guidance: don't sit through this looking for a higher number. If you've been waiting for the right window, this is it.",
      ready: 'yes',
    };
  }
  return {
    headline: 'Severe range.',
    body:
      "You're well past the induction floor. Standard approach says don't wait further.",
    ready: 'yes',
  };
}

interface ScoreButtonProps {
  value: number;
  current: number;
  onClick: () => void;
  ariaLabel: string;
}

function ScoreButton({
  value,
  current,
  onClick,
  ariaLabel,
}: ScoreButtonProps) {
  const selected = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'flex h-11 w-full items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40'
          : 'border-border bg-background text-foreground hover:bg-accent/40 hover:border-primary/40',
      )}
    >
      {value}
    </button>
  );
}

function formatStamp(d: Date): { display: string; iso: string } {
  // "Jun 8, 2026 · 5:42 PM" for the on-screen label.
  const display =
    d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  // "2026-06-08 17:42" — sort-friendly for journal/spreadsheet pasting.
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { display, iso };
}

export function SowsCalculator() {
  const [answers, setAnswers] = React.useState<number[]>(() =>
    Array(ITEMS.length).fill(-1),
  );
  // Set once all 16 items are answered, re-set on any further change so the
  // timestamp tracks the most recent observation. Cleared on reset.
  const [completedAt, setCompletedAt] = React.useState<Date | null>(null);
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );

  const total = answers.reduce((a, v) => a + (v > 0 ? v : 0), 0);
  const answered = answers.filter((v) => v >= 0).length;
  const severity = severityLabel(total);
  const guidance = guidanceFor(total, answered);

  React.useEffect(() => {
    if (answered === ITEMS.length) {
      setCompletedAt(new Date());
    } else {
      setCompletedAt(null);
    }
    setCopyState('idle');
  }, [answers, answered]);

  const setAnswer = (i: number, v: number) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[i] = v;
      return next;
    });
  };

  const reset = () => {
    setAnswers(Array(ITEMS.length).fill(-1));
    setCompletedAt(null);
    setCopyState('idle');
  };

  const logLine = completedAt
    ? (() => {
        const stamp = formatStamp(completedAt);
        return {
          display: `SOWS ${total} / 64 — ${severity} — ${stamp.display}`,
          copy: `SOWS ${total}/64 — ${severity} — ${stamp.iso}`,
        };
      })()
    : null;

  const copyLogLine = async () => {
    if (!logLine) return;
    try {
      await navigator.clipboard.writeText(logLine.copy);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
    }
  };

  // Tone of the result panel. "yes" = above floor (primary border, signals
  // induction window). Others stay neutral so the calculator doesn't push
  // anyone toward dosing too early.
  const resultBorder =
    guidance.ready === 'yes' ? 'border-primary/60' : 'border-border';

  const [open, setOpen] = React.useState(false);
  // When the score is complete, give the user a hint string on the closed
  // trigger so they see where they ended up even if they collapse the panel.
  const triggerHint = completedAt
    ? `Score: ${total} / 64 — tap to reopen`
    : 'Drop down to take your score';

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="not-prose my-6 rounded-lg border border-border bg-card text-card-foreground"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
          'transition-colors',
          open
            ? 'border-b border-border hover:bg-accent/30'
            : 'rounded-lg bg-primary/5 hover:bg-primary/10',
        )}
        aria-label={open ? 'Collapse SOWS calculator' : 'Open SOWS calculator'}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              'shrink-0 rounded-md p-2 transition-colors',
              open
                ? 'text-muted-foreground'
                : 'bg-primary/15 text-primary',
            )}
          >
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold text-foreground">
              SOWS calculator
            </div>
            <div
              className={cn(
                'mt-0.5 text-sm',
                open ? 'text-muted-foreground' : 'text-primary/85 font-medium',
              )}
            >
              {triggerHint}
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 transition-transform',
            open ? 'rotate-180 text-muted-foreground' : 'text-primary',
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
      <div className="border-b border-border p-5">
        <p className="text-sm text-muted-foreground">
          Rate each symptom on a 0–4 scale.{' '}
          <span className="text-foreground">0</span> = not at all,{' '}
          <span className="text-foreground">1</span> = a little,{' '}
          <span className="text-foreground">2</span> = moderately,{' '}
          <span className="text-foreground">3</span> = quite a bit,{' '}
          <span className="text-foreground">4</span> = extremely.
        </p>
      </div>

      <ol className="divide-y divide-border" aria-label="SOWS items">
        {ITEMS.map((label, i) => (
          <li key={i} className="p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
              <div className="text-sm text-foreground">
                <span className="mr-2 tabular-nums text-muted-foreground">
                  {i + 1}.
                </span>
                {label}
              </div>
              <div
                className="grid grid-cols-5 gap-1.5 sm:w-[280px]"
                role="radiogroup"
                aria-label={`Score for: ${label}`}
              >
                {[0, 1, 2, 3, 4].map((v) => {
                  const isSelected = answers[i] === v;
                  return (
                    <div key={v} className="flex flex-col items-center gap-1">
                      <ScoreButton
                        value={v}
                        current={answers[i]}
                        onClick={() => setAnswer(i, v)}
                        ariaLabel={`${v} — ${RATING_LABELS[v]}`}
                      />
                      <span
                        className={cn(
                          'text-center text-[10px] leading-tight',
                          isSelected
                            ? 'font-medium text-primary'
                            : 'text-muted-foreground',
                        )}
                      >
                        {RATING_LABELS_SHORT[v]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className={`m-5 rounded-md border ${resultBorder} bg-muted/40 p-4`}>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-3xl font-semibold tabular-nums text-foreground">
              {total}{' '}
              <span className="text-base font-normal text-muted-foreground">
                / 64
              </span>
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {severity}
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Reset
          </button>
        </div>
        <div className="mt-4">
          <div className="text-sm font-semibold text-foreground">
            {guidance.headline}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {guidance.body}
          </p>
        </div>
      </div>

      {logLine && (
        <div className="mx-5 mb-5 rounded-md border border-border bg-background p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Log line
          </div>
          <div className="mt-1.5 break-words font-mono text-sm text-foreground">
            {logLine.display}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={copyLogLine}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed — select the text above'
                  : 'Copy to clipboard'}
            </button>
            <span className="text-xs text-muted-foreground">
              Paste into your journal or notes app for tracking.
            </span>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 text-xs text-muted-foreground">
        Re-score every 60–90 minutes during induction so you can watch the
        trajectory, not just a snapshot. This is a scoring tool, not medical
        advice — your prescriber's plan comes first.
      </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
