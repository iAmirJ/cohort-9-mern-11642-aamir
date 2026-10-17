import { useState, useEffect } from 'react';

const ARCHIVED_STORAGE_KEY = 'notes_archived';

export function useArchivedNotes() {
  const [archivedNoteIds, setArchivedNoteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(ARCHIVED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse archived notes from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(archivedNoteIds));
    } catch (e) {
      console.error('Failed to save archived notes to localStorage', e);
    }
  }, [archivedNoteIds]);

  const toggleArchive = (noteId) => {
    setArchivedNoteIds(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId) 
        : [...prev, noteId]
    );
  };

  const isArchived = (noteId) => archivedNoteIds.includes(noteId);

  return { archivedNoteIds, toggleArchive, isArchived };
}
