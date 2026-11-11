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
  CheckCircle2,
  Lock,
  User,
  Building2,
} from 'lucide-react';

interface AccountRowProps {
  account: AccountItem;
  isSelected: boolean;
  isWhitelisted: boolean;
  isUnfollowing?: boolean;
  notes?: string;
  onToggleSelect: (username: string) => void;
  onToggleWhitelist: (username: string) => void;
  onToggleAccountType: (username: string) => void;
  onOpenNotes: (account: AccountItem) => void;
  onUnfollow?: (username: string, userId?: string) => void;
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
    onToggleAccountType,
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
        className={`group transition-colors border-b border-[var(--border-subtle)] ${
          isSelected
            ? 'bg-[var(--accent-subtle)]'
            : 'hover:bg-[var(--bg-surface-hover)]'
        }`}
      >
        {/* Selection Checkbox */}
        <td className="py-2.5 px-3.5 text-center w-10">
          <button
            onClick={() => onToggleSelect(account.username)}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-[var(--accent-primary)]" />
            ) : (
              <Square className="w-4 h-4 text-[var(--border-strong)]" />
            )}
          </button>
        </td>

        {/* Account Info */}
        <td className="py-2.5 px-3.5">
          <div className="flex items-center gap-3">
            <Avatar username={account.username} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                  @{account.username}
                </span>
                {account.isVerified && (
                  <span title="Verified Account" className="inline-flex items-center text-blue-500">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-white dark:text-[#151716]" />
                  </span>
                )}
                {account.isPrivate && (
                  <span title="Private Account" className="inline-flex items-center text-[var(--text-tertiary)]">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] p-0.5 rounded transition-colors"
                  title="Open Instagram Profile"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {account.fullName && (
                <p className="text-[11px] text-[var(--text-secondary)] truncate">
                  {account.fullName}
                </p>
              )}
              {notes && (
                <p className="text-[11px] text-[var(--status-warning)] mt-0.5 flex items-center gap-1 truncate font-medium">
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
            <button
              onClick={() => onToggleAccountType(account.username)}
              title={`Classified as ${account.accountType === 'page' ? 'Page / Brand' : 'Personal (Normal Person)'}. Click to switch.`}
              className="cursor-pointer transition-transform active:scale-95"
            >
              <Badge variant={account.accountType === 'page' ? 'page' : 'personal'} />
            </button>
            {isWhitelisted && <Badge variant="whitelisted" showIcon={false} label="Keep" />}
          </div>
        </td>

        {/* Follow Date */}
        <td className="py-2.5 px-3.5 hidden md:table-cell text-xs text-[var(--text-secondary)] tabular-nums">
          {account.timestamp ? formatDate(account.timestamp) : '—'}
        </td>

        {/* Row Actions */}
        <td className="py-2.5 px-3.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {account.isFollowing && onUnfollow && (
              <button
                onClick={() => onUnfollow(account.username, (account as any).userId || (account as any).id)}
                disabled={isUnfollowing}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--status-negative)] bg-[var(--status-negative-bg)] hover:opacity-90 border border-[var(--status-negative)]/25 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
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
                  ? 'text-[var(--status-warning)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--status-warning)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
              title={isWhitelisted ? 'Remove from whitelist' : 'Star to whitelist'}
            >
              <Star
                className={`w-3.5 h-3.5 ${isWhitelisted ? 'fill-[var(--status-warning)]' : ''}`}
              />
            </button>

            <button
              onClick={() => onOpenNotes(account)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
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
    accountTypeFilter,
    setAccountTypeFilter,
    toggleAccountType,
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
    async (uname: string, uid?: string) => {
      setUnfollowingUser(uname);
      try {
        const ok = await unfollowAccount(uname, uid);
        if (ok) {
          addToast({
            type: 'success',
            title: 'Unfollowed',
            message: `Successfully unfollowed @${uname}.`,
          });
        }
      } finally {
        setUnfollowingUser(null);
      }
    },
    [unfollowAccount, addToast]
  );

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 200);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 whenever category, search, or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [activeCategory, debouncedSearch, whitelistedOnly, accountTypeFilter]);

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

  // Account Type Counts for quick classification filter tabs
  const typeCounts = useMemo(() => {
    let personal = 0;
    let pageCount = 0;
    let verified = 0;
    for (const a of rawData) {
      if (a.accountType === 'personal') personal++;
      if (a.accountType === 'page') pageCount++;
      if (a.isVerified) verified++;
    }
    return { all: rawData.length, personal, page: pageCount, verified };
  }, [rawData]);

  // 2. Filter data
  const filteredData: AccountItem[] = useMemo(() => {
    let result = rawData;

    // Search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.username.toLowerCase().includes(q) ||
          (a.fullName && a.fullName.toLowerCase().includes(q))
      );
    }

    // Whitelist only filter
    if (whitelistedOnly) {
      result = result.filter((a) => {
        const meta = accountMetadataMap.get(a.username.toLowerCase());
        return meta ? meta.isWhitelisted : a.isWhitelisted;
      });
    }

    // Account Type Filter (Personal vs Page vs Verified)
    if (accountTypeFilter === 'personal') {
      result = result.filter((a) => a.accountType === 'personal');
    } else if (accountTypeFilter === 'page') {
      result = result.filter((a) => a.accountType === 'page');
    } else if (accountTypeFilter === 'verified') {
      result = result.filter((a) => !!a.isVerified);
    }

    // 3. Sort data
    return [...result].sort((a, b) => {
      if (sortField === 'username') {
        const cmp = a.username.localeCompare(b.username);
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortField === 'timestamp') {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [rawData, debouncedSearch, whitelistedOnly, accountTypeFilter, sortField, sortOrder, accountMetadataMap]);

  // 4. Pagination
  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Selection states
  const selectedSet = useMemo(() => new Set(selectedUsernames), [selectedUsernames]);
  const visibleUsernames = useMemo(() => paginatedData.map((a) => a.username), [paginatedData]);
  const allVisibleSelected =
    visibleUsernames.length > 0 && visibleUsernames.every((u) => selectedSet.has(u));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      clearSelection();
    } else {
      selectAllUsernames(visibleUsernames);
    }
  };

  const handleCopyUsernames = useCallback(() => {
    const toCopy =
      selectedUsernames.length > 0
        ? selectedUsernames
        : filteredData.map((a) => a.username);

    navigator.clipboard.writeText(toCopy.join('\n'));
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: `Copied ${toCopy.length} usernames.`,
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
          icon={<Smile className="w-8 h-8 text-[var(--accent-primary)]" />}
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Account Type Classification Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => {
            setAccountTypeFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            accountTypeFilter === 'all'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
          }`}
        >
          All Accounts ({typeCounts.all})
        </button>
        <button
          onClick={() => {
            setAccountTypeFilter('personal');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            accountTypeFilter === 'personal'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-emerald-500 border border-[var(--border-subtle)]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal / Normal People ({typeCounts.personal})</span>
        </button>
        <button
          onClick={() => {
            setAccountTypeFilter('page');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            accountTypeFilter === 'page'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-sky-500 border border-[var(--border-subtle)]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Pages &amp; Brands ({typeCounts.page})</span>
        </button>
        <button
          onClick={() => {
            setAccountTypeFilter('verified');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            accountTypeFilter === 'verified'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-blue-500 border border-[var(--border-subtle)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified ({typeCounts.verified})</span>
        </button>
      </div>

      {/* Search, Filter & Bulk Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {/* Instant Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by username or name..."
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              whitelistedOnly
                ? 'bg-[var(--status-warning-bg)] border-[var(--status-warning)]/30 text-[var(--status-warning)]'
                : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${whitelistedOnly ? 'fill-[var(--status-warning)] text-[var(--status-warning)]' : 'text-[var(--text-secondary)]'}`}
            />
            <span>Starred</span>
          </button>

          {/* Sort Control */}
          <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-0.5 text-xs">
            <button
              onClick={() => {
                if (sortField === 'username') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('username');
                  setSortOrder('asc');
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sortField === 'username'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>A-Z</span>
              {sortField === 'username' && (
                <span className="ml-1 text-[10px] text-[var(--accent-primary)]">
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
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sortField === 'timestamp'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Date</span>
              {sortField === 'timestamp' && (
                <span className="ml-1 text-[10px] text-[var(--accent-primary)]">
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
      <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              <th className="py-2.5 px-3.5 w-10 text-center">
                <button
                  onClick={handleToggleSelectAllVisible}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {allVisibleSelected ? (
                    <CheckSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--border-strong)]" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3.5">Account</th>
              <th className="py-2.5 px-3.5 hidden sm:table-cell">Relationship</th>
              <th className="py-2.5 px-3.5 hidden md:table-cell">Followed On</th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
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
                  onToggleAccountType={toggleAccountType}
                  onOpenNotes={setSelectedAccountForNotes}
                  onUnfollow={handleUnfollow}
                />
              );
            })}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span>
              Showing {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} accounts
            </span>
            {selectedUsernames.length > 0 && (
              <span className="font-semibold text-[var(--accent-primary)]">
                &bull; {selectedUsernames.length} selected
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
              className="py-1 px-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bg-surface-hover)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[var(--text-primary)] px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bg-surface-hover)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
