import * as React from 'react';
import { Phone, MessageSquare, ExternalLink, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';

type Hotline = {
  name: string;
  blurb: string;
  /** Phone number formatted for display (e.g., "988", "1-800-662-4357"). */
  display: string;
  /** Phone number formatted for tel: link (digits only). */
  tel: string;
  /** Optional second action (text-message line). */
  sms?: { display: string; href: string };
  /** Website for chat/more info. Opens in a new tab. */
  url: string;
};

const HOTLINES: Hotline[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    blurb:
      'If you are thinking about suicide or self-harm, or worried about someone who is. Call or text.',
    display: '988',
    tel: '988',
    sms: { display: 'Text 988', href: 'sms:988' },
    url: 'https://988lifeline.org',
  },
  {
    name: '911 — Medical Emergency',
    blurb:
      'For seizures, can’t keep water down for 24+ hours, chest pain, suspected overdose, anything actively dangerous. Stop reading and call.',
    display: '911',
    tel: '911',
    url: 'https://www.911.gov',
  },
  {
    name: 'SAMHSA National Helpline',
    blurb:
      'Free, confidential, 24/7. Real humans who will give you referrals based on your zip code and insurance. The single most useful number for finding treatment.',
    display: '1-800-662-4357',
    tel: '18006624357',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
  },
  {
    name: 'National Domestic Violence Hotline',
    blurb: 'If you or someone you love is in a situation that isn’t safe. 24/7.',
    display: '1-800-799-7233',
    tel: '18007997233',
    sms: { display: 'Text START to 88788', href: 'sms:88788?body=START' },
    url: 'https://www.thehotline.org',
  },
  {
    name: 'Childhelp National Child Abuse Hotline',
    blurb:
      'Confidential, 24/7. Will help you think through whether what you’re seeing meets the threshold and what to do next.',
    display: '1-800-422-4453',
    tel: '18004224453',
    url: 'https://www.childhelphotline.org',
  },
  {
    name: 'Poison Control',
    blurb:
      'For accidental overdose or ingestion when it isn’t (yet) a 911-level emergency. They can advise on what to watch for.',
    display: '1-800-222-1222',
    tel: '18002221222',
    url: 'https://www.poison.org',
  },
];

const SESSION_KEY = 'crisis-button-dismissed';
const PERSISTENT_KEY = 'crisis-button-disabled';

export function CrisisButton() {
  // Default to hidden during SSR so it never flashes before we know whether
  // the user has dismissed it.
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(PERSISTENT_KEY) === '1') return;
      if (sessionStorage.getItem(SESSION_KEY) === '1') return;
      setHidden(false);
    } catch {
      // Storage blocked → still show the button (safer default for a
      // crisis affordance than hiding it).
      setHidden(false);
    }
  }, []);

  const dismissForSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setHidden(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore
    }
  };

  const dismissForever = () => {
    setHidden(true);
    try {
      localStorage.setItem(PERSISTENT_KEY, '1');
    } catch {
      // ignore
    }
  };

  if (hidden) return null;

  return (
    <Sheet>
      <div className="fixed bottom-6 left-6 z-20 sm:bottom-8 sm:left-8">
        <SheetTrigger
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-amber-500 bg-amber-50 pl-4 pr-10 text-sm font-semibold text-amber-900 shadow-lg transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-amber-400 dark:bg-amber-950/70 dark:text-amber-100 dark:hover:bg-amber-950"
          aria-label="Open crisis resources"
        >
          <span aria-hidden="true">🆘</span>
          <span>Crisis</span>
        </SheetTrigger>
        {/* The X sits on top of the right side of the pill — its own
            button so clicking it dismisses without triggering the Sheet. */}
        <button
          type="button"
          onClick={dismissForSession}
          aria-label="Hide crisis button"
          className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-amber-900/70 hover:bg-amber-200/80 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-100/70 dark:hover:bg-amber-900 dark:hover:text-amber-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-xl">Crisis resources</SheetTitle>
          <SheetDescription>
            If you or someone you love needs help right now. These lines
            are staffed 24/7 unless noted.
          </SheetDescription>
        </SheetHeader>
        <ul className="space-y-5 px-4 pb-6">
          {HOTLINES.map((h) => (
            <li key={h.name} className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {h.name}
              </h3>
              <p className="text-sm text-muted-foreground">{h.blurb}</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${h.tel}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {h.display}
                </a>
                {h.sms && (
                  <a
                    href={h.sms.href}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    {h.sms.display}
                  </a>
                )}
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Website
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-4 py-4">
          <p className="text-xs text-muted-foreground">
            All of the above also lives at{' '}
            <a
              href="/resources/crisis-hotlines"
              className="text-primary hover:underline"
            >
              Crisis Hotlines
            </a>{' '}
            if you’d rather bookmark a page. Looking for treatment, not
            crisis? Visit{' '}
            <a
              href="https://findtreatment.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              findtreatment.gov
            </a>
            {' '}or read our{' '}
            <a
              href="/start-here/withdrawal-help"
              className="text-primary hover:underline"
            >
              Withdrawal Help
            </a>{' '}
            page.
          </p>
          <button
            type="button"
            onClick={dismissForever}
            className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Don’t show this button again
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
