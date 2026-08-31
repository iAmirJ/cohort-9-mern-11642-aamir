import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTrashedNotes } from './useTrashedNotes';

describe('useTrashedNotes hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useTrashedNotes());
    expect(result.current.trashedIds).toEqual([]);
    expect(result.current.isTrashed('123')).toBe(false);
  });

  it('should move to trash', () => {
    const { result } = renderHook(() => useTrashedNotes());
    
    act(() => {
      result.current.moveToTrash('note-1');
    });
    
    expect(result.current.trashedIds).toContain('note-1');
    expect(result.current.isTrashed('note-1')).toBe(true);
  });

  it('should restore from trash', () => {
    const { result } = renderHook(() => useTrashedNotes());
    
    act(() => {
      result.current.moveToTrash('note-1');
    });
    
    act(() => {
      result.current.restoreFromTrash('note-1');
    });

    expect(result.current.trashedIds).not.toContain('note-1');
    expect(result.current.isTrashed('note-1')).toBe(false);
  });
  
  it('should empty trash', () => {
    const { result } = renderHook(() => useTrashedNotes());
    
    act(() => {
      result.current.moveToTrash('note-1');
      result.current.moveToTrash('note-2');
    });
    
    expect(result.current.trashedIds.length).toBe(2);

    act(() => {
      result.current.emptyTrash();
    });

    expect(result.current.trashedIds.length).toBe(0);
  });
});
