import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoteCard } from './NoteCard';

describe('NoteCard Component', () => {
  const mockNote = {
    id: 'note-1',
    title: 'Test Note',
    content: { html: '<p>This is a <b>test</b> note.</p>' },
    createdAt: new Date('2026-01-01').toISOString(),
  };

  it('renders the title and preview correctly', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    
    // HTML should be stripped from preview
    expect(screen.getByText(/This is a test note/)).toBeInTheDocument();
  });

  it('calls onClick when the card is clicked', () => {
    const onClick = vi.fn();
    render(<NoteCard note={mockNote} onClick={onClick} />);
    
    fireEvent.click(screen.getByText('Test Note'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls action handlers without triggering card click', () => {
    const onTogglePin = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onClick = vi.fn();

    render(
      <NoteCard 
        note={mockNote} 
        onTogglePin={onTogglePin} 
        onEdit={onEdit} 
        onDelete={onDelete}
        onClick={onClick}
      />
    );

    const pinButton = screen.getByTitle('Pin note');
    fireEvent.click(pinButton);
    expect(onTogglePin).toHaveBeenCalledWith('note-1');
    expect(onClick).not.toHaveBeenCalled();

    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockNote);
    expect(onClick).not.toHaveBeenCalled();

    const deleteButton = screen.getByTitle('Move to Trash');
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('note-1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('displays pinned state correctly', () => {
    render(<NoteCard note={mockNote} isPinned={true} />);
    expect(screen.getByTitle('Unpin note')).toBeInTheDocument();
  });

  it('handles string content', () => {
    const stringNote = { ...mockNote, content: 'String content test' };
    render(<NoteCard note={stringNote} />);
    expect(screen.getByText(/String content test/)).toBeInTheDocument();
  });

  it('handles object content without html', () => {
    const objNote = { ...mockNote, content: { random: 'data' } };
    render(<NoteCard note={objNote} />);
    expect(screen.getByText(/{"random":"data"}/)).toBeInTheDocument();
  });

  it('renders preview from delta blocks content', () => {
    const blocksNote = { ...mockNote, content: { blocks: [{ text: 'hello' }, { text: 'world' }] } };
    render(<NoteCard note={blocksNote} />);
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
  });

  it('shows fallback text when note has no content', () => {
    const emptyNote = { ...mockNote, content: null };
    render(<NoteCard note={emptyNote} />);
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('decodes HTML entities in the preview', () => {
    const entityNote = { ...mockNote, content: { html: '<p>Tom &amp; Jerry</p>' } };
    render(<NoteCard note={entityNote} />);
    expect(screen.getByText(/Tom & Jerry/)).toBeInTheDocument();
  });

  it('renders tags if they exist in localStorage', () => {
    localStorage.setItem('notes_tags', JSON.stringify({ 'note-1': ['react', 'js', 'css'] }));
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#js')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    localStorage.clear();
  });

  it('handles archive action', () => {
    const onArchive = vi.fn();
    render(<NoteCard note={mockNote} onArchive={onArchive} isArchived={true} />);
    const archiveBtn = screen.getByTitle('Unarchive');
    fireEvent.click(archiveBtn);
    expect(onArchive).toHaveBeenCalledWith('note-1');
  });
});
