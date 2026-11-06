import { NormalizedAccount } from '../../types/instagram';

/**
 * Normalizes an Instagram username into a clean, canonical format.
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips leading '@'
 * - Strips Instagram URL paths (e.g., https://instagram.com/username)
 * - Removes query params and trailing slashes
 */
export function normalizeUsername(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  let cleaned = input.trim();

  // If it's a URL, extract the pathname part
  if (cleaned.includes('instagram.com/')) {
    try {
      // In case protocol is missing, add https://
      const urlStr = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
      const url = new URL(urlStr);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && pathParts[0] !== 'p' && pathParts[0] !== 'reel') {
        cleaned = pathParts[0];
      }
    } catch {
      // Fallback regex if URL parsing fails
      const match = cleaned.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
      if (match && match[1]) {
        cleaned = match[1];
      }
    }
  }

  // Strip leading @
  cleaned = cleaned.replace(/^@+/, '');

  // Strip trailing slashes or queries
  cleaned = cleaned.split('?')[0].split('#')[0].replace(/\/+$/, '');

  // Lowercase
  cleaned = cleaned.toLowerCase();

  // Retain only valid Instagram username characters: letters, numbers, periods, underscores
  const validMatch = cleaned.match(/^[a-z0-9._]+/);
  return validMatch ? validMatch[0] : cleaned;
}

/**
 * Generates an official Instagram profile URL for a normalized username
 */
export function createProfileUrl(username: string): string {
  const norm = normalizeUsername(username);
  return `https://www.instagram.com/${norm}/`;
}

/**
 * Extracts a normalized Unix timestamp in milliseconds.
 * Instagram exports usually store timestamps in seconds.
 */
export function extractTimestamp(raw: unknown): number {
  if (typeof raw === 'number') {
    // If timestamp is in seconds (10 digits), convert to ms
    return raw < 10000000000 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string') {
    const num = Number(raw);
    if (!isNaN(num)) {
      return num < 10000000000 ? num * 1000 : num;
    }
    const parsedDate = Date.parse(raw);
    if (!isNaN(parsedDate)) {
      return parsedDate;
    }
  }
  return Date.now();
}

/**
 * Deduplicates an array of NormalizedAccount entries by username.
 * Preserves the earliest timestamp or the most detailed record.
 */
export function deduplicateAccounts(accounts: NormalizedAccount[]): NormalizedAccount[] {
  const accountMap = new Map<string, NormalizedAccount>();

  for (const acc of accounts) {
    if (!acc.username) continue;

    const existing = accountMap.get(acc.username);
    if (!existing) {
      accountMap.set(acc.username, acc);
    } else {
      // If the new one has a valid earlier timestamp, use that timestamp
      const bestTimestamp = Math.min(existing.timestamp, acc.timestamp) || existing.timestamp;
      accountMap.set(acc.username, {
        ...existing,
        fullName: existing.fullName || acc.fullName,
        timestamp: bestTimestamp,
      });
    }
  }

  return Array.from(accountMap.values());
}

