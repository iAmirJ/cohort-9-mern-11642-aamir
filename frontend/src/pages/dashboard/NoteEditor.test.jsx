import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NoteEditor from './NoteEditor';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  }
}));

// Mock React Quill since it relies on browser DOM APIs
vi.mock('react-quill-new', () => {
  return {
    default: ({ value, onChange, placeholder }) => (
      <textarea
        data-testid="mock-quill"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ),
  };
});

describe('NoteEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows user to type title and content and save a new note', async () => {
    api.post.mockResolvedValueOnce({ data: { data: { id: 'new-note-id' } } });

    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="/editor" element={<NoteEditor />} />
        </Routes>
      </MemoryRouter>
    );

    // Title input
    const titleInput = screen.getByPlaceholderText('Note Title');
    fireEvent.change(titleInput, { target: { value: 'My New Note' } });

    // Content input (mocked quill)
    const contentInput = screen.getByTestId('mock-quill');
    fireEvent.change(contentInput, { target: { value: '<p>Note Content</p>' } });

    // Save
    const saveButton = screen.getByRole('button', { name: /save note/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/notes', {
        title: 'My New Note',
        content: { html: '<p>Note Content</p>' }
      });
    });
  });

  it('fetches existing note when ID is present (edit mode)', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 'note-123',
          title: 'Existing Note',
          content: { html: '<p>Existing content</p>' }
        }
      }
    });

    render(
      <MemoryRouter initialEntries={['/editor/note-123']}>
        <Routes>
          <Route path="/editor/:id" element={<NoteEditor />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/notes/note-123');
      expect(screen.getByDisplayValue('Existing Note')).toBeInTheDocument();
      expect(screen.getByDisplayValue('<p>Existing content</p>')).toBeInTheDocument();
    });
  });
});
