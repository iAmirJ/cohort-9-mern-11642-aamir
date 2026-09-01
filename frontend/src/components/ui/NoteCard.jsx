import { Pin, Pencil, Trash2, Archive } from 'lucide-react';
import { Button } from './Button';

function getPreview(content) {
  if (content?.html) {
    return content.html.replace(/<[^>]*>?/gm, '').substring(0, 100);
  }
  if (typeof content === 'string') {
    return content.replace(/<[^>]*>?/gm, '').substring(0, 100);
  }
  if (content?.blocks) {
    return content.blocks.map(b => b.text).join(' ').substring(0, 100);
  }
  if (content) {
    return JSON.stringify(content).substring(0, 100);
  }
  return 'No content';
}

export function NoteCard({ note, isPinned, isArchived, onTogglePin, onEdit, onDelete, onArchive, onClick }) {
  let preview = getPreview(note.content);

  // Decode simple HTML entities
  preview = preview.replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');

  if (preview.length === 100) preview += '...';

  // Handle both snake_case and camelCase date properties
  const createdAt = note.createdAt || note.created_at;
  const updatedAt = note.updatedAt || note.updated_at || createdAt;
  const date = new Date(updatedAt || Date.now());
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Also get tags
  const savedTags = localStorage.getItem('notes_tags');
  let tags = [];
  if (savedTags) {
    try {
      const allTags = JSON.parse(savedTags);
      if (allTags[note.id]) tags = allTags[note.id];
    } catch { /* invalid JSON in localStorage, ignore */ }
  }

  return (
    <button 
      type="button"
      onClick={onClick}
      className={`relative group flex flex-col justify-between p-5 rounded-lg border bg-surface transition-all hover:shadow-sm cursor-pointer text-left w-full ${isPinned ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'}`}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-slate-900 line-clamp-1 pr-8" title={note.title || 'Untitled'}>
            {note.title || 'Untitled'}
          </h3>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }} 
            className={`absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors ${isPinned ? 'text-primary' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <Pin className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {preview}
        </p>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">
          {formattedDate}
        </span>
        
        {tags.length > 0 && (
          <div className="flex gap-1">
            {tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary" onClick={(e) => { e.stopPropagation(); onEdit(note); }} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          {onArchive && (
            <Button variant="ghost" size="icon" className={`h-8 w-8 hover:text-orange-500 ${isArchived ? 'text-orange-500' : 'text-slate-500'}`} onClick={(e) => { e.stopPropagation(); onArchive(note.id); }} title={isArchived ? "Unarchive" : "Archive"}>
              <Archive className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-error" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} title="Move to Trash">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </button>
  );
}
