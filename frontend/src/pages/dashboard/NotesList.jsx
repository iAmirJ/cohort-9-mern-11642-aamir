import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { NoteCard } from '../../components/ui/NoteCard';
import { usePinnedNotes } from '../../hooks/usePinnedNotes';
import { useTrashedNotes } from '../../hooks/useTrashedNotes';
import { useArchivedNotes } from '../../hooks/useArchivedNotes';
import api from '../../services/api';

import { getSocket } from '../../services/socket';

import toast from 'react-hot-toast';

export default function NotesList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // URL Params for filtering (search, sort, filter)
  const [searchParams] = useSearchParams();
  const filterBy = searchParams.get('filter') || 'all'; // all, pinned, archived

  const navigate = useNavigate();
  const { isPinned, togglePin } = usePinnedNotes();
  const { isTrashed, moveToTrash } = useTrashedNotes();
  const { isArchived, toggleArchive } = useArchivedNotes();

  const handleTogglePin = (id) => {
    togglePin(id);
    if (!isPinned(id)) toast.success('Note pinned!');
    else toast.success('Note unpinned');
  };

  const handleToggleArchive = (id) => {
    toggleArchive(id);
    if (!isArchived(id)) toast.success('Note archived!');
    else toast.success('Note unarchived');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Move this note to trash?')) return;
    moveToTrash(id);
    // Remove locally from UI immediately without refreshing
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success('Note moved to trash');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await api.get(`/notes?${params.toString()}`);
      setNotes(response.data.data.notes || []);
    } catch {
      setError('Failed to fetch notes.');
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCreated = (note) => {
      setNotes(prev => {
        if (prev.some(n => n.id === note.id)) return prev;
        return [note, ...prev];
      });
    };

    const handleUpdated = (note) => {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    };

    const handleDeleted = ({ id }) => {
      setNotes(prev => prev.filter(n => n.id !== id));
    };

    socket.on('note:created', handleCreated);
    socket.on('note:updated', handleUpdated);
    socket.on('note:deleted', handleDeleted);

    return () => {
      socket.off('note:created', handleCreated);
      socket.off('note:updated', handleUpdated);
      socket.off('note:deleted', handleDeleted);
    };
  }, []);

  const filteredAndSortedNotes = useMemo(() => {
    // Filter out trashed notes first
    let result = notes.filter((n) => !isTrashed(n.id));

    // Filter
    if (filterBy === 'pinned') {
      result = result.filter((n) => isPinned(n.id) && !isArchived(n.id));
    } else if (filterBy === 'archived') {
      result = result.filter((n) => isArchived(n.id));
    } else {
      // 'all' filter: exclude archived
      result = result.filter((n) => !isArchived(n.id));
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || Date.now()).getTime();
      const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || Date.now()).getTime();
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();

      switch (sortOption) {
        case 'oldest': return dateA - dateB;
        case 'az': return titleA.localeCompare(titleB);
        case 'za': return titleB.localeCompare(titleA);
        case 'newest':
        default: return dateB - dateA;
      }
    });

    // Bring pinned notes to top
    const pinnedNotes = result.filter((n) => isPinned(n.id));
    const unpinnedNotes = result.filter((n) => !isPinned(n.id));

    return [...pinnedNotes, ...unpinnedNotes];
  }, [notes, filterBy, sortOption, isPinned, isTrashed, isArchived]);

  let pageTitle = 'All Notes';
  if (filterBy === 'pinned') pageTitle = 'Pinned Notes';
  else if (filterBy === 'archived') pageTitle = 'Archived Notes';

  let notesContent;
  if (loading) {
    notesContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse border border-gray-200"></div>
        ))}
      </div>
    );
  } else if (filteredAndSortedNotes.length === 0) {
    notesContent = (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No notes found</h3>
        <p className="text-slate-500">Try adjusting your search or filter to find what you're looking for.</p>
      </div>
    );
  } else {
    notesContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            isPinned={isPinned(note.id)}
            isArchived={isArchived(note.id)}
            onTogglePin={() => handleTogglePin(note.id)}
            onArchive={() => handleToggleArchive(note.id)}
            onClick={() => navigate(`/notes/${note.id}`)}
            onEdit={() => navigate(`/editor/${note.id}`)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <Input 
            className="pl-10 h-10 w-full bg-white shadow-sm"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Sort by:</span>
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 text-sm rounded py-2 pl-3 pr-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-medium"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">{pageTitle}</h1>
        
        {error && <div className="p-4 mb-6 bg-error/10 text-error rounded-lg">{error}</div>}

        {notesContent}
      </div>
    </div>
  );
}
