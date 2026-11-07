import { describe, it, expect } from 'vitest';
import { escapeCSVCell as escapeExportCell, generateCSVContent } from '../services/export/csvExporter';
import { escapeCSVCell as escapeDownloadCell } from '../services/export/downloadService';
import { formatNumber, formatDate, formatDateTime, formatRelativeTime } from '../utils/formatters';
import { calculateSnapshotMetrics } from '../services/analytics/engine';
import { AccountItem } from '../types/analytics';

describe('Defensive Security: CSV Formula Injection Prevention (CWE-1236)', () => {
  it('neutralizes formula injection characters (=, +, -, @, \\t, \\r)', () => {
    const maliciousPayloads = [
      '=cmd|"/C calc"!A0',
      '+123456789',
      '-2+3+cmd|"/C calc"!A0',
      '@SUM(1,2)',
      '\t=cmd|"/C calc"!A0',
      '\r=cmd|"/C calc"!A0',
    ];

    maliciousPayloads.forEach((payload) => {
      const escapedExport = escapeExportCell(payload);
      // Either starts with ' or starts with "' (if RFC 4180 quotes were needed)
      expect(escapedExport.startsWith("'") || escapedExport.startsWith("\"'")).toBe(true);

      const escapedDownload = escapeDownloadCell(payload);
      expect(escapedDownload.startsWith("'") || escapedDownload.startsWith("\"'")).toBe(true);
    });
  });

  it('preserves legitimate text while escaping quotes and commas correctly', () => {
    expect(escapeExportCell('regular_user')).toBe('regular_user');
    expect(escapeExportCell('Doe, John')).toBe('"Doe, John"');
    expect(escapeExportCell('User "The Pro"')).toBe('"User ""The Pro"""');
    expect(escapeExportCell(null)).toBe('');
    expect(escapeExportCell(undefined)).toBe('');
  });

  it('neutralizes formulas embedded in account attributes in CSV generation', () => {
    const maliciousAccount: AccountItem = {
      username: '=cmd|"/C calc"!A0',
      profileUrl: 'https://instagram.com/=cmd',
      fullName: '+Injected Name',
      isFollower: true,
      isFollowing: false,
      isMutual: false,
      isWhitelisted: false,
      timestamp: 1700000000000,
      notes: '@MaliciousNote',
      tags: ['-testTag'],
    };

    const csv = generateCSVContent([maliciousAccount]);
    expect(csv).toContain("\"'=cmd|\"\"/C calc\"\"!A0\""); // RFC 4180 escaped with formula neutralization
    expect(csv).toContain("'@MaliciousNote");
    expect(csv).toContain("'-testTag");
  });
});

describe('Defensive Formatting Utilities', () => {
  it('formatNumber handles valid, zero, NaN, and null/undefined values safely', () => {
    expect(formatNumber(12500)).toBe('12,500');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(NaN as any)).toBe('0');
    expect(formatNumber(null as any)).toBe('0');
    expect(formatNumber(undefined as any)).toBe('0');
  });

  it('formatDate handles valid timestamps and guards against invalid input', () => {
    const ts = new Date('2026-01-15T12:00:00Z').getTime();
    expect(formatDate(ts)).toContain('2026');
    expect(formatDate('invalid-date')).toBe('—');
    expect(formatDate(NaN)).toBe('—');
    expect(formatDate(0)).toBe('—');
    expect(formatDate(null as any)).toBe('—');
    expect(formatDate(undefined as any)).toBe('—');
  });

  it('formatDateTime handles valid timestamps and guards against invalid input', () => {
    const ts = new Date('2026-01-15T12:00:00Z').getTime();
    expect(formatDateTime(ts)).toContain('2026');
    expect(formatDateTime('invalid-date')).toBe('—');
    expect(formatDateTime(NaN)).toBe('—');
    expect(formatDateTime(0)).toBe('—');
  });

  it('formatRelativeTime handles zero, invalid, and past timestamps gracefully', () => {
    expect(formatRelativeTime(0)).toBe('never');
    expect(formatRelativeTime(NaN)).toBe('never');
    expect(formatRelativeTime(-100)).toBe('never');

    const now = Date.now();
    expect(formatRelativeTime(now - 10000)).toBe('just now');
    expect(formatRelativeTime(now - 120000)).toBe('2m ago');
    expect(formatRelativeTime(now - 7200000)).toBe('2h ago');
    expect(formatRelativeTime(now - 172800000)).toBe('2d ago');
  });
});

describe('Analytics Calculations Zero Guards', () => {
  it('handles 0 following without NaN or division by zero', () => {
    const metrics = calculateSnapshotMetrics([], [], 0, 0);
    expect(metrics.totalFollowers).toBe(0);
    expect(metrics.totalFollowing).toBe(0);
    expect(metrics.followBackRatio).toBe(0);
    expect(Number.isNaN(metrics.followBackRatio)).toBe(false);
  });
});
