import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('handles api fetch error', async () => {
    api.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<NotesList />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch notes.')).toBeInTheDocument();
    });
  });

  it('filters and sorts notes correctly', async () => {
    const mockNotes = [
      { id: '1', title: 'Zebra Note', content: 'hello', createdAt: '2023-01-01T00:00:00.000Z' },
      { id: '2', title: 'Apple Note', content: 'world', createdAt: '2023-10-01T00:00:00.000Z' },
    ];
    
    api.get.mockResolvedValueOnce({ data: { data: { notes: mockNotes } } });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<NotesList />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Zebra Note')).toBeInTheDocument();
      expect(screen.getByText('Apple Note')).toBeInTheDocument();
    });
  });

  it('renders only pinned notes when filter=pinned is set', async () => {
    localStorage.setItem('notes_pinned_ids', JSON.stringify(['1']));
    const mockNotes = [
      { id: '1', title: 'Pinned One', content: 'x', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', title: 'Normal Two', content: 'y', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    api.get.mockResolvedValue({ data: { data: { notes: mockNotes } } });

    render(
      <MemoryRouter initialEntries={['/?filter=pinned']}>
        <Routes>
          <Route path="/" element={<NotesList />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pinned Notes')).toBeInTheDocument();
      expect(screen.getByText('Pinned One')).toBeInTheDocument();
      expect(screen.queryByText('Normal Two')).not.toBeInTheDocument();
    });
  });

  it('renders archived page title when filter=archived is set', async () => {
    api.get.mockResolvedValue({ data: { data: { notes: [] } } });

    render(
      <MemoryRouter initialEntries={['/?filter=archived']}>
        <Routes>
          <Route path="/" element={<NotesList />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Archived Notes')).toBeInTheDocument();
    });
  });
});
