import * as React from 'react';
import { SITE } from '~/lib/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-muted/50">
      <div className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {SITE.title}.org
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {SITE.description}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Medical disclaimer</p>
            <p className="mt-2">
              This is community-compiled information, not medical advice.
              Nothing here is a substitute for a conversation with a qualified
              clinician familiar with your situation. If you are in immediate
              crisis, call or text 988 (US) or your local emergency number.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">AI disclaimer</p>
            <p className="mt-2">
              Yes, we used AI to help build out some of this content. The
              source is community members who've lived through 7-OH and
              kratom-synthetic recovery; humans verify every factual claim
              against a primary source.
            </p>
            <p className="mt-2">
              Those humans made a good-faith effort to validate every page,
              but they are sadly jelly-filled meat bags that aren't the
              product of billionaires siphoning money out of the working
              class. The use of AI here is a simple fact, one you can accept
              or not.{' '}
              <a
                href="/about/this-site#the-ai-disclaimer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                Full disclaimer →
              </a>
            </p>
            <p className="mt-3 text-foreground">
              Don't like that? Go read something else.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Contribute</p>
            <p className="mt-2">
              This site is community-maintained. Open an issue or pull request
              on{' '}
              <a
                href={SITE.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                GitHub
              </a>{' '}
              to suggest a correction or addition.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {SITE.title}.org · No accounts, no tracking, no
            monetization.
          </p>
          <nav aria-label="Site footer" className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/sitemap" className="hover:text-foreground">
              Site map
            </a>
            <a href="/about/community" className="hover:text-foreground">
              Community
            </a>
            <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
