/**
 * Universal File Ingestion Service
 *
 * Handles single ZIP archives, single JSON files, and multi-file drag-and-drop
 * (e.g. dragging followers_1.json, followers_2.json, and following.json together).
 * Provides clear diagnostics if users accidentally upload HTML exports.
 */

import { ParsedInstagramData, NormalizedAccount } from '../../types/instagram';
import { parseInstagramZip, ZipParseProgressCallback } from './zipParser';
import { parseInstagramJson } from './jsonParser';
import { deduplicateAccounts } from './normalizer';

export async function ingestInstagramFiles(
  files: File[],
  onProgress?: ZipParseProgressCallback
): Promise<ParsedInstagramData> {
  if (!files || files.length === 0) {
    throw new Error('No files provided for import.');
  }

  // 1. Check if any file is HTML
  const hasHtml = files.some(
    (f) => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
  );
  if (hasHtml) {
    throw new Error(
      'HTML export detected. Instagram data must be requested in JSON format. Please request a new export from Meta Accounts Center with the format set to "JSON".'
    );
  }

  // 2. Single ZIP file
  const zipFile = files.find((f) => f.name.toLowerCase().endsWith('.zip'));
  if (zipFile) {
    return parseInstagramZip(zipFile, zipFile.name, onProgress);
  }

  // 3. JSON files (single or multiple)
  const jsonFiles = files.filter((f) => f.name.toLowerCase().endsWith('.json'));
  if (jsonFiles.length === 0) {
    throw new Error(
      'Unsupported file format. Please upload an official Instagram export ZIP archive or .json files.'
    );
  }

  onProgress?.(10, `Reading ${jsonFiles.length} JSON file(s)...`);

  let allFollowers: NormalizedAccount[] = [];
  let allFollowing: NormalizedAccount[] = [];

  for (let i = 0; i < jsonFiles.length; i++) {
    const file = jsonFiles[i];
    const fileName = file.name.toLowerCase();
    const pct = Math.round(10 + ((i + 1) / jsonFiles.length) * 70);
    onProgress?.(pct, `Parsing ${file.name}...`);

    const text = await file.text();
    const parsedAccounts = parseInstagramJson(text, file.name);

    if (fileName.includes('following')) {
      allFollowing = allFollowing.concat(parsedAccounts);
    } else if (fileName.includes('follower')) {
      allFollowers = allFollowers.concat(parsedAccounts);
    } else {
      // If filename doesn't clearly specify, inspect content or default based on wrappers
      try {
        const rawJson = JSON.parse(text);
        if (rawJson?.relationships_following) {
          allFollowing = allFollowing.concat(parsedAccounts);
        } else {
          allFollowers = allFollowers.concat(parsedAccounts);
        }
      } catch {
        allFollowers = allFollowers.concat(parsedAccounts);
      }
    }
  }

  onProgress?.(90, 'Deduplicating accounts...');

  const normalizedFollowers = deduplicateAccounts(allFollowers);
  const normalizedFollowing = deduplicateAccounts(allFollowing);

  onProgress?.(100, 'Import ready!');

  const missingFollowersFile = normalizedFollowers.length === 0;
  const missingFollowingFile = normalizedFollowing.length === 0;

  return {
    exportDate: new Date(),
    followers: normalizedFollowers,
    following: normalizedFollowing,
    missingFollowersFile,
    missingFollowingFile,
    sourceType: 'json',
    sourceFileName:
      jsonFiles.length === 1
        ? jsonFiles[0].name
        : `${jsonFiles.length} JSON files (${jsonFiles.map((f) => f.name).join(', ')})`,
    rawFileCount: jsonFiles.length,
  };
}

