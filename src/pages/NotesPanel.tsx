import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import type { StickyNote } from '../types';
import './NotesPanel.css';

const noteColors = ['#7C5CFC', '#FF6B9D', '#4ECDC4', '#FFD93D', '#FF8A5C', '#A78BFA'];

export default function NotesPanel() {
    const { currentProject, updateProject } = useProject();
    if (!currentProject) return null;

    const { notes } = currentProject;

    const addNote = () => {
        const color = noteColors[notes.length % noteColors.length];
        const note: StickyNote = { id: uuid(), content: '', color, createdAt: Date.now() };
        updateProject({ ...currentProject, notes: [note, ...notes] });
    };

    const updateNote = (id: string, patch: Partial<StickyNote>) => {
        const updated = notes.map(n => n.id === id ? { ...n, ...patch } : n);
        updateProject({ ...currentProject, notes: updated });
    };

    const deleteNote = (id: string) => {
        updateProject({ ...currentProject, notes: notes.filter(n => n.id !== id) });
    };

    return (
        <div className="notes-panel">
            <div className="notes-toolbar">
                <span className="notes-count">{notes.length} 条便签</span>
                <button className="btn btn-primary" onClick={addNote}>
                    <Plus size={14} /> 新便签
                </button>
            </div>

            <div className="notes-grid">
                {notes.map(note => (
                    <div key={note.id} className="note-card"
                        style={{ borderTopColor: note.color }}>
                        <textarea
                            className="note-textarea"
                            placeholder="随手记个想法..."
                            value={note.content}
                            onChange={e => updateNote(note.id, { content: e.target.value })}
                        />
                        <div className="note-footer">
                            <span className="note-date">
                                {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                            <div className="note-colors">
                                {noteColors.map(c => (
                                    <button key={c} className={`color-dot ${note.color === c ? 'active' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => updateNote(note.id, { color: c })} />
                                ))}
                            </div>
                            <button className="btn-icon" onClick={() => deleteNote(note.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
