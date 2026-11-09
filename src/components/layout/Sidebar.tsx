import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RelationshipCategory } from '../../types/analytics';
import { cn } from '../../utils/cn';
import { BrandLogo } from '../common/BrandLogo';
import { THEMES } from '../../styles/themes';
import {
  LayoutDashboard,
  Activity,
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  Users2,
  ArrowUpRight,
  Heart,
  History,
  Settings,
  Palette,
  Upload,
} from 'lucide-react';

interface NavItemDef {
  id: RelationshipCategory;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItemDef[];
}

export const Sidebar: React.FC = () => {
  const {
    activeCategory,
    setActiveCategory,
    activeSnapshot,
    followers,
    following,
    notFollowingBack,
    fans,
    mutuals,
    unfollowers,
    newFollowers,
    activeThemeId,
    setThemeId,
    setImportModalOpen,
    liveStatus,
    customUsername,
  } = useAppStore();

  const isTabDetected = !!liveStatus?.isInstagramTabOpen;
  const currentTheme = THEMES[activeThemeId] || THEMES.slate_sand;

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES) as (keyof typeof THEMES)[];
    const currentIndex = themeKeys.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setThemeId(themeKeys[nextIndex]);
  };

  const groups: NavGroup[] = [
    {
      title: 'ANALYTICS',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'live_mode',
          label: 'Live Mode',
          icon: (
            <div className="relative">
              <Activity
                className={cn(
                  'w-4 h-4',
                  isTabDetected ? 'text-[var(--accent-primary)]' : 'text-current opacity-70'
                )}
              />
              {isTabDetected && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--status-positive)] animate-pulse" />
              )}
            </div>
          ),
        },
      ],
    },
    {
      title: 'RELATIONSHIPS',
      items: [
        {
          id: 'not_following_back',
          label: 'Not Following Back',
          icon: <ArrowUpRight className="w-4 h-4 text-[var(--status-warning)]" />,
          badge: notFollowingBack.length,
          highlight: notFollowingBack.length > 0,
        },
        {
          id: 'followers',
          label: 'Followers',
          icon: <Users className="w-4 h-4" />,
          badge: followers.length,
        },
        {
          id: 'following',
          label: 'Following',
          icon: <UserCheck className="w-4 h-4" />,
          badge: following.length,
        },
        {
          id: 'mutuals',
          label: 'Mutual Friends',
          icon: <Users2 className="w-4 h-4" />,
          badge: mutuals.length,
        },
        {
          id: 'fans',
          label: 'Fans',
          icon: <Heart className="w-4 h-4" />,
          badge: fans.length,
        },
      ],
    },
    {
      title: 'ACTIVITY',
      items: [
        {
          id: 'unfollowers',
          label: 'Unfollowers',
          icon: <UserMinus className="w-4 h-4 text-[var(--status-negative)]" />,
          badge: unfollowers.length,
          highlight: unfollowers.length > 0,
        },
        {
          id: 'new_followers',
          label: 'New Followers',
          icon: <UserPlus className="w-4 h-4 text-[var(--status-positive)]" />,
          badge: newFollowers.length,
        },
        {
          id: 'history',
          label: 'Snapshots',
          icon: <History className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  const displayHandle = activeSnapshot?.accountUsername
    ? `@${activeSnapshot.accountUsername}`
    : customUsername
    ? `@${customUsername}`
    : 'Private Analytics';

  return (
    <aside className="w-60 h-screen flex flex-col shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] select-none">
      {/* Brand & Account Header */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="w-8 h-8 rounded-xl shrink-0 overflow-hidden shadow-xs" size={32} />
          <div className="min-w-0">
            <h1 className="text-base font-logo font-normal tracking-wide text-[var(--text-primary)] truncate">
              InstaTrack
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {displayHandle}
            </p>
          </div>
        </div>

        {/* Live tab pulse indicator */}
        <div
          title={isTabDetected ? 'Instagram tab active' : 'No Instagram tab open'}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]"
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isTabDetected ? 'bg-[var(--status-positive)] animate-pulse' : 'bg-[var(--border-strong)]'
            )}
          />
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">
            {isTabDetected ? 'Live' : 'Off'}
          </span>
        </div>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-2.5 text-[10px] font-semibold text-[var(--text-tertiary)] tracking-wider uppercase">
              {group.title}
            </h2>
            {group.items.map((item) => {
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)] font-semibold border border-[var(--accent-primary)]/30 shadow-subtle'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn('shrink-0', isActive ? 'text-[var(--accent-primary)]' : 'opacity-70')}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium tabular-nums',
                        isActive
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                          : item.highlight
                            ? 'bg-[var(--status-negative-bg)] text-[var(--status-negative)]'
                            : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'
                      )}
                    >
                      {item.badge.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions: Import & Theme */}
      <div className="p-3.5 border-t border-[var(--border-subtle)] space-y-2">
        <button
          onClick={() => setImportModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:opacity-90 text-[var(--bg-canvas)] shadow-subtle active:scale-[0.98] transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Data</span>
        </button>

        <div className="flex items-center justify-between px-1.5 pt-1 text-xs text-[var(--text-secondary)]">
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors w-full"
            title="Cycle theme palette"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[11px] font-medium truncate">{currentTheme.name}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
