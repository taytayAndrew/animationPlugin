import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, Music, Volume2 } from 'lucide-react';
import type { MusicPlanEntry, SoundEffect, PropStatus } from '../types';
import './AudioPlanner.css';

const sfxStatusLabels: Record<PropStatus, string> = {
    'pending': '待处理', 'in-progress': '进行中', 'done': '已完成',
};

export default function AudioPlanner() {
    const { currentProject, updateProject } = useProject();
    const [tab, setTab] = useState<'music' | 'sfx'>('music');

    if (!currentProject) return null;

    const { musicPlan, soundEffects, scenes } = currentProject;

    // Music
    const addMusic = () => {
        const m: MusicPlanEntry = {
            id: uuid(), timeRange: '', style: '', mood: '',
            notes: '', linkedBeatIds: [], order: musicPlan.length,
        };
        updateProject({ ...currentProject, musicPlan: [...musicPlan, m] });
    };
    const updateMusic = (id: string, patch: Partial<MusicPlanEntry>) => {
        updateProject({ ...currentProject, musicPlan: musicPlan.map(m => m.id === id ? { ...m, ...patch } : m) });
    };
    const deleteMusic = (id: string) => {
        updateProject({ ...currentProject, musicPlan: musicPlan.filter(m => m.id !== id) });
    };

    // SFX
    const addSfx = () => {
        const s: SoundEffect = {
            id: uuid(), name: '新音效', description: '', status: 'pending',
        };
        updateProject({ ...currentProject, soundEffects: [...soundEffects, s] });
    };
    const updateSfx = (id: string, patch: Partial<SoundEffect>) => {
        updateProject({ ...currentProject, soundEffects: soundEffects.map(s => s.id === id ? { ...s, ...patch } : s) });
    };
    const deleteSfx = (id: string) => {
        updateProject({ ...currentProject, soundEffects: soundEffects.filter(s => s.id !== id) });
    };

    return (
        <div className="audio-planner">
            <div className="audio-tabs">
                <button className={`btn btn-ghost btn-sm ${tab === 'music' ? 'active' : ''}`}
                    onClick={() => setTab('music')}>
                    <Music size={14} /> 配乐 ({musicPlan.length})
                </button>
                <button className={`btn btn-ghost btn-sm ${tab === 'sfx' ? 'active' : ''}`}
                    onClick={() => setTab('sfx')}>
                    <Volume2 size={14} /> 音效 ({soundEffects.length})
                </button>
            </div>

            {tab === 'music' && (
                <div className="music-section">
                    <button className="btn btn-primary" onClick={addMusic}>
                        <Plus size={14} /> 添加配乐段
                    </button>
                    <div className="music-list">
                        {musicPlan.sort((a, b) => a.order - b.order).map(m => (
                            <div key={m.id} className="music-item glass-card">
                                <div className="music-row">
                                    <input className="input" placeholder="时间段（如 0:00-1:30）"
                                        value={m.timeRange}
                                        onChange={e => updateMusic(m.id, { timeRange: e.target.value })} />
                                    <input className="input" placeholder="风格"
                                        value={m.style}
                                        onChange={e => updateMusic(m.id, { style: e.target.value })} />
                                    <input className="input" placeholder="情绪"
                                        value={m.mood}
                                        onChange={e => updateMusic(m.id, { mood: e.target.value })} />
                                    <button className="btn-icon" onClick={() => deleteMusic(m.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <textarea className="textarea" placeholder="备注..."
                                    value={m.notes}
                                    onChange={e => updateMusic(m.id, { notes: e.target.value })}
                                    rows={1} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'sfx' && (
                <div className="sfx-section">
                    <button className="btn btn-primary" onClick={addSfx}>
                        <Plus size={14} /> 添加音效
                    </button>
                    <div className="sfx-list">
                        {soundEffects.map(s => (
                            <div key={s.id} className="sfx-item glass-card">
                                <div className="sfx-row">
                                    <input className="input" placeholder="音效名称"
                                        value={s.name}
                                        onChange={e => updateSfx(s.id, { name: e.target.value })} />
                                    <select className="input select-sm"
                                        value={s.status}
                                        onChange={e => updateSfx(s.id, { status: e.target.value as PropStatus })}>
                                        {(['pending', 'in-progress', 'done'] as PropStatus[]).map(st => (
                                            <option key={st} value={st}>{sfxStatusLabels[st]}</option>
                                        ))}
                                    </select>
                                    <select className="input select-sm"
                                        value={s.sceneId ?? ''}
                                        onChange={e => updateSfx(s.id, { sceneId: e.target.value || undefined })}>
                                        <option value="">无关联场景</option>
                                        {scenes.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                    </select>
                                    <button className="btn-icon" onClick={() => deleteSfx(s.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <textarea className="textarea" placeholder="描述..."
                                    value={s.description}
                                    onChange={e => updateSfx(s.id, { description: e.target.value })}
                                    rows={1} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
