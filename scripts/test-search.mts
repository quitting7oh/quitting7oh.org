import fs from 'node:fs';
import MiniSearch from 'minisearch';
import {
  getMiniSearchOptions,
  SEARCH_OPTIONS,
  type SearchDocument,
} from '../src/lib/search-config.ts';
import { getPinnedSearchResults, queryForSearchIndex } from '../src/lib/search-policy.ts';

interface Payload {
  version: number;
  index: unknown;
}

const indexPath = new URL('../dist/search-index.json', import.meta.url);
if (!fs.existsSync(indexPath)) {
  throw new Error('dist/search-index.json does not exist. Run npm run build before npm run test:search.');
}

const payload = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as Payload;
const miniSearch = MiniSearch.loadJSON<SearchDocument>(
  JSON.stringify(payload.index),
  getMiniSearchOptions(),
);

function rankedPages(query: string): string[] {
  const pinned = getPinnedSearchResults(query).map((result) => result.pageUrl);
  const pages = miniSearch.search(queryForSearchIndex(query) || query, SEARCH_OPTIONS).map((result) => String(result.pageUrl));
  return [...new Set([...pinned, ...pages])];
}

const rankingCases = [
  ['withdrawal tonight', '/start-here/7-oh-withdrawal-guide'],
  ['helper medications', '/medications-supplements/helper-meds'],
  ['clondine', '/medications-supplements/helper-meds'],
  ['precipitated withdrawl', '/mat-suboxone/sows-cows-induction-guide'],
  ['sleep after quitting', '/post-acute/sleep-recovery'],
  ['MGM15', '/compounds/mgm15'],
  ['pseudo', '/compounds/mitragynine-pseudoindoxyl'],
  ['taper calculator', '/resources/taper-calculator'],
  ['NA meeting', '/virtual-na-meetings-now'],
  ['SMART recovery', '/virtual-smart-meetings-now'],
  ['job protection', '/for-you/fmla-ada-job'],
  ['craving right now', '/start-here/cravings-and-relapse-thoughts'],
  ['I feel depressed but I am not suicidal', '/post-acute/depression-and-anhedonia'],
] as const;

const safetyCases = [
  ['I want to kill myself', '/resources/crisis-hotlines'],
  ['mixed 7oh with xanax and very sleepy', '/resources/crisis-hotlines'],
  ['my partner threatened me with a gun at home', '/for-loved-ones/safety'],
] as const;

const standardPins = [
  ['precipitated withdrawal', '/mat-suboxone/sows-cows-induction-guide'],
  ['craving right now', '/start-here/cravings-and-relapse-thoughts'],
] as const;

const intentCases = [
  ['make it stop', '/start-here/7-oh-withdrawal-help'],
  ["I'm 24 hours in", '/start-here/7-oh-withdrawal-help'],
  ['when will it be over?', '/start-here/7-oh-withdrawal-guide#hour-by-hour-timeline'],
  ['what day is the worst?', '/start-here/7-oh-withdrawal-guide#hour-by-hour-timeline'],
  ['when will I feel normal again?', '/post-acute/7-oh-recovery-timeline'],
  ["I haven't slept in three days", '/post-acute/sleep-recovery'],
  ['what can I take for sleep?', '/medications-supplements/helper-meds#sleep-medications'],
  ['what helps withdrawal?', '/medications-supplements/helper-meds#quick-reference'],
  ['what supplements help?', '/medications-supplements/vitamins-supplements'],
  ['what should I buy before quitting?', '/start-here/7-oh-withdrawal-quickstart'],
  ['cold turkey or taper?', '/start-here/how-to-quit-7-oh'],
  ['make me a taper schedule', '/resources/taper-calculator'],
  ['I have 10 pills left', '/resources/taper-calculator'],
  ['will I be able to work tomorrow?', '/start-here/7-oh-withdrawal-guide#hour-by-hour-timeline'],
  ['what do I tell HR?', '/for-you/fmla-ada-job'],
  ['how long should I wait to take Suboxone?', '/mat-suboxone/sows-cows-induction-guide'],
  ["Suboxone isn't working", '/mat-suboxone/why-suboxone-isnt-working'],
  ['talk me out of using', '/start-here/cravings-and-relapse-thoughts'],
  ['did I reset everything?', '/post-acute/kindling-and-relapse#if-youve-already-used'],
  ['can I switch to kratom powder?', '/medications-supplements/quit-7-oh-with-kratom-leaf'],
  ["I can't go to rehab", '/for-you/at-home-treatment'],
  ['is anyone awake?', '/next-kratom-support-meeting'],
  ['should I go to the ER?', '/start-here/7-oh-withdrawal-guide#when-to-go-to-the-er'],
] as const;

const intentNegativeControls = [
  'how long is the Suboxone half life?',
  'how do I make the page stop scrolling?',
  "I can't take Suboxone in the morning",
  'I work on withdrawal research',
  'when will the ban be over?',
] as const;

const failures: string[] = [];

for (const [query, expected] of [...rankingCases, ...safetyCases]) {
  const actual = rankedPages(query)[0];
  const passed = actual === expected;
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${query} -> ${actual ?? '(none)'}`);
  if (!passed) failures.push(`“${query}” expected ${expected}, received ${actual ?? '(none)'}`);
}

for (const [query, expected] of standardPins) {
  const pins = getPinnedSearchResults(query);
  const passed = pins.length === 1 && pins[0]?.pageUrl === expected && pins[0]?.emphasis === 'standard';
  console.log(`${passed ? 'PASS' : 'FAIL'}  quiet best match for: ${query}`);
  if (!passed) failures.push(`“${query}” did not produce one quiet ${expected} result`);
}

for (const [query, expectedUrl] of intentCases) {
  const match = getPinnedSearchResults(query)[0];
  const passed = match?.url === expectedUrl && match.emphasis === 'standard';
  console.log(`${passed ? 'PASS' : 'FAIL'}  intent: ${query} -> ${match?.url ?? '(none)'}`);
  if (!passed) failures.push(`“${query}” expected quiet route ${expectedUrl}, received ${match?.url ?? '(none)'}`);
}

for (const query of intentNegativeControls) {
  const match = getPinnedSearchResults(query)[0];
  const passed = !match;
  console.log(`${passed ? 'PASS' : 'FAIL'}  no intent hijack for: ${query}`);
  if (!passed) failures.push(`“${query}” unexpectedly routed to ${match.url}`);
}

for (const [query] of safetyCases) {
  const pins = getPinnedSearchResults(query);
  const passed = pins.length === 1 && pins[0]?.emphasis === 'urgent';
  console.log(`${passed ? 'PASS' : 'FAIL'}  one concise safety result for: ${query}`);
  if (!passed) failures.push(`“${query}” did not produce exactly one concise safety result`);
}

for (const query of ['I feel depressed but I am not suicidal', 'general anxiety help', 'withdrawal help']) {
  const pins = getPinnedSearchResults(query);
  const passed = pins.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'}  no urgent pin for: ${query}`);
  if (!passed) failures.push(`“${query}” unexpectedly triggered ${pins[0]?.pageUrl}`);
}

const changelogPresent = miniSearch.search('changelog', SEARCH_OPTIONS)
  .some((result) => result.pageUrl === '/about/changelog');
console.log(`${changelogPresent ? 'FAIL' : 'PASS'}  changelog route excluded from the index`);
if (changelogPresent) failures.push('The public changelog appeared in MiniSearch results.');

if (failures.length) {
  console.error(`\n${failures.length} search regression${failures.length === 1 ? '' : 's'} failed:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`\nAll ${rankingCases.length + safetyCases.length * 2 + standardPins.length + intentCases.length + intentNegativeControls.length + 4} search regressions passed.`);
}
