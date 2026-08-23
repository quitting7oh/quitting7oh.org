import type { SearchResultType, StoredSearchResult } from './search-config';

export interface PinnedSearchResult extends StoredSearchResult {
  pinned: true;
  pinLabel: string;
  emphasis: 'standard' | 'urgent';
}

function pinnedResult(
  pageUrl: string,
  title: string,
  excerpt: string,
  options: {
    pinLabel?: string;
    category?: string;
    categoryLabel?: string;
    type?: SearchResultType;
    emphasis?: PinnedSearchResult['emphasis'];
  } = {},
): PinnedSearchResult {
  const canonicalPageUrl = pageUrl.split('#')[0] || pageUrl;
  return {
    id: `pin:${pageUrl}`,
    pageUrl: canonicalPageUrl,
    url: pageUrl,
    title,
    section: '',
    excerpt,
    category: options.category ?? canonicalPageUrl.split('/')[1] ?? 'start-here',
    categoryLabel: options.categoryLabel ?? 'Start Here',
    type: options.type ?? 'Guide',
    priority: 10,
    pinned: true,
    pinLabel: options.pinLabel ?? '',
    emphasis: options.emphasis ?? 'standard',
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
const RELAPSE_NOW = /\b(about to use|about to buy (?:more|some)|going to use|want to redose|thinking about using|thinking of using|talk me out of (?:using|buying more)|fuck its|strong craving|craving right now|cant stop craving|cannot stop craving|cant stop thinking about (?:it|using)|cannot stop thinking about (?:it|using))\b/i;

interface IntentRule {
  test: RegExp;
  url: string;
  title: string;
  excerpt: string;
  categoryLabel?: string;
  category?: string;
  type?: SearchResultType;
}

const INTENT_RULES: IntentRule[] = [
  {
    test: /^(?:please\s+)?make it stop[.!]*$|\b(i cant take (?:this|it) anymore|help me (?:get )?through (?:this|tonight)|what do i do right now|im \d+\s*hours? in|i feel (?:awful|like hell)|this is hell)\b/i,
    url: '/start-here/7-oh-withdrawal-help',
    title: 'A plan for the next hour',
    excerpt: 'Short, practical steps for getting through the part in front of you.',
  },
  {
    test: /^(?:when will it be over|is this normal)[?.!]*$|\b(how long (?:does|will|do) (?:withdrawal|withdrawals|wd|wds) last|when (?:does|will) (?:withdrawal|withdrawals|wd|wds) (?:end|stop)|what day is (?:the )?worst|when does it peak|am i (?:through|past) the worst|day \d+ and still (?:sick|hurting|feeling bad))\b/i,
    url: '/start-here/7-oh-withdrawal-guide#hour-by-hour-timeline',
    title: 'Withdrawal timeline',
    excerpt: 'What tends to happen hour by hour and when the acute phase starts easing.',
  },
  {
    test: /\b(when will i feel normal|will i ever (?:feel|be) (?:normal|myself) again|weeks? later (?:and )?still (?:feel|feeling) (?:bad|awful|sick)|when does my energy come back|why (?:did|have) (?:my )?symptoms? (?:come|came) back|second wave of withdrawal|why am i still (?:depressed|anxious|tired|sick))\b/i,
    url: '/post-acute/7-oh-recovery-timeline',
    title: '7-OH recovery timeline',
    excerpt: 'The longer recovery arc for energy, mood, sleep, and returning to normal.',
    categoryLabel: 'Post-Acute',
  },
  {
    test: /\b(what can i take for sleep|sleep (?:medicine|medication|meds)|(?:trazodone|clonidine|gabapentin) for sleep|medicine for (?:rls|restless legs))\b/i,
    url: '/medications-supplements/helper-meds#sleep-medications',
    title: 'Sleep medications during withdrawal',
    excerpt: 'Common prescription and over-the-counter options, with the important cautions.',
    categoryLabel: 'Meds & Supplements',
  },
  {
    test: /\b(cant sleep|cannot sleep|havent slept|when will (?:i )?sleep (?:return|come back)|when will i sleep again|my legs wont stop|restless legs|skin crawling at night|nightmares? every night|rls at night)\b/i,
    url: '/post-acute/sleep-recovery',
    title: 'Sleep recovery',
    excerpt: 'Why sleep is disrupted, what helps, and how it tends to return.',
    categoryLabel: 'Post-Acute',
  },
  {
    test: /\b(what helps (?:with )?withdrawal|comfort meds|something for chills|what helps nausea|anything for sweating|what can i take for withdrawal|helper meds)\b/i,
    url: '/medications-supplements/helper-meds#quick-reference',
    title: 'Helper medications by symptom',
    excerpt: 'A quick reference for common withdrawal symptoms and medication options.',
    categoryLabel: 'Meds & Supplements',
  },
  {
    test: /\b(what supplements? (?:help|work)|vitamin c protocol|does magnesium help|what supplements? should i avoid|benadryl (?:made|makes) (?:my )?(?:legs|rls) worse|unisom (?:made|makes) (?:my )?(?:legs|rls) worse)\b/i,
    url: '/medications-supplements/vitamins-supplements',
    title: 'Vitamins and supplements',
    excerpt: 'What may help, what to skip, and which combinations need caution.',
    categoryLabel: 'Meds & Supplements',
  },
  {
    test: /\b(cold turkey or taper|how do i quit|where do i start|best way to (?:quit|get off)|i keep failing to quit|i need to get off (?:this|7oh|7-oh)|i need off (?:this|7oh|7-oh))\b/i,
    url: '/start-here/how-to-quit-7-oh',
    title: 'Compare ways to quit 7-OH',
    excerpt: 'Cold turkey, tapering, leaf, helper medications, and MAT compared plainly.',
  },
  {
    test: /\b(how fast should i taper|make me a taper(?:ing)? schedule|i have \d+ (?:pills|tablets) left|how much should i reduce|taper by (?:percentage|percent)|dose reduction schedule)\b/i,
    url: '/resources/taper-calculator',
    title: 'Taper calculators',
    excerpt: 'Build a reduction schedule from the dose and supply you have.',
    categoryLabel: 'Resources',
    type: 'Calculator',
  },
  {
    test: /\b(will i (?:be able to|make it through) work tomorrow|will i (?:feel|be) (?:okay|ok) by (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|i only have \d+ days? off|when will i be functional|functional enough to work)\b/i,
    url: '/start-here/7-oh-withdrawal-guide#hour-by-hour-timeline',
    title: 'Planning around the withdrawal timeline',
    excerpt: 'A realistic timeline for the acute phase and returning to basic responsibilities.',
  },
  {
    test: /\b(fmla|what do i tell hr|can (?:work|my job|my employer) fire me|can i (?:get|be) fired for (?:rehab|detox|treatment)|time off for (?:detox|treatment)|does ada cover|medical leave for (?:detox|rehab|treatment))\b/i,
    url: '/for-you/fmla-ada-job',
    title: 'Work, FMLA, and treatment',
    excerpt: 'Leave, accommodations, privacy, and how to approach an HR conversation.',
    categoryLabel: 'For You',
  },
  {
    test: /\b(when can i take (?:suboxone|subs|bupe|buprenorphine)|how long should i wait (?:to take )?(?:suboxone|subs|bupe|buprenorphine)|am i sick enough for (?:suboxone|subs|bupe)|sows score|cows score|afraid of precipitated withdrawal|precipitated withdrawl|precipitated withdrawal|pwd)\b/i,
    url: '/mat-suboxone/sows-cows-induction-guide',
    title: 'Time Suboxone induction with SOWS or COWS',
    excerpt: 'Use observable withdrawal severity rather than a fixed clock alone.',
    categoryLabel: 'MAT / Suboxone',
  },
  {
    test: /\b(suboxone (?:isnt|is not|not) working|bupe (?:isnt|is not|not) holding me|still withdrawing on (?:suboxone|subs|bupe)|woke up sick after (?:suboxone|subs|bupe)|why do i still feel bad (?:on|after) (?:suboxone|subs|bupe))\b/i,
    url: '/mat-suboxone/why-suboxone-isnt-working',
    title: 'Why Suboxone may not feel like it is working',
    excerpt: 'Coverage gaps, timing, dose questions, and practical next steps.',
    categoryLabel: 'MAT / Suboxone',
  },
  {
    test: RELAPSE_NOW,
    url: '/start-here/cravings-and-relapse-thoughts',
    title: 'Get through the craving in front of you',
    excerpt: 'A short plan for the moment when using again feels inevitable.',
  },
  {
    test: /\b(i slipped|i used again|did i reset (?:everything|withdrawal|withdrawals)|am i back (?:at|to) day one|\d+[- ]day relapse|i failed again|will i (?:withdraw|have withdrawals) again|am i gonna have withdrawals again)\b/i,
    url: '/post-acute/kindling-and-relapse#if-youve-already-used',
    title: 'If you used again',
    excerpt: 'What a lapse may change, what it does not erase, and what to do next.',
    categoryLabel: 'Post-Acute',
  },
  {
    test: /\b(switch to (?:kratom|kratom powder|plain leaf)|will (?:kratom|plain leaf) stop withdrawal|does kratom prolong withdrawal|leaf taper|plain leaf instead of (?:7oh|7-oh)|can i use kratom to quit)\b/i,
    url: '/medications-supplements/quit-7-oh-with-kratom-leaf',
    title: 'Using kratom leaf as a bridge',
    excerpt: 'When plain leaf can help, common mistakes, and how to taper the bridge.',
    categoryLabel: 'Meds & Supplements',
  },
  {
    test: /\b(i have kids and cant (?:leave|disappear|go away)|i cant go to rehab|i need to do this at home|i have responsibilities and cant (?:leave|go to rehab)|how do i detox at home)\b/i,
    url: '/for-you/at-home-treatment',
    title: 'Planning treatment at home',
    excerpt: 'Practical options when work, children, cost, or access limit residential care.',
    categoryLabel: 'For You',
  },
  {
    test: /\b(i need someone to talk to|is anyone awake|anyone awake|meeting (?:right )?now|i cant do this alone|somewhere to talk without (?:being judged|judgment)|support meeting)\b/i,
    url: '/next-kratom-support-meeting',
    title: 'Find support right now',
    excerpt: 'The next 7-OH or kratom meeting in your local time, plus live alternatives.',
    category: 'resources',
    categoryLabel: 'Resources',
    type: 'Meeting',
  },
  {
    test: /\b(should i go to the er|when should i go to the er|is withdrawal dangerous|when is withdrawal dangerous)\b/i,
    url: '/start-here/7-oh-withdrawal-guide#when-to-go-to-the-er',
    title: 'When withdrawal needs medical care',
    excerpt: 'Clear warning signs and what to expect if you seek care.',
  },
];

function isOverdoseQuery(query: string): boolean {
  return (
    OVERDOSE_EMERGENCY.test(query) ||
    (TOO_MUCH.test(query) && OPIOID_LIKE_SUBSTANCE.test(query)) ||
    (CHILD_INGESTION.test(query) && OPIOID_LIKE_SUBSTANCE.test(query)) ||
    (DANGEROUS_MIX.test(query) && OPIOID_LIKE_SUBSTANCE.test(query) && DEPRESSANT.test(query) && IMPAIRED_CONSCIOUSNESS.test(query))
  );
}

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
        '988 Suicide & Crisis Lifeline',
        'Call or text 988. Call 911 for immediate danger.',
        { pinLabel: 'Safety information', categoryLabel: 'Resources', emphasis: 'urgent' },
      ),
    ];
  }

  if (isOverdoseQuery(query)) {
    return [
      pinnedResult(
        '/resources/crisis-hotlines',
        'Possible overdose or poisoning',
        'Call 911 for breathing problems or unresponsiveness. US Poison Control: 1-800-222-1222.',
        { pinLabel: 'Safety information', categoryLabel: 'Resources', emphasis: 'urgent' },
      ),
    ];
  }

  if (MEDICAL_RED_FLAG.test(query)) {
    return [
      pinnedResult(
        '/start-here/7-oh-withdrawal-guide#when-to-go-to-the-er',
        'When withdrawal needs medical care',
        'Clear warning signs and what to expect if you seek care.',
        { pinLabel: 'Medical guidance' },
      ),
    ];
  }

  if (VIOLENCE.test(query) && HOME_CONTEXT.test(query)) {
    return [
      pinnedResult(
        '/for-loved-ones/safety',
        'Safety planning at home',
        'Practical steps and phone, text, and chat support.',
        { pinLabel: 'Safety information', categoryLabel: 'For Loved Ones', emphasis: 'urgent' },
      ),
    ];
  }

  for (const intent of INTENT_RULES) {
    if (!intent.test.test(query)) continue;
    return [
      pinnedResult(intent.url, intent.title, intent.excerpt, {
        category: intent.category,
        categoryLabel: intent.categoryLabel,
        type: intent.type,
      }),
    ];
  }

  return [];
}

/** Remove a specifically negated self-harm phrase from lexical ranking. */
export function queryForSearchIndex(rawQuery: string): string {
  const query = rawQuery
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '');

  if (SELF_HARM.test(query) && !SELF_HARM_NEGATION.test(query)) return 'suicide crisis hotline';
  if (isOverdoseQuery(query)) return 'overdose naloxone poison control';
  if (VIOLENCE.test(query) && HOME_CONTEXT.test(query)) return 'domestic violence safety planning';
  if (!SELF_HARM_NEGATION.test(query)) return rawQuery;
  return rawQuery.replace(SELF_HARM_NEGATION, ' ').replace(/\s+/g, ' ').trim();
}
