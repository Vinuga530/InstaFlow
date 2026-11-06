import { describe, it, expect } from 'vitest';
import { ingestInstagramFiles } from '../services/ingestion/fileIngestionService';

describe('Universal File Ingestion Service', () => {
  it('rejects empty file lists', async () => {
    await expect(ingestInstagramFiles([])).rejects.toThrow('No files provided');
  });

  it('detects and rejects HTML exports with informative instructions', async () => {
    const htmlFile = new File(['<html><body>test</body></html>'], 'followers.html', {
      type: 'text/html',
    });
    await expect(ingestInstagramFiles([htmlFile])).rejects.toThrow('HTML export detected');
  });

  it('rejects unsupported file formats', async () => {
    const txtFile = new File(['test'], 'notes.txt', { type: 'text/plain' });
    await expect(ingestInstagramFiles([txtFile])).rejects.toThrow('Unsupported file format');
  });

  it('parses multiple JSON files simultaneously (followers and following)', async () => {
    const followersJson = JSON.stringify([
      {
        title: 'user_a',
        string_list_data: [{ value: 'user_a', timestamp: 1700000000, href: 'https://instagram.com/user_a' }],
      },
      {
        title: 'user_b',
        string_list_data: [{ value: 'user_b', timestamp: 1700000100, href: 'https://instagram.com/user_b' }],
      },
    ]);

    const followingJson = JSON.stringify({
      relationships_following: [
        {
          title: 'user_b',
          string_list_data: [{ value: 'user_b', timestamp: 1700000100, href: 'https://instagram.com/user_b' }],
        },
        {
          title: 'user_c',
          string_list_data: [{ value: 'user_c', timestamp: 1700000200, href: 'https://instagram.com/user_c' }],
        },
      ],
    });

    const fileFollowers = new File([followersJson], 'followers_1.json', { type: 'application/json' });
    const fileFollowing = new File([followingJson], 'following.json', { type: 'application/json' });

    const result = await ingestInstagramFiles([fileFollowers, fileFollowing]);

    expect(result.followers.length).toBe(2);
    expect(result.following.length).toBe(2);
    expect(result.followers.map((f) => f.username)).toContain('user_a');
    expect(result.followers.map((f) => f.username)).toContain('user_b');
    expect(result.following.map((f) => f.username)).toContain('user_b');
    expect(result.following.map((f) => f.username)).toContain('user_c');
    expect(result.missingFollowersFile).toBe(false);
    expect(result.missingFollowingFile).toBe(false);
  });
});

