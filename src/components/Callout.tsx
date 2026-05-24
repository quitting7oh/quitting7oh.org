import * as React from 'react';
import { Info, AlertTriangle, Stethoscope } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert';
import { cn } from '~/lib/utils';

type CalloutType = 'info' | 'warning' | 'medical';

interface Props {
  type?: CalloutType;
  title?: string;
  children?: React.ReactNode;
}

const defaultTitles: Record<CalloutType, string> = {
  info: 'Note',
  warning: 'Warning',
  medical: 'Not medical advice',
};

const tone: Record<CalloutType, { wrapper: string; icon: React.ElementType }> = {
  info: {
    wrapper:
      'border-sky-500 bg-sky-50 text-sky-900 [&>svg]:text-sky-600 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-50 dark:[&>svg]:text-sky-300',
    icon: Info,
  },
  warning: {
    wrapper:
      'border-amber-500 bg-amber-50 text-amber-900 [&>svg]:text-amber-600 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-50 dark:[&>svg]:text-amber-300',
    icon: AlertTriangle,
  },
  medical: {
    wrapper:
      'border-rose-500 bg-rose-50 text-rose-900 [&>svg]:text-rose-600 dark:border-rose-400 dark:bg-rose-950/40 dark:text-rose-50 dark:[&>svg]:text-rose-300',
    icon: Stethoscope,
  },
};

export function Callout({ type = 'info', title, children }: Props) {
  const { wrapper, icon: Icon } = tone[type];
  const resolvedTitle = title ?? defaultTitles[type];
  return (
    <Alert className={cn('my-6 border-l-4', wrapper)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{resolvedTitle}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
