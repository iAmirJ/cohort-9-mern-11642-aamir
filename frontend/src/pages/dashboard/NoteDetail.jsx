import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pin, Trash2, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { usePinnedNotes } from '../../hooks/usePinnedNotes';
import { useTrashedNotes } from '../../hooks/useTrashedNotes';
import { useNoteTags } from '../../hooks/useNoteTags';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isPinned, togglePin } = usePinnedNotes();
  const { moveToTrash } = useTrashedNotes();
  const { tags } = useNoteTags(id);

  const handleTogglePin = () => {
    togglePin(id);
    if (!isPinned(id)) toast.success('Note pinned!');
    else toast.success('Note unpinned');
  };

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await api.get(`/notes/${id}`);
        setNote(response.data.data);
      } catch (err) {
        setError('Failed to load note.');
        toast.error('Failed to load note');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdated = (updatedNote) => {
      if (updatedNote.id === id) {
        setNote(updatedNote);
      }
    };

    const handleDeleted = (deletedInfo) => {
      if (deletedInfo.id === id) {
        toast.error('This note was deleted');
        navigate('/');
      }
    };

    socket.on('note:updated', handleUpdated);
    socket.on('note:deleted', handleDeleted);

    return () => {
      socket.off('note:updated', handleUpdated);
      socket.off('note:deleted', handleDeleted);
    };
  }, [id, navigate]);

  const handleDelete = () => {
    moveToTrash(id);
    toast.success('Note moved to trash');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !note) {
    return <div className="text-error">{error || 'Note not found'}</div>;
  }

  const isNotePinned = isPinned(note.id);

  // Generate HTML safely
  let htmlContent = '';
  if (note.content?.html) {
    htmlContent = note.content.html;
  } else if (typeof note.content === 'string') {
    htmlContent = note.content;
  } else {
    htmlContent = JSON.stringify(note.content || {});
  }

  // Format dates securely with fallback
  const createdDateRaw = note.createdAt || note.created_at;
  const updatedDateRaw = note.updatedAt || note.updated_at || createdDateRaw;
  
  const createdDate = new Date(createdDateRaw || Date.now()).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const updatedDate = new Date(updatedDateRaw || Date.now()).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Bar */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Notes
          </button>
          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
          <span className="text-xs text-slate-400 hidden sm:block">
            Created {createdDate} • Last edited {updatedDate}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleTogglePin} className={isNotePinned ? 'border-primary text-primary bg-primary/5' : ''}>
            <Pin className={`w-4 h-4 mr-2 ${isNotePinned ? 'fill-current' : ''}`} /> {isNotePinned ? 'Pinned' : 'Pin'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-error hover:bg-error/5 hover:border-error/30 border-gray-200">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
          <Button size="sm" onClick={() => navigate(`/editor/${note.id}`)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit Note
          </Button>
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 overflow-auto p-10 md:px-16 md:py-12">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
          {note.title || 'Untitled Note'}
        </h1>
        
        <div 
          className="rich-text"
          style={{ fontSize: '16px', lineHeight: '1.7', color: '#475569' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>

      {/* Footer Meta */}
      <div className="border-t border-gray-100 p-4 text-center text-xs text-slate-400 font-medium bg-surface-dim">
        ID: {note.id}
      </div>
    </div>
  );
}
