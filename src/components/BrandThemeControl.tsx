import * as React from 'react';
import { Monitor, Sun, Moon, Check } from 'lucide-react';

/**
 * In-page theme switcher for the /brand page. Mirrors ThemePicker's apply +
 * persist logic exactly (same localStorage keys, same DOM mutations) so the
 * two stay consistent, and observes <html> so it reflects changes made from
 * the header picker too.
 *
 * Two layouts:
 *   - "bar"  → compact sticky control (mode toggle + 8 color swatches)
 *   - "grid" → clickable catalog of all 8 variants with light/dark + hex
 */

type Mode = 'system' | 'light' | 'dark';
type Variant =
  | 'stone'
  | 'accent-teal'
  | 'zinc'
  | 'slate'
  | 'neutral'
  | 'rose'
  | 'blue'
  | 'green';

const STORAGE_MODE = 'theme';
const STORAGE_VARIANT = 'theme-variant';

interface VariantInfo {
  key: Variant;
  label: string;
  def?: boolean;
  /** [bg, fg, primary] light, then dark — exact token hex. */
  light: [string, string, string];
  dark: [string, string, string];
}

const VARIANTS: VariantInfo[] = [
  { key: 'stone', label: 'Stone', def: true, light: ['#f6f1ea', '#261f17', '#604020'], dark: ['#130f0b', '#f6f5f3', '#d5b890'] },
  { key: 'accent-teal', label: 'Accent Teal', light: ['#eef7f5', '#0f1a17', '#1d7260'], dark: ['#09110f', '#f3f6f6', '#53c6ad'] },
  { key: 'zinc', label: 'Zinc', light: ['#eeeef1', '#121216', '#2a2a32'], dark: ['#0c0c0e', '#f5f5f5', '#f0f0f0'] },
  { key: 'slate', label: 'Slate', light: ['#eaeff5', '#121821', '#1f3451'], dark: ['#0a0e15', '#f3f5f6', '#94b2db'] },
  { key: 'neutral', label: 'Neutral', light: ['#f2f2f2', '#1a1a1a', '#262626'], dark: ['#0d0d0d', '#f5f5f5', '#ebebeb'] },
  { key: 'rose', label: 'Rose', light: ['#f8edef', '#30171d', '#d61f49'], dark: ['#150a0c', '#f7f3f4', '#e64c70'] },
  { key: 'blue', label: 'Blue', light: ['#edf0f8', '#151b28', '#195ae6'], dark: ['#0a0d15', '#f3f4f6', '#5588f6'] },
  { key: 'green', label: 'Green', light: ['#eef7f1', '#122117', '#1d8743'], dark: ['#08110c', '#f3f6f4', '#2dd269'] },
];

const MODES: { key: Mode; label: string; Icon: React.ElementType }[] = [
  { key: 'system', label: 'System', Icon: Monitor },
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
];

function applyMode(mode: Mode) {
  const root = document.documentElement;
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = mode === 'dark' || (mode === 'system' && mql.matches);
  root.classList.toggle('dark', isDark);
  root.dataset.themeMode = mode;
}

function applyVariant(variant: Variant) {
  const root = document.documentElement;
  if (variant === 'stone') delete root.dataset.theme;
  else root.dataset.theme = variant;
}

function readMode(): Mode {
  if (typeof document === 'undefined') return 'system';
  const fromDom = document.documentElement.dataset.themeMode as Mode | undefined;
  if (fromDom) return fromDom;
  return (localStorage.getItem(STORAGE_MODE) as Mode | null) || 'system';
}

function readVariant(): Variant {
  if (typeof document === 'undefined') return 'stone';
  const fromDom = document.documentElement.dataset.theme as Variant | undefined;
  if (fromDom) return fromDom;
  return (localStorage.getItem(STORAGE_VARIANT) as Variant | null) || 'stone';
}

/** Shared state hook: current mode/variant + setters that apply, persist, and
 *  stay in sync with any other control (header picker, other instance). */
function useTheme() {
  const [mode, setMode] = React.useState<Mode>('system');
  const [variant, setVariant] = React.useState<Variant>('stone');

  React.useEffect(() => {
    const sync = () => {
      setMode(readMode());
      setVariant(readVariant());
    };
    sync();

    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-theme-mode'],
    });
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onMql = () => {
      if ((localStorage.getItem(STORAGE_MODE) || 'system') === 'system') applyMode('system');
    };
    mql.addEventListener('change', onMql);
    return () => {
      obs.disconnect();
      mql.removeEventListener('change', onMql);
    };
  }, []);

  const chooseMode = (m: Mode) => {
    if (m === 'system') localStorage.removeItem(STORAGE_MODE);
    else localStorage.setItem(STORAGE_MODE, m);
    applyMode(m);
    setMode(m);
  };
  const chooseVariant = (v: Variant) => {
    if (v === 'stone') localStorage.removeItem(STORAGE_VARIANT);
    else localStorage.setItem(STORAGE_VARIANT, v);
    applyVariant(v);
    setVariant(v);
  };

  return { mode, variant, chooseMode, chooseVariant };
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-0.5" role="group" aria-label="Light or dark mode">
      {MODES.map(({ key, label, Icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={[
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BrandThemeControl({ layout = 'bar' }: { layout?: 'bar' | 'grid' | 'logo-dark' }) {
  const { mode, variant, chooseMode, chooseVariant } = useTheme();
  const current = VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0];

  // Logo on a dark surface, recolored to the ACTIVE variant's dark palette
  // (always dark, regardless of the page's light/dark mode — that's the point
  // of the preview). Updates live when the variant changes.
  if (layout === 'logo-dark') {
    const [bg, fg, primary] = current.dark;
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-border p-8"
        style={{ background: bg }}
      >
        <svg viewBox="0 0 64 64" fill="none" className="h-14 w-14" aria-hidden="true">
          <path d="M20 33 V39 a12 12 0 0 0 24 0 V33" stroke={fg} strokeWidth={8} strokeLinecap="round" />
          <path d="M32 37 V14" stroke={primary} strokeWidth={8} strokeLinecap="round" />
          <path d="M23 24 L32 11 L41 24" stroke={primary} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs" style={{ color: fg, opacity: 0.6 }}>On dark · {current.label}</span>
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {VARIANTS.map((v) => {
          const active = v.key === variant;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => chooseVariant(v.key)}
              aria-pressed={active}
              aria-label={`Use ${v.label} theme`}
              className={[
                'group overflow-hidden rounded-xl border text-left transition',
                active ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary',
              ].join(' ')}
            >
              <div className="grid grid-cols-2">
                {[v.light, v.dark].map((set, i) => (
                  <div key={i} className="flex h-24 flex-col justify-between p-3" style={{ background: set[0] }}>
                    <span className="font-display text-lg font-semibold" style={{ color: set[1] }}>Aa</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ background: set[2] }} />
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: set[1], opacity: 0.6 }}>
                        {i === 0 ? 'light' : 'dark'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-card px-3 py-2">
                <span className="text-sm font-medium text-foreground">{v.label}</span>
                {active ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <Check className="h-3.5 w-3.5" /> live
                  </span>
                ) : v.def ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">default</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // bar layout
  return (
    <div className="rounded-xl border border-border bg-background/95 p-4 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((v) => {
              const active = v.key === variant;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => chooseVariant(v.key)}
                  aria-pressed={active}
                  aria-label={`Use ${v.label} theme`}
                  title={v.label}
                  className={[
                    'h-7 w-7 rounded-full transition',
                    active
                      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                      : 'ring-1 ring-border hover:ring-foreground/50',
                  ].join(' ')}
                  style={{ background: v.light[2] }}
                />
              );
            })}
          </div>
        </div>
        <ModeToggle mode={mode} onChange={chooseMode} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Live preview — currently <span className="font-medium text-foreground">{current.label}</span>,{' '}
        {mode} mode. The whole page recolors. Same setting as the picker in the header.
      </p>
    </div>
  );
}
