import JSZip from 'jszip';
import { ParsedInstagramData, NormalizedAccount } from '../../types/instagram';
import { parseInstagramJson } from './jsonParser';
import { deduplicateAccounts, normalizeUsername } from './normalizer';

export interface ZipParseProgressCallback {
  (percentage: number, status: string): void;
}

/**
 * Extracts and parses Instagram relationship data from an official ZIP export file.
 * Handles numbered follower files (e.g. followers_1.json, followers_2.json),
 * following.json, and personal account metadata across diverse folder hierarchies.
 */
export async function parseInstagramZip(
  file: File | Blob | ArrayBuffer,
  fileName = 'instagram_export.zip',
  onProgress?: ZipParseProgressCallback
): Promise<ParsedInstagramData> {
  onProgress?.(10, 'Reading ZIP archive...');

  const zip = new JSZip();
  let loadedZip: JSZip;

  try {
    loadedZip = await zip.loadAsync(file);
  } catch (err) {
    throw new Error(`Failed to read ZIP archive: ${(err as Error).message}. Ensure it is a valid ZIP file.`);
  }

  onProgress?.(30, 'Scanning files...');

  const fileKeys = Object.keys(loadedZip.files);
  const totalFiles = fileKeys.length;

  if (totalFiles === 0) {
    throw new Error('The provided ZIP archive is empty.');
  }

  const followerFiles: string[] = [];
  const followingFiles: string[] = [];
  let personalInfoFile: string | null = null;
  let htmlFilesCount = 0;

  // Scan file tree
  for (const path of fileKeys) {
    const lower = path.toLowerCase();

    // Skip directories and MacOS metadata
    if (loadedZip.files[path].dir || lower.includes('__macosx') || lower.startsWith('.')) {
      continue;
    }

    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      htmlFilesCount++;
    }

    // Match follower files: followers_1.json, followers_2.json, followers.json
    if (
      lower.endsWith('.json') &&
      (lower.includes('followers_') ||
        lower.endsWith('followers.json') ||
        lower.endsWith('/followers.json') ||
        lower.endsWith('\\followers.json'))
    ) {
      followerFiles.push(path);
    }

    // Match following file: following.json, connections/followers_and_following/following.json
    if (
      lower.endsWith('.json') &&
      (lower.includes('following_') ||
        lower.endsWith('following.json') ||
        lower.endsWith('/following.json') ||
        lower.endsWith('\\following.json'))
    ) {
      followingFiles.push(path);
    }

    // Match personal info if present
    if (lower.includes('personal_information.json')) {
      personalInfoFile = path;
    }
  }

  // Handle missing files validation
  const missingFollowersFile = followerFiles.length === 0;
  const missingFollowingFile = followingFiles.length === 0;

  if (missingFollowersFile && missingFollowingFile) {
    if (htmlFilesCount > 0) {
      throw new Error(
        'This ZIP archive contains HTML files instead of JSON. When requesting your export from Meta Accounts Center, make sure to set the Format option to "JSON" rather than "HTML".'
      );
    }
    throw new Error(
      'Could not find any follower or following JSON files in this ZIP archive. ' +
      'Please make sure you selected "Followers and following" in JSON format when requesting the Instagram export.'
    );
  }

  // Sort follower files naturally (followers_1.json, followers_2.json...)
  followerFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  onProgress?.(50, 'Extracting followers...');

  // Parse all follower files
  let allFollowers: NormalizedAccount[] = [];
  for (let i = 0; i < followerFiles.length; i++) {
    const fPath = followerFiles[i];
    const content = await loadedZip.files[fPath].async('string');
    const parsed = parseInstagramJson(content, fPath);
    allFollowers = allFollowers.concat(parsed);
  }

  onProgress?.(70, 'Extracting following...');

  // Parse following file(s)
  let allFollowing: NormalizedAccount[] = [];
  for (let i = 0; i < followingFiles.length; i++) {
    const fPath = followingFiles[i];
    const content = await loadedZip.files[fPath].async('string');
    const parsed = parseInstagramJson(content, fPath);
    allFollowing = allFollowing.concat(parsed);
  }

  onProgress?.(85, 'Deduplicating accounts...');

  const normalizedFollowers = deduplicateAccounts(allFollowers);
  const normalizedFollowing = deduplicateAccounts(allFollowing);

  // Extract account username if personal_information.json exists
  let detectedUsername: string | undefined;
  if (personalInfoFile) {
    try {
      const pInfoContent = await loadedZip.files[personalInfoFile].async('string');
      const pInfo = JSON.parse(pInfoContent);
      if (pInfo?.profile_user && Array.isArray(pInfo.profile_user)) {
        for (const item of pInfo.profile_user) {
          if (item?.string_map_data?.Username?.value) {
            detectedUsername = normalizeUsername(item.string_map_data.Username.value);
            break;
          }
        }
      }
    } catch {
      // Non-critical, ignore
    }
  }

  onProgress?.(100, 'Data parsing complete!');

  return {
    accountUsername: detectedUsername,
    exportDate: new Date(),
    followers: normalizedFollowers,
    following: normalizedFollowing,
    missingFollowersFile,
    missingFollowingFile,
    sourceType: 'zip',
    sourceFileName: fileName,
    rawFileCount: totalFiles,
  };
}

