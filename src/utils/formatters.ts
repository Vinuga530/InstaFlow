/**
 * Format numbers with comma separators (e.g., 12,450)
 */
export function formatNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat().format(num);
}

/**
 * Format date in a clean readable form (e.g., "Nov 3, 2026")
 */
export function formatDate(timestamp: number | string | Date): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format date with time (e.g., "Nov 3, 2026, 2:30 PM")
 */
export function formatDateTime(timestamp: number | string | Date): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Friendly relative time formatter ("3 days ago", "just now")
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) return 'never';
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
 * Generates deterministic understated color classes for username monograms
 */
export function getAvatarGradient(username: string): string {
  const tones = [
    'bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#505D4A] dark:text-[#C5D2C0] border border-[#71806C]/25 dark:border-[#899783]/30',
    'bg-[#686E64]/15 dark:bg-[#A6AA9D]/20 text-[#4A5046] dark:text-[#D4D8CB] border border-[#686E64]/20 dark:border-[#A6AA9D]/25',
    'bg-[#9E7E43]/15 dark:bg-[#C0A268]/20 text-[#705527] dark:text-[#E2D2AF] border border-[#9E7E43]/20 dark:border-[#C0A268]/25',
    'bg-[#5A6755]/15 dark:bg-[#9BA897]/20 text-[#3E493A] dark:text-[#D0DDD0] border border-[#5A6755]/20 dark:border-[#9BA897]/25',
    'bg-[#7D786D]/15 dark:bg-[#B3ADA1]/20 text-[#565147] dark:text-[#E0DDD5] border border-[#7D786D]/20 dark:border-[#B3ADA1]/25',
    'bg-[#8A7968]/15 dark:bg-[#C2B2A2]/20 text-[#615243] dark:text-[#E7DFD6] border border-[#8A7968]/20 dark:border-[#C2B2A2]/25',
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % tones.length;
  return tones[index];
}

