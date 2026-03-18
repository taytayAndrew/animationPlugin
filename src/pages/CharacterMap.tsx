import { useState, useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, Link, User, Camera } from 'lucide-react';
import type { Character, CharacterRelation } from '../types';
import './CharacterMap.css';

const roleOptions = ['主角', '反派', '配角', '导师', '伙伴', '路人', '其他'];

export default function CharacterMap() {
    const { currentProject, updateProject } = useProject();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showRelForm, setShowRelForm] = useState(false);
    const [relFrom, setRelFrom] = useState('');
    const [relTo, setRelTo] = useState('');
    const [relType, setRelType] = useState('');

    if (!currentProject) return null;

    const { characters, characterRelations } = currentProject;

    const addCharacter = () => {
        const c: Character = {
            id: uuid(), name: '新角色', role: '配角',
            description: '', personality: '', notes: '',
        };
        updateProject({ ...currentProject, characters: [...characters, c] });
        setEditingId(c.id);
    };

    const updateChar = (id: string, patch: Partial<Character>) => {
        const updated = characters.map(c => c.id === id ? { ...c, ...patch } : c);
        updateProject({ ...currentProject, characters: updated });
    };

    const deleteChar = (id: string) => {
        updateProject({
            ...currentProject,
            characters: characters.filter(c => c.id !== id),
            characterRelations: characterRelations.filter(r => r.fromId !== id && r.toId !== id),
        });
    };

    const addRelation = () => {
        if (!relFrom || !relTo || !relType || relFrom === relTo) return;
        const r: CharacterRelation = { id: uuid(), fromId: relFrom, toId: relTo, relationType: relType, description: '' };
        updateProject({ ...currentProject, characterRelations: [...characterRelations, r] });
        setShowRelForm(false);
        setRelFrom(''); setRelTo(''); setRelType('');
    };

    const deleteRelation = (id: string) => {
        updateProject({ ...currentProject, characterRelations: characterRelations.filter(r => r.id !== id) });
    };

    const getName = (id: string) => characters.find(c => c.id === id)?.name ?? '?';

    const handleAvatarUpload = (charId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                // Resize to keep IndexedDB lean
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 256;
                    let w = img.width, h = img.height;
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    updateChar(charId, { avatar: dataUrl });
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    return (
        <div className="character-map">
            <div className="char-toolbar">
                <button className="btn btn-primary" onClick={addCharacter}>
                    <Plus size={14} /> 添加角色
                </button>
                <button className="btn btn-ghost" onClick={() => setShowRelForm(true)}>
                    <Link size={14} /> 添加关系
                </button>
            </div>

            {showRelForm && (
                <div className="rel-form glass-card">
                    <select className="input select-sm" value={relFrom} onChange={e => setRelFrom(e.target.value)}>
                        <option value="">选择角色A</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="input" placeholder="关系类型（如：师徒、敌对、暗恋）" value={relType}
                        onChange={e => setRelType(e.target.value)} />
                    <select className="input select-sm" value={relTo} onChange={e => setRelTo(e.target.value)}>
                        <option value="">选择角色B</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="form-actions">
                        <button className="btn btn-primary btn-sm" onClick={addRelation}>确认</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowRelForm(false)}>取消</button>
                    </div>
                </div>
            )}

            {/* 关系列表 */}
            {characterRelations.length > 0 && (
                <div className="relations-list">
                    <h4 className="section-label">角色关系</h4>
                    {characterRelations.map(r => (
                        <div key={r.id} className="relation-item glass-card">
                            <span className="rel-char">{getName(r.fromId)}</span>
                            <span className="rel-type-badge">{r.relationType}</span>
                            <span className="rel-char">{getName(r.toId)}</span>
                            <button className="btn-icon" onClick={() => deleteRelation(r.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 角色卡片 */}
            <div className="char-grid">
                {characters.map(c => (
                    <div key={c.id} className={`char-card glass-card ${editingId === c.id ? 'editing' : ''}`}
                        onClick={() => setEditingId(c.id)}>
                        <div className="char-avatar" onClick={e => { e.stopPropagation(); handleAvatarUpload(c.id); }}
                            title="点击上传头像">
                            {c.avatar
                                ? <img src={c.avatar} alt={c.name} className="char-avatar-img" />
                                : <><User size={20} /><Camera size={10} className="avatar-upload-hint" /></>
                            }
                        </div>
                        <div className="char-info">
                            {editingId === c.id ? (
                                <>
                                    <input className="input char-name-input" value={c.name}
                                        onChange={e => updateChar(c.id, { name: e.target.value })} autoFocus />
                                    <select className="input select-sm" value={c.role}
                                        onChange={e => updateChar(c.id, { role: e.target.value })}>
                                        {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <textarea className="textarea" placeholder="角色描述..." value={c.description}
                                        onChange={e => updateChar(c.id, { description: e.target.value })} rows={2} />
                                    <textarea className="textarea" placeholder="性格特点..." value={c.personality}
                                        onChange={e => updateChar(c.id, { personality: e.target.value })} rows={2} />
                                    <textarea className="textarea" placeholder="备注..." value={c.notes}
                                        onChange={e => updateChar(c.id, { notes: e.target.value })} rows={2} />
                                </>
                            ) : (
                                <>
                                    <span className="char-name">{c.name}</span>
                                    <span className="char-role tag">{c.role}</span>
                                    {c.description && <p className="char-desc">{c.description}</p>}
                                </>
                            )}
                        </div>
                        <button className="btn-icon char-delete" onClick={e => { e.stopPropagation(); deleteChar(c.id); }}>
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
