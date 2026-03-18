import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, ChevronDown, ChevronRight, GripVertical, Trash2, Edit3, Check } from 'lucide-react';
import type { Beat, Act } from '../types';
import './StoryEditor.css';

export default function StoryEditor() {
    const { currentProject, updateProject } = useProject();
    if (!currentProject) return null;

    const { story } = currentProject;

    const updateStory = (patch: Partial<typeof story>) => {
        updateProject({ ...currentProject, story: { ...story, ...patch } });
    };

    // 幕操作
    const addAct = () => {
        const act: Act = {
            id: uuid(),
            name: `第${story.acts.length + 1}幕`,
            description: '',
            beats: [],
        };
        updateStory({ acts: [...story.acts, act] });
    };

    const updateAct = (actId: string, patch: Partial<Act>) => {
        const acts = story.acts.map(a => a.id === actId ? { ...a, ...patch } : a);
        updateStory({ acts });
    };

    const deleteAct = (actId: string) => {
        updateStory({ acts: story.acts.filter(a => a.id !== actId) });
    };

    const moveAct = (actId: string, direction: 'up' | 'down') => {
        const idx = story.acts.findIndex(a => a.id === actId);
        if (idx < 0) return;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= story.acts.length) return;
        const acts = [...story.acts];
        [acts[idx], acts[target]] = [acts[target], acts[idx]];
        updateStory({ acts });
    };

    // Beat操作
    const addBeat = (actId: string) => {
        const acts = story.acts.map(a => {
            if (a.id !== actId) return a;
            const beat: Beat = { id: uuid(), title: '', content: '', order: a.beats.length };
            return { ...a, beats: [...a.beats, beat] };
        });
        updateStory({ acts });
    };

    const updateBeat = (actId: string, beatId: string, patch: Partial<Beat>) => {
        const acts = story.acts.map(a => {
            if (a.id !== actId) return a;
            return { ...a, beats: a.beats.map(b => b.id === beatId ? { ...b, ...patch } : b) };
        });
        updateStory({ acts });
    };

    const deleteBeat = (actId: string, beatId: string) => {
        const acts = story.acts.map(a => {
            if (a.id !== actId) return a;
            return { ...a, beats: a.beats.filter(b => b.id !== beatId) };
        });
        updateStory({ acts });
    };

    const moveBeat = (actId: string, beatId: string, direction: 'up' | 'down') => {
        const acts = story.acts.map(a => {
            if (a.id !== actId) return a;
            const idx = a.beats.findIndex(b => b.id === beatId);
            if (idx < 0) return a;
            const target = direction === 'up' ? idx - 1 : idx + 1;
            if (target < 0 || target >= a.beats.length) return a;
            const beats = [...a.beats];
            [beats[idx], beats[target]] = [beats[target], beats[idx]];
            return { ...a, beats };
        });
        updateStory({ acts });
    };

    return (
        <div className="story-editor">
            {/* Logline */}
            <section className="story-block glass-card">
                <div className="block-header">
                    <span className="block-icon">📌</span>
                    <h3 className="block-title">Logline</h3>
                    <span className="block-hint">一句话概括你的故事</span>
                </div>
                <input
                    className="input logline-input"
                    placeholder="例：一个失去影子的女孩踏上寻回自我的旅程"
                    value={story.logline}
                    onChange={e => updateStory({ logline: e.target.value })}
                />
            </section>

            {/* 世界观 */}
            <section className="story-block glass-card">
                <div className="block-header">
                    <span className="block-icon">🌍</span>
                    <h3 className="block-title">世界观设定</h3>
                </div>
                <textarea
                    className="textarea"
                    placeholder="时间、地点、规则、氛围..."
                    value={story.worldSetting}
                    onChange={e => updateStory({ worldSetting: e.target.value })}
                    rows={4}
                />
            </section>

            {/* 故事结构 */}
            <section className="story-block glass-card">
                <div className="block-header">
                    <span className="block-icon">📖</span>
                    <h3 className="block-title">故事结构</h3>
                    <button className="btn btn-primary btn-sm add-act-btn" onClick={addAct}>
                        <Plus size={14} /> 添加幕
                    </button>
                </div>
                {story.acts.length === 0 && (
                    <p className="empty-acts-hint">还没有故事结构，点击"添加幕"开始构建你的故事</p>
                )}
                <div className="acts-container">
                    {story.acts.map((act, actIndex) => (
                        <ActBlock
                            key={act.id}
                            act={act}
                            actIndex={actIndex}
                            totalActs={story.acts.length}
                            onUpdateAct={patch => updateAct(act.id, patch)}
                            onDeleteAct={() => deleteAct(act.id)}
                            onMoveAct={dir => moveAct(act.id, dir)}
                            onAddBeat={() => addBeat(act.id)}
                            onUpdateBeat={(bid, patch) => updateBeat(act.id, bid, patch)}
                            onDeleteBeat={bid => deleteBeat(act.id, bid)}
                            onMoveBeat={(bid, dir) => moveBeat(act.id, bid, dir)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

interface ActBlockProps {
    act: Act;
    actIndex: number;
    totalActs: number;
    onUpdateAct: (patch: Partial<Act>) => void;
    onDeleteAct: () => void;
    onMoveAct: (dir: 'up' | 'down') => void;
    onAddBeat: () => void;
    onUpdateBeat: (beatId: string, patch: Partial<Beat>) => void;
    onDeleteBeat: (beatId: string) => void;
    onMoveBeat: (beatId: string, dir: 'up' | 'down') => void;
}

function ActBlock({
    act, actIndex, totalActs,
    onUpdateAct, onDeleteAct, onMoveAct,
    onAddBeat, onUpdateBeat, onDeleteBeat, onMoveBeat,
}: ActBlockProps) {
    const [expanded, setExpanded] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [nameVal, setNameVal] = useState(act.name);
    const [descVal, setDescVal] = useState(act.description);
    const [editingDesc, setEditingDesc] = useState(false);

    const saveName = () => {
        onUpdateAct({ name: nameVal.trim() || act.name });
        setEditingName(false);
    };

    const saveDesc = () => {
        onUpdateAct({ description: descVal });
        setEditingDesc(false);
    };

    return (
        <div className="act-block">
            <div className="act-header">
                <button className="btn-icon" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {editingName ? (
                    <div className="act-name-edit">
                        <input
                            className="input act-name-input"
                            value={nameVal}
                            onChange={e => setNameVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveName()}
                            autoFocus
                        />
                        <button className="btn-icon" onClick={saveName}><Check size={14} /></button>
                    </div>
                ) : (
                    <span className="act-name" onDoubleClick={() => setEditingName(true)}>
                        {act.name}
                    </span>
                )}

                {editingDesc ? (
                    <div className="act-desc-edit">
                        <input
                            className="input act-desc-input"
                            value={descVal}
                            placeholder="幕描述..."
                            onChange={e => setDescVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveDesc()}
                            autoFocus
                        />
                        <button className="btn-icon" onClick={saveDesc}><Check size={14} /></button>
                    </div>
                ) : (
                    <span className="act-desc" onDoubleClick={() => setEditingDesc(true)}>
                        {act.description || '双击编辑描述'}
                    </span>
                )}

                <span className="beat-count">{act.beats.length} beats</span>

                <div className="act-actions">
                    <button className="btn-icon" title="编辑名称" onClick={() => setEditingName(true)}>
                        <Edit3 size={12} />
                    </button>
                    {actIndex > 0 && (
                        <button className="btn-icon" title="上移" onClick={() => onMoveAct('up')}>↑</button>
                    )}
                    {actIndex < totalActs - 1 && (
                        <button className="btn-icon" title="下移" onClick={() => onMoveAct('down')}>↓</button>
                    )}
                    <button className="btn-icon act-delete-btn" title="删除幕" onClick={onDeleteAct}>
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="beats-list">
                    {act.beats.map((beat, i) => (
                        <div key={beat.id} className="beat-card">
                            <div className="beat-left">
                                <div className="beat-grip"><GripVertical size={14} /></div>
                                <span className="beat-number">Beat {i + 1}</span>
                                <div className="beat-move-btns">
                                    {i > 0 && (
                                        <button className="btn-icon btn-micro" onClick={() => onMoveBeat(beat.id, 'up')}>↑</button>
                                    )}
                                    {i < act.beats.length - 1 && (
                                        <button className="btn-icon btn-micro" onClick={() => onMoveBeat(beat.id, 'down')}>↓</button>
                                    )}
                                </div>
                            </div>
                            <div className="beat-content-area">
                                <input
                                    className="input beat-title-input"
                                    placeholder="Beat 标题..."
                                    value={beat.title}
                                    onChange={e => onUpdateBeat(beat.id, { title: e.target.value })}
                                />
                                <textarea
                                    className="textarea beat-content-input"
                                    placeholder="这个节拍发生了什么..."
                                    value={beat.content}
                                    onChange={e => onUpdateBeat(beat.id, { content: e.target.value })}
                                    rows={2}
                                />
                            </div>
                            <button className="btn-icon beat-delete" onClick={() => onDeleteBeat(beat.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    <button className="btn btn-ghost add-beat-btn" onClick={onAddBeat}>
                        <Plus size={14} /> 添加 Beat
                    </button>
                </div>
            )}
        </div>
    );
}
