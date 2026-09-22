interface NaMeetingAudience {
  name: string;
  formatTags: readonly string[];
}

const SPECIAL_INTEREST_TAGS = new Set([
  'women',
  'men',
  'lgbtq+',
  'young people',
  'restricted access',
]);

// Some listings omit audience tags, including "Women in Recovery" and
// "Saturday Men's Stag". Match explicit audience words, not substrings
// such as "men" in "Mental Health" or "Empowerment".
const SPECIAL_INTEREST_NAMES = [
  /\b(?:wom[ae]n|men)(?:['’]?s)?\b|\b(?:ladies|sisters?|sisterhood|brothers?|brotherhood|girls?|boys?|stag)\b/i,
  /\b(?:lgbt\w*|gay|lesbian|bisexual|queer|trans(?:gender)?|transworld|non[- ]?binary)\b/i,
  /\b(?:young people|youth|teens?|seniors?|veterans?|deaf|hard of hearing)\b/i,
];

// This policy applies only to unsolicited suggestions. Keep the full NA
// schedule intact so readers can choose a meeting for their own needs.
export function hasGeneralNaAudience(meeting: NaMeetingAudience): boolean {
  return !meeting.formatTags.some((tag) => SPECIAL_INTEREST_TAGS.has(tag.trim().toLowerCase()))
    && !SPECIAL_INTEREST_NAMES.some((pattern) => pattern.test(meeting.name));
}
