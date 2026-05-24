import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '~/components/ui/button';

const STORAGE_KEY = 'beta-banner-dismissed';

export function BetaBanner() {
  // Render visible by default to match SSR; hide after mount if dismissed.
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true);
    } catch {
      // sessionStorage blocked; leave visible.
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <aside
      role="note"
      className="border-b border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/50"
    >
      <div className="mx-auto flex max-w-[88rem] items-start gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <p className="flex-1 text-sm leading-6 text-amber-900 dark:text-amber-100">
          <span className="font-semibold">Beta:</span> This site is still being
          verified. AI tools were used to help organize and clean up content that
          was originally written and fact-checked by humans, but not every page
          has been fully reviewed yet.{' '}
          <span className="block sm:inline">Use at your own risk.</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="-mr-1 h-6 w-6 flex-shrink-0 text-amber-900/60 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-100/70 dark:hover:bg-amber-900/40 dark:hover:text-amber-50"
          aria-label="Dismiss beta notice for this session"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </aside>
  );
}
