import { describe, it, expect } from 'vitest';
import {
  calculateNotFollowingBack,
  calculateFans,
  calculateMutuals,
  calculateSnapshotMetrics,
} from '../services/analytics/engine';
import { NormalizedAccount } from '../types/instagram';

describe('Analytics Engine Calculations', () => {
  const followers: NormalizedAccount[] = [
    { username: 'alice', profileUrl: '', timestamp: 1000 },
    { username: 'bob', profileUrl: '', timestamp: 1000 },
    { username: 'charlie', profileUrl: '', timestamp: 1000 }, // Charlie is fan
    { username: 'david', profileUrl: '', timestamp: 1000 },   // David is fan
  ];

  const following: NormalizedAccount[] = [
    { username: 'alice', profileUrl: '', timestamp: 1000 },   // Mutual
    { username: 'bob', profileUrl: '', timestamp: 1000 },     // Mutual
    { username: 'edward', profileUrl: '', timestamp: 1000 },  // Not following back
    { username: 'fiona', profileUrl: '', timestamp: 1000 },   // Not following back
  ];

  it('correctly calculates not following back (Following minus Followers)', () => {
    const notFollowingBack = calculateNotFollowingBack(followers, following);
    expect(notFollowingBack.map((a) => a.username)).toEqual(['edward', 'fiona']);
  });

  it('correctly calculates fans (Followers minus Following)', () => {
    const fans = calculateFans(followers, following);
    expect(fans.map((a) => a.username)).toEqual(['charlie', 'david']);
  });

  it('correctly calculates mutual followers (Intersection of Followers and Following)', () => {
    const mutuals = calculateMutuals(followers, following);
    expect(mutuals.map((a) => a.username)).toEqual(['alice', 'bob']);
  });

  it('computes accurate snapshot metrics and follow-back ratio', () => {
    const metrics = calculateSnapshotMetrics(followers, following, 5, 2);

    expect(metrics.totalFollowers).toBe(4);
    expect(metrics.totalFollowing).toBe(4);
    expect(metrics.mutualCount).toBe(2);
    expect(metrics.notFollowingBackCount).toBe(2);
    expect(metrics.fansCount).toBe(2);
    // Follow back ratio: 2 mutuals / 4 following = 50.0%
    expect(metrics.followBackRatio).toBe(50.0);
    expect(metrics.newFollowersCount).toBe(5);
    expect(metrics.unfollowersCount).toBe(2);
    expect(metrics.netFollowerGrowth).toBe(3);
  });

  describe('Edge Cases', () => {
    it('handles empty followers list gracefully', () => {
      const emptyFollowers: NormalizedAccount[] = [];
      const notFollowing = calculateNotFollowingBack(emptyFollowers, following);
      expect(notFollowing).toHaveLength(following.length);

      const fans = calculateFans(emptyFollowers, following);
      expect(fans).toHaveLength(0);

      const mutuals = calculateMutuals(emptyFollowers, following);
      expect(mutuals).toHaveLength(0);

      const metrics = calculateSnapshotMetrics(emptyFollowers, following);
      expect(metrics.followBackRatio).toBe(0);
      expect(metrics.fansCount).toBe(0);
      expect(metrics.notFollowingBackCount).toBe(following.length);
    });

    it('handles empty following list gracefully', () => {
      const emptyFollowing: NormalizedAccount[] = [];
      const notFollowing = calculateNotFollowingBack(followers, emptyFollowing);
      expect(notFollowing).toHaveLength(0);

      const fans = calculateFans(followers, emptyFollowing);
      expect(fans).toHaveLength(followers.length);

      const metrics = calculateSnapshotMetrics(followers, emptyFollowing);
      expect(metrics.followBackRatio).toBe(0);
      expect(metrics.mutualCount).toBe(0);
      expect(metrics.notFollowingBackCount).toBe(0);
    });

    it('handles 100% mutual followers', () => {
      const mutualSet: NormalizedAccount[] = [
        { username: 'user_a', profileUrl: '', timestamp: 1 },
        { username: 'user_b', profileUrl: '', timestamp: 2 },
      ];
      const metrics = calculateSnapshotMetrics(mutualSet, mutualSet);
      expect(metrics.followBackRatio).toBe(100.0);
      expect(metrics.notFollowingBackCount).toBe(0);
      expect(metrics.fansCount).toBe(0);
      expect(metrics.mutualCount).toBe(2);
    });

    it('is case-insensitive when calculating relationships', () => {
      const followerCase: NormalizedAccount[] = [
        { username: 'JohnDoe', profileUrl: '', timestamp: 1 },
      ];
      const followingCase: NormalizedAccount[] = [
        { username: 'johndoe', profileUrl: '', timestamp: 1 },
      ];
      const mutuals = calculateMutuals(followerCase, followingCase);
      expect(mutuals).toHaveLength(1);
    });
  });
});

