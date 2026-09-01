import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePinnedNotes } from './usePinnedNotes';

describe('usePinnedNotes hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty array if nothing in localStorage', () => {
    const { result } = renderHook(() => usePinnedNotes());
    expect(result.current.pinnedIds).toEqual([]);
    expect(result.current.isPinned('123')).toBe(false);
  });

  it('should toggle a pin correctly', () => {
    const { result } = renderHook(() => usePinnedNotes());
    
    act(() => {
      result.current.togglePin('note-1');
    });
    
    expect(result.current.pinnedIds).toContain('note-1');
    expect(result.current.isPinned('note-1')).toBe(true);

    act(() => {
      result.current.togglePin('note-1');
    });

    expect(result.current.pinnedIds).not.toContain('note-1');
    expect(result.current.isPinned('note-1')).toBe(false);
  });

  it('should sync with localStorage', () => {
    const { result } = renderHook(() => usePinnedNotes());
    
    act(() => {
      result.current.togglePin('note-2');
    });

    const stored = JSON.parse(localStorage.getItem('notes_pinned_ids'));
    expect(stored).toContain('note-2');
  });
});
