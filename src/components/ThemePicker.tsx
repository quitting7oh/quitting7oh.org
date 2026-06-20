import * as React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '~/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Button } from '~/components/ui/button';

type Mode = 'system' | 'light' | 'dark';
type Variant =
  | 'accent-teal'
  | 'zinc'
  | 'slate'
  | 'stone'
  | 'neutral'
  | 'rose'
  | 'blue'
  | 'green';

const STORAGE_MODE = 'theme';
const STORAGE_VARIANT = 'theme-variant';

const VARIANTS: { key: Variant; label: string }[] = [
  { key: 'zinc', label: 'Zinc' },
  { key: 'accent-teal', label: 'Accent Teal' },
  { key: 'slate', label: 'Slate' },
  { key: 'stone', label: 'Stone' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'rose', label: 'Rose' },
  { key: 'blue', label: 'Blue' },
  { key: 'green', label: 'Green' },
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
  if (variant === 'stone') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = variant;
  }
}

function readInitialMode(): Mode {
  if (typeof document === 'undefined') return 'system';
  const fromDom = document.documentElement.dataset.themeMode as Mode | undefined;
  if (fromDom) return fromDom;
  const fromStorage = localStorage.getItem(STORAGE_MODE) as Mode | null;
  return fromStorage || 'system';
}

function readInitialVariant(): Variant {
  if (typeof document === 'undefined') return 'stone';
  const fromDom = document.documentElement.dataset.theme as Variant | undefined;
  if (fromDom) return fromDom;
  const fromStorage = localStorage.getItem(STORAGE_VARIANT) as Variant | null;
  return fromStorage || 'stone';
}

export function ThemePicker() {
  // Start with safe defaults to avoid hydration mismatch; the useEffect
  // below syncs to whatever the pre-paint script set on the DOM.
  const [mode, setMode] = React.useState<Mode>('system');
  const [variant, setVariant] = React.useState<Variant>('stone');

  React.useEffect(() => {
    const sync = () => {
      setMode(readInitialMode());
      setVariant(readInitialVariant());
    };
    sync();

    // Reflect theme changes made elsewhere (e.g. the in-page control on
    // /brand) so this picker's selection stays accurate.
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-theme-mode'],
    });

    // Live OS-theme updates while in 'system' mode.
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if ((localStorage.getItem(STORAGE_MODE) || 'system') === 'system') {
        applyMode('system');
      }
    };
    mql.addEventListener('change', handler);
    return () => {
      obs.disconnect();
      mql.removeEventListener('change', handler);
    };
  }, []);

  const handleModeChange = (next: string) => {
    const m = next as Mode;
    setMode(m);
    if (m === 'system') localStorage.removeItem(STORAGE_MODE);
    else localStorage.setItem(STORAGE_MODE, m);
    applyMode(m);
  };

  const handleVariantChange = (next: string) => {
    const v = next as Variant;
    setVariant(v);
    if (v === 'stone') localStorage.removeItem(STORAGE_VARIANT);
    else localStorage.setItem(STORAGE_VARIANT, v);
    applyVariant(v);
  };

  const Icon = mode === 'system' ? Monitor : mode === 'light' ? Sun : Moon;

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={`Theme: ${mode}`}>
                <Icon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Theme &amp; color</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={handleModeChange}>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" /> System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" /> Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={variant} onValueChange={handleVariantChange}>
          {VARIANTS.map((v) => (
            <DropdownMenuRadioItem key={v.key} value={v.key}>
              {v.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
