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
});
