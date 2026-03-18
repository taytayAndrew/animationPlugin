import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, Package } from 'lucide-react';
import type { Prop, PropStatus } from '../types';
import './PropsList.css';

const statusLabels: Record<PropStatus, string> = {
    'pending': '待处理',
    'in-progress': '进行中',
    'done': '已完成',
};

export default function PropsList() {
    const { currentProject, updateProject } = useProject();
    const [filter, setFilter] = useState<PropStatus | ''>('');

    if (!currentProject) return null;

    const { props, scenes } = currentProject;

    const filtered = filter ? props.filter(p => p.status === filter) : props;

    const addProp = () => {
        const p: Prop = {
            id: uuid(), name: '新道具', description: '',
            status: 'pending',
        };
        updateProject({ ...currentProject, props: [...props, p] });
    };

    const updateProp = (id: string, patch: Partial<Prop>) => {
        const updated = props.map(p => p.id === id ? { ...p, ...patch } : p);
        updateProject({ ...currentProject, props: updated });
    };

    const deleteProp = (id: string) => {
        updateProject({ ...currentProject, props: props.filter(p => p.id !== id) });
    };

    const getSceneName = (id?: string) => scenes.find(s => s.id === id)?.name ?? '';

    return (
        <div className="props-list">
            <div className="props-toolbar">
                <div className="props-filters">
                    <button className={`btn btn-ghost btn-sm ${filter === '' ? 'active' : ''}`}
                        onClick={() => setFilter('')}>全部 ({props.length})</button>
                    {(['pending', 'in-progress', 'done'] as PropStatus[]).map(s => (
                        <button key={s} className={`btn btn-ghost btn-sm ${filter === s ? 'active' : ''}`}
                            onClick={() => setFilter(s)}>
                            {statusLabels[s]} ({props.filter(p => p.status === s).length})
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={addProp}>
                    <Plus size={14} /> 添加道具
                </button>
            </div>

            <div className="props-grid">
                {filtered.map(prop => (
                    <div key={prop.id} className="prop-card glass-card">
                        <div className="prop-header">
                            <input className="input prop-name" value={prop.name}
                                onChange={e => updateProp(prop.id, { name: e.target.value })} />
                            <button className="btn-icon" onClick={() => deleteProp(prop.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <textarea className="textarea" placeholder="道具描述..."
                            value={prop.description}
                            onChange={e => updateProp(prop.id, { description: e.target.value })}
                            rows={2} />
                        <div className="prop-meta">
                            <select className="input select-sm"
                                value={prop.status}
                                onChange={e => updateProp(prop.id, { status: e.target.value as PropStatus })}>
                                {(['pending', 'in-progress', 'done'] as PropStatus[]).map(s => (
                                    <option key={s} value={s}>{statusLabels[s]}</option>
                                ))}
                            </select>
                            <select className="input select-sm"
                                value={prop.sceneId ?? ''}
                                onChange={e => updateProp(prop.id, { sceneId: e.target.value || undefined })}>
                                <option value="">无关联场景</option>
                                {scenes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <Package size={32} />
                        <p>没有道具，点击上方按钮添加</p>
                    </div>
                )}
            </div>
        </div>
    );
}
