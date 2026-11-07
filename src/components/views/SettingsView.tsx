import React, { useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { clearAllData, exportAllDatabaseData, importDatabaseBackup } from '../../db';
import { seedSampleData } from '../../utils/sampleData';
import { downloadBlob } from '../../services/export/csvExporter';
import {
  Sun,
  Moon,
  Laptop,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Database,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    loadSnapshots,
    addToast,
    setLoading,
    snapshots,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Backup database
  const handleBackup = async () => {
    try {
      setLoading(true, 'Exporting full backup...');
      const jsonBackup = await exportAllDatabaseData();
      const filename = `instatrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadBlob(jsonBackup, filename, 'application/json');
      addToast({
        type: 'success',
        title: 'Backup Downloaded',
        message: 'All snapshots, relationships, and metadata exported safely.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Backup failed',
        message: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore backup
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true, 'Restoring database...');
      const text = await file.text();
      await importDatabaseBackup(text);
      await loadSnapshots();
      addToast({
        type: 'success',
        title: 'Restore Completed',
        message: 'Successfully imported database from backup file.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Restore Failed',
        message: (err as Error).message,
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (
      window.confirm(
        'WARNING: This will permanently erase ALL stored snapshots, accounts, and notes from your browser IndexedDB storage.\n\nAre you sure you want to proceed?'
      )
    ) {
      try {
        setIsClearing(true);
        setLoading(true, 'Clearing database...');
        await clearAllData();
        await loadSnapshots();
        addToast({
          type: 'success',
          title: 'Database Reset',
          message: 'All application data has been cleared.',
        });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Failed to clear data',
          message: (err as Error).message,
        });
      } finally {
        setIsClearing(false);
        setLoading(false);
      }
    }
  };

  // Seed sample demo data
  const handleSeedSample = async () => {
    try {
      setLoading(true, 'Seeding sample data...');
      await seedSampleData();
      await loadSnapshots();
      addToast({
        type: 'success',
        title: 'Sample Data Loaded',
        message: 'Successfully created 2 realistic demonstration snapshots.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading sample data',
        message: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="font-fredoka text-xl text-[#292522] dark:text-[#F7F4EF]">
          App Preferences & Storage
        </h2>
        <p className="text-xs text-[#8C827A] dark:text-[#A8A199] mt-0.5">
          Customize your display experience, backup your data, or inspect privacy guarantees.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] shadow-cozy space-y-4">
        <div>
          <h3 className="font-fredoka text-base text-[#292522] dark:text-[#F7F4EF] flex items-center gap-2">
            <span>Appearance & Theme</span>
          </h3>
          <p className="text-xs text-[#8C827A] dark:text-[#A8A199] mt-0.5">
            Choose your preferred aesthetic. InstaTrack supports soft oat Light mode and warm espresso Dark mode.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
              theme === 'light'
                ? 'border-[#E05A47] bg-[#E05A47]/10 text-[#E05A47] shadow-cozy shadow-[#E05A47]/10 ring-2 ring-[#E05A47]/20'
                : 'border-black/[0.06] dark:border-white/[0.08] text-[#59534E] dark:text-[#D1CBC5] bg-[#FAF8F5] dark:bg-[#141312] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
              theme === 'dark'
                ? 'border-[#E05A47] bg-[#E05A47]/10 text-[#E05A47] shadow-cozy shadow-[#E05A47]/10 ring-2 ring-[#E05A47]/20'
                : 'border-black/[0.06] dark:border-white/[0.08] text-[#59534E] dark:text-[#D1CBC5] bg-[#FAF8F5] dark:bg-[#141312] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
            }`}
          >
            <Moon className="w-4 h-4 text-purple-400" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
              theme === 'system'
                ? 'border-[#E05A47] bg-[#E05A47]/10 text-[#E05A47] shadow-cozy shadow-[#E05A47]/10 ring-2 ring-[#E05A47]/20'
                : 'border-black/[0.06] dark:border-white/[0.08] text-[#59534E] dark:text-[#D1CBC5] bg-[#FAF8F5] dark:bg-[#141312] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-500" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] shadow-cozy space-y-4">
        <div>
          <h3 className="font-fredoka text-base text-[#292522] dark:text-[#F7F4EF] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E05A47]" />
            <span>Local Database & Backups</span>
          </h3>
          <p className="text-xs text-[#8C827A] dark:text-[#A8A199] mt-0.5">
            All relationship snapshots, tags, and accounts are stored strictly on your computer inside IndexedDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleBackup}
          >
            Export Backup (JSON)
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Restore Backup
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            onClick={handleSeedSample}
          >
            Load 10k Demo Dataset
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Clear All Application Data
            </h4>
            <p className="text-[11px] text-[#8C827A] dark:text-[#A8A199]">
              Permanently erase all stored snapshots, custom tags, and whitelists from this browser.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            isLoading={isClearing}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleClearAllData}
          >
            Clear Database
          </Button>
        </div>
      </div>
    </div>
  );
};

