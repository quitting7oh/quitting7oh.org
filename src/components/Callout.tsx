import * as React from 'react';
import { AlertTriangle, CircleAlert, Info, MessageCircle, Stethoscope } from 'lucide-react';
import { cn } from '~/lib/utils';

type CalloutType = 'info' | 'support' | 'warning' | 'medical' | 'emergency';

interface Props {
  type?: CalloutType;
  title?: string;
  children?: React.ReactNode;
}

const styles = {
  info: {
    Icon: Info,
    title: 'Note',
    urgent: false,
    className: 'border-primary/28 bg-accent/55 [&_.callout-icon]:text-primary',
  },
  support: {
    Icon: MessageCircle,
    title: 'Talk to someone now if:',
    urgent: true,
    className: 'border-success bg-success/10 [&_.callout-head]:bg-success [&_.callout-head]:text-success-foreground',
  },
  warning: {
    Icon: AlertTriangle,
    title: 'Check with a clinician first if:',
    urgent: true,
    className: 'border-signal bg-signal/10 [&_.callout-head]:bg-signal [&_.callout-head]:text-signal-foreground',
  },
  medical: {
    Icon: Stethoscope,
    title: 'Get urgent medical help if:',
    urgent: true,
    className: 'border-destructive bg-destructive/9 [&_.callout-head]:bg-destructive [&_.callout-head]:text-destructive-foreground',
  },
  emergency: {
    Icon: CircleAlert,
    title: 'Call 911 or go to the ER now if:',
    urgent: true,
    className: 'border-destructive bg-destructive/9 [&_.callout-head]:bg-destructive [&_.callout-head]:text-destructive-foreground',
  },
} as const;

export function Callout({ type = 'info', title, children }: Props) {
  const { Icon, title: fallback, className, urgent } = styles[type];

  if (urgent) {
    return (
      <aside className={cn('not-prose my-7 overflow-hidden rounded-lg border text-foreground', className)}>
        <h2 className="callout-head m-0 flex min-h-12 items-center gap-2.5 px-4 py-2.5 font-sans text-base font-bold tracking-normal sm:px-5">
          {type === 'emergency' && <span className="sr-only">Immediate action required: </span>}
          <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>{title ?? fallback}</span>
        </h2>
        <div className="callout-urgent-body px-4 py-4 text-[1.0625rem] leading-[1.65] text-foreground sm:px-5 sm:text-lg">
          {children}
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn('not-prose my-7 grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-r-lg border border-l-[3px] px-4 py-3.5', className)}>
      <span className="callout-icon inline-flex size-7 items-center justify-center rounded-md bg-background/55">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title ?? fallback}</p>
        <div className="mt-1 text-base leading-[1.65] text-foreground/88">{children}</div>
      </div>
    </aside>
  );
}
