import { describe, it, expect } from 'vitest';
import { parseInstagramJson } from '../services/ingestion/jsonParser';

describe('Instagram JSON Export Parser', () => {
  it('parses modern Meta Accounts Center array of entries with string_list_data', () => {
    const raw = JSON.stringify([
      {
        title: 'sarah.design',
        media_list_data: [],
        string_list_data: [
          {
            href: 'https://www.instagram.com/sarah.design',
            value: 'sarah.design',
            timestamp: 1690000000,
          },
        ],
      },
      {
        title: 'alex_wanderer',
        media_list_data: [],
        string_list_data: [
          {
            href: 'https://www.instagram.com/alex_wanderer',
            value: 'alex_wanderer',
            timestamp: 1691000000,
          },
        ],
      },
    ]);

    const accounts = parseInstagramJson(raw, 'followers_1.json');
    expect(accounts).toHaveLength(2);
    expect(accounts[0].username).toBe('sarah.design');
    expect(accounts[0].profileUrl).toBe('https://www.instagram.com/sarah.design');
    expect(accounts[1].username).toBe('alex_wanderer');
  });

  it('parses wrapped format { "relationships_followers": [...] }', () => {
    const raw = JSON.stringify({
      relationships_followers: [
        {
          title: 'dev_marcus',
          string_list_data: [
            {
              href: 'https://www.instagram.com/dev_marcus',
              value: 'dev_marcus',
              timestamp: 1680000000,
            },
          ],
        },
      ],
    });

    const accounts = parseInstagramJson(raw, 'followers.json');
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBe('dev_marcus');
  });

  it('parses following wrapped format { "relationships_following": [...] }', () => {
    const raw = JSON.stringify({
      relationships_following: [
        {
          title: 'natgeo',
          string_list_data: [
            {
              href: 'https://www.instagram.com/natgeo',
              value: 'natgeo',
              timestamp: 1670000000,
            },
          ],
        },
      ],
    });

    const accounts = parseInstagramJson(raw, 'following.json');
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBe('natgeo');
  });

  it('parses raw array of string_list_data objects', () => {
    const raw = JSON.stringify([
      {
        href: 'https://www.instagram.com/clara_sound',
        value: 'clara_sound',
        timestamp: 1685000000,
      },
    ]);

    const accounts = parseInstagramJson(raw);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBe('clara_sound');
  });

  it('parses legacy dictionary { "username": timestamp } format', () => {
    const raw = JSON.stringify({
      user_alpha: 1620000000,
      user_beta: 1630000000,
    });

    const accounts = parseInstagramJson(raw);
    expect(accounts).toHaveLength(2);
    expect(accounts.map((a) => a.username)).toContain('user_alpha');
    expect(accounts.map((a) => a.username)).toContain('user_beta');
  });

  it('throws an informative error on corrupted or invalid JSON', () => {
    const corrupted = '{ "bad_json: 1234, broken ';
    expect(() => parseInstagramJson(corrupted, 'corrupted.json')).toThrow(
      /Failed to parse JSON for file "corrupted.json"/
    );
  });

  it('handles empty JSON gracefully', () => {
    expect(parseInstagramJson('[]')).toEqual([]);
    expect(parseInstagramJson('{}')).toEqual([]);
  });
});

