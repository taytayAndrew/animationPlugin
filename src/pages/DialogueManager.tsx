import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import type { DialogueLine } from '../types';
import './DialogueManager.css';

const emotionOptions = ['平静', '开心', '悲伤', '愤怒', '惊讶', '恐惧', '厌恶', '期待', '犹豫', '坚定'];

export default function DialogueManager() {
    const { currentProject, updateProject } = useProject();
    const [filterChar, setFilterChar] = useState('');

    if (!currentProject) return null;

    const { dialogues, characters } = currentProject;

    const filtered = filterChar
        ? dialogues.filter(d => d.characterId === filterChar)
        : dialogues;

    const sorted = [...filtered].sort((a, b) => a.order - b.order);

    const addLine = () => {
        const line: DialogueLine = {
            id: uuid(),
            characterId: characters[0]?.id ?? '',
            content: '',
            emotion: '平静',
            order: dialogues.length,
        };
        updateProject({ ...currentProject, dialogues: [...dialogues, line] });
    };

    const updateLine = (id: string, patch: Partial<DialogueLine>) => {
        const updated = dialogues.map(d => d.id === id ? { ...d, ...patch } : d);
        updateProject({ ...currentProject, dialogues: updated });
    };

    const deleteLine = (id: string) => {
        updateProject({ ...currentProject, dialogues: dialogues.filter(d => d.id !== id) });
    };

    const getCharName = (id: string) => characters.find(c => c.id === id)?.name ?? '未指定';

    return (
        <div className="dialogue-manager">
            <div className="dialogue-toolbar">
                <select className="input select-sm" value={filterChar}
                    onChange={e => setFilterChar(e.target.value)}>
                    <option value="">全部角色</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="dialogue-count">{sorted.length} 条对白</span>
                <button className="btn btn-primary" onClick={addLine}>
                    <Plus size={14} /> 添加对白
                </button>
            </div>

            <div className="dialogue-list">
                {sorted.map(line => (
                    <div key={line.id} className="dialogue-item glass-card">
                        <div className="dialogue-meta">
                            <select className="input select-sm char-select"
                                value={line.characterId}
                                onChange={e => updateLine(line.id, { characterId: e.target.value })}>
                                <option value="">选择角色</option>
                                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="input select-sm emotion-select"
                                value={line.emotion}
                                onChange={e => updateLine(line.id, { emotion: e.target.value })}>
                                {emotionOptions.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <button className="btn-icon" onClick={() => deleteLine(line.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <textarea className="textarea dialogue-content"
                            placeholder="输入对白内容..."
                            value={line.content}
                            onChange={e => updateLine(line.id, { content: e.target.value })}
                            rows={2} />
                    </div>
                ))}
                {sorted.length === 0 && (
                    <div className="empty-state">
                        <MessageSquare size={32} />
                        <p>还没有对白，点击上方按钮添加</p>
                    </div>
                )}
            </div>
        </div>
    );
}
