import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, MapPin, Edit3, Check } from 'lucide-react';
import type { Scene } from '../types';
import './SceneManager.css';

export default function SceneManager() {
    const { currentProject, updateProject } = useProject();
    const [editingId, setEditingId] = useState<string | null>(null);

    if (!currentProject) return null;

    const { scenes, storyboard } = currentProject;

    const addScene = () => {
        const s: Scene = {
            id: uuid(), name: '新场景', description: '',
            referenceImages: [], linkedShotIds: [], notes: '',
        };
        updateProject({ ...currentProject, scenes: [...scenes, s] });
        setEditingId(s.id);
    };

    const updateScene = (id: string, patch: Partial<Scene>) => {
        const updated = scenes.map(s => s.id === id ? { ...s, ...patch } : s);
        updateProject({ ...currentProject, scenes: updated });
    };

    const deleteScene = (id: string) => {
        updateProject({ ...currentProject, scenes: scenes.filter(s => s.id !== id) });
    };

    const toggleShotLink = (sceneId: string, shotId: string) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        const linked = scene.linkedShotIds.includes(shotId)
            ? scene.linkedShotIds.filter(id => id !== shotId)
            : [...scene.linkedShotIds, shotId];
        updateScene(sceneId, { linkedShotIds: linked });
    };

    return (
        <div className="scene-manager">
            <div className="scene-toolbar">
                <span className="scene-count">{scenes.length} 个场景</span>
                <button className="btn btn-primary" onClick={addScene}>
                    <Plus size={14} /> 添加场景
                </button>
            </div>

            <div className="scene-grid">
                {scenes.map(scene => (
                    <div key={scene.id} className="scene-card glass-card">
                        <div className="scene-header">
                            {editingId === scene.id ? (
                                <input className="input" value={scene.name}
                                    onChange={e => updateScene(scene.id, { name: e.target.value })}
                                    autoFocus />
                            ) : (
                                <h4 className="scene-name">{scene.name}</h4>
                            )}
                            <div className="scene-actions">
                                <button className="btn-icon"
                                    onClick={() => setEditingId(editingId === scene.id ? null : scene.id)}>
                                    {editingId === scene.id ? <Check size={12} /> : <Edit3 size={12} />}
                                </button>
                                <button className="btn-icon" onClick={() => deleteScene(scene.id)}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {editingId === scene.id ? (
                            <div className="scene-edit">
                                <textarea className="textarea" placeholder="场景描述..."
                                    value={scene.description}
                                    onChange={e => updateScene(scene.id, { description: e.target.value })}
                                    rows={2} />
                                <textarea className="textarea" placeholder="备注..."
                                    value={scene.notes}
                                    onChange={e => updateScene(scene.id, { notes: e.target.value })}
                                    rows={2} />
                                {storyboard.length > 0 && (
                                    <div className="shot-links">
                                        <span className="section-label">关联镜头</span>
                                        <div className="shot-link-list">
                                            {storyboard.map(shot => (
                                                <label key={shot.id} className="shot-link-item">
                                                    <input type="checkbox"
                                                        checked={scene.linkedShotIds.includes(shot.id)}
                                                        onChange={() => toggleShotLink(scene.id, shot.id)} />
                                                    <span>镜头 {shot.shotNumber}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {scene.description && <p className="scene-desc">{scene.description}</p>}
                                <div className="scene-meta">
                                    <span className="tag">{scene.linkedShotIds.length} 个关联镜头</span>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {scenes.length === 0 && (
                    <div className="empty-state">
                        <MapPin size={32} />
                        <p>还没有场景，点击上方按钮添加</p>
                    </div>
                )}
            </div>
        </div>
    );
}
