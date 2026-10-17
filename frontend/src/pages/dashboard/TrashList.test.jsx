import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TrashList from './TrashList';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  }
}));

const allNotes = [
  { id: 'note-1', title: 'Trashed Note', content: 'deleted content', createdAt: new Date().toISOString() },
  { id: 'note-2', title: 'Active Note', content: 'active content', createdAt: new Date().toISOString() },
];

describe('TrashList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    render(<TrashList />);
    expect(screen.getByText('Loading trash...')).toBeInTheDocument();
  });

  it('shows empty state when there are no trashed notes', async () => {
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });
    render(<TrashList />);

    await waitFor(() => {
      expect(screen.getByText('Your trash is empty.')).toBeInTheDocument();
    });
  });

  it('renders only trashed notes', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1']));
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });

    render(<TrashList />);

    await waitFor(() => {
      expect(screen.getByText('Trashed Note')).toBeInTheDocument();
      expect(screen.queryByText('Active Note')).not.toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1']));
    api.get.mockRejectedValue(new Error('Network Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TrashList />);

    await waitFor(() => {
      expect(screen.getByText('Your trash is empty.')).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it('restores a note', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1']));
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });

    render(<TrashList />);

    const restoreBtn = await screen.findByTitle('Restore');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Your trash is empty.')).toBeInTheDocument();
    });
  });

  it('permanently deletes a note after confirmation', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1']));
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });
    api.delete.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TrashList />);

    const deleteBtn = await screen.findByTitle('Permanent Delete');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/notes/note-1');
      expect(screen.getByText('Your trash is empty.')).toBeInTheDocument();
    });
    vi.restoreAllMocks();
  });

  it('does not delete when confirmation is cancelled', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1']));
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TrashList />);

    const deleteBtn = await screen.findByTitle('Permanent Delete');
    fireEvent.click(deleteBtn);

    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Trashed Note')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('alerts when permanent delete fails', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1']));
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });
    api.delete.mockRejectedValue(new Error('Delete failed'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<TrashList />);

    const deleteBtn = await screen.findByTitle('Permanent Delete');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to permanently delete note');
      expect(screen.getByText('Trashed Note')).toBeInTheDocument();
    });
    vi.restoreAllMocks();
  });

  it('empties the trash after confirmation', async () => {
    localStorage.setItem('notes_trashed_ids', JSON.stringify(['note-1', 'note-2']));
    api.get.mockResolvedValue({ data: { data: { notes: allNotes } } });
    api.delete.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TrashList />);

    await waitFor(() => {
      expect(screen.getByText('Trashed Note')).toBeInTheDocument();
    });

    const emptyBtn = screen.getByRole('button', { name: /empty trash/i });
    fireEvent.click(emptyBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Your trash is empty.')).toBeInTheDocument();
    });
    vi.restoreAllMocks();
  });
});