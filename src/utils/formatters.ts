/**
 * Format numbers with comma separators (e.g., 12,450)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format date in a clean readable form (e.g., "Nov 3, 2026")
 */
export function formatDate(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time (e.g., "Nov 3, 2026, 2:30 PM")
 */
export function formatDateTime(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Friendly relative time formatter ("3 days ago", "just now")
 */
export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

/**
 * Generates deterministic pastel/gradient color classes for username monograms
 */
export function getAvatarGradient(username: string): string {
  const gradients = [
    'from-rose-500 to-amber-500',
    'from-purple-600 to-pink-500',
    'from-blue-500 to-teal-400',
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-500',
    'from-fuchsia-600 to-pink-600',
    'from-violet-600 to-indigo-600',
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

