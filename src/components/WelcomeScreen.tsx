import { Film, Sparkles } from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { useState } from 'react';
import './WelcomeScreen.css';

export default function WelcomeScreen() {
    const { createProject } = useProject();
    const [name, setName] = useState('');

    const handleCreate = () => {
        const n = name.trim() || '我的动画短片';
        createProject(n);
    };

    return (
        <div className="welcome">
            <div className="welcome-glow" />
            <div className="welcome-content glass-card">
                <div className="welcome-icon">
                    <Film size={48} />
                </div>
                <h1 className="welcome-title">AnimStudio</h1>
                <p className="welcome-subtitle">动画短片创作助手</p>
                <p className="welcome-desc">
                    收集灵感、整理故事、管理制作流程<br />
                    让每一个创意都能变成精彩的动画
                </p>
                <div className="welcome-form">
                    <input
                        className="input welcome-input"
                        placeholder="给你的短片起个名字..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <button className="btn btn-primary welcome-btn" onClick={handleCreate}>
                        <Sparkles size={16} />
                        开始创作
                    </button>
                </div>
            </div>
        </div>
    );
}
