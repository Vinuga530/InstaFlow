/**
 * Account Classifier Utility
 *
 * Distinguishes between individual/personal accounts (normal people, friends)
 * and pages/brands/businesses/creator entities to help users make informed decisions
 * about who to keep and who to unfollow.
 */

export type AccountType = 'personal' | 'page';

export interface ClassifiedAccountInfo {
  accountType: AccountType;
  isVerified: boolean;
  isPrivate: boolean;
  typeLabel: string;
}

const PAGE_KEYWORDS_REGEX =
  /(?:^|[._\s-])(?:shop|store|brand|official|boutique|wear|apparel|clothing|media|news|mag|magazine|daily|memes|quotes|club|co|inc|ltd|corp|llc|company|foundation|charity|org|agency|studio|hub|community|network|cafe|coffee|restaurant|bar|kitchen|bakery|hotel|resort|gym|fitness|salon|spa|clinic|dental|travel|tours|photography|photos|photo|records|music|tv|radio|podcast|review|reviews|deals|sale|market|central|universe|vibes|zone|world|guide|tips|creators|page|updates|blog|production|productions)(?:[._\s-]|\d+|$)/i;

/**
 * Classifies an account based on username, full name, privacy status, verification, and user tags.
 */
export function classifyAccount(account: {
  username: string;
  fullName?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  tags?: string[];
}): ClassifiedAccountInfo {
  const isVerified = !!account.isVerified;
  const isPrivate = !!account.isPrivate;
  const tags = account.tags || [];

  // 1. User manual override tags take highest priority
  if (tags.includes('personal')) {
    return {
      accountType: 'personal',
      isVerified,
      isPrivate,
      typeLabel: 'Personal',
    };
  }
  if (tags.includes('page') || tags.includes('business') || tags.includes('brand')) {
    return {
      accountType: 'page',
      isVerified,
      isPrivate,
      typeLabel: 'Page / Brand',
    };
  }

  // 2. Private accounts are virtually always personal/individual users
  if (isPrivate) {
    return {
      accountType: 'personal',
      isVerified,
      isPrivate: true,
      typeLabel: 'Personal',
    };
  }

  // 3. Verified accounts are public figures, media, creators, or brands
  if (isVerified) {
    return {
      accountType: 'page',
      isVerified: true,
      isPrivate: false,
      typeLabel: 'Verified Page',
    };
  }

  // 4. Commercial, media, or organization keyword analysis
  const uname = account.username.toLowerCase();
  const fname = (account.fullName || '').toLowerCase();

  if (PAGE_KEYWORDS_REGEX.test(uname) || PAGE_KEYWORDS_REGEX.test(fname)) {
    return {
      accountType: 'page',
      isVerified,
      isPrivate,
      typeLabel: 'Page / Brand',
    };
  }

  // 5. Default to Personal account for individual human profiles
  return {
    accountType: 'personal',
    isVerified,
    isPrivate,
    typeLabel: 'Personal',
  };
}

