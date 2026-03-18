import { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import StoryEditor from './StoryEditor';
import PipelineBoard from './PipelineBoard';
import StoryboardView from './StoryboardView';
import CharacterMap from './CharacterMap';
import NotesPanel from './NotesPanel';
import DialogueManager from './DialogueManager';
import SceneManager from './SceneManager';
import PropsList from './PropsList';
import AudioPlanner from './AudioPlanner';
import MilestoneTracker from './MilestoneTracker';
import ReferenceLibrary from './ReferenceLibrary';
import DevLog from './DevLog';
import CollectorPanel from './CollectorPanel';
import {
    BookOpen, Kanban, Layout, Users, StickyNote, BarChart3,
    MessageSquare, MapPin, Package, Music, Flag, Bookmark, FileText,
    Download, Upload, Search, X, Globe,
} from 'lucide-react';
import './ProjectDetail.css';

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const tabGroups = [
    {
        label: '创作',
        tabs: [
            { key: 'story', label: '故事', icon: BookOpen },
            { key: 'characters', label: '角色', icon: Users },
            { key: 'dialogue', label: '对白', icon: MessageSquare },
            { key: 'storyboard', label: '分镜', icon: Layout },
            { key: 'scenes', label: '场景', icon: MapPin },
        ],
    },
    {
        label: '制作',
        tabs: [
            { key: 'pipeline', label: '流程', icon: Kanban },
            { key: 'props', label: '道具', icon: Package },
            { key: 'audio', label: '音频', icon: Music },
            { key: 'milestones', label: '里程碑', icon: Flag },
        ],
    },
    {
        label: '素材',
        tabs: [
            { key: 'collector', label: '收集', icon: Globe },
            { key: 'references', label: '参考库', icon: Bookmark },
            { key: 'notes', label: '便签', icon: StickyNote },
            { key: 'devlog', label: '日志', icon: FileText },
            { key: 'stats', label: '统计', icon: BarChart3 },
        ],
    },
];

type TabKey = string;

export default function ProjectDetail() {
    const { currentProject, updateProject } = useProject();
    const [activeTab, setActiveTab] = useState<TabKey>('story');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);

    if (!currentProject) return null;

    // === Export ===
    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${currentProject.name}.json`);
        setShowExportMenu(false);
    };

    const exportMarkdown = () => {
        const p = currentProject;
        const lines: string[] = [];
        lines.push(`# ${p.name}\n`);
        lines.push(`> ${p.description || '（无描述）'}\n`);
        lines.push(`## Logline\n${p.story.logline || '—'}\n`);
        lines.push(`## 世界观\n${p.story.worldSetting || '—'}\n`);
        lines.push(`## 故事结构\n`);
        p.story.acts.forEach(act => {
            lines.push(`### ${act.name}\n${act.description || ''}\n`);
            act.beats.forEach((b, i) => lines.push(`- **Beat ${i + 1}** ${b.title}: ${b.content}`));
            lines.push('');
        });
        if (p.characters.length) {
            lines.push(`## 角色\n`);
            p.characters.forEach(c => lines.push(`- **${c.name}**（${c.role}）: ${c.description}`));
            lines.push('');
        }
        if (p.dialogues.length) {
            lines.push(`## 对白\n`);
            p.dialogues.forEach(d => {
                const name = p.characters.find(c => c.id === d.characterId)?.name ?? '?';
                lines.push(`- **${name}**（${d.emotion}）: ${d.content}`);
            });
            lines.push('');
        }
        if (p.storyboard.length) {
            lines.push(`## 分镜\n`);
            p.storyboard.forEach(s => lines.push(`- Shot ${s.shotNumber}: ${s.shotSize}/${s.cameraAngle}/${s.cameraMove} ${s.duration}s — ${s.actionDescription}`));
            lines.push('');
        }
        if (p.scenes.length) {
            lines.push(`## 场景\n`);
            p.scenes.forEach(s => lines.push(`- **${s.name}**: ${s.description}`));
            lines.push('');
        }
        if (p.milestones.length) {
            lines.push(`## 里程碑\n`);
            p.milestones.forEach(m => lines.push(`- [${m.completed ? 'x' : ' '}] ${m.title} ${m.dueDate ? `(${m.dueDate})` : ''}`));
            lines.push('');
        }
        if (p.devLog.length) {
            lines.push(`## 制作日志\n`);
            p.devLog.forEach(d => lines.push(`### ${d.date}\n${d.content}\n`));
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
        downloadBlob(blob, `${currentProject.name}.md`);
        setShowExportMenu(false);
    };

    // === Import ===
    const importJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result as string);
                    if (data.id && data.name && data.story) {
                        updateProject({ ...data, updatedAt: Date.now() });
                    } else {
                        alert('无效的项目文件');
                    }
                } catch { alert('JSON 解析失败'); }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // === Search ===
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results: { type: string; label: string; detail: string; tab: TabKey }[] = [];
        const p = currentProject;
        // Story
        if (p.story.logline.toLowerCase().includes(q)) results.push({ type: '故事', label: 'Logline', detail: p.story.logline, tab: 'story' });
        if (p.story.worldSetting.toLowerCase().includes(q)) results.push({ type: '故事', label: '世界观', detail: p.story.worldSetting.slice(0, 80), tab: 'story' });
        p.story.acts.forEach(a => a.beats.forEach(b => {
            if (b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q))
                results.push({ type: '故事', label: `${a.name} / ${b.title || 'Beat'}`, detail: b.content.slice(0, 80), tab: 'story' });
        }));
        // Characters
        p.characters.forEach(c => {
            if (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
                results.push({ type: '角色', label: c.name, detail: c.description.slice(0, 80), tab: 'characters' });
        });
        // Dialogues
        p.dialogues.forEach(d => {
            if (d.content.toLowerCase().includes(q))
                results.push({ type: '对白', label: p.characters.find(c => c.id === d.characterId)?.name ?? '?', detail: d.content.slice(0, 80), tab: 'dialogue' });
        });
        // Scenes
        p.scenes.forEach(s => {
            if (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
                results.push({ type: '场景', label: s.name, detail: s.description.slice(0, 80), tab: 'scenes' });
        });
        // Notes
        p.notes.forEach(n => {
            if (n.content.toLowerCase().includes(q))
                results.push({ type: '便签', label: n.content.slice(0, 30), detail: n.content.slice(0, 80), tab: 'notes' });
        });
        // DevLog
        p.devLog.forEach(d => {
            if (d.content.toLowerCase().includes(q) || d.problems.toLowerCase().includes(q))
                results.push({ type: '日志', label: d.date, detail: d.content.slice(0, 80), tab: 'devlog' });
        });
        // References
        p.references.forEach(r => {
            if (r.title.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q))
                results.push({ type: '参考', label: r.title, detail: r.notes.slice(0, 80), tab: 'references' });
        });
        // Pipeline notes
        p.pipeline.forEach(s => {
            if (s.notes.toLowerCase().includes(q))
                results.push({ type: '流程', label: s.name, detail: s.notes.slice(0, 80), tab: 'pipeline' });
        });
        return results.slice(0, 20);
    }, [searchQuery, currentProject]);

    return (
        <div className="project-detail">
            <header className="project-header">
                <div className="project-header-top">
                    <h1 className="project-title">{currentProject.name}</h1>
                    <div className="header-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowSearch(!showSearch)}
                            title="全局搜索">
                            <Search size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={importJSON} title="导入 JSON">
                            <Upload size={14} />
                        </button>
                        <div className="export-dropdown"
                            onMouseLeave={() => setShowExportMenu(false)}>
                            <button className="btn btn-ghost btn-sm"
                                onClick={() => setShowExportMenu(!showExportMenu)} title="导出">
                                <Download size={14} />
                            </button>
                            {showExportMenu && (
                                <div className="export-menu glass-card">
                                    <button className="export-option" onClick={exportJSON}>💾 导出 JSON</button>
                                    <button className="export-option" onClick={exportMarkdown}>📄 导出 Markdown</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showSearch && (
                    <div className="search-bar">
                        <Search size={14} className="search-icon" />
                        <input className="input search-input" placeholder="搜索故事、角色、对白、场景..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                        <button className="btn-icon" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                            <X size={14} />
                        </button>
                        {searchResults.length > 0 && (
                            <div className="search-results glass-card">
                                {searchResults.map((r, i) => (
                                    <button key={i} className="search-result-item"
                                        onClick={() => { setActiveTab(r.tab); setShowSearch(false); setSearchQuery(''); }}>
                                        <span className="search-result-type">{r.type}</span>
                                        <span className="search-result-label">{r.label}</span>
                                        <span className="search-result-detail">{r.detail}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {searchQuery && searchResults.length === 0 && (
                            <div className="search-results glass-card">
                                <div className="search-empty">没有找到匹配内容</div>
                            </div>
                        )}
                    </div>
                )}

                <nav className="tab-nav">
                    {tabGroups.map(group => (
                        <div key={group.label} className="tab-group">
                            <span className="tab-group-label">{group.label}</span>
                            <div className="tab-group-items">
                                {group.tabs.map(t => (
                                    <button
                                        key={t.key}
                                        className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                                        onClick={() => setActiveTab(t.key)}
                                    >
                                        <t.icon size={14} />
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </header>

            <div className="tab-content">
                {activeTab === 'story' && <StoryEditor />}
                {activeTab === 'pipeline' && <PipelineBoard />}
                {activeTab === 'storyboard' && <StoryboardView />}
                {activeTab === 'characters' && <CharacterMap />}
                {activeTab === 'notes' && <NotesPanel />}
                {activeTab === 'dialogue' && <DialogueManager />}
                {activeTab === 'scenes' && <SceneManager />}
                {activeTab === 'props' && <PropsList />}
                {activeTab === 'audio' && <AudioPlanner />}
                {activeTab === 'milestones' && <MilestoneTracker />}
                {activeTab === 'references' && <ReferenceLibrary />}
                {activeTab === 'devlog' && <DevLog />}
                {activeTab === 'collector' && <CollectorPanel />}
                {activeTab === 'stats' && <StatsPanel />}
            </div>
        </div>
    );
}

function StatsPanel() {
    const { currentProject } = useProject();
    if (!currentProject) return null;
    const shots = currentProject.storyboard;
    const totalDuration = shots.reduce((s, c) => s + c.duration, 0);
    const completed = currentProject.pipeline.filter(s => s.status === 'completed').length;
    const total = currentProject.pipeline.length;
    const totalBeats = currentProject.story.acts.reduce((s, a) => s + a.beats.length, 0);
    const doneProps = currentProject.props.filter(p => p.status === 'done').length;
    const doneSfx = currentProject.soundEffects.filter(s => s.status === 'done').length;
    const doneMilestones = currentProject.milestones.filter(m => m.completed).length;

    return (
        <div className="stats-grid">
            <div className="stat-card glass-card"><span className="stat-value">{shots.length}</span><span className="stat-label">总镜头数</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{totalDuration}s</span><span className="stat-label">预估总时长</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{currentProject.characters.length}</span><span className="stat-label">角色数</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{completed}/{total}</span><span className="stat-label">流程进度</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{currentProject.story.acts.length}</span><span className="stat-label">幕数</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{totalBeats}</span><span className="stat-label">Beat数</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{currentProject.scenes.length}</span><span className="stat-label">场景数</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{doneProps}/{currentProject.props.length}</span><span className="stat-label">道具进度</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{doneSfx}/{currentProject.soundEffects.length}</span><span className="stat-label">音效进度</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{doneMilestones}/{currentProject.milestones.length}</span><span className="stat-label">里程碑</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{currentProject.dialogues.length}</span><span className="stat-label">对白条数</span></div>
            <div className="stat-card glass-card"><span className="stat-value">{currentProject.references.length}</span><span className="stat-label">参考素材</span></div>
        </div>
    );
}
