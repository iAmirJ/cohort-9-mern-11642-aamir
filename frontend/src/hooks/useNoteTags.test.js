import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useNoteTags } from './useNoteTags';

describe('useNoteTags hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty array for a new note', () => {
    const { result } = renderHook(() => useNoteTags('note-1'));
    expect(result.current.tags).toEqual([]);
  });

  it('should add tags and persist them', () => {
    const { result } = renderHook(() => useNoteTags('note-1'));
    
    act(() => {
      result.current.addTag('react');
      result.current.addTag('js');
    });
    
    expect(result.current.tags).toEqual(['react', 'js']);

    const stored = JSON.parse(localStorage.getItem('notes_tags'));
    expect(stored['note-1']).toEqual(['react', 'js']);
  });

  it('should not add duplicate tags', () => {
    const { result } = renderHook(() => useNoteTags('note-1'));
    
    act(() => {
      result.current.addTag('react');
      result.current.addTag('react');
      result.current.addTag(' react ');
    });
    
    expect(result.current.tags).toEqual(['react']);
  });

  it('should remove tags', () => {
    const { result } = renderHook(() => useNoteTags('note-1'));
    
    act(() => {
      result.current.addTag('react');
      result.current.addTag('js');
    });
    
    act(() => {
      result.current.removeTag('react');
    });

    expect(result.current.tags).toEqual(['js']);
    
    const stored = JSON.parse(localStorage.getItem('notes_tags'));
    expect(stored['note-1']).toEqual(['js']);
  });

  it('should load existing tags from localStorage', () => {
    localStorage.setItem('notes_tags', JSON.stringify({ 'note-99': ['node', 'express'] }));
    
    const { result } = renderHook(() => useNoteTags('note-99'));
    expect(result.current.tags).toEqual(['node', 'express']);
  });
});
