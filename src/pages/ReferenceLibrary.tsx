import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, Bookmark, ExternalLink } from 'lucide-react';
import type { ReferenceItem } from '../types';
import './ReferenceLibrary.css';

const aspectOptions = ['构图', '色彩', '节奏', '角色设计', '场景设计', '动画风格', '分镜', '光影', '其他'];

export default function ReferenceLibrary() {
    const { currentProject, updateProject } = useProject();
    const [filterAspect, setFilterAspect] = useState('');

    if (!currentProject) return null;

    const { references } = currentProject;

    const filtered = filterAspect
        ? references.filter(r => r.aspect === filterAspect)
        : references;

    const addRef = () => {
        const r: ReferenceItem = {
            id: uuid(), title: '新参考', url: '', image: '',
            aspect: '其他', notes: '', tags: [],
        };
        updateProject({ ...currentProject, references: [...references, r] });
    };

    const updateRef = (id: string, patch: Partial<ReferenceItem>) => {
        const updated = references.map(r => r.id === id ? { ...r, ...patch } : r);
        updateProject({ ...currentProject, references: updated });
    };

    const deleteRef = (id: string) => {
        updateProject({ ...currentProject, references: references.filter(r => r.id !== id) });
    };

    return (
        <div className="ref-library">
            <div className="ref-toolbar">
                <div className="ref-filters">
                    <button className={`btn btn-ghost btn-sm ${filterAspect === '' ? 'active' : ''}`}
                        onClick={() => setFilterAspect('')}>全部</button>
                    {aspectOptions.map(a => (
                        <button key={a} className={`btn btn-ghost btn-sm ${filterAspect === a ? 'active' : ''}`}
                            onClick={() => setFilterAspect(a)}>{a}</button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={addRef}>
                    <Plus size={14} /> 添加参考
                </button>
            </div>

            <div className="ref-grid">
                {filtered.map(ref => (
                    <div key={ref.id} className="ref-card glass-card">
                        <input className="input ref-title" value={ref.title}
                            onChange={e => updateRef(ref.id, { title: e.target.value })} />
                        <div className="ref-url-row">
                            <input className="input" placeholder="链接 URL"
                                value={ref.url ?? ''}
                                onChange={e => updateRef(ref.id, { url: e.target.value })} />
                            {ref.url && (
                                <a className="btn-icon" href={ref.url} target="_blank" rel="noreferrer">
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                        <select className="input select-sm"
                            value={ref.aspect}
                            onChange={e => updateRef(ref.id, { aspect: e.target.value })}>
                            {aspectOptions.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <textarea className="textarea" placeholder="笔记..."
                            value={ref.notes}
                            onChange={e => updateRef(ref.id, { notes: e.target.value })}
                            rows={2} />
                        <button className="btn-icon ref-delete" onClick={() => deleteRef(ref.id)}>
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <Bookmark size={32} />
                        <p>没有参考素材，点击上方按钮添加</p>
                    </div>
                )}
            </div>
        </div>
    );
}
