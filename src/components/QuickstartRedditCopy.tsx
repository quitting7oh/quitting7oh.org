import * as React from 'react';
import { Check, Copy, OctagonAlert } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { buildQuickstartRedditPost } from '~/lib/quickstart-reddit';

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through for browsers that block the async clipboard API.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function QuickstartRedditCopy() {
  const [status, setStatus] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleCopy = async () => {
    const copied = await writeToClipboard(buildQuickstartRedditPost());
    setStatus(copied ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 2200);
  };

  return (
    <aside
      className="not-prose mt-10 flex justify-end border-t border-border/60 pt-3"
      aria-label="Sharing shortcut"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="min-h-11 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {status === 'copied' ? (
          <>
            <Check aria-hidden="true" />
            Reddit links copied
          </>
        ) : status === 'failed' ? (
          <>
            <OctagonAlert aria-hidden="true" />
            Copy failed
          </>
        ) : (
          <>
            <Copy aria-hidden="true" />
            Copy Reddit starter links
          </>
        )}
      </Button>
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Reddit starter links copied to clipboard.'
          : status === 'failed'
            ? 'The Reddit starter links could not be copied.'
            : ''}
      </span>
    </aside>
  );
}
