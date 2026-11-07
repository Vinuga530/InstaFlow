import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AccountItem, SortField, SortOrder } from '../../types/analytics';
import { Avatar } from '../common/Avatar';
import { Badge, BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { exportAccountsToCSV } from '../../services/export/csvExporter';
import { exportAccountsToJSON } from '../../services/export/jsonExporter';
import { formatDate } from '../../utils/formatters';
import { useDebounce } from '../../utils/useDebounce';
import {
  ExternalLink,
  Star,
  FileText,
  Copy,
  Download,
  Users,
  CheckSquare,
  Square,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Smile,
  UserMinus,
  Loader2,
} from 'lucide-react';

interface AccountRowProps {
  account: AccountItem;
  isSelected: boolean;
  isWhitelisted: boolean;
  isUnfollowing?: boolean;
  notes?: string;
  onToggleSelect: (username: string) => void;
  onToggleWhitelist: (username: string) => void;
  onOpenNotes: (account: AccountItem) => void;
  onUnfollow?: (username: string) => void;
}

const AccountRow = React.memo<AccountRowProps>(
  ({
    account,
    isSelected,
    isWhitelisted,
    isUnfollowing,
    notes,
    onToggleSelect,
    onToggleWhitelist,
    onOpenNotes,
    onUnfollow,
  }) => {
    let badgeVariant: BadgeVariant = 'neutral';
    if (account.isUnfollower) {
      badgeVariant = 'unfollower';
    } else if (account.isNewFollower) {
      badgeVariant = 'new';
    } else if (account.isMutual) {
      badgeVariant = 'mutual';
    } else if (!account.isFollower && account.isFollowing) {
      badgeVariant = 'not_following_back';
    } else if (account.isFollower && !account.isFollowing) {
      badgeVariant = 'fan';
    }

    return (
      <tr
        className={`group transition-colors border-b border-black/[0.04] dark:border-white/[0.05] ${
          isSelected
            ? 'bg-rose-500/5 dark:bg-rose-500/10'
            : 'hover:bg-neutral-50/70 dark:hover:bg-[#23201D]'
        }`}
      >
        {/* Selection Checkbox */}
        <td className="py-2.5 px-3.5 text-center w-10">
          <button
            onClick={() => onToggleSelect(account.username)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-brand-500" />
            ) : (
              <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
            )}
          </button>
        </td>

        {/* Account Info */}
        <td className="py-2.5 px-3.5">
          <div className="flex items-center gap-3">
            <Avatar username={account.username} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                  @{account.username}
                </span>
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                  title="Open Instagram Profile"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {account.fullName && (
                <p className="text-[11px] text-neutral-400 truncate">
                  {account.fullName}
                </p>
              )}
              {notes && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1 truncate">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>{notes}</span>
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Relationship Badges */}
        <td className="py-2.5 px-3.5 hidden sm:table-cell">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={badgeVariant} />
            {isWhitelisted && <Badge variant="whitelisted" showIcon={false} />}
          </div>
        </td>

        {/* Follow Date */}
        <td className="py-2.5 px-3.5 hidden md:table-cell text-xs text-neutral-400 tabular-nums">
          {account.timestamp ? formatDate(account.timestamp) : '—'}
        </td>

        {/* Row Actions */}
        <td className="py-2.5 px-3.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {account.isFollowing && onUnfollow && (
              <button
                onClick={() => onUnfollow(account.username)}
                disabled={isUnfollowing}
                className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                title="Unfollow on Instagram"
              >
                {isUnfollowing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <UserMinus className="w-3 h-3" />
                    <span>Unfollow</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onToggleWhitelist(account.username)}
              className={`p-1.5 rounded-lg transition-colors ${
                isWhitelisted
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={isWhitelisted ? 'Remove from whitelist' : 'Star to whitelist'}
            >
              <Star
                className={`w-3.5 h-3.5 ${isWhitelisted ? 'fill-amber-400' : ''}`}
              />
            </button>

            <button
              onClick={() => onOpenNotes(account)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Add notes"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
);

AccountRow.displayName = 'AccountRow';

export const AccountListView: React.FC = () => {
  const {
    activeCategory,
    followers,
    following,
    notFollowingBack,
    fans,
    mutuals,
    unfollowers,
    newFollowers,
    accountMetadataMap,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    whitelistedOnly,
    setWhitelistedOnly,
    selectedUsernames,
    toggleSelectUsername,
    selectAllUsernames,
    clearSelection,
    toggleWhitelist,
    setSelectedAccountForNotes,
    addToast,
    setImportModalOpen,
    unfollowAccount,
  } = useAppStore();

  const [unfollowingUser, setUnfollowingUser] = useState<string | null>(null);

  const handleUnfollow = useCallback(
    async (uname: string) => {
      setUnfollowingUser(uname);
      try {
        await unfollowAccount(uname);
      } finally {
        setUnfollowingUser(null);
      }
    },
    [unfollowAccount]
  );

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 200);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 whenever category, search, or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [activeCategory, debouncedSearch, whitelistedOnly]);

  // 1. Pick dataset based on category
  const rawData: AccountItem[] = useMemo(() => {
    switch (activeCategory) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      case 'not_following_back':
        return notFollowingBack;
      case 'fans':
        return fans;
      case 'mutuals':
        return mutuals;
      case 'unfollowers':
        return unfollowers;
      case 'new_followers':
        return newFollowers;
      default:
        return followers;
    }
  }, [
    activeCategory,
    followers,
    following,
    notFollowingBack,
    fans,
    mutuals,
    unfollowers,
    newFollowers,
  ]);

  // 2. Filter data with debounced query
  const filteredData = useMemo(() => {
    let result = rawData;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (acc) =>
          acc.username.toLowerCase().includes(q) ||
          (acc.fullName && acc.fullName.toLowerCase().includes(q))
      );
    }

    if (whitelistedOnly) {
      result = result.filter((acc) => {
        const meta = accountMetadataMap.get(acc.username.toLowerCase());
        return meta ? meta.isWhitelisted : acc.isWhitelisted;
      });
    }

    // 3. Sort data
    return [...result].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'username') {
        comparison = a.username.localeCompare(b.username);
      } else if (sortField === 'timestamp') {
        comparison = (a.timestamp || 0) - (b.timestamp || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [rawData, debouncedSearch, whitelistedOnly, sortField, sortOrder, accountMetadataMap]);

  // 3. Windowed Pagination for 10,000+ records
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const selectedSet = useMemo(() => new Set(selectedUsernames), [selectedUsernames]);

  const allVisibleSelected =
    paginatedData.length > 0 &&
    paginatedData.every((acc) => selectedSet.has(acc.username));

  const handleToggleSelectAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      clearSelection();
    } else {
      const allUsers = paginatedData.map((a) => a.username);
      selectAllUsernames(Array.from(new Set([...selectedUsernames, ...allUsers])));
    }
  }, [allVisibleSelected, paginatedData, selectedUsernames, clearSelection, selectAllUsernames]);

  const handleCopyUsernames = useCallback(() => {
    const toCopy =
      selectedUsernames.length > 0
        ? selectedUsernames
        : filteredData.map((a) => a.username);

    navigator.clipboard.writeText(toCopy.join('\n'));
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: `Copied ${toCopy.length} username${toCopy.length > 1 ? 's' : ''}.`,
    });
  }, [selectedUsernames, filteredData, addToast]);

  const handleExportCSV = useCallback(() => {
    const toExport =
      selectedUsernames.length > 0
        ? filteredData.filter((a) => selectedSet.has(a.username))
        : filteredData;

    exportAccountsToCSV(toExport, `instatrack_${activeCategory}_export`);
    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: `Saved ${toExport.length} accounts to CSV file.`,
    });
  }, [selectedUsernames, filteredData, selectedSet, activeCategory, addToast]);

  const handleExportJSON = useCallback(() => {
    const toExport =
      selectedUsernames.length > 0
        ? filteredData.filter((a) => selectedSet.has(a.username))
        : filteredData;

    exportAccountsToJSON(toExport, `instatrack_${activeCategory}_export`);
    addToast({
      type: 'success',
      title: 'JSON Exported',
      message: `Saved ${toExport.length} accounts to JSON file.`,
    });
  }, [selectedUsernames, filteredData, selectedSet, activeCategory, addToast]);

  if (rawData.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <EmptyState
          icon={<Smile className="w-8 h-8 text-neutral-400" />}
          title={`No Accounts in ${activeCategory.replace(/_/g, ' ')}`}
          description={
            activeCategory === 'unfollowers'
              ? 'Unfollowers are accurately detected when comparing two different snapshots over time. If this is your first snapshot, import another export later to track who unfollowed you.'
              : 'There are currently no accounts matching this relationship category.'
          }
          actionLabel="Import New Export"
          onAction={() => setImportModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
      {/* Search, Filter & Bulk Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] shadow-subtle">
        {/* Instant Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by username or name..."
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/70 dark:bg-[#242220] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Whitelist Star Filter */}
          <button
            onClick={() => {
              setWhitelistedOnly(!whitelistedOnly);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              whitelistedOnly
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-[#242220] border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${whitelistedOnly ? 'fill-amber-400 text-amber-500' : 'text-neutral-400'}`}
            />
            <span>Starred</span>
          </button>

          {/* Sort Control */}
          <div className="flex items-center rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-100/70 dark:bg-[#242220] p-0.5 text-xs">
            <button
              onClick={() => {
                if (sortField === 'username') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('username');
                  setSortOrder('asc');
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortField === 'username'
                  ? 'bg-white dark:bg-[#34302C] text-neutral-900 dark:text-neutral-100 shadow-subtle font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>A-Z</span>
              {sortField === 'username' && (
                <span className="ml-1 text-[10px] text-brand-500">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (sortField === 'timestamp') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('timestamp');
                  setSortOrder('desc');
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortField === 'timestamp'
                  ? 'bg-white dark:bg-[#34302C] text-neutral-900 dark:text-neutral-100 shadow-subtle font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>Date</span>
              {sortField === 'timestamp' && (
                <span className="ml-1 text-[10px] text-brand-500">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>

          {/* Export Actions */}
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Copy className="w-3 h-3" />}
            onClick={handleCopyUsernames}
            title="Copy usernames to clipboard"
          >
            Copy
          </Button>

          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Download className="w-3 h-3" />}
            onClick={handleExportCSV}
          >
            CSV
          </Button>
          <Button variant="secondary" size="xs" onClick={handleExportJSON}>
            JSON
          </Button>
        </div>
      </div>

      {/* Account Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] shadow-subtle">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/60 dark:bg-[#201E1C] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <th className="py-2.5 px-3.5 w-10 text-center">
                <button
                  onClick={handleToggleSelectAllVisible}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {allVisibleSelected ? (
                    <CheckSquare className="w-4 h-4 text-brand-500" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3.5">Account</th>
              <th className="py-2.5 px-3.5 hidden sm:table-cell">Relationship</th>
              <th className="py-2.5 px-3.5 hidden md:table-cell">Followed On</th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] text-xs">
            {paginatedData.map((account) => {
              const meta = accountMetadataMap.get(account.username.toLowerCase());
              const isWhitelisted = meta ? meta.isWhitelisted : !!account.isWhitelisted;
              const notes = meta?.notes || account.notes;

              return (
                <AccountRow
                  key={account.username}
                  account={account}
                  isSelected={selectedSet.has(account.username)}
                  isWhitelisted={isWhitelisted}
                  isUnfollowing={unfollowingUser === account.username}
                  notes={notes}
                  onToggleSelect={toggleSelectUsername}
                  onToggleWhitelist={toggleWhitelist}
                  onOpenNotes={setSelectedAccountForNotes}
                  onUnfollow={handleUnfollow}
                />
              );
            })}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/40 dark:bg-[#1E1C1A] text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
              <strong className="text-neutral-900 dark:text-neutral-100 tabular-nums">
                {filteredData.length.toLocaleString()}
              </strong>{' '}
              accounts
            </span>

            {selectedUsernames.length > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold ml-2">
                {selectedUsernames.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#242220] text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={250}>250 / page</option>
            </select>

            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] text-neutral-500 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tabular-nums px-1.5 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] text-neutral-500 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
