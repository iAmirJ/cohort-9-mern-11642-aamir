import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotesList from './NotesList';
import api from '../../services/api';

// Mock API and Socket
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  }
}));

vi.mock('../../services/socket', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('NotesList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then fetches notes', async () => {
    const mockNotes = [
      { id: '1', title: 'First Note', content: 'hello', createdAt: new Date().toISOString() },
      { id: '2', title: 'Second Note', content: 'world', createdAt: new Date().toISOString() },
    ];
    
    api.get.mockResolvedValueOnce({ data: { data: { notes: mockNotes } } });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<NotesList />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial title
    expect(screen.getByText('All Notes')).toBeInTheDocument();

    // Wait for mock API to resolve and notes to render
    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });
  });

  it('renders empty state if no notes are found', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { notes: [] } } });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<NotesList />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No notes found')).toBeInTheDocument();
    });
  });
});
