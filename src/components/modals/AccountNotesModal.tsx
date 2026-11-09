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
      <div className="relative w-full max-w-md rounded-3xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF] dark:bg-[#202421] shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header with Account info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar username={selectedAccountForNotes.username} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-base text-[#242823] dark:text-[#F0EEE6]">
                  @{selectedAccountForNotes.username}
                </h3>
                <a
                  href={selectedAccountForNotes.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#686E64] dark:text-[#A6AA9D] hover:text-[#71806C] dark:hover:text-[#899783] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-[#686E64] dark:text-[#A6AA9D] font-medium">
                Custom Account Notes & Whitelist
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedAccountForNotes(null)}
            className="p-2 rounded-xl text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Whitelist quick toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F3EC] dark:bg-[#151716] border border-[#D5D2C5] dark:border-[#343B35]">
          <div className="flex items-center gap-2.5">
            <Star
              className={`w-4 h-4 ${
                selectedAccountForNotes.isWhitelisted
                  ? 'text-[#9E7E43] fill-[#9E7E43] dark:text-[#CBB279] dark:fill-[#CBB279]'
                  : 'text-[#686E64] dark:text-[#A6AA9D]'
              }`}
            />
            <span className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
              Whitelisted VIP Account
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleWhitelist(selectedAccountForNotes.username)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.97] ${
              selectedAccountForNotes.isWhitelisted
                ? 'bg-[#9E7E43]/15 text-[#9E7E43] dark:text-[#CBB279] border-[#9E7E43]/30'
                : 'bg-[#EAE8DF] dark:bg-[#202421] text-[#686E64] dark:text-[#A6AA9D] border-[#D5D2C5] dark:border-[#343B35] hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60'
            }`}
          >
            {selectedAccountForNotes.isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
          </button>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
            Personal Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Met at tech conference, personal friend, brand partner..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-[#242823] dark:text-[#F0EEE6] placeholder-[#686E64]/60 dark:placeholder-[#A6AA9D]/60 focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] resize-none font-medium leading-relaxed"
          />
        </div>

        {/* Tags input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
            Custom Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="e.g. friend, colleague, creator"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D5D2C5] dark:border-[#343B35] bg-[#F5F3EC] dark:bg-[#151716] text-[#242823] dark:text-[#F0EEE6] placeholder-[#686E64]/60 dark:placeholder-[#A6AA9D]/60 focus:outline-none focus:ring-1 focus:ring-[#71806C] dark:focus:ring-[#899783] font-medium"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#71806C]/15 text-[#71806C] dark:text-[#899783] font-medium border border-[#71806C]/30"
                >
                  <span>#{t}</span>
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-[#242823] dark:hover:text-[#F0EEE6] text-xs font-bold transition-colors"
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

