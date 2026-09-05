import * as React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  doItems: React.ReactNode[];
  dontItems: React.ReactNode[];
}

export function DoDont({ doItems, dontItems }: Props) {
  return (
    <div className="not-prose my-7 grid gap-3 sm:grid-cols-2">
      <section className="rounded-lg border border-success/35 bg-success/7 p-4 sm:p-5" aria-labelledby="do-title">
        <h3 id="do-title" className="flex items-center gap-2 text-base font-bold text-foreground">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="size-4" aria-hidden="true" />
          </span>
          Do
        </h3>
        <ul className="mt-3 space-y-2.5 text-base leading-[1.55] text-foreground/85">
          {doItems.map((item, index) => <li key={index} className="pl-0">{item}</li>)}
        </ul>
      </section>
      <section className="rounded-lg border border-destructive/28 bg-destructive/6 p-4 sm:p-5" aria-labelledby="dont-title">
        <h3 id="dont-title" className="flex items-center gap-2 text-base font-bold text-foreground">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-destructive/12 text-destructive">
            <X className="size-4" aria-hidden="true" />
          </span>
          Don’t
        </h3>
        <ul className="mt-3 space-y-2.5 text-base leading-[1.55] text-foreground/85">
          {dontItems.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </section>
    </div>
  );
}
