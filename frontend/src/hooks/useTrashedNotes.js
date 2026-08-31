import { useState, useEffect } from 'react';

const TRASHED_STORAGE_KEY = 'notes_trashed_ids';

export function useTrashedNotes() {
  const [trashedIds, setTrashedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(TRASHED_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse trashed notes from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(TRASHED_STORAGE_KEY, JSON.stringify(trashedIds));
  }, [trashedIds]);

  const moveToTrash = (noteId) => {
    setTrashedIds((prev) => {
      if (!prev.includes(noteId)) {
        return [...prev, noteId];
      }
      return prev;
    });
  };

  const restoreFromTrash = (noteId) => {
    setTrashedIds((prev) => prev.filter((id) => id !== noteId));
  };

  const emptyTrash = () => {
    setTrashedIds([]);
  };

  const isTrashed = (noteId) => trashedIds.includes(noteId);

  return {
    trashedIds,
    moveToTrash,
    restoreFromTrash,
    emptyTrash,
    isTrashed,
  };
}
