import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { ingestInstagramFiles } from '../../services/ingestion/fileIngestionService';
import { calculateSnapshotMetrics } from '../../services/analytics/engine';
import { officialExportAdapter } from '../../services/browser-adapter/instagramAdapter';
import { saveSnapshot, getSnapshotRelationships } from '../../db';
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

      const followerSet = new Set(stagedData.followers.map((f) => f.username.toLowerCase()));
      const followingSet = new Set(stagedData.following.map((f) => f.username.toLowerCase()));

      let newFollowerCount = 0;
      let unfollowerCount = 0;

      if (prevSnapshot) {
        try {
          const prevRels = await getSnapshotRelationships(prevSnapshot.id);
          const prevFollowerSet = new Set<string>();
          for (const r of prevRels) {
            if (r.relationshipType === 'follower' || r.relationshipType === 'mutual') {
              prevFollowerSet.add(r.username.toLowerCase());
            }
          }
          for (const p of prevFollowerSet) {
            if (!followerSet.has(p)) {
              unfollowerCount++;
            }
          }
          for (const cur of followerSet) {
            if (!prevFollowerSet.has(cur)) {
              newFollowerCount++;
            }
          }
        } catch {}
      }

      const metrics = calculateSnapshotMetrics(
        stagedData.followers,
        stagedData.following,
        newFollowerCount,
        unfollowerCount
      );

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
        newFollowerCount,
        unfollowerCount,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Sheet Window */}
      <div className="relative w-full max-w-[560px] max-h-[88vh] flex flex-col rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] shadow-2xl overflow-hidden font-sans text-[#242823] dark:text-[#F0EEE6]">
        {/* Sheet Top Navigation Bar */}
        <div className="px-5 py-3.5 border-b border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between shrink-0 bg-[#E2DFD6]/60 dark:bg-[#1A1D1B]">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-[13px] font-normal text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <h2 className="text-[13px] font-semibold text-[#242823] dark:text-[#F0EEE6] tracking-tight">
            Import Instagram Data
          </h2>

          <div className="w-12 text-right">
            {stagedData && (
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="text-[13px] font-semibold text-[#71806C] hover:text-[#5d6a59] dark:text-[#899783] dark:hover:text-[#a1b09b] disabled:opacity-50"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Segmented Control */}
        {!stagedData && (
          <div className="px-5 pt-4 pb-1 shrink-0">
            <div className="grid grid-cols-2 p-0.5 rounded-lg bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35] text-[12px] font-medium select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setError(null);
                }}
                className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] font-semibold border border-[#D5D2C5]/80 dark:border-[#343B35]'
                    : 'text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6]'
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
                    ? 'bg-[#EAE8DF] dark:bg-[#202421] text-[#242823] dark:text-[#F0EEE6] font-semibold border border-[#D5D2C5]/80 dark:border-[#343B35]'
                    : 'text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6]'
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
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#A33F31]/10 border border-[#A33F31]/20 text-[#A33F31] dark:text-[#C45B4B] text-xs leading-relaxed">
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
              {/* Drop Canvas */}
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
                    ? 'border-[#71806C] dark:border-[#899783] bg-[#71806C]/10 scale-[0.995]'
                    : 'border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60'
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

                <div className="w-11 h-11 rounded-2xl bg-[#71806C]/15 dark:bg-[#899783]/20 text-[#71806C] dark:text-[#899783] flex items-center justify-center mb-3">
                  <FolderArchive className="w-5 h-5" />
                </div>

                <p className="text-[13px] font-semibold text-[#242823] dark:text-[#F0EEE6] text-center">
                  Drop your Instagram ZIP archive or JSON files here
                </p>
                <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D] mt-1 text-center">
                  or click to select from your computer (supports multi-file selection)
                </p>

                <div className="flex items-center gap-2 mt-3.5 text-[10px] text-[#686E64] dark:text-[#A6AA9D] font-medium">
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
                  <div className="flex justify-between text-xs font-medium text-[#686E64] dark:text-[#A6AA9D]">
                    <span>{progressStatus}</span>
                    <span className="tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E2DFD6] dark:bg-[#1A1D1B] overflow-hidden">
                    <div
                      className="h-full bg-[#71806C] dark:bg-[#899783] transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Direct Shortcut to Meta DYI Portal */}
              <div className="p-3.5 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#242823] dark:text-[#F0EEE6]">
                    Need to download your Instagram data?
                  </p>
                  <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">
                    Takes ~5 minutes. Request it directly from Meta Accounts Center.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => officialExportAdapter.openDataDownloadPortal()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EAE8DF] dark:bg-[#202421] hover:bg-[#E2DFD6] dark:hover:bg-[#272C28] text-[#242823] dark:text-[#F0EEE6] border border-[#D5D2C5] dark:border-[#343B35] flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <span>Request Export</span>
                  <ExternalLink className="w-3 h-3 text-[#686E64] dark:text-[#A6AA9D]" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD GUIDE */}
          {activeTab === 'guide' && !stagedData && (
            <div className="space-y-3.5">
              {/* Direct Portal Launch Button */}
              <div className="p-4 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
                    Meta Accounts Center — Download Your Information
                  </h4>
                  <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">
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
                    className="p-3 rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#E2DFD6] dark:bg-[#272C28] text-[#242823] dark:text-[#F0EEE6] flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
                          {step.title}
                        </h5>
                        {step.actionUrl && (
                          <a
                            href={step.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-[#71806C] dark:text-[#899783] hover:underline flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D] leading-relaxed">
                        {step.description}
                      </p>
                      {step.tip && (
                        <p className="text-[10px] text-[#9E7E43] dark:text-[#CBB279] pt-0.5 font-medium">
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
              <div className="p-4 rounded-xl bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#71806C] dark:text-[#899783]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Export Analyzed Successfully</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E2DFD6] dark:bg-[#272C28] text-[#242823] dark:text-[#F0EEE6] uppercase">
                    {stagedData.sourceType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35]">
                    <span className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">Followers</span>
                    <p className="text-lg font-semibold text-[#242823] dark:text-[#F0EEE6] tabular-nums mt-0.5">
                      {stagedData.followers.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35]">
                    <span className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">Following</span>
                    <p className="text-lg font-semibold text-[#242823] dark:text-[#F0EEE6] tabular-nums mt-0.5">
                      {stagedData.following.length.toLocaleString()}
                    </p>
                  </div>
                </div>

                {stagedData.missingFollowingFile && (
                  <p className="text-[11px] text-[#9E7E43] dark:text-[#CBB279] bg-[#9E7E43]/10 border border-[#9E7E43]/20 p-2.5 rounded-lg">
                    ⚠️ Note: Only followers data was detected. To see non-followers and mutuals, make sure to also include <code>following.json</code>.
                  </p>
                )}

                {stagedData.accountUsername && (
                  <p className="text-xs text-[#686E64] dark:text-[#A6AA9D]">
                    Account: <strong className="text-[#242823] dark:text-[#F0EEE6]">@{stagedData.accountUsername}</strong>
                  </p>
                )}
              </div>

              {/* Label & Optional Notes */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#242823] dark:text-[#F0EEE6] mb-1">
                    Snapshot Name
                  </label>
                  <input
                    type="text"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="e.g. Export Nov 4, 2026"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-[#242823] dark:text-[#F0EEE6] placeholder-[#686E64]/60 dark:placeholder-[#A6AA9D]/60 focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#242823] dark:text-[#F0EEE6] mb-1">
                    Optional Notes
                  </label>
                  <input
                    type="text"
                    value={snapshotNotes}
                    onChange={(e) => setSnapshotNotes(e.target.value)}
                    placeholder="e.g. Follower audit after campaign"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-[#242823] dark:text-[#F0EEE6] placeholder-[#686E64]/60 dark:placeholder-[#A6AA9D]/60 focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783]"
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
