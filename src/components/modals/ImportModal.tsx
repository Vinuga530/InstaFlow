import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { ingestInstagramFiles } from '../../services/ingestion/fileIngestionService';
import { calculateSnapshotMetrics } from '../../services/analytics/engine';
import { officialExportAdapter } from '../../services/browser-adapter/instagramAdapter';
import { saveSnapshot } from '../../db';
import { Snapshot, SnapshotRelationship } from '../../types/database';
import { ParsedInstagramData } from '../../types/instagram';
import { formatDate } from '../../utils/formatters';
import {
  Upload,
  X,
  FileArchive,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ChevronRight,
  FolderArchive,
  Sparkles,
} from 'lucide-react';

export const ImportModal: React.FC = () => {
  const {
    isImportModalOpen,
    setImportModalOpen,
    loadSnapshots,
    selectSnapshot,
    addToast,
    snapshots,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'guide'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Staged parsed data awaiting user confirmation
  const [stagedData, setStagedData] = useState<ParsedInstagramData | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isImportModalOpen) return null;

  const handleClose = () => {
    if (isProcessing) return;
    setStagedData(null);
    setError(null);
    setProgressPercent(0);
    setProgressStatus('');
    setActiveTab('upload');
    setImportModalOpen(false);
  };

  const processFileList = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setError(null);
    setIsProcessing(true);
    setProgressPercent(15);
    setProgressStatus('Reading files...');

    try {
      const parsedResult = await ingestInstagramFiles(files, (pct, status) => {
        setProgressPercent(pct);
        setProgressStatus(status);
      });

      setStagedData(parsedResult);
      const defaultLabel = `Export ${formatDate(new Date())}`;
      setSnapshotLabel(defaultLabel);
      setProgressPercent(100);
      setProgressStatus('Data parsed successfully');
    } catch (err) {
      setError((err as Error).message || 'Failed to parse file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleConfirmImport = async () => {
    if (!stagedData) return;

    try {
      setIsProcessing(true);
      setProgressStatus('Saving snapshot locally...');

      const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();
      const prevSnapshot = snapshots.length > 0 ? snapshots[0] : undefined;

      const metrics = calculateSnapshotMetrics(
        stagedData.followers,
        stagedData.following,
        0,
        0
      );

      const followerSet = new Set(stagedData.followers.map((f) => f.username.toLowerCase()));
      const followingSet = new Set(stagedData.following.map((f) => f.username.toLowerCase()));

      const relationships: Omit<SnapshotRelationship, 'id'>[] = [];

      // Followers & Mutuals
      for (const f of stagedData.followers) {
        const isMutual = followingSet.has(f.username.toLowerCase());
        relationships.push({
          snapshotId,
          username: f.username,
          profileUrl: f.profileUrl,
          fullName: f.fullName,
          relationshipType: isMutual ? 'mutual' : 'follower',
          timestamp: f.timestamp || now,
        });
      }

      // Following (non-mutual)
      for (const f of stagedData.following) {
        if (!followerSet.has(f.username.toLowerCase())) {
          relationships.push({
            snapshotId,
            username: f.username,
            profileUrl: f.profileUrl,
            fullName: f.fullName,
            relationshipType: 'following',
            timestamp: f.timestamp || now,
          });
        }
      }

      const snapshot: Snapshot = {
        id: snapshotId,
        timestamp: now,
        label: snapshotLabel.trim() || `Export ${formatDate(new Date())}`,
        accountUsername: stagedData.accountUsername || 'my_account',
        followerCount: stagedData.followers.length,
        followingCount: stagedData.following.length,
        notFollowingBackCount: metrics.notFollowingBackCount,
        fansCount: metrics.fansCount,
        mutualCount: metrics.mutualCount,
        newFollowerCount: 0,
        unfollowerCount: 0,
        notes: snapshotNotes.trim() || undefined,
        sourceType: stagedData.sourceType,
        fileName: stagedData.sourceFileName,
        previousSnapshotId: prevSnapshot?.id,
      };

      await saveSnapshot(snapshot, relationships);
      await loadSnapshots();
      await selectSnapshot(snapshotId);

      addToast({
        type: 'success',
        title: 'Snapshot Saved',
        message: `Imported ${stagedData.followers.length.toLocaleString()} followers and ${stagedData.following.length.toLocaleString()} following.`,
      });

      handleClose();
    } catch (err) {
      setError(`Failed to save snapshot: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const guideSteps = officialExportAdapter.getGuideSteps();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Apple-style Modal Sheet Window */}
      <div className="relative w-full max-w-[560px] max-h-[88vh] flex flex-col rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl shadow-2xl overflow-hidden font-sans text-neutral-900 dark:text-[#F5F5F7]">
        {/* Sheet Top Navigation Bar (macOS / iPadOS style) */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/40">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-[13px] font-normal text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <h2 className="text-[13px] font-semibold text-neutral-900 dark:text-white tracking-tight">
            Import Instagram Data
          </h2>

          <div className="w-12 text-right">
            {stagedData && (
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="text-[13px] font-semibold text-brand-500 hover:text-brand-600 dark:text-rose-400 dark:hover:text-rose-300 disabled:opacity-50"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Apple Segmented Control */}
        {!stagedData && (
          <div className="px-5 pt-4 pb-1 shrink-0">
            <div className="grid grid-cols-2 p-0.5 rounded-lg bg-neutral-200/70 dark:bg-[#2C2C2E] text-[12px] font-medium select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setError(null);
                }}
                className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-[#3A3A3C] text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Files</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('guide');
                  setError(null);
                }}
                className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'guide'
                    ? 'bg-white dark:bg-[#3A3A3C] text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Download Guide</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Error Notice */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Import</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD WORKFLOW */}
          {activeTab === 'upload' && !stagedData && (
            <div className="space-y-4">
              {/* Apple-style Receptive Drop Canvas */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-9 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  dragActive
                    ? 'border-brand-500 bg-brand-500/[0.04] scale-[0.995]'
                    : 'border-neutral-300/80 dark:border-neutral-700/80 bg-neutral-500/[0.02] dark:bg-neutral-500/[0.04] hover:bg-neutral-500/[0.05] hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.json"
                  className="hidden"
                  onChange={(e) => e.target.files && processFileList(e.target.files)}
                />

                <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-rose-500/10 to-purple-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-3 shadow-sm">
                  <FolderArchive className="w-5 h-5" />
                </div>

                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 text-center">
                  Drop your Instagram ZIP archive or JSON files here
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 text-center">
                  or click to select from your Mac (supports multi-file selection)
                </p>

                <div className="flex items-center gap-2 mt-3.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                  <span className="flex items-center gap-1">
                    <FileArchive className="w-3 h-3" /> .ZIP Export
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3 h-3" /> followers_*.json / following.json
                  </span>
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    <span>{progressStatus}</span>
                    <span className="tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Direct Shortcut to Meta DYI Portal */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/60 dark:bg-[#2C2C2E]/50 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    Need to download your Instagram data?
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Takes ~5 minutes. Request it directly from Meta Accounts Center.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => officialExportAdapter.openDataDownloadPortal()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#3A3A3C] hover:bg-neutral-100 dark:hover:bg-[#48484A] text-neutral-900 dark:text-white border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <span>Request Export</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD GUIDE */}
          {activeTab === 'guide' && !stagedData && (
            <div className="space-y-3.5">
              {/* Direct Portal Launch Button */}
              <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-[#2C2C2E]/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Meta Accounts Center — Download Your Information
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Opens the official Instagram data export page in a new browser tab
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => officialExportAdapter.openDataDownloadPortal()}
                >
                  Open Portal
                </Button>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-2">
                {guideSteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.07] bg-white dark:bg-[#2C2C2E]/30 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-semibold text-neutral-900 dark:text-white">
                          {step.title}
                        </h5>
                        {step.actionUrl && (
                          <a
                            href={step.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-brand-500 hover:underline flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {step.description}
                      </p>
                      {step.tip && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 pt-0.5 font-medium">
                          💡 {step.tip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ready to Upload */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => setActiveTab('upload')}
                >
                  I have my file, proceed to upload
                </Button>
              </div>
            </div>
          )}

          {/* STAGED CONFIRMATION PREVIEW */}
          {stagedData && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#2C2C2E]/60 border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Export Analyzed Successfully</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 uppercase">
                    {stagedData.sourceType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08]">
                    <span className="text-[11px] text-neutral-400">Followers</span>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums mt-0.5">
                      {stagedData.followers.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08]">
                    <span className="text-[11px] text-neutral-400">Following</span>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums mt-0.5">
                      {stagedData.following.length.toLocaleString()}
                    </p>
                  </div>
                </div>

                {stagedData.missingFollowingFile && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg">
                    ⚠️ Note: Only followers data was detected. To see non-followers and mutuals, make sure to also include <code>following.json</code>.
                  </p>
                )}

                {stagedData.accountUsername && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Account: <strong className="text-neutral-900 dark:text-white">@{stagedData.accountUsername}</strong>
                  </p>
                )}
              </div>

              {/* Label & Optional Notes */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Snapshot Name
                  </label>
                  <input
                    type="text"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="e.g. Export Nov 4, 2026"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Optional Notes
                  </label>
                  <input
                    type="text"
                    value={snapshotNotes}
                    onChange={(e) => setSnapshotNotes(e.target.value)}
                    placeholder="e.g. Follower audit after campaign"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStagedData(null)}
                  disabled={isProcessing}
                >
                  Change File
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  onClick={handleConfirmImport}
                >
                  Confirm & Save Snapshot
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
