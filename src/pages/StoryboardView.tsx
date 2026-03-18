import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, Image } from 'lucide-react';
import type { ShotCard, ShotSize, CameraAngle, CameraMove } from '../types';
import './StoryboardView.css';

const shotSizes: ShotSize[] = ['远景', '全景', '中景', '近景', '特写', '大特写'];
const cameraAngles: CameraAngle[] = ['平拍', '俯拍', '仰拍', '斜拍', '鸟瞰'];
const cameraMoves: CameraMove[] = ['固定', '推进', '拉远', '摇移', '跟拍', '环绕'];

function compressImage(file: File, maxSize = 512): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                else { w = Math.round(w * maxSize / h); h = maxSize; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
}

export default function StoryboardView() {
    const { currentProject, updateProject } = useProject();
    if (!currentProject) return null;

    const shots = currentProject.storyboard;

    const addShot = () => {
        const shot: ShotCard = {
            id: uuid(),
            shotNumber: shots.length + 1,
            shotSize: '中景',
            cameraAngle: '平拍',
            cameraMove: '固定',
            duration: 3,
            actionDescription: '',
            dialogue: '',
            soundNotes: '',
            order: shots.length,
        };
        updateProject({ ...currentProject, storyboard: [...shots, shot] });
    };

    const updateShot = (shotId: string, patch: Partial<ShotCard>) => {
        const updated = shots.map(s => s.id === shotId ? { ...s, ...patch } : s);
        updateProject({ ...currentProject, storyboard: updated });
    };

    const deleteShot = (shotId: string) => {
        const updated = shots.filter(s => s.id !== shotId).map((s, i) => ({ ...s, shotNumber: i + 1, order: i }));
        updateProject({ ...currentProject, storyboard: updated });
    };

    const handleShotImage = async (shotId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const dataUrl = await compressImage(file);
            updateShot(shotId, { image: dataUrl });
        };
        input.click();
    };

    return (
        <div className="storyboard-view">
            <div className="storyboard-toolbar">
                <span className="shot-count">{shots.length} 个镜头 · 预估 {shots.reduce((s, c) => s + c.duration, 0)}s</span>
                <button className="btn btn-primary" onClick={addShot}>
                    <Plus size={14} /> 添加镜头
                </button>
            </div>

            <div className="shots-grid">
                {shots.sort((a, b) => a.order - b.order).map(shot => (
                    <div key={shot.id} className="shot-card glass-card">
                        <div className="shot-header">
                            <span className="shot-number">Shot {String(shot.shotNumber).padStart(3, '0')}</span>
                            <button className="btn-icon shot-delete" onClick={() => deleteShot(shot.id)}>
                                <Trash2 size={12} />
                            </button>
                        </div>

                        <div className="shot-image-area" onClick={() => handleShotImage(shot.id)}
                            title="点击上传画面">
                            {shot.image
                                ? <img src={shot.image} alt={`Shot ${shot.shotNumber}`} className="shot-image" />
                                : <><Image size={24} /><span>点击上传画面</span></>
                            }
                        </div>

                        <div className="shot-meta">
                            <div className="meta-row">
                                <label>景别</label>
                                <select className="input select-xs" value={shot.shotSize}
                                    onChange={e => updateShot(shot.id, { shotSize: e.target.value as ShotSize })}>
                                    {shotSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="meta-row">
                                <label>机位</label>
                                <select className="input select-xs" value={shot.cameraAngle}
                                    onChange={e => updateShot(shot.id, { cameraAngle: e.target.value as CameraAngle })}>
                                    {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="meta-row">
                                <label>运镜</label>
                                <select className="input select-xs" value={shot.cameraMove}
                                    onChange={e => updateShot(shot.id, { cameraMove: e.target.value as CameraMove })}>
                                    {cameraMoves.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="meta-row">
                                <label>时长</label>
                                <input className="input select-xs" type="number" min={0.5} step={0.5}
                                    value={shot.duration}
                                    onChange={e => updateShot(shot.id, { duration: parseFloat(e.target.value) || 0 })} />
                                <span className="unit">s</span>
                            </div>
                        </div>

                        <div className="shot-fields">
                            <textarea className="textarea shot-textarea" placeholder="动作描述..."
                                value={shot.actionDescription}
                                onChange={e => updateShot(shot.id, { actionDescription: e.target.value })}
                                rows={2} />
                            <textarea className="textarea shot-textarea" placeholder="对白..."
                                value={shot.dialogue}
                                onChange={e => updateShot(shot.id, { dialogue: e.target.value })}
                                rows={2} />
                            <textarea className="textarea shot-textarea" placeholder="音效/配乐备注..."
                                value={shot.soundNotes}
                                onChange={e => updateShot(shot.id, { soundNotes: e.target.value })}
                                rows={1} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
