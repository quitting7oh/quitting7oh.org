import * as React from 'react';
import { Check, Copy } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
  sharePath?: string;
}

export function Breadcrumbs({ crumbs, sharePath }: Props) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const all = [{ label: 'Home', href: '/' }, ...crumbs];

  const copy = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!sharePath) return;
    void navigator.clipboard.writeText(window.location.origin + sharePath).then(() => {
      setCopied(true);
      const live = document.getElementById('copy-announce');
      if (live) live.textContent = 'Page link copied to clipboard';
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(false);
        if (live) live.textContent = '';
      }, 1600);
    });
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
        {all.map((crumb, index) => {
          const last = index === all.length - 1;
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              <li className={last ? 'truncate font-bold text-foreground' : undefined}>
                {crumb.href && !last ? (
                  <a href={crumb.href} className="hover:text-primary hover:underline">{crumb.label}</a>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>
                )}
              </li>
              {!last && <li aria-hidden="true" className="text-border">/</li>}
            </React.Fragment>
          );
        })}
      </ol>
      {sharePath && (
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
          aria-label="Copy a link to this page"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      )}
    </nav>
  );
}
