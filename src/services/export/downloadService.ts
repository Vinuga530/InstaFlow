/**
 * InstaTrack Download Service
 * Generates formatted downloads for CSV, Excel-compatible CSV, and structured JSON.
 */

function escapeCSVCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadAccountsAsCSV(
  accounts: Array<{
    username: string;
    fullName?: string;
    isVerified?: boolean;
    isPrivate?: boolean;
    profileUrl?: string;
    relationship?: string;
  }>,
  filename: string
): void {
  const headers = ['Username', 'Full Name', 'Relationship', 'Verified', 'Private', 'Profile URL'];
  const rows = accounts.map((acc) => [
    acc.username,
    acc.fullName || '',
    acc.relationship || '',
    acc.isVerified ? 'Yes' : 'No',
    acc.isPrivate ? 'Yes' : 'No',
    acc.profileUrl || `https://www.instagram.com/${acc.username}/`,
  ]);

  // Prepend UTF-8 BOM so Microsoft Excel opens special characters and emojis cleanly
  const csvContent = '\uFEFF' + [
    headers.map(escapeCSVCell).join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(',')),
  ].join('\r\n');

  const cleanName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  triggerDownload(csvContent, cleanName, 'text/csv;charset=utf-8;');
}

export function downloadAccountsAsJSON(
  data: any,
  filename: string
): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const cleanName = filename.endsWith('.json') ? filename : `${filename}.json`;
  triggerDownload(jsonContent, cleanName, 'application/json;charset=utf-8;');
}

