import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

type Mode = 'system' | 'light' | 'dark';

const OPTIONS: { value: Mode; label: string; Icon: React.ElementType }[] = [
  { value: 'system', label: 'Use device setting', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

function readMode(): Mode {
  if (typeof document === 'undefined') return 'system';
  const fromDom = document.documentElement.dataset.themeMode;
  return fromDom === 'light' || fromDom === 'dark' ? fromDom : 'system';
}

function applyMode(mode: Mode) {
  const root = document.documentElement;
  const dark = mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
  root.dataset.themeMode = mode;
  root.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemePicker() {
  const [mode, setMode] = React.useState<Mode>('system');

  React.useEffect(() => setMode(readMode()), []);

  const changeMode = (value: string) => {
    const next = value as Mode;
    setMode(next);
    try {
      if (next === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch {
      // Theme still applies for the current page if storage is unavailable.
    }
    applyMode(next);
  };

  const ActiveIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-accent"
          aria-label={`Appearance: ${mode}`}
        >
          <ActiveIcon className="size-[1.05rem]" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2.5 pb-1 pt-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Reading appearance
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={changeMode}>
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="rounded-lg py-2.5 pl-8 pr-3 text-sm"
            >
              <Icon className="mr-2 size-4" aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
