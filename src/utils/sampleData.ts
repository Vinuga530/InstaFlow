import { Snapshot, SnapshotRelationship } from '../types/database';
import { saveSnapshot } from '../db';

/**
 * Generates and seeds realistic Instagram relationship data for demonstration & testing
 */
export async function seedSampleData(): Promise<{ baselineId: string; latestId: string }> {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const baselineId = 'snap_demo_baseline';
  const latestId = 'snap_demo_latest';

  // Realistic sample usernames
  const mutualUsernames = [
    'sarah.design', 'alex_wanderer', 'emily_photo', 'dev_marcus', 'lisa.creates',
    'ryan_film', 'olivia_art', 'daniel_travels', 'clara_sound', 'lucas_lens',
    'maya_coffee', 'leo_sketches', 'sophie_coder', 'ethan_visuals', 'chloe_reads',
    'sam_minimal', 'zoe_adventures', 'nathan_light', 'hannah_crafts', 'jordan_vibe',
    'grace_flora', 'liam_notes', 'ava_journal', 'noah_space', 'mia_motion'
  ];

  const notFollowingBackUsernames = [
    'celebrity_news', 'tech_insider', 'natgeo_wild', 'apple_rumors', 'arch_daily',
    'design_boom', 'product_hunt', 'verge_daily', 'wired_mag', 'dribbble_best',
    'github_official', 'figma_crew', 'nike_run', 'spotify_sound', 'cinema_classic'
  ];

  const fansUsernames = [
    'student_coder12', 'art_enthusiast99', 'wanderer_japan', 'photo_hobbyist', 'swift_learner',
    'pixel_fanatic', 'coffee_lover2026', 'design_explorer', 'minimal_life4', 'curator_daily'
  ];

  // Accounts that unfollowed between baseline and latest
  const unfollowerUsernames = [
    'former_friend_dan', 'ghost_follower88', 'unfollower_sam', 'marketing_bot3', 'old_coworker_pete'
  ];

  // Accounts that followed recently (in latest only)
  const newFollowerUsernames = [
    'new_friend_oliver', 'creative_studio_sf', 'designer_nina', 'frontend_dev_guru', 'lens_craftsman'
  ];

  // --- BUILD BASELINE SNAPSHOT (30 days ago) ---
  const baselineFollowers = [
    ...mutualUsernames,
    ...fansUsernames,
    ...unfollowerUsernames, // Present in baseline, will leave in latest
  ];

  const baselineFollowing = [
    ...mutualUsernames,
    ...notFollowingBackUsernames,
  ];

  const baselineRelationships: Omit<SnapshotRelationship, 'id'>[] = [];

  for (const u of baselineFollowers) {
    const isMutual = baselineFollowing.includes(u);
    baselineRelationships.push({
      snapshotId: baselineId,
      username: u,
      profileUrl: `https://www.instagram.com/${u}/`,
      relationshipType: isMutual ? 'mutual' : 'follower',
      timestamp: thirtyDaysAgo - Math.floor(Math.random() * 60 * 24 * 3600 * 1000),
    });
  }

  for (const u of baselineFollowing) {
    if (!baselineFollowers.includes(u)) {
      baselineRelationships.push({
        snapshotId: baselineId,
        username: u,
        profileUrl: `https://www.instagram.com/${u}/`,
        relationshipType: 'following',
        timestamp: thirtyDaysAgo - Math.floor(Math.random() * 60 * 24 * 3600 * 1000),
      });
    }
  }

  const baselineSnapshot: Snapshot = {
    id: baselineId,
    timestamp: thirtyDaysAgo,
    label: 'Baseline Snapshot (Oct 2026)',
    accountUsername: 'alex.creator',
    followerCount: baselineFollowers.length, // 25 + 10 + 5 = 40
    followingCount: baselineFollowing.length, // 25 + 15 = 40
    notFollowingBackCount: notFollowingBackUsernames.length, // 15
    fansCount: fansUsernames.length + unfollowerUsernames.length, // 15
    mutualCount: mutualUsernames.length, // 25
    newFollowerCount: 0,
    unfollowerCount: 0,
    sourceType: 'mock',
    notes: 'Initial imported baseline archive.',
  };

  await saveSnapshot(baselineSnapshot, baselineRelationships);

  // --- BUILD LATEST SNAPSHOT (Today) ---
  // In latest: unfollowerUsernames are gone, newFollowerUsernames are added
  const latestFollowers = [
    ...mutualUsernames,
    ...fansUsernames,
    ...newFollowerUsernames, // Gained
  ];

  const latestFollowing = [
    ...mutualUsernames,
    ...notFollowingBackUsernames,
  ];

  const latestRelationships: Omit<SnapshotRelationship, 'id'>[] = [];

  for (const u of latestFollowers) {
    const isMutual = latestFollowing.includes(u);
    latestRelationships.push({
      snapshotId: latestId,
      username: u,
      profileUrl: `https://www.instagram.com/${u}/`,
      relationshipType: isMutual ? 'mutual' : 'follower',
      timestamp: newFollowerUsernames.includes(u)
        ? now - Math.floor(Math.random() * 5 * 24 * 3600 * 1000)
        : thirtyDaysAgo,
    });
  }

  for (const u of latestFollowing) {
    if (!latestFollowers.includes(u)) {
      latestRelationships.push({
        snapshotId: latestId,
        username: u,
        profileUrl: `https://www.instagram.com/${u}/`,
        relationshipType: 'following',
        timestamp: thirtyDaysAgo,
      });
    }
  }

  const latestSnapshot: Snapshot = {
    id: latestId,
    timestamp: now,
    label: 'Latest Snapshot (Nov 2026)',
    accountUsername: 'alex.creator',
    followerCount: latestFollowers.length, // 40
    followingCount: latestFollowing.length, // 40
    notFollowingBackCount: notFollowingBackUsernames.length, // 15
    fansCount: fansUsernames.length + newFollowerUsernames.length, // 15
    mutualCount: mutualUsernames.length, // 25
    newFollowerCount: newFollowerUsernames.length, // 5
    unfollowerCount: unfollowerUsernames.length, // 5
    previousSnapshotId: baselineId,
    sourceType: 'mock',
    notes: 'Latest Instagram data export.',
  };

  await saveSnapshot(latestSnapshot, latestRelationships);

  return { baselineId, latestId };
}

