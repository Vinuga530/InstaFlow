import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RelationshipCategory } from '../../types/analytics';
import { cn } from '../../utils/cn';
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
  Sun,
  Moon,
  Upload,
  Sparkles,
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
    theme,
    setTheme,
    setImportModalOpen,
    liveStatus,
  } = useAppStore();

  const isTabDetected = !!liveStatus?.isInstagramTabOpen;

  const groups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'live_mode',
          label: 'Live Hub',
          icon: (
            <span className="relative flex h-4 w-4 items-center justify-center">
              {isTabDetected && (
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <Activity
                className={cn(
                  'w-4 h-4',
                  isTabDetected ? 'text-emerald-500' : 'text-neutral-400'
                )}
              />
            </span>
          ),
          highlight: isTabDetected,
        },
      ],
    },
    {
      title: 'RELATIONSHIPS',
      items: [
        {
          id: 'followers',
          label: 'Followers',
          icon: <Users className="w-4 h-4 text-rose-500/80" />,
          badge: followers.length,
        },
        {
          id: 'following',
          label: 'Following',
          icon: <UserCheck className="w-4 h-4 text-purple-500/80" />,
          badge: following.length,
        },
        {
          id: 'not_following_back',
          label: 'Not Following Back',
          icon: <ArrowUpRight className="w-4 h-4 text-amber-500" />,
          badge: notFollowingBack.length,
          highlight: notFollowingBack.length > 0,
        },
        {
          id: 'mutuals',
          label: 'Mutual Friends',
          icon: <Users2 className="w-4 h-4 text-emerald-500" />,
          badge: mutuals.length,
        },
        {
          id: 'fans',
          label: 'Fans',
          icon: <Heart className="w-4 h-4 text-blue-500" />,
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
          icon: <UserMinus className="w-4 h-4 text-rose-500" />,
          badge: unfollowers.length,
          highlight: unfollowers.length > 0,
        },
        {
          id: 'new_followers',
          label: 'New Followers',
          icon: <UserPlus className="w-4 h-4 text-purple-500" />,
          badge: newFollowers.length,
        },
        {
          id: 'history',
          label: 'Snapshots',
          icon: <History className="w-4 h-4 text-neutral-400" />,
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4 text-neutral-400" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-60 h-screen flex flex-col shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#161514]/80 backdrop-blur-xl select-none">
      {/* Brand & Account Header */}
      <div className="p-4 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-cozy shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-logo font-normal tracking-wide text-neutral-900 dark:text-neutral-50 truncate">
              InstaTrack
            </h1>
            <p className="text-[11px] text-neutral-400 truncate">
              {activeSnapshot ? `@${activeSnapshot.accountUsername || 'account'}` : 'Private Analytics'}
            </p>
          </div>
        </div>

        {/* Live tab pulse indicator */}
        <div
          title={isTabDetected ? 'Instagram tab active' : 'No Instagram tab open'}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-black/[0.04] dark:border-white/[0.06]"
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isTabDetected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300 dark:bg-neutral-600'
            )}
          />
          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
            {isTabDetected ? 'Live' : 'Off'}
          </span>
        </div>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-2.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
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
                      ? 'bg-neutral-200/70 dark:bg-[#282522] text-neutral-900 dark:text-white font-semibold shadow-subtle'
                      : 'text-neutral-600 hover:bg-neutral-100/70 dark:text-neutral-400 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn('shrink-0', isActive ? 'text-brand-500' : 'text-neutral-400')}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums',
                        isActive
                          ? 'bg-white dark:bg-[#3A3633] text-neutral-900 dark:text-neutral-100 shadow-subtle'
                          : item.highlight
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-neutral-200/50 dark:bg-neutral-800/60 text-neutral-500'
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
      <div className="p-3.5 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2">
        <button
          onClick={() => setImportModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-cozy active:scale-[0.98] transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Data</span>
        </button>

        <div className="flex items-center justify-between px-1.5 pt-1 text-xs text-neutral-400">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
            title="Toggle appearance"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-purple-400" />}
            <span className="capitalize text-[11px] font-medium">{theme} Mode</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
