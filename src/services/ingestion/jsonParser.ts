import { NormalizedAccount } from '../../types/instagram';
import {
  normalizeUsername,
  createProfileUrl,
  extractTimestamp,
  deduplicateAccounts,
} from './normalizer';

/**
 * Robust JSON parser capable of extracting normalized accounts from diverse
 * Instagram data export schemas (Meta Accounts Center 2023-2026, legacy formats, wrappers).
 */
export function parseInstagramJson(
  input: string | unknown,
  fileName = ''
): NormalizedAccount[] {
  let data: unknown;

  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (err) {
      throw new Error(`Failed to parse JSON for file "${fileName}": ${(err as Error).message}`);
    }
  } else {
    data = input;
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const accounts: NormalizedAccount[] = [];

  // Case 1: Wrapped objects, e.g. { "relationships_followers": [...] } or { "relationships_following": [...] }
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.relationships_followers)) {
    data = obj.relationships_followers;
  } else if (Array.isArray(obj.relationships_following)) {
    data = obj.relationships_following;
  }

  // Case 2: Array of modern or mixed entries
  if (Array.isArray(data)) {
    for (const item of data) {
      if (!item) continue;

      // Subcase 2a: Modern entry with string_list_data
      if (item.string_list_data && Array.isArray(item.string_list_data)) {
        for (const sld of item.string_list_data) {
          const rawUser = sld.value || item.title || sld.href;
          const user = normalizeUsername(rawUser);
          if (user) {
            accounts.push({
              username: user,
              profileUrl: sld.href || createProfileUrl(user),
              timestamp: extractTimestamp(sld.timestamp),
              fullName: item.title && item.title !== user ? item.title : undefined,
              raw: item,
            });
          }
        }
      }
      // Subcase 2b: Direct string_list_data object { href, value, timestamp }
      else if (item.value || (item.href && typeof item.href === 'string')) {
        const rawUser = item.value || item.href;
        const user = normalizeUsername(rawUser);
        if (user) {
          accounts.push({
            username: user,
            profileUrl: item.href || createProfileUrl(user),
            timestamp: extractTimestamp(item.timestamp),
            fullName: item.title,
            raw: item,
          });
        }
      }
      // Subcase 2c: Plain string array element
      else if (typeof item === 'string') {
        const user = normalizeUsername(item);
        if (user) {
          accounts.push({
            username: user,
            profileUrl: createProfileUrl(user),
            timestamp: Date.now(),
          });
        }
      }
      // Subcase 2d: Object with explicit username field
      else if (item.username && typeof item.username === 'string') {
        const user = normalizeUsername(item.username);
        if (user) {
          accounts.push({
            username: user,
            profileUrl: item.profile_url || createProfileUrl(user),
            timestamp: extractTimestamp(item.timestamp),
            fullName: item.full_name || item.name,
            raw: item,
          });
        }
      }
    }
  }
  // Case 3: Legacy dictionary object { "username": timestamp }
  else if (typeof data === 'object' && data !== null) {
    for (const [key, val] of Object.entries(obj)) {
      // Ignore meta keys
      if (key === 'meta' || key === 'status') continue;

      const user = normalizeUsername(key);
      if (user) {
        accounts.push({
          username: user,
          profileUrl: createProfileUrl(user),
          timestamp: extractTimestamp(val),
        });
      }
    }
  }

  return deduplicateAccounts(accounts);
}

