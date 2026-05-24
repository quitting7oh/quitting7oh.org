import * as React from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const SHOW_AFTER_PX = 400;

export function BackToTop() {
  const [shown, setShown] = React.useState(false);
  const prefersReducedMotion = React.useRef(false);

  React.useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const update = () => setShown(window.scrollY > SHOW_AFTER_PX);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion.current ? 'auto' : 'smooth',
    });
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
