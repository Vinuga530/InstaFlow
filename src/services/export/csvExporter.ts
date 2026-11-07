import { AccountItem } from '../../types/analytics';

/**
 * Escapes a cell value for RFC 4180 CSV compliance and neutralizes formula injection (CWE-1236)
 */
export function escapeCSVCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Defensive CSV Formula Injection Prevention: neutralize formula prefixes
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds RFC 4180 compliant CSV string from accounts
 */
export function generateCSVContent(accounts: AccountItem[]): string {
  const headers = [
    'Username',
    'Profile URL',
    'Follows You',
    'You Follow',
    'Mutual',
    'Whitelisted',
    'Followed Date',
    'Notes',
    'Tags',
  ];

  const rows = accounts.map((acc) => [
    acc.username,
    acc.profileUrl,
    acc.isFollower ? 'Yes' : 'No',
    acc.isFollowing ? 'Yes' : 'No',
    acc.isMutual ? 'Yes' : 'No',
    acc.isWhitelisted ? 'Yes' : 'No',
    acc.timestamp ? new Date(acc.timestamp).toISOString() : '',
    acc.notes || '',
    (acc.tags || []).join('; '),
  ]);

  return [
    headers.map(escapeCSVCell).join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(',')),
  ].join('\r\n');
}

/**
 * Exports a list of accounts to CSV and triggers a client-side download
 */
export function exportAccountsToCSV(accounts: AccountItem[], filename: string): void {
  const csvContent = generateCSVContent(accounts);
  downloadBlob(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Triggers a browser download for a blob or text string
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

