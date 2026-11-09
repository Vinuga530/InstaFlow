import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { clearAllData, exportAllDatabaseData, importDatabaseBackup } from '../../db';
import { seedSampleData } from '../../utils/sampleData';
import { downloadBlob } from '../../services/export/csvExporter';
import { THEME_LIST } from '../../styles/themes';
import { ThemeId } from '../../types/theme';
import {
  Trash2,
  Download,
  Upload,
  Sparkles,
  Database,
  Palette,
  Check,
  AtSign,
  Compass,
  Save,
  HelpCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    activeThemeId,
    setThemeId,
    customUsername,
    setCustomUsername,
    resetOnboarding,
    setOnboardingStep,
    loadSnapshots,
    addToast,
    setLoading,
    setGuideModalOpen,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(customUsername || '');
  const [isSavedUser, setIsSavedUser] = useState(false);

  useEffect(() => {
    setUsernameInput(customUsername || '');
  }, [customUsername]);

  const handleSaveUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = usernameInput.trim().replace(/^@/, '');
    setCustomUsername(clean);
    setIsSavedUser(true);
    setTimeout(() => setIsSavedUser(false), 2000);
    addToast({
      type: 'success',
      title: 'Username Updated',
      message: clean ? `Active profile handle set to @${clean}` : 'Reset to default account handle',
    });
  };

  const handleRevisitTour = async () => {
    setOnboardingStep(1);
    window.location.hash = '#onboarding';
  };

  // Backup database
  const handleBackup = async () => {
    try {
      setLoading(true, 'Exporting full backup...');
      const jsonBackup = await exportAllDatabaseData();
      const filename = `instaflow_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        <h2 className="font-bold tracking-tight text-2xl text-[var(--text-primary)]">
          Preferences &amp; Storage
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Customize your visual aesthetic, update your profile identifier, or inspect local data sovereignty.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-5 shadow-subtle">
        <div>
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Appearance &amp; Theme System</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Select your preferred visual palette. Color tokens adapt dynamically across the entire extension.
          </p>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {THEME_LIST.map((theme) => {
            const isSelected = activeThemeId === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setThemeId(theme.id as ThemeId)}
                className={`p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between active:scale-[0.99] ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-elevated)] ring-2 ring-[var(--accent-primary)]/40 shadow-sm'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {theme.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]">
                      {theme.appearance}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-canvas)]'
                        : 'border border-[var(--border-subtle)] opacity-40'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mb-3">
                  {theme.tagline}
                </p>

                {/* Swatches */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                  {theme.palette.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-black/15 shadow-xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Personalization Section */}
      <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-subtle">
        <div>
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <AtSign className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Target Instagram Username</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Personalizes report labels and header badges. Never requires your password.
          </p>
        </div>

        <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--accent-primary)]">
              @
            </span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="your_username"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={isSavedUser ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          >
            {isSavedUser ? 'Saved!' : 'Update Handle'}
          </Button>
        </form>
      </div>

      {/* Setup Tour & Guidance Section */}
      <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-subtle">
        <div>
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Setup Tour &amp; Export Instructions</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Revisit the step-by-step onboarding walkthrough or inspect how to download your official archive from Meta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
            onClick={handleRevisitTour}
          >
            Revisit Setup Tour
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<HelpCircle className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
            onClick={() => setGuideModalOpen(true)}
          >
            Meta Export Instructions
          </Button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-subtle">
        <div>
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Local Database &amp; Sovereign Backups</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            All relationship snapshots, tags, and accounts are stored strictly in your browser&apos;s sandboxed IndexedDB.
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
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
            onClick={handleSeedSample}
          >
            Load 10k Demo Dataset
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-[var(--status-negative)]">
              Clear All Application Data
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
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
