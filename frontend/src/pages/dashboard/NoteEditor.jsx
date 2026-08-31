import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useNoteTags } from '../../hooks/useNoteTags';
import { ArrowLeft, X } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

import toast from 'react-hot-toast';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = Boolean(id);
  const { tags, addTag, removeTag } = useNoteTags(isEditMode ? id : 'draft');
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchNote = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/notes/${id}`);
          const note = response.data.data;
          setTitle(note.title || '');
          if (note.content?.html) {
            setContent(note.content.html);
          } else if (typeof note.content === 'string') {
            setContent(note.content);
          } else {
            setContent(JSON.stringify(note.content || {})); 
          }
        } catch (err) {
          setError('Failed to load note.');
          toast.error('Failed to load note');
        } finally {
          setLoading(false);
        }
      };
      fetchNote();
    }
  }, [id, isEditMode]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      setError('Title or content is required');
      toast.error('Title or content is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Backend requires content to be an object
      const contentObject = { html: content };
      const payload = { title, content: contentObject };
      
      let noteId = id;
      if (isEditMode) {
        await api.put(`/notes/${noteId}`, payload);
        toast.success('Note updated successfully!');
      } else {
        const response = await api.post('/notes', payload);
        noteId = response.data.data.id;
        
        // Transfer draft tags to the new real note id
        const saved = localStorage.getItem('notes_tags');
        if (saved) {
          const allTags = JSON.parse(saved);
          if (allTags['draft']) {
            allTags[noteId] = allTags['draft'];
            delete allTags['draft'];
            localStorage.setItem('notes_tags', JSON.stringify(allTags));
          }
        }
        toast.success('Note created successfully!');
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save note';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTagSubmit = (e) => {
    e.preventDefault();
    if (tagInput.trim()) {
      addTag(tagInput.trim());
      setTagInput('');
      setIsAddingTag(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <button onClick={() => navigate('/')} className="hover:bg-gray-100 p-1.5 rounded transition-colors flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
          </button>
          <span className="text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => navigate('/')}>Dashboard</span>
          <span className="text-slate-400">/</span>
          <span>{isEditMode ? 'Edit Note' : 'New Note'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">Last saved: {isEditMode ? 'Previously' : 'Just now'}</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            Save Note
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 md:p-10 bg-white">
        {error && <div className="mb-4 p-3 bg-error/10 text-error text-sm rounded border border-error/20">{error}</div>}
        
        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:outline-none mb-4 bg-transparent"
        />

        {/* Tags */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <div className="px-3 py-1.5 border border-gray-200 text-slate-500 rounded text-xs font-semibold flex items-center gap-2 bg-gray-50">
            📅 {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          
          {tags.map(tag => (
            <span key={tag} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-semibold flex items-center gap-1.5">
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-primary-dark">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {isAddingTag ? (
            <form onSubmit={handleTagSubmit} className="inline-flex">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onBlur={() => {
                  if(!tagInput) setIsAddingTag(false);
                }}
                autoFocus
                placeholder="tag name..."
                className="px-2 py-1 text-xs border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary w-24"
              />
            </form>
          ) : (
            <button onClick={() => setIsAddingTag(true)} className="px-3 py-1.5 border border-gray-200 text-slate-500 hover:bg-gray-50 rounded text-xs font-semibold flex items-center gap-2 transition-colors">
              + Add Tag
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-auto editor-container">
          <style dangerouslySetInnerHTML={{__html: `
            .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid #f1f5f9; padding: 12px 0; margin-bottom: 16px; }
            .ql-container.ql-snow { border: none; font-family: inherit; font-size: 16px; }
            .ql-editor { padding: 0; min-height: 300px; color: #475569; line-height: 1.6; }
            .ql-editor.ql-blank::before { left: 0; font-style: normal; color: #cbd5e1; }
          `}} />
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="Start typing your brilliant thoughts..."
            className="h-full flex flex-col"
          />
        </div>
      </div>
    </div>
  );
}
