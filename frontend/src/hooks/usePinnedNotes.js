import { useState, useEffect } from 'react';

const PINNED_STORAGE_KEY = 'notes_pinned_ids';

export function usePinnedNotes() {
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse pinned notes from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (noteId) => {
    setPinnedIds((prev) => {
      if (prev.includes(noteId)) {
        return prev.filter((id) => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  const removePin = (noteId) => {
    setPinnedIds((prev) => prev.filter((id) => id !== noteId));
  };

  const isPinned = (noteId) => pinnedIds.includes(noteId);

  return {
    pinnedIds,
    togglePin,
    removePin,
    isPinned,
  };
}
