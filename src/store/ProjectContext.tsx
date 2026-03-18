import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Project } from '../types';
import { getAllProjects, saveProject, deleteProject as dbDelete } from './db';
import { createDefaultProject } from './defaultProject';

interface ProjectContextType {
    projects: Project[];
    currentProject: Project | null;
    loading: boolean;
    selectProject: (id: string) => void;
    createProject: (name: string) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllProjects().then(list => {
            setProjects(list.sort((a, b) => b.updatedAt - a.updatedAt));
            if (list.length > 0) setCurrentId(list[0].id);
            setLoading(false);
        });
    }, []);

    const raw = projects.find(p => p.id === currentId) ?? null;
    // Ensure all new fields exist for projects created before they were added.
    // We spread raw first, then override any undefined/missing arrays with defaults.
    const arrayDefaults: Partial<Project> = {
        themes: [], dialogues: [], storylines: [], colorScript: [],
        scenes: [], props: [], musicPlan: [], soundEffects: [],
        milestones: [], references: [], devLog: [],
        characterRelations: [], moodBoard: [], notes: [],
        emotionCurve: [], trash: [], tags: [],
    };
    const currentProject = raw ? {
        ...raw,
        ...Object.fromEntries(
            Object.entries(arrayDefaults).filter(([key]) =>
                (raw as unknown as Record<string, unknown>)[key] == null
            )
        ),
    } as Project : null;

    const selectProject = useCallback((id: string) => setCurrentId(id), []);

    const createProject = useCallback(async (name: string) => {
        const p = createDefaultProject(name);
        await saveProject(p);
        setProjects(prev => [p, ...prev]);
        setCurrentId(p.id);
    }, []);

    const updateProject = useCallback(async (project: Project) => {
        await saveProject(project);
        setProjects(prev => prev.map(p => p.id === project.id ? { ...project, updatedAt: Date.now() } : p));
    }, []);

    const deleteProjectFn = useCallback(async (id: string) => {
        await dbDelete(id);
        setProjects(prev => {
            const next = prev.filter(p => p.id !== id);
            if (currentId === id) setCurrentId(next[0]?.id ?? null);
            return next;
        });
    }, [currentId]);

    return (
        <ProjectContext.Provider value={{
            projects, currentProject, loading,
            selectProject, createProject, updateProject, deleteProject: deleteProjectFn,
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProject must be inside ProjectProvider');
    return ctx;
}
