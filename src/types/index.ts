// ============ 核心数据模型 ============

export interface Project {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
  story: Story;
  pipeline: PipelineStage[];
  storyboard: ShotCard[];
  characters: Character[];
  characterRelations: CharacterRelation[];
  moodBoard: MoodBoardItem[];
  notes: StickyNote[];
  tags: string[];
  emotionCurve: EmotionPoint[];
  trash: TrashItem[];
  // 新增功能
  themes: ThemeMotif[];
  dialogues: DialogueLine[];
  storylines: Storyline[];
  colorScript: ColorScriptEntry[];
  scenes: Scene[];
  props: Prop[];
  musicPlan: MusicPlanEntry[];
  soundEffects: SoundEffect[];
  milestones: Milestone[];
  references: ReferenceItem[];
  devLog: DevLogEntry[];
}

export interface Story {
  logline: string;
  worldSetting: string;
  acts: Act[];
}

export interface Act {
  id: string;
  name: string;
  description: string;
  beats: Beat[];
}

export interface Beat {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Character {
  id: string;
  name: string;
  role: string; // 主角/反派/配角/导师等
  avatar?: string;
  description: string;
  personality: string;
  notes: string;
}

export interface CharacterRelation {
  id: string;
  fromId: string;
  toId: string;
  relationType: string;
  description: string;
}

// ============ 制作流程 ============

export type StageStatus = 'not-started' | 'in-progress' | 'completed';

export interface PipelineStage {
  id: string;
  name: string;
  phase: 'pre-production' | 'production' | 'post-production';
  status: StageStatus;
  order: number;
  notes: string;
  materials: Material[];
  linkedConversations: ConversationSnippet[];
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Material {
  id: string;
  type: 'image' | 'text' | 'link';
  content: string;
  title: string;
  tags: string[];
  createdAt: number;
  source?: string;
}

// ============ 分镜系统 ============

export type ShotSize = '远景' | '全景' | '中景' | '近景' | '特写' | '大特写';
export type CameraAngle = '平拍' | '俯拍' | '仰拍' | '斜拍' | '鸟瞰';
export type CameraMove = '固定' | '推进' | '拉远' | '摇移' | '跟拍' | '环绕';

export interface ShotCard {
  id: string;
  shotNumber: number;
  image?: string;
  shotSize: ShotSize;
  cameraAngle: CameraAngle;
  cameraMove: CameraMove;
  duration: number; // 秒
  actionDescription: string;
  dialogue: string;
  soundNotes: string;
  linkedBeatId?: string;
  order: number;
}

// ============ 对话抓取 ============

export type ImportMode = 'full' | 'selective' | 'highlight';

export interface ConversationSnippet {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source: string; // DeepSeek/Kimi/豆包等
  capturedAt: number;
  linkedStageId?: string;
}

// ============ 灵感看板 ============

export interface MoodBoardItem {
  id: string;
  type: 'image' | 'color' | 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============ 便签系统 ============

export interface StickyNote {
  id: string;
  content: string;
  color: string;
  createdAt: number;
  linkedStageId?: string;
}

// ============ 情绪曲线 ============

export interface EmotionPoint {
  beatId: string;
  intensity: number; // 0-100
}

// ============ 回收站 ============

export interface TrashItem {
  id: string;
  type: string;
  data: unknown;
  deletedAt: number;
}

// ============ 导出 ============

export type ExportFormat = 'markdown' | 'pdf' | 'json' | 'zip';

// ============ 镜头统计 ============

export interface ShotStats {
  totalShots: number;
  totalDuration: number;
  shotSizeDistribution: Record<ShotSize, number>;
  sceneShotCount: Record<string, number>;
}

// ============ 主题/母题 ============

export interface ThemeMotif {
  id: string;
  title: string;
  description: string;
  color: string;
}

// ============ 对白管理 ============

export interface DialogueLine {
  id: string;
  characterId: string;
  shotId?: string;
  beatId?: string;
  content: string;
  emotion: string;
  order: number;
}

// ============ 故事线 ============

export interface Storyline {
  id: string;
  name: string;
  color: string;
  description: string;
  beatIds: string[];
}

// ============ 色彩脚本 ============

export interface ColorScriptEntry {
  id: string;
  shotId?: string;
  beatId?: string;
  colors: string[];
  mood: string;
  notes: string;
  order: number;
}

// ============ 场景管理 ============

export interface Scene {
  id: string;
  name: string;
  description: string;
  referenceImages: string[];
  linkedShotIds: string[];
  notes: string;
}

// ============ 道具清单 ============

export type PropStatus = 'pending' | 'in-progress' | 'done';

export interface Prop {
  id: string;
  name: string;
  description: string;
  sceneId?: string;
  referenceImage?: string;
  status: PropStatus;
}

// ============ 配乐规划 ============

export interface MusicPlanEntry {
  id: string;
  timeRange: string;
  style: string;
  mood: string;
  notes: string;
  linkedBeatIds: string[];
  order: number;
}

// ============ 音效清单 ============

export interface SoundEffect {
  id: string;
  name: string;
  description: string;
  sceneId?: string;
  shotId?: string;
  status: PropStatus;
}

// ============ 里程碑 ============

export interface Milestone {
  id: string;
  stageId?: string;
  title: string;
  dueDate: string;
  completed: boolean;
  notes: string;
}

// ============ 参考片库 ============

export interface ReferenceItem {
  id: string;
  title: string;
  url?: string;
  image?: string;
  aspect: string; // 参考什么：构图、节奏、色彩、角色设计等
  notes: string;
  tags: string[];
}

// ============ 制作日志 ============

export interface DevLogEntry {
  id: string;
  date: string;
  content: string;
  problems: string;
  tomorrow: string;
}
