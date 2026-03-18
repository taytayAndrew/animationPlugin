import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Film, Plus, ChevronLeft, ChevronRight, Trash2, FolderOpen } from 'lucide-react';
import './Sidebar.css';

interface Props {
    open: boolean;
    onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: Props) {
    const { projects, currentProject, selectProject, createProject, deleteProject } = useProject();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        await createProject(name);
        setNewName('');
        setShowNew(false);
    };

    return (
        <aside className={`sidebar ${open ? 'open' : 'collapsed'}`}>
            <div className="sidebar-header">
                {open && (
                    <div className="sidebar-logo">
                        <Film size={20} className="logo-icon" />
                        <span className="logo-text">AnimStudio</span>
                    </div>
                )}
                <button className="btn-icon toggle-btn" onClick={onToggle}>
                    {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>

            {open && (
                <>
                    <div className="sidebar-section">
                        <div className="section-header">
                            <span className="section-title">项目列表</span>
                            <button className="btn-icon" onClick={() => setShowNew(true)}>
                                <Plus size={14} />
                            </button>
                        </div>

                        {showNew && (
                            <div className="new-project-form">
                                <input
                                    className="input"
                                    placeholder="项目名称..."
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    autoFocus
                                />
                                <div className="form-actions">
                                    <button className="btn btn-primary btn-sm" onClick={handleCreate}>创建</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>取消</button>
                                </div>
                            </div>
                        )}

                        <div className="project-list">
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    className={`project-item ${currentProject?.id === p.id ? 'active' : ''}`}
                                    onClick={() => selectProject(p.id)}
                                >
                                    <FolderOpen size={14} className="project-icon" />
                                    <span className="project-name">{p.name}</span>
                                    <button
                                        className="btn-icon delete-btn"
                                        onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {projects.length === 0 && !showNew && (
                                <p className="empty-hint">还没有项目，点击 + 创建一个</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
}
