import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
  /** Pathname of the current page. When set, the current-page crumb
   *  becomes a link that copies the page URL to the clipboard. */
  sharePath?: string;
}

function ShareCrumb({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks (new tab, etc.) keep normal anchor behavior.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigator.clipboard.writeText(window.location.origin + path).then(() => {
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
    <span className="relative">
      <a
        href={path}
        aria-current="page"
        aria-label="Copy a link to this page"
        title="Copy link to this page"
        onClick={onClick}
        className="inline-flex items-center gap-1 font-normal text-foreground transition hover:text-primary"
      >
        {label}
        {copied ? (
          <Check className="h-3 w-3 text-primary" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        )}
      </a>
      {copied && (
        <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-background">
          Copied
        </span>
      )}
    </span>
  );
}

export function Breadcrumbs({ crumbs, sharePath }: Props) {
  const all: Crumb[] = [{ label: 'Home', href: '/' }, ...crumbs];
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList className="text-xs font-semibold uppercase tracking-wider">
        {all.map((c, i) => {
          const isLast = i === all.length - 1;
          return (
            <React.Fragment key={`${c.label}-${i}`}>
              <BreadcrumbItem>
                {c.href && !isLast ? (
                  <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>
                ) : isLast && sharePath ? (
                  <ShareCrumb path={sharePath} label={c.label} />
                ) : (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator>›</BreadcrumbSeparator>}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
