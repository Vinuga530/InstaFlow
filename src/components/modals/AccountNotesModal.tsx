import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import {
  FileText,
  X,
  Star,
  Tag,
  ExternalLink,
} from 'lucide-react';

export const AccountNotesModal: React.FC = () => {
  const {
    selectedAccountForNotes,
    setSelectedAccountForNotes,
    saveAccountNotes,
    toggleWhitelist,
  } = useAppStore();

  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedAccountForNotes) {
      setNotes(selectedAccountForNotes.notes || '');
      setTags(selectedAccountForNotes.tags || []);
      setTagInput('');
    }
  }, [selectedAccountForNotes]);

  if (!selectedAccountForNotes) return null;

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveAccountNotes(selectedAccountForNotes.username, notes, tags);
      setSelectedAccountForNotes(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1B1918]/95 backdrop-blur-2xl shadow-cozy-lg overflow-hidden p-6 space-y-5">
        {/* Header with Account info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar username={selectedAccountForNotes.username} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-fredoka text-base text-[#292522] dark:text-[#F7F4EF]">
                  @{selectedAccountForNotes.username}
                </h3>
                <a
                  href={selectedAccountForNotes.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8C827A] hover:text-[#E05A47] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-[#8C827A] dark:text-[#A8A199] font-medium">
                Custom Account Notes & Whitelist
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedAccountForNotes(null)}
            className="p-2 rounded-xl text-[#8C827A] hover:text-[#292522] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Whitelist quick toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <Star
              className={`w-4 h-4 ${
                selectedAccountForNotes.isWhitelisted
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-[#8C827A] dark:text-[#A8A199]'
              }`}
            />
            <span className="text-xs font-bold text-[#292522] dark:text-[#F7F4EF]">
              Whitelisted VIP Account
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleWhitelist(selectedAccountForNotes.username)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-[0.97] ${
              selectedAccountForNotes.isWhitelisted
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shadow-cozy shadow-amber-500/10'
                : 'bg-white dark:bg-[#1B1918] text-[#59534E] dark:text-[#D1CBC5] border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
            }`}
          >
            {selectedAccountForNotes.isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
          </button>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#292522] dark:text-[#F7F4EF]">
            Personal Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Met at tech conference, personal friend, brand partner..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-[#292522] dark:text-[#F7F4EF] placeholder-[#8C827A]/60 dark:placeholder-[#A8A199]/60 focus:outline-none focus:ring-2 focus:ring-[#E05A47]/30 resize-none font-medium leading-relaxed"
          />
        </div>

        {/* Tags input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#292522] dark:text-[#F7F4EF]">
            Custom Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="e.g. friend, colleague, creator"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1B1918] text-[#292522] dark:text-[#F7F4EF] placeholder-[#8C827A]/60 dark:placeholder-[#A8A199]/60 focus:outline-none focus:ring-2 focus:ring-[#E05A47]/30 font-medium"
            />
            <Button variant="secondary" size="sm" onClick={handleAddTag}>
              Add Tag
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#E05A47]/10 text-[#E05A47] dark:text-[#E05A47] font-bold border border-[#E05A47]/20"
                >
                  <span>#{t}</span>
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-[#C93B20] text-xs font-bold transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAccountForNotes(null)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={handleSave}
          >
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  );
};

