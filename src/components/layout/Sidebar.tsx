import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RelationshipCategory } from '../../types/analytics';
import { cn } from '../../utils/cn';
import { BrandLogo } from '../common/BrandLogo';
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
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#71806C] dark:bg-[#899783] opacity-60"></span>
              )}
              <Activity
                className={cn(
                  'w-4 h-4',
                  isTabDetected ? 'text-[#71806C] dark:text-[#899783]' : 'text-current opacity-70'
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
          id: 'not_following_back',
          label: 'Not Following Back',
          icon: <ArrowUpRight className="w-4 h-4" />,
          badge: notFollowingBack.length,
          highlight: notFollowingBack.length > 0,
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
          icon: <UserMinus className="w-4 h-4" />,
          badge: unfollowers.length,
          highlight: unfollowers.length > 0,
        },
        {
          id: 'new_followers',
          label: 'New Followers',
          icon: <UserPlus className="w-4 h-4" />,
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

  return (
    <aside className="w-60 h-screen flex flex-col shrink-0 border-r border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] select-none">
      {/* Brand & Account Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#D5D2C5] dark:border-[#343B35]">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="w-8 h-8 rounded-xl shrink-0 overflow-hidden" size={32} />
          <div className="min-w-0">
            <h1 className="text-base font-logo font-normal tracking-wide text-[#242823] dark:text-[#F0EEE6] truncate">
              InstaTrack
            </h1>
            <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D] truncate">
              {activeSnapshot ? `@${activeSnapshot.accountUsername || 'account'}` : 'Private Analytics'}
            </p>
          </div>
        </div>

        {/* Live tab pulse indicator */}
        <div
          title={isTabDetected ? 'Instagram tab active' : 'No Instagram tab open'}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#E2DFD6] dark:bg-[#272C28] border border-[#D5D2C5] dark:border-[#343B35]"
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isTabDetected ? 'bg-[#71806C] dark:bg-[#899783] animate-pulse' : 'bg-[#BCB8A9] dark:bg-[#444E46]'
            )}
          />
          <span className="text-[10px] font-medium text-[#686E64] dark:text-[#A6AA9D]">
            {isTabDetected ? 'Live' : 'Off'}
          </span>
        </div>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="px-2.5 text-[10px] font-semibold text-[#8D9387] dark:text-[#72776C] tracking-wider uppercase">
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
                      ? 'bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#242823] dark:text-[#F0EEE6] font-semibold border border-[#71806C]/25 dark:border-[#899783]/30 shadow-subtle'
                      : 'text-[#686E64] hover:bg-[#E2DFD6]/60 dark:text-[#A6AA9D] dark:hover:bg-[#272C28]/60 hover:text-[#242823] dark:hover:text-[#F0EEE6]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn('shrink-0', isActive ? 'text-[#71806C] dark:text-[#899783]' : 'opacity-70')}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium tabular-nums',
                        isActive
                          ? 'bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] border border-[#71806C]/30 dark:border-[#899783]/30'
                          : item.highlight
                          ? 'bg-[#A33F31]/10 text-[#A33F31] dark:bg-[#C45B4B]/15 dark:text-[#C45B4B]'
                          : 'bg-[#E2DFD6] dark:bg-[#272C28] text-[#686E64] dark:text-[#A6AA9D]'
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
      <div className="p-3.5 border-t border-[#D5D2C5] dark:border-[#343B35] space-y-2">
        <button
          onClick={() => setImportModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[#71806C] hover:bg-[#606E5B] dark:bg-[#899783] dark:hover:bg-[#98A792] text-[#F5F3EC] dark:text-[#151716] shadow-subtle active:scale-[0.98] transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Data</span>
        </button>

        <div className="flex items-center justify-between px-1.5 pt-1 text-xs text-[#686E64] dark:text-[#A6AA9D]">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6] dark:hover:bg-[#272C28] transition-colors"
            title="Toggle appearance"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#899783]" /> : <Moon className="w-3.5 h-3.5 text-[#71806C]" />}
            <span className="capitalize text-[11px] font-medium">{theme} Mode</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
