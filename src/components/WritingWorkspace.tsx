import { useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  Focus,
  GripVertical,
  Info,
  Lightbulb,
  ListChecks,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Search,
  StickyNote,
  Target,
  UserRound,
  X,
} from 'lucide-react';

export type AssistantCharacter = {
  role: string;
  source: string;
  questions: string[];
};

export type AssistantEvent = {
  label: string;
  text: string;
  status: 'saved' | 'confirmed';
};

type WritingWorkspaceProps = {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  characters: AssistantCharacter[];
  events: AssistantEvent[];
  projectName: string;
  dirty: boolean;
  justSaved: boolean;
  onSave: () => void;
  onToast: (message: string) => void;
};

type AssistantSection = 'focus' | 'known' | 'questions' | 'consistency' | 'search' | 'note';

export function WritingWorkspace({ text, setText, characters, events, projectName, dirty, justSaved, onSave, onToast }: WritingWorkspaceProps) {
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantWidth, setAssistantWidth] = useState(360);
  const [focusMode, setFocusMode] = useState(false);
  const [assistantSection, setAssistantSection] = useState<AssistantSection>('focus');
  const [selectedRole, setSelectedRole] = useState(characters[0]?.role ?? 'Detective');
  const [searchQuery, setSearchQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [consistencyChecked, setConsistencyChecked] = useState(false);
  const [focusPrompt, setFocusPrompt] = useState('');

  const selectedCharacter = characters.find((character) => character.role === selectedRole) ?? characters[0];
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return [
      ...characters.filter((character) => `${character.role} ${character.source}`.toLowerCase().includes(query)).map((character) => ({ type: 'Character', label: character.role, detail: 'Saved in Story Bible' })),
      ...events.filter((event) => `${event.label} ${event.text}`.toLowerCase().includes(query)).map((event) => ({ type: 'Event', label: event.label, detail: event.text })),
    ];
  }, [characters, events, searchQuery]);

  const focusEditor = (message: string) => {
    setFocusPrompt(message);
    setFocusMode(false);
    onToast('Focus returned to your manuscript.');
  };

  const rememberNote = () => {
    if (!noteDraft.trim()) return;
    setSavedNote(noteDraft.trim());
    setNoteDraft('');
    onToast('Writer note saved to this prototype workspace.');
  };

  return <div className={`writing-workspace ${focusMode ? 'writing-focus-mode' : ''}`}>
    {!focusMode && <aside className="manuscript-sidebar" aria-label="Manuscript navigation">
      <div className="workspace-column-title"><BookOpen size={16} /> Manuscript</div>
      <div className="manuscript-project"><span className="status-dot" /> {projectName} <ChevronDown size={14} /></div>
      <div className="manuscript-tree">
        <button className="tree-item tree-item-active"><FileText size={15} /><span>Chapter 1</span><span className="tree-count">open</span></button>
        <button className="tree-item"><FileText size={15} /><span>Chapter 2</span><span className="tree-count">not started</span></button>
      </div>
      <div className="column-divider" />
      <div className="workspace-column-title small"><ListChecks size={15} /> Writing tasks</div>
      <button className="writing-task active"><span className="task-marker" /> Continue Chapter 1<span className="task-arrow"><ArrowRight size={13} /></span></button>
      <button className="writing-task"><span className="task-marker empty" /> Revisit the opening focus</button>
      <div className="column-divider" />
      <div className="workspace-column-title small"><CircleHelp size={15} /> Story questions</div>
      <button className="question-shortcut" onClick={() => { setAssistantOpen(true); setAssistantSection('questions'); }}><span>6 unanswered</span><ArrowRight size={14} /></button>
      <div className="sidebar-handoff"><StickyNote size={15} /><span>Last saved focus<br /><strong>Detective’s home</strong></span></div>
    </aside>}

    <section className="writing-center" aria-label="Manuscript editor">
      <div className="writing-center-header">
        <div><div className="eyebrow">Chapter 1 · Draft</div><h2>Continue your story</h2></div>
        <div className="writing-center-actions"><span className={`save-state ${dirty ? 'save-state-unsaved' : ''} ${justSaved && !dirty ? 'save-state-saved' : ''}`}><span className="save-dot" /> {dirty ? 'Unsaved changes' : justSaved ? 'Saved just now' : 'All changes saved'}</span><button className="button button-quiet compact-button" onClick={() => setFocusMode((current) => !current)}>{focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {focusMode ? 'Exit focus' : 'Focus mode'}</button><button className="button button-primary compact-button" onClick={onSave}><Check size={15} /> Save</button></div>
      </div>
      {focusPrompt && <div className="focus-prompt"><Target size={15} /><span><strong>Current focus:</strong> {focusPrompt}</span><button className="icon-button" onClick={() => setFocusPrompt('')} aria-label="Dismiss focus prompt"><X size={15} /></button></div>}
      <div className="chapter-context"><FileText size={15} /><span>Last session: exploring the detective’s home and the things he takes from his neighbors.</span></div>
      <div className="writing-paper workspace-paper"><div className="paper-title">Chapter 1</div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Begin wherever it feels easiest. You do not need to solve the whole story today." aria-label="Chapter 1 writing area" /><div className="paper-footer"><span>Your manuscript is writer-owned</span><span>{text.length} characters</span></div></div>
      <div className="editor-footer-note"><Info size={15} /> The Writing Assistant can point to saved information, but it will not write, rewrite, or change this page.</div>
    </section>

    {assistantOpen ? <aside className="writing-assistant" style={{ width: `${assistantWidth}px` }} aria-label="Writing Assistant">
      <div className="assistant-header"><div><div className="assistant-title"><SparkCompass /> Writing Assistant</div><span>Reference your story without leaving the page.</span></div><button className="icon-button" onClick={() => setAssistantOpen(false)} aria-label="Collapse Writing Assistant"><PanelRightClose size={17} /></button></div>
      <div className="assistant-control"><span>Panel width</span><input type="range" min="310" max="475" value={assistantWidth} onChange={(event) => setAssistantWidth(Number(event.target.value))} aria-label="Writing Assistant panel width" /></div>
      <div className="assistant-safety"><Info size={14} /><span>Reference only. No generated prose or silent story changes.</span></div>
      <div className="assistant-cards">
        <AssistantCard icon={<StickyNote size={16} />} title="Where I left off" section="focus" active={assistantSection === 'focus'} onOpen={() => setAssistantSection('focus')}>
          <p className="assistant-lead">You were exploring the detective’s home and the things he takes from his neighbors.</p><button className="assistant-action" onClick={() => focusEditor('Continue the opening chapter from your recorded place.')}>Return focus to manuscript <ArrowRight size={14} /></button>
        </AssistantCard>
        <AssistantCard icon={<UserRound size={16} />} title="What do we know?" section="known" active={assistantSection === 'known'} onOpen={() => setAssistantSection('known')}>
          <label className="assistant-select-label">Look up a role<select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>{characters.map((character) => <option key={character.role}>{character.role}</option>)}</select></label>{selectedCharacter && <div className="assistant-reference"><div className="reference-status established"><CheckCircle2 size={13} /> Established from your notes</div><p>{selectedCharacter.source}</p><span>Exact saved wording · Story Bible</span></div>}
        </AssistantCard>
        <AssistantCard icon={<CircleHelp size={16} />} title="Unanswered questions" section="questions" active={assistantSection === 'questions'} onOpen={() => setAssistantSection('questions')} badge="6">
          <div className="assistant-question-list">{(selectedCharacter?.questions ?? []).map((question) => <div key={question}><CircleHelp size={13} /><span>{question}</span></div>)}<div><CircleHelp size={13} /><span>Why did she run away?</span></div></div><span className="assistant-caption">Questions stay open until you decide.</span>
        </AssistantCard>
        <AssistantCard icon={<CheckCircle2 size={16} />} title="Check consistency" section="consistency" active={assistantSection === 'consistency'} onOpen={() => setAssistantSection('consistency')}>
          <p className="assistant-caption">Review saved story information against this chapter. Nothing will be changed automatically.</p><button className="assistant-action" onClick={() => setConsistencyChecked(true)}>{consistencyChecked ? <><Check size={14} /> Review complete</> : <>Review this chapter <ArrowRight size={14} /></>}</button>{consistencyChecked && <div className="assistant-result neutral"><CheckCircle2 size={14} /><span>No saved conflicts to review in this prototype.</span></div>}
        </AssistantCard>
        <AssistantCard icon={<Target size={16} />} title="Help me focus" section="focus" active={false} onOpen={() => setAssistantSection('focus')}>
          <div className="focus-choices"><button onClick={() => focusEditor('Write one paragraph about the detective’s home.')}>One small paragraph <ArrowRight size={13} /></button><button onClick={() => focusEditor('Stay with Chapter 1 and leave the timeline for later.')}>Stay with this chapter <ArrowRight size={13} /></button></div>
        </AssistantCard>
        <AssistantCard icon={<Search size={16} />} title="Find a character, event or passage" section="search" active={assistantSection === 'search'} onOpen={() => setAssistantSection('search')}>
          <div className="assistant-search"><Search size={14} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search saved information" aria-label="Search saved information" /></div>{searchQuery && <div className="search-results">{searchResults.length ? searchResults.map((result) => <button key={`${result.type}-${result.label}`} onClick={() => focusEditor(`Review ${result.label} in your saved story information.`)}><span>{result.type}</span><strong>{result.label}</strong><small>{result.detail}</small></button>) : <span className="assistant-caption">No saved match. Nothing was invented.</span>}</div>}
        </AssistantCard>
        <AssistantCard icon={<Lightbulb size={16} />} title="Remember a note or decision" section="note" active={assistantSection === 'note'} onOpen={() => setAssistantSection('note')}>
          <textarea className="assistant-note-input" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Write a reminder in your own words" rows={3} aria-label="Writer-authored assistant note" /><button className="assistant-action" onClick={rememberNote} disabled={!noteDraft.trim()}>Save writer note <Check size={14} /></button>{savedNote && <div className="saved-writer-note"><StickyNote size={13} /><span>{savedNote}</span></div>}
        </AssistantCard>
      </div>
    </aside> : <button className="assistant-reopen" onClick={() => setAssistantOpen(true)}><PanelRightOpen size={16} /> Open Assistant</button>}
  </div>;
}

function AssistantCard({ icon, title, section, active, badge, onOpen, children }: { icon: ReactNode; title: string; section: AssistantSection; active: boolean; badge?: string; onOpen: () => void; children: ReactNode }) {
  return <section className={`assistant-card ${active ? 'assistant-card-active' : ''}`}><button className="assistant-card-heading" onClick={onOpen} aria-expanded={active}><span className="assistant-card-icon">{icon}</span><strong>{title}</strong>{badge && <span className="assistant-badge">{badge}</span>}<ChevronDown className={active ? 'rotated' : ''} size={15} /></button>{active && <div className="assistant-card-content">{children}</div>}</section>;
}

function SparkCompass() {
  return <span className="spark-compass"><Focus size={15} /></span>;
}
