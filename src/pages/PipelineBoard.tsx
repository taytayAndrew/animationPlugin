import { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { v4 as uuid } from 'uuid';
import { ChevronDown, ChevronRight, Plus, Trash2, Check, Square, CheckSquare } from 'lucide-react';
import type { PipelineStage, StageStatus, ChecklistItem } from '../types';
import './PipelineBoard.css';

const phaseLabels = {
    'pre-production': '前期 Pre-production',
    'production': '中期 Production',
    'post-production': '后期 Post-production',
};

const statusOptions: { value: StageStatus; label: string }[] = [
    { value: 'not-started', label: '未开始' },
    { value: 'in-progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
];

export default function PipelineBoard() {
    const { currentProject, updateProject } = useProject();
    if (!currentProject) return null;

    const { pipeline } = currentProject;
    const phases = ['pre-production', 'production', 'post-production'] as const;

    const updateStage = (stageId: string, patch: Partial<PipelineStage>) => {
        const updated = pipeline.map(s => s.id === stageId ? { ...s, ...patch } : s);
        updateProject({ ...currentProject, pipeline: updated });
    };

    const addChecklist = (stageId: string) => {
        const stage = pipeline.find(s => s.id === stageId);
        if (!stage) return;
        const item: ChecklistItem = { id: uuid(), text: '', checked: false };
        updateStage(stageId, { checklist: [...stage.checklist, item] });
    };

    const updateChecklist = (stageId: string, itemId: string, patch: Partial<ChecklistItem>) => {
        const stage = pipeline.find(s => s.id === stageId);
        if (!stage) return;
        const checklist = stage.checklist.map(c => c.id === itemId ? { ...c, ...patch } : c);
        updateStage(stageId, { checklist });
    };

    const deleteChecklist = (stageId: string, itemId: string) => {
        const stage = pipeline.find(s => s.id === stageId);
        if (!stage) return;
        updateStage(stageId, { checklist: stage.checklist.filter(c => c.id !== itemId) });
    };

    return (
        <div className="pipeline-board">
            {phases.map(phase => (
                <div key={phase} className="phase-group">
                    <h3 className="phase-title">{phaseLabels[phase]}</h3>
                    <div className="stages-list">
                        {pipeline.filter(s => s.phase === phase).sort((a, b) => a.order - b.order).map(stage => (
                            <StageCard
                                key={stage.id}
                                stage={stage}
                                onUpdateStage={patch => updateStage(stage.id, patch)}
                                onAddChecklist={() => addChecklist(stage.id)}
                                onUpdateChecklist={(iid, patch) => updateChecklist(stage.id, iid, patch)}
                                onDeleteChecklist={(iid) => deleteChecklist(stage.id, iid)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface StageCardProps {
    stage: PipelineStage;
    onUpdateStage: (patch: Partial<PipelineStage>) => void;
    onAddChecklist: () => void;
    onUpdateChecklist: (itemId: string, patch: Partial<ChecklistItem>) => void;
    onDeleteChecklist: (itemId: string) => void;
}

function StageCard({ stage, onUpdateStage, onAddChecklist, onUpdateChecklist, onDeleteChecklist }: StageCardProps) {
    const [expanded, setExpanded] = useState(false);
    const checkedCount = stage.checklist.filter(c => c.checked).length;

    return (
        <div className={`stage-card glass-card ${stage.status}`}>
            <div className="stage-header" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="stage-name">{stage.name}</span>
                <span className={`status-badge ${stage.status}`}>
                    {statusOptions.find(o => o.value === stage.status)?.label}
                </span>
                {stage.checklist.length > 0 && (
                    <span className="checklist-progress">{checkedCount}/{stage.checklist.length}</span>
                )}
            </div>

            {expanded && (
                <div className="stage-body">
                    <div className="stage-status-select">
                        <label className="field-label">状态</label>
                        <select
                            className="input select-sm"
                            value={stage.status}
                            onChange={e => onUpdateStage({ status: e.target.value as StageStatus })}
                        >
                            {statusOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="stage-notes">
                        <label className="field-label">笔记</label>
                        <textarea
                            className="textarea"
                            placeholder="记录这个环节的想法和进展..."
                            value={stage.notes}
                            onChange={e => onUpdateStage({ notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="stage-checklist">
                        <label className="field-label">检查清单</label>
                        {stage.checklist.map(item => (
                            <div key={item.id} className="checklist-item">
                                <button
                                    className="btn-icon check-btn"
                                    onClick={() => onUpdateChecklist(item.id, { checked: !item.checked })}
                                >
                                    {item.checked ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}
                                </button>
                                <input
                                    className={`input checklist-input ${item.checked ? 'done' : ''}`}
                                    value={item.text}
                                    placeholder="待办事项..."
                                    onChange={e => onUpdateChecklist(item.id, { text: e.target.value })}
                                />
                                <button className="btn-icon" onClick={() => onDeleteChecklist(item.id)}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        <button className="btn btn-ghost btn-xs" onClick={onAddChecklist}>
                            <Plus size={12} /> 添加
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
