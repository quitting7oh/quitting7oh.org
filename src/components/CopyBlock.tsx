import * as React from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * A scrollable code/text block with a copy-to-clipboard button. Used on
 * /brand to let people grab the AI agent context in one click.
 */
export function CopyBlock({ text, filename }: { text: string; filename?: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  const onCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{filename ?? 'context'}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary"
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-primary" /> Copied</>
          ) : (
            <><Copy className="h-3.5 w-3.5" /> Copy</>
          )}
        </button>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-4 text-xs leading-relaxed text-foreground">
        <code>{text}</code>
      </pre>
    </div>
  );
}
