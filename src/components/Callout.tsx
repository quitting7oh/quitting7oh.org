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
    className: 'bg-muted/65 text-foreground [&_.callout-icon]:text-primary',
  },
  warning: {
    Icon: AlertTriangle,
    title: 'Safety note',
    className: 'bg-signal/10 text-foreground [&_.callout-icon]:text-signal',
  },
  medical: {
    Icon: Stethoscope,
    title: 'Medical context',
    className: 'bg-destructive/8 text-foreground [&_.callout-icon]:text-destructive',
  },
} as const;

export function Callout({ type = 'info', title, children }: Props) {
  const { Icon, title: fallback, className } = styles[type];
  return (
    <aside className={cn('not-prose my-7 grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded px-4 py-3.5', className)}>
      <span className="callout-icon inline-flex size-6 items-center justify-center">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title ?? fallback}</p>
        <div className="mt-1 text-sm leading-[1.65] text-muted-foreground">{children}</div>
      </div>
    </aside>
  );
}
