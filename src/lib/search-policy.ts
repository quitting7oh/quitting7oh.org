import type { StoredSearchResult } from './search-config';

export interface PinnedSearchResult extends StoredSearchResult {
  pinned: true;
  pinLabel: string;
}

function pinnedResult(
  pageUrl: string,
  title: string,
  excerpt: string,
  pinLabel: string,
  categoryLabel = 'Start Here',
): PinnedSearchResult {
  return {
    id: `pin:${pageUrl}`,
    pageUrl,
    url: pageUrl,
    title,
    section: '',
    excerpt,
    category: 'start-here',
    categoryLabel,
    type: 'Guide',
    priority: 10,
    pinned: true,
    pinLabel,
  };
}

const SELF_HARM = /\b(suicid(?:e|al)|kill myself|end my life|want to die|dont want to live|do not want to live|hurt myself)\b/i;
const SELF_HARM_NEGATION = /\b(?:not|never|dont|do not|isnt|is not|arent|am not)\s+(?:feeling\s+)?(?:suicidal|thinking about suicide|going to hurt myself|wanting to die)\b/i;
const OVERDOSE_EMERGENCY = /\b(overdos(?:e|ed|ing)|not breathing|stopped breathing|blue lips|turning blue|unresponsive|wont wake|will not wake|cant wake|cannot wake)\b/i;
const TOO_MUCH = /\b(took|used|swallowed|ate|had)\s+(?:way\s+)?too much\b/i;
const OPIOID_LIKE_SUBSTANCE = /\b(7\s*[- ]?oh|7oh|kratom|mgm\s*[- ]?15|mgm15|suboxone|bupe|buprenorphine|opioid|opiate|fentanyl|heroin)\b/i;
const DANGEROUS_MIX = /\b(mix(?:ed|ing)?|combined|took together|used together|took .* with)\b/i;
const DEPRESSANT = /\b(xanax|alprazolam|benzo|benzodiazepine|alcohol|liquor|gabapentin|pregabalin|lyrica|sleeping pill|sedative)\b/i;
const IMPAIRED_CONSCIOUSNESS = /\b(cant stay awake|cannot stay awake|very sleepy|hard to wake|slowed breathing|slow breathing|nodding out)\b/i;
const CHILD_INGESTION = /\b(child|kid|toddler|baby|son|daughter)\b.*\b(swallowed|took|ate|drank|ingested)\b|\b(swallowed|took|ate|drank|ingested)\b.*\b(child|kid|toddler|baby|son|daughter)\b/i;
const MEDICAL_RED_FLAG = /\b(chest pain|seizure|seizing|fainted|passed out|vomiting blood|throwing up blood|cant keep (?:water|fluids) down|cannot keep (?:water|fluids) down)\b/i;
const VIOLENCE = /\b(hit me|hits me|hitting me|threaten(?:ed|ing)? me|violent|violence|weapon|gun|knife|afraid for my safety|unsafe at home)\b/i;
const HOME_CONTEXT = /\b(partner|boyfriend|girlfriend|husband|wife|spouse|parent|home|house|child|children|kid|kids)\b/i;
const PRECIPITATED = /\b(precipitated withdrawal|precipitated withdrawl|precip withdraw|pwd)\b/i;
const RELAPSE_NOW = /\b(about to use|going to use|want to redose|thinking about using|thinking of using|fuck its|strong craving|craving right now|cant stop craving|cannot stop craving)\b/i;

/**
 * Search ranking is useful, but urgent intents should not depend on ranking.
 * These deliberately narrow rules pin a relevant route only when the wording
 * is specific enough to justify interrupting ordinary results.
 */
export function getPinnedSearchResults(rawQuery: string): PinnedSearchResult[] {
  const query = rawQuery
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .trim();

  if (!query) return [];

  if (SELF_HARM.test(query) && !SELF_HARM_NEGATION.test(query)) {
    return [
      pinnedResult(
        '/resources/crisis-hotlines',
        'Get immediate crisis help',
        'If you may hurt yourself, call or text 988 now. If danger is immediate, call 911.',
        'Immediate help',
        'Resources',
      ),
    ];
  }

  if (
    OVERDOSE_EMERGENCY.test(query) ||
    (TOO_MUCH.test(query) && OPIOID_LIKE_SUBSTANCE.test(query)) ||
    (CHILD_INGESTION.test(query) && OPIOID_LIKE_SUBSTANCE.test(query)) ||
    (DANGEROUS_MIX.test(query) && OPIOID_LIKE_SUBSTANCE.test(query) && DEPRESSANT.test(query) && IMPAIRED_CONSCIOUSNESS.test(query))
  ) {
    return [
      pinnedResult(
        '/resources/crisis-hotlines',
        'Possible overdose or poisoning',
        'Call 911 now for breathing problems or unresponsiveness. Poison Control in the US: 1-800-222-1222.',
        'Emergency guidance',
        'Resources',
      ),
      pinnedResult(
        '/for-loved-ones/safety',
        'Safety steps for someone nearby',
        'What to watch for and what to do while emergency help is on the way.',
        'Safety guide',
        'For Loved Ones',
      ),
    ];
  }

  if (MEDICAL_RED_FLAG.test(query)) {
    return [
      pinnedResult(
        '/resources/crisis-hotlines',
        'Know when to get urgent medical care',
        'Chest pain, seizures, fainting, blood in vomit, or severe dehydration need prompt medical evaluation.',
        'Urgent medical help',
        'Resources',
      ),
      pinnedResult(
        '/start-here/7-oh-withdrawal-guide#when-to-go-to-the-er',
        'When to go to the ER',
        'Withdrawal-specific red flags and what to expect when you arrive.',
        'Withdrawal guide',
      ),
    ];
  }

  if (VIOLENCE.test(query) && HOME_CONTEXT.test(query)) {
    return [
      pinnedResult(
        '/for-loved-ones/safety',
        'Put your safety first',
        'Practical safety planning for you and any children in the home.',
        'Safety guide',
        'For Loved Ones',
      ),
      pinnedResult(
        '/resources/crisis-hotlines',
        'Crisis and domestic-violence contacts',
        'Immediate phone, text, and chat support in the United States.',
        'Immediate help',
        'Resources',
      ),
    ];
  }

  if (PRECIPITATED.test(query)) {
    return [
      pinnedResult(
        '/mat-suboxone/sows-cows-induction-guide',
        'Check withdrawal severity before induction',
        'Use SOWS or COWS to reduce the risk of taking buprenorphine too early.',
        'Induction timing',
        'MAT / Suboxone',
      ),
    ];
  }

  if (RELAPSE_NOW.test(query)) {
    return [
      pinnedResult(
        '/start-here/cravings-and-relapse-thoughts',
        'Get through the craving in front of you',
        'A short plan for the moment when using again feels inevitable.',
        'Right now',
      ),
    ];
  }

  return [];
}

/** Remove a specifically negated self-harm phrase from lexical ranking. */
export function queryForSearchIndex(rawQuery: string): string {
  if (!SELF_HARM_NEGATION.test(rawQuery)) return rawQuery;
  return rawQuery.replace(SELF_HARM_NEGATION, ' ').replace(/\s+/g, ' ').trim();
}
