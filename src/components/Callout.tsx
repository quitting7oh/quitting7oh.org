import * as React from 'react';
import { AlertTriangle, Info, Stethoscope } from 'lucide-react';
import { cn } from '~/lib/utils';

type CalloutType = 'info' | 'warning' | 'medical';

interface Props {
  type?: CalloutType;
  title?: string;
  children?: React.ReactNode;
}

const styles = {
  info: {
    Icon: Info,
    title: 'Note',
    className: 'border-primary/18 bg-accent/55 text-foreground [&_.callout-icon]:text-primary',
  },
  warning: {
    Icon: AlertTriangle,
    title: 'Safety note',
    className: 'border-signal/25 bg-signal/10 text-foreground [&_.callout-icon]:text-signal',
  },
  medical: {
    Icon: Stethoscope,
    title: 'Medical context',
    className: 'border-destructive/18 bg-destructive/8 text-foreground [&_.callout-icon]:text-destructive',
  },
} as const;

export function Callout({ type = 'info', title, children }: Props) {
  const { Icon, title: fallback, className } = styles[type];
  return (
    <aside className={cn('not-prose my-7 grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border px-4 py-3.5 shadow-[0_12px_30px_-28px_hsl(var(--foreground)/0.55)]', className)}>
      <span className="callout-icon inline-flex size-7 items-center justify-center rounded-md bg-background/55">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title ?? fallback}</p>
        <div className="mt-1 text-sm leading-[1.65] text-muted-foreground">{children}</div>
      </div>
    </aside>
  );
}
