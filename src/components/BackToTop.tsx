import * as React from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const SHOW_AFTER_PX = 400;
const SCROLL_DURATION_MS = 500; // Fixed max — distance-independent.

/** Custom scroll-to-top animation with a fixed duration cap.
 *  The browser's native smooth scroll is distance-proportional, so from
 *  the bottom of a long article it can take 3+ seconds — which feels
 *  broken. This always completes in ~500ms regardless of how far we are
 *  from the top. */
function smoothScrollToTop() {
  const startY = window.scrollY;
  if (startY === 0) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  const startTime = performance.now();
  // ease-out cubic: fast start, gentle landing
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  function step(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / SCROLL_DURATION_MS);
    const y = startY * (1 - ease(t));
    // 'instant' here bypasses the page-level CSS scroll-behavior:smooth
    // so our animation isn't fighting the browser's separate animation.
    window.scrollTo({ top: y, behavior: 'instant' });
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function BackToTop() {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const update = () => setShown(window.scrollY > SHOW_AFTER_PX);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    smoothScrollToTop();
    e.currentTarget.blur();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-20 h-11 w-11 rounded-full shadow-lg transition-all duration-200',
        'sm:bottom-8 sm:right-8',
        shown
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
