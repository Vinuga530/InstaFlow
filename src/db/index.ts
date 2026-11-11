import Dexie, { type Table } from 'dexie';
import {
  Snapshot,
  SnapshotRelationship,
  AccountMetadata,
  ImportHistoryRecord,
  AppSetting,
} from '../types/database';

export class InstaTrackDB extends Dexie {
  snapshots!: Table<Snapshot, string>;
  snapshot_relationships!: Table<SnapshotRelationship, number>;
  accounts!: Table<AccountMetadata, string>;
  import_history!: Table<ImportHistoryRecord, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('InstaTrackDatabase');

    // Define schema version 1
    this.version(1).stores({
      snapshots: 'id, timestamp, accountUsername',
      snapshot_relationships: '++id, snapshotId, username, relationshipType, timestamp, [snapshotId+relationshipType], [snapshotId+username]',
      accounts: 'username, isWhitelisted, firstSeen, lastSeen',
      import_history: 'id, timestamp, status, snapshotId',
      settings: 'key',
    });
  }
}

export const db = new InstaTrackDB();

/**
 * Save a new snapshot and its relationships in a single atomic transaction
 */
export async function saveSnapshot(
  snapshot: Snapshot,
  relationships: Omit<SnapshotRelationship, 'id'>[],
  importRecord?: ImportHistoryRecord
): Promise<void> {
  await db.transaction('rw', [db.snapshots, db.snapshot_relationships, db.accounts, db.import_history], async () => {
    // 1. Add snapshot
    await db.snapshots.put(snapshot);

    // 2. Add relationships in bulk
    await db.snapshot_relationships.bulkAdd(relationships as SnapshotRelationship[]);

    // 3. Update or create account metadata records
    const now = Date.now();
    const existingAccounts = await db.accounts.bulkGet(relationships.map((r) => r.username));
    const accountsToPut: AccountMetadata[] = [];

    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const existing = existingAccounts[i];

      if (existing) {
        accountsToPut.push({
          ...existing,
          lastSeen: now,
        });
      } else {
        accountsToPut.push({
          username: rel.username,
          isWhitelisted: false,
          tags: [],
          firstSeen: now,
          lastSeen: now,
        });
      }
    }

    // Deduplicate accountsToPut by username
    const uniqueAccounts = Array.from(
      new Map(accountsToPut.map((acc) => [acc.username, acc])).values()
    );

    await db.accounts.bulkPut(uniqueAccounts);

    // 4. Save import record if provided
    if (importRecord) {
      await db.import_history.put(importRecord);
    }
  });
}

/**
 * Retrieve all snapshots ordered by timestamp descending
 */
export async function getSnapshots(): Promise<Snapshot[]> {
  return await db.snapshots.orderBy('timestamp').reverse().toArray();
}

/**
 * Retrieve a specific snapshot by ID
 */
export async function getSnapshot(id: string): Promise<Snapshot | undefined> {
  return await db.snapshots.get(id);
}

/**
 * Delete a snapshot and its associated relationships
 */
export async function deleteSnapshot(id: string): Promise<void> {
  await db.transaction('rw', [db.snapshots, db.snapshot_relationships], async () => {
    await db.snapshots.delete(id);
    await db.snapshot_relationships.where('snapshotId').equals(id).delete();
  });
}

/**
 * Fetch all relationships for a given snapshot
 */
export async function getSnapshotRelationships(snapshotId: string): Promise<SnapshotRelationship[]> {
  return await db.snapshot_relationships.where('snapshotId').equals(snapshotId).toArray();
}

/**
 * Remove an account from following in a snapshot (e.g. after unfollowing)
 */
export async function removeFollowingRelationship(
  snapshotId: string,
  username: string
): Promise<void> {
  const norm = username.toLowerCase().trim();
  await db.transaction('rw', [db.snapshots, db.snapshot_relationships], async () => {
    const rels = await db.snapshot_relationships
      .where('[snapshotId+username]')
      .equals([snapshotId, norm])
      .toArray();

    let wasNotFollowingBack = false;
    let wasMutual = false;
    for (const rel of rels) {
      if (rel.relationshipType === 'following') {
        if (rel.id !== undefined) {
          await db.snapshot_relationships.delete(rel.id);
          wasNotFollowingBack = true;
        }
      } else if (rel.relationshipType === 'mutual') {
        if (rel.id !== undefined) {
          await db.snapshot_relationships.update(rel.id, { relationshipType: 'follower' });
          wasMutual = true;
        }
      }
    }

    if (wasNotFollowingBack || wasMutual) {
      const snap = await db.snapshots.get(snapshotId);
      if (snap) {
        await db.snapshots.update(snapshotId, {
          followingCount: Math.max(0, snap.followingCount - 1),
          notFollowingBackCount: wasNotFollowingBack
            ? Math.max(0, snap.notFollowingBackCount - 1)
            : snap.notFollowingBackCount,
          mutualCount: wasMutual
            ? Math.max(0, (snap.mutualCount || 0) - 1)
            : (snap.mutualCount || 0),
          fansCount: wasMutual
            ? (snap.fansCount || 0) + 1
            : (snap.fansCount || 0),
        });
      }
    }
  });
}

/**
 * Fetch account metadata map for fast lookups
 */
export async function getAccountMetadataMap(): Promise<Map<string, AccountMetadata>> {
  const all = await db.accounts.toArray();
  const map = new Map<string, AccountMetadata>();
  for (const acc of all) {
    map.set(acc.username, acc);
  }
  return map;
}

/**
 * Toggle account whitelist status
 */
export async function toggleAccountWhitelist(username: string): Promise<boolean> {
  const norm = username.toLowerCase().trim();
  const acc = await db.accounts.get(norm);
  const nextVal = acc ? !acc.isWhitelisted : true;

  if (acc) {
    await db.accounts.update(norm, { isWhitelisted: nextVal });
  } else {
    await db.accounts.put({
      username: norm,
      isWhitelisted: true,
      tags: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }

  return nextVal;
}

/**
 * Save user notes and tags for an account
 */
export async function updateAccountNotes(username: string, notes: string, tags: string[] = []): Promise<void> {
  const norm = username.toLowerCase().trim();
  const acc = await db.accounts.get(norm);

  if (acc) {
    await db.accounts.update(norm, { notes, tags });
  } else {
    await db.accounts.put({
      username: norm,
      isWhitelisted: false,
      notes,
      tags,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }
}

/**
 * Updates manual classification tag for an account ('personal' or 'page')
 */
export async function updateAccountClassification(username: string, type: 'personal' | 'page'): Promise<void> {
  const norm = username.toLowerCase().trim();
  const acc = await db.accounts.get(norm);
  let tags = acc?.tags ? [...acc.tags] : [];
  tags = tags.filter((t) => t !== 'personal' && t !== 'page' && t !== 'business' && t !== 'brand');
  tags.push(type);

  if (acc) {
    await db.accounts.update(norm, { tags });
  } else {
    await db.accounts.put({
      username: norm,
      isWhitelisted: false,
      tags,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }
}

/**
 * Clear all tables in database
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.snapshots, db.snapshot_relationships, db.accounts, db.import_history, db.settings], async () => {
    await db.snapshots.clear();
    await db.snapshot_relationships.clear();
    await db.accounts.clear();
    await db.import_history.clear();
    await db.settings.clear();
  });
}

/**
 * Export entire database as JSON backup
 */
export async function exportAllDatabaseData(): Promise<string> {
  const snapshots = await db.snapshots.toArray();
  const relationships = await db.snapshot_relationships.toArray();
  const accounts = await db.accounts.toArray();
  const history = await db.import_history.toArray();
  const settings = await db.settings.toArray();

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      snapshots,
      relationships,
      accounts,
      history,
      settings,
    },
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Import database backup from JSON
 */
export async function importDatabaseBackup(jsonString: string): Promise<void> {
  const backup = JSON.parse(jsonString);
  if (!backup.data || !backup.version) {
    throw new Error('Invalid InstaTrack backup file');
  }

  await db.transaction('rw', [db.snapshots, db.snapshot_relationships, db.accounts, db.import_history, db.settings], async () => {
    if (backup.data.snapshots?.length) await db.snapshots.bulkPut(backup.data.snapshots);
    if (backup.data.relationships?.length) await db.snapshot_relationships.bulkPut(backup.data.relationships);
    if (backup.data.accounts?.length) await db.accounts.bulkPut(backup.data.accounts);
    if (backup.data.history?.length) await db.import_history.bulkPut(backup.data.history);
    if (backup.data.settings?.length) await db.settings.bulkPut(backup.data.settings);
  });
}

