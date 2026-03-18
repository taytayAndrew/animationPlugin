import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, Flag, CheckCircle, Circle } from 'lucide-react';
import type { Milestone } from '../types';
import './MilestoneTracker.css';

export default function MilestoneTracker() {
    const { currentProject, updateProject } = useProject();

    if (!currentProject) return null;

    const { milestones, pipeline } = currentProject;

    const sorted = [...milestones].sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        return 1;
    });

    const addMilestone = () => {
        const m: Milestone = {
            id: uuid(), title: '新里程碑', dueDate: '',
            completed: false, notes: '',
        };
        updateProject({ ...currentProject, milestones: [...milestones, m] });
    };

    const updateMilestone = (id: string, patch: Partial<Milestone>) => {
        const updated = milestones.map(m => m.id === id ? { ...m, ...patch } : m);
        updateProject({ ...currentProject, milestones: updated });
    };

    const deleteMilestone = (id: string) => {
        updateProject({ ...currentProject, milestones: milestones.filter(m => m.id !== id) });
    };

    const getStageName = (id?: string) => pipeline.find(s => s.id === id)?.name ?? '';

    const done = milestones.filter(m => m.completed).length;

    return (
        <div className="milestone-tracker">
            <div className="milestone-toolbar">
                <span className="milestone-progress">{done}/{milestones.length} 已完成</span>
                <button className="btn btn-primary" onClick={addMilestone}>
                    <Plus size={14} /> 添加里程碑
                </button>
            </div>

            <div className="milestone-list">
                {sorted.map(m => (
                    <div key={m.id} className={`milestone-item glass-card ${m.completed ? 'completed' : ''}`}>
                        <button className="milestone-check"
                            onClick={() => updateMilestone(m.id, { completed: !m.completed })}>
                            {m.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                        </button>
                        <div className="milestone-body">
                            <input className="input milestone-title" value={m.title}
                                onChange={e => updateMilestone(m.id, { title: e.target.value })} />
                            <div className="milestone-meta">
                                <input className="input select-sm" type="date" value={m.dueDate}
                                    onChange={e => updateMilestone(m.id, { dueDate: e.target.value })} />
                                <select className="input select-sm"
                                    value={m.stageId ?? ''}
                                    onChange={e => updateMilestone(m.id, { stageId: e.target.value || undefined })}>
                                    <option value="">无关联阶段</option>
                                    {pipeline.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <textarea className="textarea" placeholder="备注..."
                                value={m.notes}
                                onChange={e => updateMilestone(m.id, { notes: e.target.value })}
                                rows={1} />
                        </div>
                        <button className="btn-icon" onClick={() => deleteMilestone(m.id)}>
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
                {milestones.length === 0 && (
                    <div className="empty-state">
                        <Flag size={32} />
                        <p>还没有里程碑，点击上方按钮添加</p>
                    </div>
                )}
            </div>
        </div>
    );
}
