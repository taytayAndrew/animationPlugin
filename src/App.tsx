import { useState } from 'react';
import { ProjectProvider, useProject } from './store/ProjectContext';
import Sidebar from './components/Sidebar';
import ProjectDetail from './pages/ProjectDetail';
import WelcomeScreen from './components/WelcomeScreen';
import './styles/global.css';

function AppContent() {
    const { currentProject, loading } = useProject();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner" />
                <p>加载中...</p>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className={`app-main ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
                {currentProject ? <ProjectDetail /> : <WelcomeScreen />}
            </main>
        </div>
    );
}

export default function App() {
    return (
        <ProjectProvider>
            <AppContent />
        </ProjectProvider>
    );
}
