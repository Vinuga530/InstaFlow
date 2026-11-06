import { describe, it, expect } from 'vitest';
import {
  normalizeUsername,
  createProfileUrl,
  extractTimestamp,
  deduplicateAccounts,
} from '../services/ingestion/normalizer';
import { NormalizedAccount } from '../types/instagram';

describe('Username Normalizer & Utilities', () => {
  it('strips leading @ symbol and trims whitespace', () => {
    expect(normalizeUsername('  @john_doe  ')).toBe('john_doe');
    expect(normalizeUsername('@@jane.doe')).toBe('jane.doe');
  });

  it('converts usernames to lowercase', () => {
    expect(normalizeUsername('Cool_User_2026')).toBe('cool_user_2026');
    expect(normalizeUsername('ALICE.DESIGN')).toBe('alice.design');
  });

  it('extracts username from full Instagram URLs', () => {
    expect(normalizeUsername('https://www.instagram.com/sarah_creates/')).toBe('sarah_creates');
    expect(normalizeUsername('http://instagram.com/alex?utm_source=ig')).toBe('alex');
    expect(normalizeUsername('instagram.com/photography_lens/#hash')).toBe('photography_lens');
  });

  it('handles invalid or non-string inputs safely', () => {
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(undefined)).toBe('');
    expect(normalizeUsername(12345)).toBe('');
  });

  it('generates correct Instagram profile URLs', () => {
    expect(createProfileUrl('user_test')).toBe('https://www.instagram.com/user_test/');
    expect(createProfileUrl('@user_test')).toBe('https://www.instagram.com/user_test/');
  });

  it('extracts timestamps properly in milliseconds', () => {
    // 10-digit unix timestamp in seconds
    const sec = 1690000000;
    expect(extractTimestamp(sec)).toBe(1690000000000);

    // 13-digit unix timestamp in ms
    const ms = 1690000000000;
    expect(extractTimestamp(ms)).toBe(1690000000000);

    // ISO string
    const iso = '2026-10-01T12:00:00Z';
    expect(extractTimestamp(iso)).toBe(Date.parse(iso));
  });

  it('deduplicates accounts and preserves the earliest follow date', () => {
    const raw: NormalizedAccount[] = [
      { username: 'user1', profileUrl: 'url1', timestamp: 2000 },
      { username: 'user2', profileUrl: 'url2', timestamp: 1000 },
      { username: 'user1', profileUrl: 'url1_new', timestamp: 1500, fullName: 'User One' },
    ];

    const deduplicated = deduplicateAccounts(raw);
    expect(deduplicated).toHaveLength(2);

    const user1 = deduplicated.find((a) => a.username === 'user1');
    expect(user1).toBeDefined();
    expect(user1?.timestamp).toBe(1500); // Earliest timestamp preserved
    expect(user1?.fullName).toBe('User One'); // Preserved full name
  });
});

