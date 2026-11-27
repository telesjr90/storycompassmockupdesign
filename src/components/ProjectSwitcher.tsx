import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/lib/storage';import { makeProject } from '@/lib/storage';
import { Check, ChevronDown, FileText, Plus } from 'lucide-react';

type ProjectSwitcherProps = {
  projects: Project[];
  activeProjectId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
};

export function ProjectSwitcher({ projects, activeProjectId, onSelect, onCreate }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
    setCreating(false);
    setOpen(false);
  };

  const active = projects.find((project) => project.id === activeProjectId);

  return (
    <div className="project-switcher" ref={rootRef}>
      <button className="project-select" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="listbox" aria-label="Switch project">
        <span className="project-select-name">{active?.name ?? 'Choose project'}</span>
        <ChevronDown size={15} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="project-menu" role="listbox" aria-label="Projects">
          {projects.map((project) => (
            <button
              key={project.id}
              role="option"
              aria-selected={project.id === activeProjectId}
              className={`project-menu-item ${project.id === activeProjectId ? 'active' : ''}`}
              onClick={() => { onSelect(project.id); setOpen(false); }}
            >
              <FileText size={14} />
              <span className="project-menu-name">{project.name}</span>
              {project.id === activeProjectId && <Check size={14} />}
            </button>
          ))}
          {creating ? (
            <div className="project-create-form">
              <input
                autoFocus
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') create(); if (event.key === 'Escape') { setCreating(false); setNewName(''); } }}
                placeholder="New project name"
                aria-label="New project name"
              />
              <button className="project-create-save" onClick={create} disabled={!newName.trim()} aria-label="Create project">Create</button>
            </div>
          ) : (
            <button className="project-menu-new" onClick={() => setCreating(true)}><Plus size={14} /> New project</button>
          )}
        </div>
      )}
    </div>
  );
}

export { makeProject };
