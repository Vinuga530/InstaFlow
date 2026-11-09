import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import {
  X,
  Star,
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
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden p-6 space-y-5 font-sans">
        {/* Header with Account info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar username={selectedAccountForNotes.username} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  @{selectedAccountForNotes.username}
                </h3>
                <a
                  href={selectedAccountForNotes.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                Custom Account Notes &amp; Whitelist
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedAccountForNotes(null)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Whitelist quick toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Star
              className={`w-4 h-4 ${
                selectedAccountForNotes.isWhitelisted
                  ? 'text-[var(--status-warning)] fill-[var(--status-warning)]'
                  : 'text-[var(--text-tertiary)]'
              }`}
            />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Whitelisted VIP Account
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleWhitelist(selectedAccountForNotes.username)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.97] ${
              selectedAccountForNotes.isWhitelisted
                ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/30'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            {selectedAccountForNotes.isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
          </button>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-primary)]">
            Personal Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Met at tech conference, personal friend, brand partner..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none font-medium leading-relaxed"
          />
        </div>

        {/* Tags input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-primary)]">
            Custom Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="e.g. friend, colleague, creator"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] font-medium"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-medium border border-[var(--accent-primary)]/30"
                >
                  <span>#{t}</span>
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-[var(--text-primary)] text-xs font-bold transition-colors"
                  >
                    &times;
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
