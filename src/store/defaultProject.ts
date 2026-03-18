import { v4 as uuid } from 'uuid';
import type { Project, PipelineStage } from '../types';

const defaultPipeline: Omit<PipelineStage, 'id'>[] = [
  // 前期
  { name: '创意/灵感收集', phase: 'pre-production', status: 'not-started', order: 0, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: 'Logline', phase: 'pre-production', status: 'not-started', order: 1, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '故事大纲', phase: 'pre-production', status: 'not-started', order: 2, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '剧本', phase: 'pre-production', status: 'not-started', order: 3, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '世界观/设定', phase: 'pre-production', status: 'not-started', order: 4, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '角色设计', phase: 'pre-production', status: 'not-started', order: 5, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '概念艺术', phase: 'pre-production', status: 'not-started', order: 6, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '分镜', phase: 'pre-production', status: 'not-started', order: 7, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '动态分镜', phase: 'pre-production', status: 'not-started', order: 8, notes: '', materials: [], linkedConversations: [], checklist: [] },
  // 中期
  { name: '场景/背景制作', phase: 'production', status: 'not-started', order: 9, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '资产制作', phase: 'production', status: 'not-started', order: 10, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '骨骼绑定', phase: 'production', status: 'not-started', order: 11, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '关键帧动画', phase: 'production', status: 'not-started', order: 12, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '合成', phase: 'production', status: 'not-started', order: 13, notes: '', materials: [], linkedConversations: [], checklist: [] },
  // 后期
  { name: '剪辑', phase: 'post-production', status: 'not-started', order: 14, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '音效/配乐', phase: 'post-production', status: 'not-started', order: 15, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '视觉特效', phase: 'post-production', status: 'not-started', order: 16, notes: '', materials: [], linkedConversations: [], checklist: [] },
  { name: '输出成片', phase: 'post-production', status: 'not-started', order: 17, notes: '', materials: [], linkedConversations: [], checklist: [] },
];

export function createDefaultProject(name: string): Project {
  return {
    id: uuid(),
    name,
    description: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    story: {
      logline: '',
      worldSetting: '',
      acts: [
        { id: uuid(), name: '第一幕 · 开端', description: '建立世界和角色', beats: [] },
        { id: uuid(), name: '第二幕 · 冲突', description: '冒险与挑战', beats: [] },
        { id: uuid(), name: '第三幕 · 高潮', description: '决战与转变', beats: [] },
      ],
    },
    pipeline: defaultPipeline.map(s => ({ ...s, id: uuid() })),
    storyboard: [],
    characters: [],
    characterRelations: [],
    moodBoard: [],
    notes: [],
    tags: [],
    emotionCurve: [],
    trash: [],
    themes: [],
    dialogues: [],
    storylines: [],
    colorScript: [],
    scenes: [],
    props: [],
    musicPlan: [],
    soundEffects: [],
    milestones: [],
    references: [],
    devLog: [],
  };
}
