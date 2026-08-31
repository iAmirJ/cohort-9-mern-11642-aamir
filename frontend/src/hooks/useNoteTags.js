import { useState, useEffect } from 'react';

const TAGS_STORAGE_KEY = 'notes_tags';

export function useNoteTags(noteId) {
  const [tags, setTags] = useState(() => {
    try {
      const saved = localStorage.getItem(TAGS_STORAGE_KEY);
      if (saved) {
        const allTags = JSON.parse(saved);
        return noteId && allTags[noteId] ? allTags[noteId] : [];
      }
    } catch (e) {
      console.error('Failed to parse tags from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    if (!noteId) return; // don't persist if we don't have an id yet
    try {
      const saved = localStorage.getItem(TAGS_STORAGE_KEY);
      const allTags = saved ? JSON.parse(saved) : {};
      allTags[noteId] = tags;
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(allTags));
    } catch (e) {
      console.error('Failed to save tags to localStorage', e);
    }
  }, [tags, noteId]);

  const addTag = (tag) => {
    if (!tag.trim() || tags.includes(tag.trim())) return;
    setTags(prev => [...prev, tag.trim()]);
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  return { tags, addTag, removeTag };
}
