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
        <h2 className="font-medium tracking-tight text-xl text-[#242823] dark:text-[#F0EEE6]">
          App Preferences & Storage
        </h2>
        <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
          Customize your display experience, backup your data, or inspect privacy guarantees.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] space-y-4">
        <div>
          <h3 className="font-semibold text-base text-[#242823] dark:text-[#F0EEE6] flex items-center gap-2">
            <span>Appearance & Theme</span>
          </h3>
          <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
            Choose your preferred aesthetic. InstaTrack uses the Quiet Precision palette in light and dark modes.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
              theme === 'light'
                ? 'border-[#71806C] dark:border-[#899783] bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#242823] dark:text-[#F0EEE6] ring-1 ring-[#71806C]/30'
                : 'border-[#D5D2C5] dark:border-[#343B35] text-[#686E64] dark:text-[#A6AA9D] bg-[#F5F3EC] dark:bg-[#151716] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60'
            }`}
          >
            <Sun className="w-4 h-4 text-[#9E7E43] dark:text-[#CBB279]" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
              theme === 'dark'
                ? 'border-[#71806C] dark:border-[#899783] bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#242823] dark:text-[#F0EEE6] ring-1 ring-[#71806C]/30'
                : 'border-[#D5D2C5] dark:border-[#343B35] text-[#686E64] dark:text-[#A6AA9D] bg-[#F5F3EC] dark:bg-[#151716] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60'
            }`}
          >
            <Moon className="w-4 h-4 text-[#71806C] dark:text-[#899783]" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] ${
              theme === 'system'
                ? 'border-[#71806C] dark:border-[#899783] bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#242823] dark:text-[#F0EEE6] ring-1 ring-[#71806C]/30'
                : 'border-[#D5D2C5] dark:border-[#343B35] text-[#686E64] dark:text-[#A6AA9D] bg-[#F5F3EC] dark:bg-[#151716] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60'
            }`}
          >
            <Laptop className="w-4 h-4 text-[#686E64] dark:text-[#A6AA9D]" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] space-y-4">
        <div>
          <h3 className="font-semibold text-base text-[#242823] dark:text-[#F0EEE6] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#71806C] dark:text-[#899783]" />
            <span>Local Database & Backups</span>
          </h3>
          <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
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
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#71806C] dark:text-[#899783]" />}
            onClick={handleSeedSample}
          >
            Load 10k Demo Dataset
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-[#D5D2C5] dark:border-[#343B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-[#A33F31] dark:text-[#C45B4B]">
              Clear All Application Data
            </h4>
            <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">
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

