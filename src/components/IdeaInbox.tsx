import { useMemo, useState } from 'react';
import type { Idea } from '@/lib/storage';
import { Check, CheckCircle2, Lightbulb, Pencil, Plus, Search, StickyNote, X } from 'lucide-react';

type IdeaInboxProps = {
  ideas: Idea[];
  onToast: (message: string) => void;
  onUpdate: (ideas: Idea[]) => void;
  goTo: (view: 'tasks') => void;
};

function formatCaptured(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const hours = Math.floor(diff / (3600 * 1000));
  if (hours < 1) return 'Captured just now';
  if (hours < 24) return `Captured ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Captured yesterday';
  return `Captured ${days} days ago`;
}

export function IdeaInbox({ ideas, onToast, onUpdate, goTo }: IdeaInboxProps) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [query, setQuery] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...ideas].sort((a, b) => b.createdAt - a.createdAt);
    if (!q) return sorted;
    return sorted.filter((idea) => idea.title.toLowerCase().includes(q));
  }, [ideas, query]);

  const flashSaved = (id: string) => {
    setSavedIds((current) => [...current, id]);
    window.setTimeout(() => setSavedIds((current) => current.filter((savedId) => savedId !== id)), 1800);
  };

  const capture = () => {
    const title = draft.trim();
    if (!title) return;
    const idea: Idea = { id: `idea-${Date.now()}`, title, label: 'Unsorted', createdAt: Date.now() };
    onUpdate([idea, ...ideas]);
    setDraft('');
    flashSaved(idea.id);
    onToast('Idea captured. It is saved in this project.');
  };

  const startEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setEditDraft(idea.title);
  };

  const saveEdit = () => {
    const title = editDraft.trim();
    if (!title || !editingId) return;
    onUpdate(ideas.map((idea) => (idea.id === editingId ? { ...idea, title } : idea)));
    flashSaved(editingId);
    setEditingId(null);
    onToast('Idea updated.');
  };

  const remove = (id: string) => {
    onUpdate(ideas.filter((idea) => idea.id !== id));
    onToast('Idea removed from this inbox.');
  };

  const toggleLabel = (id: string) => {
    onUpdate(ideas.map((idea) => {
      if (idea.id !== id) return idea;
      const next: Idea['label'] = idea.label === 'Unsorted' ? 'Needs a decision' : 'Unsorted';
      return { ...idea, label: next };
    }));
    flashSaved(id);
  };

  return (
    <div className="view">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Idea inbox</div>
          <h1>Keep the sparks safe.</h1>
          <p>Capture first. Decide where an idea belongs when you have more room to think. Everything here is saved for this project.</p>
        </div>
      </div>
      <div className="inbox-layout">
        <section className="idea-list">
          <div className="idea-capture">
            <label className="idea-capture-label" htmlFor="idea-capture-input">Capture a new idea</label>
            <div className="idea-capture-row">
              <input
                id="idea-capture-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') capture(); }}
                placeholder="Write the thought in your own words"
              />
              <button className="button button-primary" onClick={capture} disabled={!draft.trim()}>
                {draft.trim() ? <Check size={16} /> : <Plus size={16} />} Capture idea
              </button>
            </div>
            <span className="idea-capture-hint">{draft.trim() ? 'Press Capture to save it to this project.' : 'Nothing is saved until you press Capture.'}</span>
          </div>
          <div className="list-toolbar">
            <strong>{filtered.length} {filtered.length === 1 ? 'idea' : 'ideas'}</strong>
            <div className="idea-search">
              <Search size={14} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ideas" aria-label="Search ideas" />
              {query && <button className="icon-button idea-search-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={13} /></button>}
            </div>
          </div>
          {filtered.length === 0 && (
            <div className="idea-empty">
              {query
                ? <><Search size={18} /><span>No idea matches “{query}”. Nothing was invented — try another word.</span></>
                : <><Lightbulb size={18} /><span>No ideas yet. Capture the first thought above whenever you are ready.</span></>}
            </div>
          )}
          {filtered.map((idea) => {
            const justSaved = savedIds.includes(idea.id);
            return (
              <div className={`idea-row idea-row-static ${justSaved ? 'idea-saved' : ''}`} key={idea.id}>
                <div className="idea-bullet"><Lightbulb size={17} /></div>
                {editingId === idea.id ? (
                  <div className="idea-edit">
                    <input
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(); if (event.key === 'Escape') setEditingId(null); }}
                      aria-label="Edit idea text"
                    />
                    <button className="button button-secondary compact-button" onClick={saveEdit} disabled={!editDraft.trim()}><Check size={14} /> Save</button>
                    <button className="button button-quiet compact-button" onClick={() => setEditingId(null)}><X size={14} /> Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="idea-copy"><strong>{idea.title}</strong><span>{formatCaptured(idea.createdAt)}</span></div>
                    <button className="soft-tag idea-label-toggle" onClick={() => toggleLabel(idea.id)} aria-label={`Change status, currently ${idea.label}`}>{idea.label}</button>
                    <button className="icon-button" onClick={() => startEdit(idea)} aria-label={`Edit idea: ${idea.title}`}><Pencil size={14} /></button>
                    <button className="icon-button" onClick={() => remove(idea.id)} aria-label={`Remove idea: ${idea.title}`}><X size={14} /></button>
                  </>
                )}
              </div>
            );
          })}
        </section>
        <aside className="side-note">
          <div className="note-icon"><Lightbulb size={18} /></div>
          <h3>Ideas stay in your words</h3>
          <p>This inbox does not rewrite, summarize, or decide what becomes true. You choose what to develop next.</p>
          <div className="side-note-fact"><CheckCircle2 size={15} /><span>Ideas are saved per project and stay after a reload.</span></div>
          <button className="text-link" onClick={() => goTo('tasks')}>See unfinished work</button>
        </aside>
      </div>
    </div>
  );
}

export const InboxHint = StickyNote;
