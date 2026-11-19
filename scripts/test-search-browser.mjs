/**
 * Browser regressions for an initialized Codex in-app browser session:
 * const tests = await import('file:///absolute/repo/scripts/test-search-browser.mjs');
 * const result = await tests.testSearchBrowser(tab, browser, 'http://127.0.0.1:4321');
 * nodeRepl.write(result);
 * Pass undefined, { width: 390, height: 844 } as the last two arguments for mobile.
 * Requires a running dev or preview server. This is a native-browser check, not CI.
 */
export async function testSearchBrowser(tab, browser, baseUrl, variants = ['inline', 'dialog', 'page'], viewportSize) {
  const failures = [];
  const passed = [];
  const viewport = await browser.capabilities.get('viewport');
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const check = async (name, run) => {
    try {
      await run();
      passed.push(name);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  };

  try {
    if (viewportSize) await viewport.set(viewportSize);
    for (const variant of variants) {
      try {
        await tab.goto(`${baseUrl}${variant === 'page' ? '/search' : '/'}`);
        // Wait for React before typing; the server-rendered input exists earlier.
        await tab.playwright.locator('astro-island[component-export="SearchBox"][ssr]').first().waitFor({ state: 'detached' });
        if (variant === 'dialog') {
          await tab.playwright.getByRole('link', { name: 'Search the guide', exact: true }).click();
        }
        const input = variant === 'dialog'
          ? tab.playwright.getByRole('combobox', { name: 'Search all pages' })
          : tab.playwright.locator('astro-island[component-export="SearchBox"]:not([ssr])').getByRole('combobox', { name: 'Search all pages' });
        await input.waitFor({ state: 'visible' });
        await input.fill('clonidine');
        await tab.playwright.getByRole('option').filter({ visible: true }).first().waitFor({ state: 'visible' });

        await check(`${variant}: clear target is at least 44 × 44`, async () => {
          const size = await tab.playwright.evaluate(() => {
            const rect = document.querySelector('button[aria-label="Clear search"]').getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
          assert(size.width >= 44 && size.height >= 44, `measured ${size.width} × ${size.height}`);
        });

        await input.fill('sleep');
        await check(`${variant}: pending results have no active descendant`, async () => {
          assert(await tab.playwright.getByRole('status').filter({ hasText: 'Searching the guide' }).isVisible(), 'missed the debounce window; rerun this check');
          assert(!(await input.getAttribute('aria-activedescendant')), 'points at a result hidden while searching');
        });
        await tab.playwright.getByRole('option').filter({ visible: true }).first().waitFor({ state: 'visible' });
        await input.fill('clonidine');
        await tab.playwright.getByRole('option').filter({ visible: true }).first().waitFor({ state: 'visible' });
        await check(`${variant}: Enter cannot open the previous query`, async () => {
          const before = new URL(await tab.url());
          // Keep these consecutive to reach Enter inside the 120ms debounce.
          await input.fill('sleep');
          await input.press('Enter');
          const after = new URL(await tab.url());
          assert(after.pathname === before.pathname && after.hash === before.hash, `navigated to ${after.pathname}${after.hash}`);
        });

        // Skip dependent checks if the regression navigated away from search.
        if (!(await input.isVisible())) continue;
        await tab.playwright.getByRole('option').filter({ visible: true }).first().waitFor({ state: 'visible' });
        await check(`${variant}: clearing search returns focus to the input`, async () => {
          await tab.playwright.getByRole('button', { name: 'Clear search', exact: true }).click();
          const state = await tab.playwright.evaluate(() => ({
            label: document.activeElement?.getAttribute('aria-label'),
            value: document.activeElement?.value,
          }));
          assert(state.label === 'Search all pages' && state.value === '', 'clear did not leave an empty, focused input');
        });
        await input.fill('sleep');
        await tab.playwright.getByRole('option').filter({ visible: true }).first().waitFor({ state: 'visible' });

        await check(`${variant}: Escape dismisses or clears search`, async () => {
          await input.press('Escape');
          if (variant === 'dialog') {
            assert(!(await tab.playwright.getByRole('dialog').isVisible()), 'dialog stayed open');
            assert(await tab.playwright.evaluate(() => document.activeElement?.getAttribute('aria-label')) === 'Search the guide', 'focus did not return to the search trigger');
            await tab.playwright.getByRole('link', { name: 'Search the guide', exact: true }).click();
          } else {
            assert(await input.getAttribute('aria-expanded') === 'false', 'results stayed expanded');
            if (variant === 'inline') await input.press('ArrowDown');
            else await input.fill('sleep');
          }
        });

        await tab.playwright.getByRole('option').filter({ visible: true }).first().waitFor({ state: 'visible' });
        await check(`${variant}: arrows and Enter open a current result`, async () => {
          const options = tab.playwright.getByRole('option').filter({ visible: true });
          const expectedId = await options.nth(1).getAttribute('id');
          const expectedUrl = await options.nth(1).getAttribute('href');
          await input.press('ArrowDown');
          assert(await input.getAttribute('aria-activedescendant') === expectedId, 'ArrowDown did not select the second result');
          await tab.playwright.expectNavigation(() => input.press('Enter'));
          assert(await tab.url() === new URL(expectedUrl, baseUrl).href, 'Enter did not open the selected result');
        });
      } catch (error) {
        failures.push(`${variant}: setup or follow-up failed: ${error.message}`);
      }
    }
  } finally {
    await viewport.reset();
  }
  return { passed, failures };
}
