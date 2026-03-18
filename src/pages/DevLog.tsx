import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, FileText } from 'lucide-react';
import type { DevLogEntry } from '../types';
import './DevLog.css';

export default function DevLog() {
    const { currentProject, updateProject } = useProject();

    if (!currentProject) return null;

    const { devLog } = currentProject;

    const sorted = [...devLog].sort((a, b) => b.date.localeCompare(a.date));

    const addEntry = () => {
        const today = new Date().toISOString().slice(0, 10);
        const entry: DevLogEntry = {
            id: uuid(), date: today, content: '', problems: '', tomorrow: '',
        };
        updateProject({ ...currentProject, devLog: [...devLog, entry] });
    };

    const updateEntry = (id: string, patch: Partial<DevLogEntry>) => {
        const updated = devLog.map(e => e.id === id ? { ...e, ...patch } : e);
        updateProject({ ...currentProject, devLog: updated });
    };

    const deleteEntry = (id: string) => {
        updateProject({ ...currentProject, devLog: devLog.filter(e => e.id !== id) });
    };

    return (
        <div className="dev-log">
            <div className="devlog-toolbar">
                <span className="devlog-count">{devLog.length} 条日志</span>
                <button className="btn btn-primary" onClick={addEntry}>
                    <Plus size={14} /> 今日日志
                </button>
            </div>

            <div className="devlog-list">
                {sorted.map(entry => (
                    <div key={entry.id} className="devlog-entry glass-card">
                        <div className="devlog-header">
                            <input className="input devlog-date" type="date" value={entry.date}
                                onChange={e => updateEntry(entry.id, { date: e.target.value })} />
                            <button className="btn-icon" onClick={() => deleteEntry(entry.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <div className="devlog-fields">
                            <div className="devlog-field">
                                <label className="devlog-label">📝 今日工作</label>
                                <textarea className="textarea" placeholder="今天做了什么..."
                                    value={entry.content}
                                    onChange={e => updateEntry(entry.id, { content: e.target.value })}
                                    rows={2} />
                            </div>
                            <div className="devlog-field">
                                <label className="devlog-label">⚠️ 遇到问题</label>
                                <textarea className="textarea" placeholder="遇到了什么问题..."
                                    value={entry.problems}
                                    onChange={e => updateEntry(entry.id, { problems: e.target.value })}
                                    rows={2} />
                            </div>
                            <div className="devlog-field">
                                <label className="devlog-label">🎯 明日计划</label>
                                <textarea className="textarea" placeholder="明天打算做什么..."
                                    value={entry.tomorrow}
                                    onChange={e => updateEntry(entry.id, { tomorrow: e.target.value })}
                                    rows={2} />
                            </div>
                        </div>
                    </div>
                ))}
                {devLog.length === 0 && (
                    <div className="empty-state">
                        <FileText size={32} />
                        <p>还没有日志，点击上方按钮开始记录</p>
                    </div>
                )}
            </div>
        </div>
    );
}
