import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useArchivedNotes } from './useArchivedNotes';

describe('useArchivedNotes hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useArchivedNotes());
    expect(result.current.archivedNoteIds).toEqual([]);
    expect(result.current.isArchived('123')).toBe(false);
  });

  it('should toggle an archive correctly', () => {
    const { result } = renderHook(() => useArchivedNotes());
    
    act(() => {
      result.current.toggleArchive('note-1');
    });
    
    expect(result.current.archivedNoteIds).toContain('note-1');
    expect(result.current.isArchived('note-1')).toBe(true);

    act(() => {
      result.current.toggleArchive('note-1');
    });

    expect(result.current.archivedNoteIds).not.toContain('note-1');
    expect(result.current.isArchived('note-1')).toBe(false);
  });
});
