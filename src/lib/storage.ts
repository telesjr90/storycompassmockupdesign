export type Idea = {
  id: string;
  title: string;
  label: 'Unsorted' | 'Needs a decision';
  createdAt: number;
};

export type ProjectData = {
  ideas: Idea[];
  writingText: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  lastOpenedAt: number;
  data: ProjectData;
};

const STORAGE_KEY = 'story-compass-workspace-v1';

const seedIdeas: Idea[] = [
  { id: 'idea-1', title: 'The detective only has analog equipment', label: 'Unsorted', createdAt: Date.now() - 26 * 3600 * 1000 },
  { id: 'idea-2', title: 'Someone is still looking for the secretary', label: 'Needs a decision', createdAt: Date.now() - 3 * 24 * 3600 * 1000 },
  { id: 'idea-3', title: 'The accident changes what he knows', label: 'Unsorted', createdAt: Date.now() - 5 * 24 * 3600 * 1000 },
];

export function makeProject(name: string): Project {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: Date.now(),
    lastOpenedAt: Date.now(),
    data: { ideas: [], writingText: '' },
  };
}

export function seedWorkspace(): Project[] {
  return [
    {
      id: 'project-detective',
      name: 'Detective Story',
      createdAt: Date.now() - 12 * 24 * 3600 * 1000,
      lastOpenedAt: Date.now() - 26 * 3600 * 1000,
      data: {
        ideas: seedIdeas,
        writingText: '',
      },
    },
  ];
}

export type Workspace = {
  projects: Project[];
  activeProjectId: string;
};

export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { projects: seedWorkspace(), activeProjectId: 'project-detective' };
    const parsed = JSON.parse(raw) as Workspace;
    if (!parsed.projects?.length) return { projects: seedWorkspace(), activeProjectId: 'project-detective' };
    const activeExists = parsed.projects.some((project) => project.id === parsed.activeProjectId);
    return { ...parsed, activeProjectId: activeExists ? parsed.activeProjectId : parsed.projects[0].id };
  } catch {
    return { projects: seedWorkspace(), activeProjectId: 'project-detective' };
  }
}

export function saveWorkspace(workspace: Workspace): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // storage unavailable (private mode/quota) — prototype keeps working in memory
  }
}
