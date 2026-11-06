import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { officialExportAdapter } from '../../services/browser-adapter/instagramAdapter';
import { Button } from '../common/Button';
import {
  BookOpen,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileJson,
  Upload,
} from 'lucide-react';

export const BrowserGuideModal: React.FC = () => {
  const { isGuideModalOpen, setGuideModalOpen, setImportModalOpen } = useAppStore();

  if (!isGuideModalOpen) return null;

  const steps = officialExportAdapter.getGuideSteps();

  const handleOpenAccountsCenter = () => {
    officialExportAdapter.openDataDownloadPortal();
  };

  const handleOpenImport = () => {
    setGuideModalOpen(false);
    setImportModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1B1918]/95 backdrop-blur-2xl shadow-cozy-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E05A47] via-[#D94E34] to-[#C93B20] flex items-center justify-center text-white shadow-cozy shadow-[#E05A47]/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fredoka text-lg text-[#292522] dark:text-[#F7F4EF]">
                How to Download Your Instagram Data
              </h3>
              <p className="text-xs text-[#8C827A] dark:text-[#A8A199] mt-0.5">
                Official, 100% private step-by-step export instructions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setGuideModalOpen(false)}
            className="p-2 rounded-xl text-[#8C827A] hover:text-[#292522] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Privacy Banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200">Why this is the safest method</p>
              <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                Instagram actively flags and bans accounts that log in through third-party tracker apps. By using Instagram's official "Download Your Information" feature, you never share your password or session cookies with anyone.
              </p>
            </div>
          </div>

          {/* Direct Link Action Card */}
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#141312] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-fredoka text-sm text-[#292522] dark:text-[#F7F4EF]">
                Meta Accounts Center Portal
              </h4>
              <p className="text-[11px] text-[#8C827A] dark:text-[#A8A199]">
                Direct shortcut to the data download request portal
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={handleOpenAccountsCenter}
            >
              Open Instagram DYI
            </Button>
          </div>

          {/* Interactive Steps List */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A] dark:text-[#A8A199] px-0.5">
              Step-by-Step Instructions
            </h4>

            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-start gap-3.5 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] shadow-cozy"
              >
                <div className="w-7 h-7 rounded-full bg-[#E05A47]/10 text-[#E05A47] flex items-center justify-center font-fredoka text-sm shrink-0 mt-0.5">
                  {step.stepNumber}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-fredoka text-sm text-[#292522] dark:text-[#F7F4EF]">
                      {step.title}
                    </h5>
                    {step.actionUrl && (
                      <a
                        href={step.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#E05A47] hover:text-[#C93B20] flex items-center gap-1 transition-colors"
                      >
                        <span>{step.actionLabel || 'Open Link'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#59534E] dark:text-[#D1CBC5] leading-relaxed">
                    {step.description}
                  </p>
                  {step.tip && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-medium mt-1">
                      💡 Tip: {step.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ / Key Tips */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-black/[0.04] dark:border-white/[0.04] space-y-2 text-xs">
            <h5 className="font-fredoka text-sm text-[#292522] dark:text-[#F7F4EF] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8C827A] dark:text-[#A8A199]" />
              <span>Frequently Asked Questions</span>
            </h5>
            <div className="space-y-2 text-[#59534E] dark:text-[#D1CBC5]">
              <p>
                <strong className="text-[#292522] dark:text-[#F7F4EF]">Q: How long does Instagram take to generate the file?</strong>
                <br />
                A: When selecting ONLY "Followers and following", it typically takes 5 to 15 minutes.
              </p>
              <p>
                <strong className="text-[#292522] dark:text-[#F7F4EF]">Q: Can I import multiple times?</strong>
                <br />
                A: Yes! Every time you download a new export, import it into InstaTrack. InstaTrack will automatically detect which accounts unfollowed you and which newly followed you!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-[#FAF8F5]/80 dark:bg-[#141312]/80">
          <span className="text-xs text-[#8C827A] dark:text-[#A8A199] font-medium">
            Already downloaded your ZIP or JSON?
          </span>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={handleOpenImport}
          >
            Import File Now
          </Button>
        </div>
      </div>
    </div>
  );
};

