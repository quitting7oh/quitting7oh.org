import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const bannerPath = 'src/components/SchedulingBanner.astro';
const pagePath = 'src/content/compounds/7-oh-ban.md';
const reviewedDocuments = [
  '2026-13580', '2026-13581', '2026-13608', '2026-17429',
  '2026-17409', '2026-13364', '2026-17531',
];

function fixture(t, { drift = false } = {}) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ban-status-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  for (const file of [bannerPath, pagePath]) {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(cwd, file));
  }
  if (drift) {
    const page = fs.readFileSync(path.join(cwd, pagePath), 'utf8');
    assert.ok(page.includes('comments posted'));
    fs.writeFileSync(path.join(cwd, pagePath), page.replaceAll('comments posted', 'posted submissions'));
  }
  const read = () => [bannerPath, pagePath].map((file) => fs.readFileSync(path.join(cwd, file), 'utf8'));
  return {
    read,
    editBanner(transform) {
      fs.writeFileSync(path.join(cwd, bannerPath), transform(read()[0]));
    },
    run({ unreviewed = false, countUnavailable = false, withoutKey = false, now = '2099-01-02T12:00:00Z' } = {}) {
      // Run the unmodified updater against real files, with only the clock and APIs replaced.
      const preload = `
        const NativeDate = Date;
        globalThis.Date = class extends NativeDate {
          constructor(...args) { super(...(args.length ? args : [${JSON.stringify(now)}])); }
        };
        globalThis.fetch = async (url) => {
          if (url.startsWith('https://www.federalregister.gov/api/v1/documents.json?')) {
            const numbers = ${JSON.stringify(reviewedDocuments)};
            if (${unreviewed}) numbers.push('2099-99999');
            return { ok: true, json: async () => ({ results: numbers.map(document_number => ({
              document_number, publication_date: '2026-09-01', title: 'Fixture document',
            })) }) };
          }
          if (url.startsWith('https://api.regulations.gov/v4/comments?')) {
            if (${countUnavailable}) throw new Error('Fixture API outage');
            return { ok: true, json: async () => ({ meta: { totalElements: 45678 } }) };
          }
          throw new Error('Unexpected URL: ' + url);
        };
      `;
      const result = spawnSync(process.execPath, [
        '--import', `data:text/javascript,${encodeURIComponent(preload)}`,
        path.join(root, 'scripts/update-ban-status.mjs'),
      ], {
        cwd,
        env: { REGSGOV_API_KEY: withoutKey ? '' : 'fixture-only' },
        encoding: 'utf8',
        timeout: 10_000,
      });
      assert.ifError(result.error);
      return result;
    },
  };
}

test('refreshes the current ban page with past-tense comment wording', (t) => {
  const f = fixture(t);
  const submissions = f.read()[1].match(/The docket reported \*\*[\d,]+ submissions received\*\* on [A-Z][a-z]+ \d+, \d{4}\./)?.[0];
  assert.ok(submissions, 'The manually verified submission total must be present.');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const [banner, page] = f.read();
  assert.match(banner, /^const LAST_CHECKED = '2099-01-02';$/m);
  assert.match(banner, /Federal bans:/);
  assert.match(banner.replace(/<[^>]*>/g, ''), /Proposed for 7-OH\. In effect for pseudo and MGM-15\./);
  assert.match(page, /last_updated: "2099-01-02"/);
  assert.match(page, /Last verified against primary sources on January 2, 2099\./);
  assert.match(page, /As of January 2, 2099, 7-OH is not banned\./);
  assert.match(page, /\| \*\*January 2, 2099\*\* \| Latest check against the Federal Register/);
  assert.match(page, /As of January 2,\n\[the docket\][^\n]+\nshowed 45,678 comments posted\./);
  assert.ok(page.includes(submissions), 'Preserve the manual total and its verification date.');

  const unchanged = f.read();
  const rerun = f.run();
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.match(rerun.stdout, /verification-only run/);
  assert.deepEqual(f.read(), unchanged);

  const newDocument = f.run({ unreviewed: true });
  assert.equal(newDocument.status, 2, newDocument.stderr);
  assert.match(newDocument.stderr, /UNREVIEWED Federal Register document/);
  assert.deepEqual(f.read(), unchanged);
});

test('leaves both files untouched when the comment text drifts', (t) => {
  const f = fixture(t, { drift: true });
  const before = f.read();
  const result = f.run();
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /Pattern not found.*posted-comment count/);
  assert.deepEqual(f.read(), before);
});

test('refuses to refresh stale dates when a document has not been reviewed', (t) => {
  const f = fixture(t);
  const before = f.read();
  const result = f.run({ unreviewed: true });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /UNREVIEWED Federal Register document/);
  assert.deepEqual(f.read(), before);
});

for (const options of [{ countUnavailable: true }, { withoutKey: true }]) {
  test(`refreshes dates but preserves the count when ${options.withoutKey ? 'the API key is absent' : 'the count API fails'}`, (t) => {
    const f = fixture(t);
    const count = f.read()[1].match(/showed [\d,]+ comments posted\./)?.[0];
    assert.ok(count);
    const result = f.run(options);
    assert.equal(result.status, 0, result.stderr);
    const [banner, page] = f.read();
    assert.match(banner, /^const LAST_CHECKED = '2099-01-02';$/m);
    assert.match(page, /last_updated: "2099-01-02"/);
    assert.ok(page.includes(count));
  });
}

for (const kind of ['missing', 'duplicate']) {
  test(`leaves both files untouched when the banner date is ${kind}`, (t) => {
    const f = fixture(t);
    assert.equal(f.run().status, 0);
    f.editBanner((banner) => banner.replace(
      "const LAST_CHECKED = '2099-01-02';",
      kind === 'missing' ? '' : "const LAST_CHECKED = '2099-01-02';\nconst LAST_CHECKED = '2099-01-02';",
    ));
    const before = f.read();
    // Even today's date must not bypass the banner's structural checks.
    const result = f.run();
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Expected 1 match\(es\).*banner last-checked date/);
    assert.deepEqual(f.read(), before);
  });
}

test('refreshes the same month and day in a new year', (t) => {
  const f = fixture(t);
  assert.equal(f.run().status, 0);
  const result = f.run({ now: '2100-01-02T12:00:00Z' });
  assert.equal(result.status, 0, result.stderr);
  const [banner, page] = f.read();
  assert.match(banner, /^const LAST_CHECKED = '2100-01-02';$/m);
  assert.match(page, /last_updated: "2100-01-02"/);
});

test('refreshes the date without depending on or overwriting banner wording', (t) => {
  const f = fixture(t);
  const wording = 'Fixture editorial copy independent of the date.';
  f.editBanner((banner) => banner.replace(
    'Proposed for ', wording,
  ));
  assert.ok(f.read()[0].includes(wording));
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const [banner, page] = f.read();
  assert.match(banner, /^const LAST_CHECKED = '2099-01-02';$/m);
  assert.ok(banner.includes(wording));
  assert.match(page, /last_updated: "2099-01-02"/);
});

test('uses the New York calendar day for both the banner and page', (t) => {
  const f = fixture(t);
  assert.equal(f.run().status, 0);
  const before = f.read();
  const sameDay = f.run({ now: '2099-01-03T03:00:00Z' });
  assert.equal(sameDay.status, 0, sameDay.stderr);
  assert.match(sameDay.stdout, /verification-only run/);
  assert.deepEqual(f.read(), before);

  const nextDay = f.run({ now: '2099-01-03T05:00:00Z' });
  assert.equal(nextDay.status, 0, nextDay.stderr);
  const [banner, page] = f.read();
  assert.match(banner, /^const LAST_CHECKED = '2099-01-03';$/m);
  assert.match(page, /last_updated: "2099-01-03"/);
});
