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
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#71806C]/15 dark:bg-[#899783]/20 flex items-center justify-center text-[#71806C] dark:text-[#899783]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#242823] dark:text-[#F0EEE6]">
                How to Download Your Instagram Data
              </h3>
              <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] mt-0.5">
                Official, 100% private step-by-step export instructions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setGuideModalOpen(false)}
            className="p-2 rounded-xl text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Privacy Banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#71806C]/10 border border-[#71806C]/20 text-[#242823] dark:text-[#F0EEE6] text-xs">
            <ShieldCheck className="w-5 h-5 text-[#71806C] dark:text-[#899783] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#242823] dark:text-[#F0EEE6]">Why this is the safest method</p>
              <p className="mt-0.5 text-[#686E64] dark:text-[#A6AA9D] leading-relaxed">
                Instagram actively flags and bans accounts that log in through third-party tracker apps. By using Instagram's official "Download Your Information" feature, you never share your password or session cookies with anyone.
              </p>
            </div>
          </div>

          {/* Direct Link Action Card */}
          <div className="p-4 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-semibold text-sm text-[#242823] dark:text-[#F0EEE6]">
                Meta Accounts Center Portal
              </h4>
              <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D]">
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
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#686E64] dark:text-[#A6AA9D] px-0.5">
              Step-by-Step Instructions
            </h4>

            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716]"
              >
                <div className="w-7 h-7 rounded-full bg-[#E2DFD6] dark:bg-[#272C28] text-[#242823] dark:text-[#F0EEE6] flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                  {step.stepNumber}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-semibold text-sm text-[#242823] dark:text-[#F0EEE6]">
                      {step.title}
                    </h5>
                    {step.actionUrl && (
                      <a
                        href={step.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[#71806C] dark:text-[#899783] hover:underline flex items-center gap-1 transition-colors"
                      >
                        <span>{step.actionLabel || 'Open Link'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#686E64] dark:text-[#A6AA9D] leading-relaxed">
                    {step.description}
                  </p>
                  {step.tip && (
                    <p className="text-[11px] text-[#9E7E43] dark:text-[#CBB279] bg-[#9E7E43]/10 border border-[#9E7E43]/20 px-3 py-1.5 rounded-xl font-medium mt-1">
                      💡 Tip: {step.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ / Key Tips */}
          <div className="p-4 rounded-2xl bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35] space-y-2 text-xs">
            <h5 className="font-semibold text-sm text-[#242823] dark:text-[#F0EEE6] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#686E64] dark:text-[#A6AA9D]" />
              <span>Frequently Asked Questions</span>
            </h5>
            <div className="space-y-2 text-[#686E64] dark:text-[#A6AA9D]">
              <p>
                <strong className="text-[#242823] dark:text-[#F0EEE6]">Q: How long does Instagram take to generate the file?</strong>
                <br />
                A: When selecting ONLY "Followers and following", it typically takes 5 to 15 minutes.
              </p>
              <p>
                <strong className="text-[#242823] dark:text-[#F0EEE6]">Q: Can I import multiple times?</strong>
                <br />
                A: Yes! Every time you download a new export, import it into InstaTrack. InstaTrack will automatically detect which accounts unfollowed you and which newly followed you!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D5D2C5] dark:border-[#343B35] flex items-center justify-between shrink-0 bg-[#E2DFD6]/60 dark:bg-[#1A1D1B]">
          <span className="text-xs text-[#686E64] dark:text-[#A6AA9D] font-medium">
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

