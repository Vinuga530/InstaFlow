import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { formatDate } from '../../utils/formatters';
import {
  Upload,
  GitCompare,
  Calendar,
  Layers,
  Activity,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeCategory,
    activeSnapshot,
    snapshots,
    selectSnapshot,
    setImportModalOpen,
    setCompareModalOpen,
    dataSourceMode,
    setDataSourceMode,
  } = useAppStore();

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Analytics Overview',
      subtitle: 'Relationship health, mutual connections, and follower changes.',
    },
    live_mode: {
      title: 'Live Synchronization Hub',
      subtitle: 'Real-time browser session detection and authorized synchronization.',
    },
    followers: {
      title: 'Followers',
      subtitle: 'Accounts currently following your Instagram profile.',
    },
    following: {
      title: 'Following',
      subtitle: 'Accounts you are currently following.',
    },
    not_following_back: {
      title: 'Not Following Back',
      subtitle: 'Accounts you follow that do not follow your account in return.',
    },
    fans: {
      title: 'Fans',
      subtitle: 'Accounts that follow you, but you do not follow back.',
    },
    mutuals: {
      title: 'Mutual Friends',
      subtitle: 'Accounts where you follow each other reciprocally.',
    },
    unfollowers: {
      title: 'Unfollowers',
      subtitle: 'Accounts present in the prior snapshot that are missing in the current snapshot.',
    },
    new_followers: {
      title: 'New Followers',
      subtitle: 'Accounts newly detected in this snapshot compared to the prior snapshot.',
    },
    history: {
      title: 'Historical Snapshots',
      subtitle: 'Manage and compare dated imports to analyze relationship changes over time.',
    },
    settings: {
      title: 'Settings & Privacy',
      subtitle: 'Manage appearance, local data backups, and whitelist preferences.',
    },
  };

  const current = titles[activeCategory] || titles.overview;

  return (
    <header className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#161514]/80 backdrop-blur-xl shrink-0 select-none">
      <div>
        <h2 className="text-base sm:text-lg font-fredoka font-normal tracking-wide text-neutral-900 dark:text-neutral-50">
          {current.title}
        </h2>
        <p className="text-[11px] text-neutral-400 hidden sm:block">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Snapshot Selector */}
        {snapshots.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={activeSnapshot?.id || ''}
                onChange={(e) => selectSnapshot(e.target.value)}
                className="appearance-none pl-7 pr-7 py-1.5 text-xs font-medium rounded-xl border border-black/[0.07] dark:border-white/[0.1] bg-white dark:bg-[#242220] text-neutral-800 dark:text-neutral-200 cursor-pointer shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({formatDate(s.timestamp)})
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Layers className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Compare snapshots button */}
            {snapshots.length >= 2 && (
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<GitCompare className="w-3.5 h-3.5 text-purple-500" />}
                onClick={() => setCompareModalOpen(true)}
              >
                Compare
              </Button>
            )}
          </div>
        )}

        {/* Quick Mode Shortcut */}
        {activeCategory !== 'live_mode' ? (
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Activity className="w-3.5 h-3.5 text-rose-500" />}
            onClick={() => setDataSourceMode('live')}
          >
            Live Hub
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Layers className="w-3.5 h-3.5" />}
            onClick={() => setDataSourceMode('import')}
          >
            Import View
          </Button>
        )}

        {/* Import Action */}
        <Button
          variant="primary"
          size="xs"
          leftIcon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => setImportModalOpen(true)}
        >
          Import
        </Button>
      </div>
    </header>
  );
};
