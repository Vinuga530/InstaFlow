import { describe, it, expect } from 'vitest';
import { compareSnapshots } from '../services/analytics/comparisons';
import { NormalizedAccount } from '../types/instagram';

describe('Historical Snapshot Comparison & Unfollower Detection', () => {
  const baseFollowers: NormalizedAccount[] = [
    { username: 'stable_friend', profileUrl: '', timestamp: 1000 },
    { username: 'will_unfollow', profileUrl: '', timestamp: 1000 },
    { username: 'mutual_buddy', profileUrl: '', timestamp: 1000 },
  ];

  const baseFollowing: NormalizedAccount[] = [
    { username: 'mutual_buddy', profileUrl: '', timestamp: 1000 },
    { username: 'will_unfollow_him', profileUrl: '', timestamp: 1000 },
  ];

  const compareFollowers: NormalizedAccount[] = [
    { username: 'stable_friend', profileUrl: '', timestamp: 1000 },
    { username: 'mutual_buddy', profileUrl: '', timestamp: 1000 },
    { username: 'newly_followed_me', profileUrl: '', timestamp: 2000 }, // Gained
    // 'will_unfollow' is missing -> Unfollower
  ];

  const compareFollowing: NormalizedAccount[] = [
    { username: 'mutual_buddy', profileUrl: '', timestamp: 1000 },
    { username: 'newly_followed_by_me', profileUrl: '', timestamp: 2000 }, // User newly followed
    // 'will_unfollow_him' is missing -> User unfollowed
  ];

  it('correctly detects unfollowers (present in base followers, missing in compare followers)', () => {
    const diff = compareSnapshots(
      'base_1',
      'compare_2',
      1000,
      2000,
      baseFollowers,
      baseFollowing,
      compareFollowers,
      compareFollowing
    );

    expect(diff.unfollowers).toHaveLength(1);
    expect(diff.unfollowers[0].username).toBe('will_unfollow');
    expect(diff.unfollowers[0].isUnfollower).toBe(true);
  });

  it('correctly detects new followers (present in compare followers, missing in base followers)', () => {
    const diff = compareSnapshots(
      'base_1',
      'compare_2',
      1000,
      2000,
      baseFollowers,
      baseFollowing,
      compareFollowers,
      compareFollowing
    );

    expect(diff.newFollowers).toHaveLength(1);
    expect(diff.newFollowers[0].username).toBe('newly_followed_me');
    expect(diff.newFollowers[0].isNewFollower).toBe(true);
  });

  it('correctly detects accounts the user unfollowed and newly followed', () => {
    const diff = compareSnapshots(
      'base_1',
      'compare_2',
      1000,
      2000,
      baseFollowers,
      baseFollowing,
      compareFollowers,
      compareFollowing
    );

    expect(diff.unfollowedAccounts).toHaveLength(1);
    expect(diff.unfollowedAccounts[0].username).toBe('will_unfollow_him');

    expect(diff.newFollowing).toHaveLength(1);
    expect(diff.newFollowing[0].username).toBe('newly_followed_by_me');
  });

  it('calculates correct net follower growth', () => {
    const diff = compareSnapshots(
      'base_1',
      'compare_2',
      1000,
      2000,
      baseFollowers,
      baseFollowing,
      compareFollowers,
      compareFollowing
    );

    // base had 3 followers, compare has 3 followers -> net growth 0
    expect(diff.netGrowth).toBe(0);
  });

  describe('Edge Cases', () => {
    it('returns empty diffs when two snapshots are identical', () => {
      const diff = compareSnapshots(
        'base_1',
        'base_1_copy',
        1000,
        1000,
        baseFollowers,
        baseFollowing,
        baseFollowers,
        baseFollowing
      );

      expect(diff.unfollowers).toHaveLength(0);
      expect(diff.newFollowers).toHaveLength(0);
      expect(diff.unfollowedAccounts).toHaveLength(0);
      expect(diff.newFollowing).toHaveLength(0);
      expect(diff.netGrowth).toBe(0);
    });

    it('handles complete turnover where all followers were lost and replaced by new ones', () => {
      const totallyNewFollowers: NormalizedAccount[] = [
        { username: 'brand_new_1', profileUrl: '', timestamp: 2000 },
        { username: 'brand_new_2', profileUrl: '', timestamp: 2000 },
      ];

      const diff = compareSnapshots(
        'base_1',
        'compare_turnover',
        1000,
        2000,
        baseFollowers,
        baseFollowing,
        totallyNewFollowers,
        compareFollowing
      );

      expect(diff.unfollowers).toHaveLength(3); // All 3 original lost
      expect(diff.newFollowers).toHaveLength(2); // 2 brand new gained
      expect(diff.netGrowth).toBe(-1); // 2 - 3 = -1
    });

    it('handles first-time import where base has 0 followers and compare has new ones', () => {
      const emptyBase: NormalizedAccount[] = [];

      const diff = compareSnapshots(
        'empty_base',
        'first_import',
        0,
        2000,
        emptyBase,
        [],
        compareFollowers,
        compareFollowing
      );

      expect(diff.unfollowers).toHaveLength(0);
      expect(diff.newFollowers).toHaveLength(compareFollowers.length);
      expect(diff.netGrowth).toBe(compareFollowers.length);
    });
  });
});

