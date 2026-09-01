import { useState, useEffect } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTrashedNotes } from '../../hooks/useTrashedNotes';
import api from '../../services/api';

function TrashItem({ note, onRestore, onPermanentDelete }) {
  const preview = typeof note.content === 'string'
    ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 100)
    : 'Content preview not available.';

  return (
    <div className="relative group flex flex-col justify-between p-5 rounded-lg border border-gray-200 bg-surface">
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-slate-400 line-through line-clamp-1 pr-8">
            {note.title || 'Untitled'}
          </h3>
        </div>
        <p className="text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed">
          {preview}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Deleted
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onRestore} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Restore">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button type="button" onClick={onPermanentDelete} className="p-1.5 text-error hover:bg-error/10 rounded" title="Permanent Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrashList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { trashedIds, restoreFromTrash, restoreFromTrash: removeTrashId, emptyTrash: clearTrashIds } = useTrashedNotes();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notes');
        const allNotes = response.data.data.notes || [];
        // Filter only trashed notes
        setNotes(allNotes.filter(n => trashedIds.includes(n.id)));
      } catch {
        console.error('Failed to fetch trash.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [trashedIds]);

  const handleRestore = (id) => {
    restoreFromTrash(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this note? This cannot be undone.')) return;
    try {
      await api.delete(`/notes/${id}`);
      removeTrashId(id); // Clean up localStorage
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      alert('Failed to permanently delete note');
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Empty all trashed notes permanently?')) return;
    try {
      // Loop and delete all
      await Promise.all(notes.map(note => api.delete(`/notes/${note.id}`)));
      clearTrashIds();
      setNotes([]);
    } catch {
      alert('Failed to empty some notes. They might have already been deleted.');
    }
  };

  let trashContent;
  if (loading) {
    trashContent = <div className="text-slate-500">Loading trash...</div>;
  } else if (notes.length === 0) {
    trashContent = <div className="text-slate-500 mt-10">Your trash is empty.</div>;
  } else {
    trashContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {notes.map((note) => (
          <TrashItem
            key={note.id}
            note={note}
            onRestore={() => handleRestore(note.id)}
            onPermanentDelete={() => handlePermanentDelete(note.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Trash</h1>
          <p className="text-slate-500 text-sm">Notes in trash are kept safely until you permanently delete them.</p>
        </div>
        <Button variant="danger" className="bg-error/10 text-error hover:bg-error/20" onClick={handleEmptyTrash} disabled={notes.length === 0}>
          <Trash2 className="w-4 h-4 mr-2" /> Empty Trash
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trashContent}
      </div>
    </div>
  );
}
