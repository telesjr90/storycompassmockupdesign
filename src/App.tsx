import { useMemo, useState } from 'react';
import { TimelineExplorer } from '@/components/TimelineExplorer';
import { WritingWorkspace } from '@/components/WritingWorkspace';
import type { TimelineEventRecord, TimelineGroup } from '@/components/TimelineExplorer';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Home as HomeIcon,
  Inbox,
  Lightbulb,
  ListChecks,
  Menu,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Target,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

type View = 'home' | 'inbox' | 'bible' | 'timeline' | 'writing' | 'tasks';
type EventStatus = 'saved' | 'confirmed';
type Modal = 'add-event' | 'confirm-event' | 'order' | 'confirm-order' | 'edit-character' | null;

type StoryEvent = TimelineEventRecord;

type Character = {
  role: string;
  source: string;
  questions: string[];
  notes: string;
  accent: string;
};

const sourceText = 'she disappeared when she was 16';
const sourceTextB = 'he only saw her again five years later at the accident that killed the rest of his family.';

const makeGroups = (overrides: Partial<Record<TimelineGroup, string[]>> = {}): Record<TimelineGroup, string[]> => ({
  character: ['Not established'],
  location: ['Not established'],
  arc: ['Not grouped'],
  plot: ['Not grouped'],
  subplot: ['Not grouped'],
  ...overrides,
});

const initialEvents: StoryEvent[] = [
  {
    id: 'event-a',
    label: 'Event A',
    text: sourceText,
    notes: 'A moment the writer wants to place in the story timeline.',
    status: 'saved',
    bookOrder: null,
    chronologyOrder: null,
    chapters: ['Chapter 1'],
    groups: makeGroups({ arc: ['Main plot'], plot: ['Main plot'] }),
  },
  {
    id: 'event-b',
    label: 'Event B',
    text: sourceTextB,
    notes: 'The later moment is still undated.',
    status: 'confirmed',
    bookOrder: 1,
    chronologyOrder: 1,
    chapters: ['Chapter 1', 'Chapter 2'],
    groups: makeGroups({ arc: ['Main plot'], plot: ['Main plot'] }),
  },
  {
    id: 'event-c',
    label: 'Event C',
    text: 'Nowadays he mostly works in small cases to pay the bills and tries to rebuild his life.',
    status: 'confirmed',
    bookOrder: 2,
    chronologyOrder: null,
    chapters: ['Chapter 1'],
    groups: makeGroups({ character: ['Detective'], arc: ['Main plot'], plot: ['Character-specific plot'] }),
  },
  {
    id: 'event-d',
    label: 'Event D',
    text: 'Their secretary is a person who is in hiding after being caught doing corporate espionage by him.',
    status: 'confirmed',
    bookOrder: null,
    chronologyOrder: null,
    chapters: ['Chapter 1', 'Chapter 2'],
    groups: makeGroups({ character: ['Secretary'], subplot: ['Subplot'] }),
  },
];

const characters: Character[] = [
  {
    role: 'Detective',
    source: 'A paranoid, grumpy, cybersecurity detective and his team work as private investigators. The detective only has analog equipment in his home and steals cable, power, water, everything from his neighbors.',
    questions: ['What is the detective’s name?', 'Why did his kid disappear?'],
    notes: 'Keep the home setup grounded in analog details. Revisit the missing kid thread when the timeline is clearer.',
    accent: 'olive',
  },
  {
    role: 'Secretary',
    source: 'Their secretary is a person who is in hiding after being caught doing corporate espionage by him.',
    questions: ['What is the secretary’s name?', 'What does “by him” refer to?'],
    notes: 'The reason they are in hiding may shape how they work with the team.',
    accent: 'clay',
  },
  {
    role: 'IT worker',
    source: 'The IT is a girl who used to run digital scams for her family’s business.',
    questions: ['What is the IT worker’s name?', 'What is her role on the team now?'],
    notes: 'Keep this profile separate from assumptions about why she joined the team.',
    accent: 'blue',
  },
  {
    role: 'Muscle',
    source: 'The muscle is a heavily traumatized, ptsd, drug user, survavilist, israeli woman who shot up her platoon and blew up a base during a mission where she caught them raping kids, and was shot by her commander and left for dead. Palestines saved her.',
    questions: ['What is the muscle’s name?', 'When did she meet the detective?'],
    notes: 'The source uses “she” and several unresolved details. Do not fill in the gaps until the writer decides.',
    accent: 'sand',
  },
];

const navItems: { id: View; label: string; icon: typeof HomeIcon; count?: string }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'inbox', label: 'Idea Inbox', icon: Inbox, count: '3' },
  { id: 'bible', label: 'Story Bible', icon: BookOpen },
  { id: 'timeline', label: 'Plot & Timeline', icon: Clock3, count: '1' },
  { id: 'writing', label: 'Writing', icon: NotebookPen },
  { id: 'tasks', label: 'Tasks', icon: ListChecks, count: '4' },
];

function App() {
  const [view, setView] = useState<View>('home');
  const [events, setEvents] = useState<StoryEvent[]>(initialEvents);
  const [selectedCharacter, setSelectedCharacter] = useState(0);
  const [characterData, setCharacterData] = useState(characters);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedEventId, setSelectedEventId] = useState('event-a');
  const [orderFirstId, setOrderFirstId] = useState('event-a');
  const [orderSecondId, setOrderSecondId] = useState('event-b');
  const [orderDirection, setOrderDirection] = useState<'before' | 'after'>('before');
  const [confirmedOrder, setConfirmedOrder] = useState(false);
  const [confirmingForOrder, setConfirmingForOrder] = useState(false);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newEvent, setNewEvent] = useState({ text: '', date: '', notes: '' });
  const [writingText, setWritingText] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>(['bible']);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];
  const orderFirst = events.find((event) => event.id === orderFirstId) ?? events[0];
  const orderSecond = events.find((event) => event.id === orderSecondId) ?? events[1];
  const orderNeedsConfirmation = Boolean(orderFirst && orderSecond && (orderFirst.status !== 'confirmed' || orderSecond.status !== 'confirmed'));
  const activeCharacter = characterData[selectedCharacter];

  const goTo = (nextView: View) => {
    setView(nextView);
    setSidebarOpen(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const saveEvent = () => {
    if (!newEvent.text.trim()) return;
    const created: StoryEvent = {
      id: `event-${Date.now()}`,
      label: `Event ${String.fromCharCode(65 + events.length)}`,
      text: newEvent.text.trim(),
      date: newEvent.date.trim() || undefined,
      notes: newEvent.notes.trim() || undefined,
      status: 'saved',
      bookOrder: null,
      chronologyOrder: null,
      chapters: ['Chapter 1'],
      groups: makeGroups(),
    };
    setEvents((current) => [...current, created]);
    setNewEvent({ text: '', date: '', notes: '' });
    setModal(null);
    showToast('Event saved. It is ready for your confirmation.');
  };

  const confirmEvent = () => {
    setEvents((current) => current.map((event) => event.id === selectedEventId ? { ...event, status: 'confirmed' } : event));
    setModal(confirmingForOrder ? 'order' : null);
    setConfirmingForOrder(false);
    showToast('Event confirmed and added to your story information.');
  };

  const confirmOrder = () => {
    setConfirmedOrder(true);
    setModal(null);
    showToast('Order confirmed. Your timeline now remembers this decision.');
  };

  const toggleTask = (id: string) => {
    setCompletedTasks((current) => current.includes(id) ? current.filter((taskId) => taskId !== id) : [...current, id]);
  };

  const saveCharacter = (source: string, notes: string) => {
    setCharacterData((current) => current.map((character, index) => index === selectedCharacter ? { ...character, source, notes } : character));
    setModal(null);
    showToast('Character information saved.');
  };

  const pageTitle = useMemo(() => navItems.find((item) => item.id === view)?.label ?? 'Home', [view]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><CompassMark /></div>
          {!sidebarCollapsed && <div><div className="brand-name">story compass</div><div className="brand-tagline">A little direction. More story.</div></div>}
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        {!sidebarCollapsed && <div className="workspace-picker"><span>Your workspace</span><button className="project-select">Detective Story <ChevronDown size={15} /></button></div>}
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${view === item.id ? 'nav-item-active' : ''}`} onClick={() => goTo(item.id)} title={sidebarCollapsed ? item.label : undefined}><Icon size={18} /><span>{!sidebarCollapsed && item.label}</span>{!sidebarCollapsed && item.count && <span className="nav-count">{item.count}</span>}</button>;
          })}
        </nav>
        {!sidebarCollapsed && <div className="sidebar-footer"><div className="prototype-pill"><Sparkles size={14} /> Interactive prototype</div><div className="local-status"><span className="status-dot" /> Local workspace</div></div>}
        <button className="collapse-button" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> Collapse</>}</button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Detective Story</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div>
          <div className="topbar-actions"><span className="prototype-label"><span className="status-dot" /> Prototype mode</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><div className="avatar">DW</div></div>
        </header>
        <div className="page-content">
          {view === 'home' && <HomeView goTo={goTo} />}
          {view === 'inbox' && <InboxView goTo={goTo} />}
          {view === 'bible' && <BibleView characters={characterData} activeIndex={selectedCharacter} onSelect={setSelectedCharacter} onEdit={() => setModal('edit-character')} />}
          {view === 'timeline' && <TimelineView events={events} selectedEventId={selectedEventId} setSelectedEventId={setSelectedEventId} orderFirstId={orderFirstId} setOrderFirstId={setOrderFirstId} orderSecondId={orderSecondId} setOrderSecondId={setOrderSecondId} orderDirection={orderDirection} setOrderDirection={setOrderDirection} confirmedOrder={confirmedOrder} orderNeedsConfirmation={orderNeedsConfirmation} onAdd={() => setModal('add-event')} onConfirmEvent={() => { setConfirmingForOrder(false); setModal('confirm-event'); }} onReviewOrder={() => { if (orderNeedsConfirmation) { const pendingEvent = orderFirst.status !== 'confirmed' ? orderFirst : orderSecond; setSelectedEventId(pendingEvent.id); setConfirmingForOrder(true); setModal('confirm-event'); } else { setConfirmingForOrder(false); setModal('order'); } }} onTimelineUpdate={setEvents} onToast={showToast} />}
          {view === 'writing' && <WritingWorkspace text={writingText} setText={setWritingText} characters={characterData} events={events} onSave={() => showToast('Your writing is saved right here.')} onToast={showToast} />}
          {view === 'tasks' && <TasksView completedTasks={completedTasks} toggleTask={toggleTask} goTo={goTo} />}
        </div>
      </main>

      {modal === 'add-event' && <AddEventModal value={newEvent} setValue={setNewEvent} onClose={() => setModal(null)} onSave={saveEvent} />}
      {modal === 'confirm-event' && selectedEvent && <ConfirmEventModal event={selectedEvent} onClose={() => { setConfirmingForOrder(false); setModal(null); }} onConfirm={confirmEvent} orderPending={confirmingForOrder} />}
      {modal === 'order' && orderFirst && orderSecond && <OrderModal first={orderFirst} second={orderSecond} direction={orderDirection} onClose={() => setModal(null)} onConfirm={confirmOrder} />}
      {modal === 'edit-character' && <EditCharacterModal character={activeCharacter} onClose={() => setModal(null)} onSave={saveCharacter} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} /> {toast}</div>}
    </div>
  );
}

function CompassMark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M21.5 10.5 18 18l-7.5 3.5L14 14l7.5-3.5Z" fill="currentColor" /></svg>;
}

function HomeView({ goTo }: { goTo: (view: View) => void }) {
  return <div className="view home-view">
    <PageIntro eyebrow="Your writing space" title="Welcome back, Dana." description={<>Let’s find one clear way back into <strong>Detective Story</strong>.</>} />
    <div className="home-grid">
      <section className="resume-card">
        <div className="card-kicker"><span className="kicker-dot" /> Your recorded place</div>
        <div className="resume-number">1</div>
        <h2>Continue the chapter you opened last time.</h2>
        <p>Writing is available now. Planning and focus sessions are optional.</p>
        <button className="button button-primary" onClick={() => goTo('writing')}><NotebookPen size={17} /> Continue writing <ArrowRight size={16} /></button>
        <div className="resume-meta"><span>Last writing session</span><strong>Yesterday, 4:18 PM</strong></div>
        <button className="text-link" onClick={() => goTo('writing')}>Open chapter 1 <ArrowRight size={14} /></button>
      </section>
      <aside className="held-card"><div className="section-label"><StickyNote size={16} /> Held for you</div><div className="held-item"><span>Current writing focus</span><strong>Continue the opening chapter in your own words.</strong></div><div className="held-item"><span>Recent saved information</span><strong>Two timeline moments are ready to place.</strong></div><div className="held-item"><span>Unanswered questions</span><strong>6 questions are waiting in your Story Bible.</strong></div></aside>
    </div>
    <section className="focus-section"><div className="section-heading"><div><div className="section-label"><Target size={16} /> One thing to focus on</div><h2>Make one small decision about the timeline.</h2><p>Event A is saved, but not yet confirmed. Confirming it keeps your original words and tells Story Compass you stand behind this detail.</p></div><button className="button button-secondary" onClick={() => goTo('timeline')}>Review timeline <ArrowRight size={16} /></button></div></section>
    <div className="quick-grid"><button className="quick-card" onClick={() => goTo('inbox')}><div className="quick-icon peach"><Lightbulb size={19} /></div><div><strong>Capture an idea</strong><span>Keep the thought before you decide where it belongs.</span></div><ArrowRight size={17} /></button><button className="quick-card" onClick={() => goTo('bible')}><div className="quick-icon olive"><UsersRound size={19} /></div><div><strong>Open the Story Bible</strong><span>See what is known and what is still open.</span></div><ArrowRight size={17} /></button></div>
  </div>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: React.ReactNode; action?: React.ReactNode }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function InboxView({ goTo }: { goTo: (view: View) => void }) {
  return <div className="view"><PageIntro eyebrow="Idea inbox" title="Keep the sparks safe." description="Capture first. Decide where an idea belongs when you have more room to think." action={<button className="button button-primary"><Plus size={17} /> Capture an idea</button>} /><div className="inbox-layout"><section className="idea-list"><div className="list-toolbar"><strong>3 captured ideas</strong><button className="filter-button"><Search size={15} /> Search</button></div><IdeaRow title="The detective only has analog equipment" meta="Captured yesterday" label="Unsorted" /><IdeaRow title="Someone is still looking for the secretary" meta="Captured Nov 24" label="Needs a decision" /><IdeaRow title="The accident changes what he knows" meta="Captured Nov 22" label="Unsorted" /></section><aside className="side-note"><div className="note-icon"><Lightbulb size={18} /></div><h3>Ideas stay in your words</h3><p>This inbox does not rewrite, summarize, or decide what becomes true. You choose what to develop next.</p><button className="text-link" onClick={() => goTo('tasks')}>See unfinished work <ArrowRight size={14} /></button></aside></div></div>;
}

function IdeaRow({ title, meta, label }: { title: string; meta: string; label: string }) {
  return <button className="idea-row"><div className="idea-bullet"><Lightbulb size={17} /></div><div className="idea-copy"><strong>{title}</strong><span>{meta}</span></div><span className="soft-tag">{label}</span><ChevronRight size={17} /> </button>;
}

function BibleView({ characters: characterList, activeIndex, onSelect, onEdit }: { characters: Character[]; activeIndex: number; onSelect: (index: number) => void; onEdit: () => void }) {
  const character = characterList[activeIndex];
  return <div className="view"><PageIntro eyebrow="Story Bible" title="A clear place for what you know." description="Writer-supplied information, open questions, and your private notes stay visibly separate." action={<button className="button button-secondary"><Plus size={17} /> Add a character</button>} /><div className="bible-layout"><aside className="character-list"><div className="list-heading"><strong>Characters</strong><span>4</span></div>{characterList.map((item, index) => <button key={item.role} className={`character-row ${index === activeIndex ? 'character-row-active' : ''}`} onClick={() => onSelect(index)}><span className={`character-avatar ${item.accent}`}>{item.role.slice(0, 1)}</span><span><strong>{item.role}</strong><small>{item.questions.length} open questions</small></span><ChevronRight size={16} /></button>)}<div className="list-footnote"><CircleHelp size={15} /> Names and optional details remain unestablished until you choose them.</div></aside><section className="character-profile"><div className="profile-header"><div><div className="profile-role"><span className={`character-avatar large ${character.accent}`}>{character.role.slice(0, 1)}</span><div><div className="eyebrow">Character profile</div><h2>{character.role}</h2><span className="not-established">Name · Not established</span></div></div></div><button className="button button-secondary" onClick={onEdit}>Edit information</button></div><div className="profile-sections"><ProfileSection icon={<CheckCircle2 size={18} />} title="What we know" hint="Writer-supplied or writer-confirmed information"><div className="source-block"><div className="source-label"><FileText size={14} /> From your story notes</div><p>{character.source}</p></div></ProfileSection><ProfileSection icon={<CircleHelp size={18} />} title="Open questions" hint="These stay open until you answer them"><div className="question-list">{character.questions.map((question) => <div className="question-item" key={question}><CircleHelp size={16} /><span>{question}</span><MoreHorizontal size={17} /></div>)}</div></ProfileSection><ProfileSection icon={<MessageCircle size={18} />} title="My notes" hint="Private planning and possibilities — not established story information"><div className="notes-block"><p>{character.notes}</p><button className="text-link" onClick={onEdit}>Edit my notes <ArrowRight size={14} /></button></div></ProfileSection></div><div className="profile-footer"><CheckCircle2 size={16} /> Saved and visible here whenever you return.</div></section></div></div>;
}

function ProfileSection({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return <section className="profile-section"><div className="profile-section-heading"><div className="section-label">{icon}<strong>{title}</strong></div><span>{hint}</span></div>{children}</section>;
}

function TimelineView({ events, selectedEventId, setSelectedEventId, orderFirstId, setOrderFirstId, orderSecondId, setOrderSecondId, orderDirection, setOrderDirection, confirmedOrder, orderNeedsConfirmation, onAdd, onConfirmEvent, onReviewOrder, onTimelineUpdate, onToast }: { events: StoryEvent[]; selectedEventId: string; setSelectedEventId: (id: string) => void; orderFirstId: string; setOrderFirstId: (id: string) => void; orderSecondId: string; setOrderSecondId: (id: string) => void; orderDirection: 'before' | 'after'; setOrderDirection: (direction: 'before' | 'after') => void; confirmedOrder: boolean; orderNeedsConfirmation: boolean; onAdd: () => void; onConfirmEvent: () => void; onReviewOrder: () => void; onTimelineUpdate: (events: StoryEvent[]) => void; onToast: (message: string) => void }) {
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];
  return <div className="view"><PageIntro eyebrow="Plot & Timeline" title="See the shape without forcing the dates." description="Save moments in your own words, then confirm only what you are ready to establish." action={<button className="button button-primary" onClick={onAdd}><Plus size={18} /> Add event</button>} /><TimelineExplorer events={events} onUpdate={onTimelineUpdate} onToast={onToast} /><div className="prototype-banner"><Sparkles size={17} /><span><strong>Prototype workspace</strong> Changes here are temporary and demonstrate the intended experience.</span></div><div className="timeline-layout"><section className="timeline-main"><div className="timeline-header"><div><h2>Your story moments</h2><p>Unknown dates are okay. Order is a separate decision.</p></div><span className="soft-tag"><span className="status-dot" /> {events.length} saved</span></div><div className="story-timeline">{events.map((event) => <TimelineEvent key={event.id} event={event} selected={selectedEventId === event.id} onSelect={() => setSelectedEventId(event.id)} onConfirm={onConfirmEvent} />)}{confirmedOrder && <div className="timeline-connection confirmed-connection"><div className="connection-line" /><div className="connection-card"><CheckCircle2 size={17} /><span><strong>Confirmed order</strong> Event A happens before Event B</span></div></div>}</div></section><aside className="timeline-side"><div className="side-panel selected-panel"><div className="panel-eyebrow">Selected moment</div><h3>{selectedEvent.label}</h3><p className="selected-quote">“{selectedEvent.text}”</p><div className={`status-row ${selectedEvent.status}`}><span className="status-icon">{selectedEvent.status === 'confirmed' ? <Check size={14} /> : <Clock3 size={14} />}</span><div><strong>{selectedEvent.status === 'confirmed' ? 'Confirmed story information' : 'Saved — not yet confirmed'}</strong><span>{selectedEvent.status === 'confirmed' ? 'You approved this detail.' : 'Your words are safe. Review when ready.'}</span></div></div>{selectedEvent.status === 'saved' && <button className="button button-primary full-width" onClick={onConfirmEvent}>Review and confirm event <ArrowRight size={16} /></button>}</div><div className="side-panel order-panel"><div className="panel-eyebrow">Make one timeline decision</div><h3>Establish an order</h3><p>Choose two moments. No calendar date is needed.</p><div className="order-selects"><label>First moment<select value={orderFirstId} onChange={(event) => setOrderFirstId(event.target.value)}>{events.map((item) => <option key={item.id} value={item.id}>{item.label}: {item.text.slice(0, 27)}…</option>)}</select></label><div className="direction-toggle" role="group" aria-label="Choose event order"><button className={orderDirection === 'before' ? 'selected' : ''} onClick={() => setOrderDirection('before')}>happened before</button><button className={orderDirection === 'after' ? 'selected' : ''} onClick={() => setOrderDirection('after')}>happened after</button></div><label>Second moment<select value={orderSecondId} onChange={(event) => setOrderSecondId(event.target.value)}>{events.map((item) => <option key={item.id} value={item.id}>{item.label}: {item.text.slice(0, 27)}…</option>)}</select></label></div>{orderNeedsConfirmation && <div className="inline-notice"><CircleHelp size={16} /><span>One of these events needs your confirmation before we can save their order.</span></div>}{confirmedOrder ? <div className="confirmed-order"><CheckCircle2 size={17} /><div><strong>Confirmed: Event A happens before Event B</strong><span>Dates remain unknown.</span></div></div> : <button className="button button-secondary full-width" onClick={onReviewOrder}>{orderNeedsConfirmation ? 'Confirm event and continue' : 'Review proposed order'} <ArrowRight size={16} /></button>}</div></aside></div></div>;
}

function TimelineEvent({ event, selected, onSelect, onConfirm }: { event: StoryEvent; selected: boolean; onSelect: () => void; onConfirm: () => void }) {
  return <div className={`timeline-event ${selected ? 'timeline-event-selected' : ''}`}><div className={`event-node ${event.status}`}><span>{event.status === 'confirmed' ? <Check size={14} /> : ''}</span></div><button className="event-card" onClick={onSelect}><div className="event-card-top"><span className="event-label">{event.label}</span><span className={`event-status ${event.status}`}>{event.status === 'confirmed' ? <><CheckCircle2 size={14} /> Confirmed</> : <><Clock3 size={14} /> Saved</>}</span></div><p>{event.text}</p><div className="event-bottom"><span>{event.date ? event.date : 'Date unknown'}</span>{event.status === 'saved' && <span className="event-action" onClick={(clickEvent) => { clickEvent.stopPropagation(); onConfirm(); }}>Review and confirm <ArrowRight size={13} /></span>}</div></button></div>;
}

function WritingView({ text, setText, onSave }: { text: string; setText: (text: string) => void; onSave: () => void }) {
  return <div className="view writing-view"><PageIntro eyebrow="Writing" title="Chapter 1" description="A quiet place to continue. Your words stay yours." action={<button className="button button-primary" onClick={onSave}><Check size={17} /> Save writing</button>} /><div className="writing-toolbar"><span><FileText size={16} /> Draft · Chapter 1</span><span>Last saved yesterday, 4:18 PM</span></div><div className="writing-paper"><div className="paper-title">Chapter 1</div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Begin wherever it feels easiest. You do not need to solve the whole story today." aria-label="Chapter 1 writing area" /><div className="paper-footer"><span>Write in your own words</span><span>{text.length} characters</span></div></div><div className="writing-reminder"><StickyNote size={17} /><span><strong>When you return:</strong> You were exploring the detective’s home and the things he takes from his neighbors.</span></div></div>;
}

function TasksView({ completedTasks, toggleTask, goTo }: { completedTasks: string[]; toggleTask: (id: string) => void; goTo: (view: View) => void }) {
  const tasks = [{ id: 'timeline', title: 'Confirm the saved timeline event', detail: 'Event A is waiting for your decision.', action: 'Open timeline', view: 'timeline' as View }, { id: 'bible', title: 'Review the open character questions', detail: 'Six questions are intentionally unanswered.', action: 'Open Story Bible', view: 'bible' as View }, { id: 'writing', title: 'Continue Chapter 1', detail: 'Pick up from your recorded writing focus.', action: 'Continue writing', view: 'writing' as View }, { id: 'inbox', title: 'Sort one captured idea', detail: 'Your inbox has three ideas waiting.', action: 'Open idea inbox', view: 'inbox' as View }];
  return <div className="view"><PageIntro eyebrow="Unfinished work" title="A short list, not a pressure list." description="These are the next useful places to look. Complete only what helps you return to your story." /><div className="task-layout"><section className="task-list"><div className="task-list-header"><span className="section-label"><ListChecks size={17} /> Next steps</span><span>{completedTasks.length} of {tasks.length} complete</span></div>{tasks.map((task) => { const done = completedTasks.includes(task.id); return <div className={`task-row ${done ? 'task-done' : ''}`} key={task.id}><button className={`check-button ${done ? 'checked' : ''}`} onClick={() => toggleTask(task.id)} aria-label={done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}>{done && <Check size={15} />}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.detail}</span></div>{!done && <button className="text-link" onClick={() => goTo(task.view)}>{task.action} <ArrowRight size={14} /></button>}</div>; })}</section><aside className="task-side"><div className="task-side-icon"><Target size={20} /></div><h3>One thing is enough.</h3><p>Story Compass keeps your unfinished work visible so you do not have to hold every thread in your head.</p><button className="button button-secondary" onClick={() => goTo('home')}>Back to home <ArrowLeft size={16} /></button></aside></div></div>;
}

function ModalShell({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation"><div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true">{children}<button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div></div>;
}

function AddEventModal({ value, setValue, onClose, onSave }: { value: { text: string; date: string; notes: string }; setValue: (value: { text: string; date: string; notes: string }) => void; onClose: () => void; onSave: () => void }) {
  return <ModalShell onClose={onClose}><div className="modal-eyebrow"><Plus size={15} /> New timeline event</div><h2>Add an event in your own words.</h2><p className="modal-intro">Start with what you know. The date can stay blank, and you can confirm the event later.</p><label className="form-label">Event title or description <span>Required</span><textarea autoFocus value={value.text} onChange={(event) => setValue({ ...value, text: event.target.value })} placeholder="For example: they meet at the accident" rows={4} /></label><label className="form-label">Date <span>Optional</span><input value={value.date} onChange={(event) => setValue({ ...value, date: event.target.value })} placeholder="Leave blank if unknown" /></label><label className="form-label">Writer notes <span>Optional</span><textarea value={value.notes} onChange={(event) => setValue({ ...value, notes: event.target.value })} placeholder="A reminder for yourself" rows={3} /></label><div className="modal-actions"><button className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={onSave} disabled={!value.text.trim()}>Save event <ArrowRight size={16} /></button></div></ModalShell>;
}

function ConfirmEventModal({ event, onClose, onConfirm, orderPending }: { event: StoryEvent; onClose: () => void; onConfirm: () => void; orderPending: boolean }) {
  return <ModalShell onClose={onClose}><div className="confirm-symbol"><CheckCircle2 size={22} /></div><div className="modal-eyebrow">{orderPending ? 'One quick step first' : 'Review before confirming'}</div><h2>{orderPending ? 'Confirm this event to continue.' : 'Is this ready to become story information?'}</h2><p className="modal-intro">Your original entry stays exactly as you wrote it. Confirming tells Story Compass that you approve this detail for your Story Bible and timeline.</p><div className="original-entry"><div className="source-label"><FileText size={14} /> Your original entry</div><p>{event.text}</p>{event.notes && <span>{event.notes}</span>}</div><div className="plain-warning"><CircleHelp size={16} /><span>This does not add a date, cause, or any other detail.</span></div><div className="modal-actions"><button className="button button-quiet" onClick={onClose}>Not yet</button><button className="button button-primary" onClick={onConfirm}>Confirm event <Check size={16} /></button></div></ModalShell>;
}

function OrderModal({ first, second, direction, onClose, onConfirm }: { first: StoryEvent; second: StoryEvent; direction: 'before' | 'after'; onClose: () => void; onConfirm: () => void }) {
  const relation = direction === 'before' ? `${first.label} happens before ${second.label}` : `${first.label} happens after ${second.label}`;
  return <ModalShell onClose={onClose}><div className="confirm-symbol order-symbol"><ArrowRight size={22} /></div><div className="modal-eyebrow">Review proposed order</div><h2>Does this order feel right?</h2><p className="modal-intro">You are choosing sequence only. Both dates can remain unknown, and Story Compass will not infer why one moment follows another.</p><div className="order-review"><div className="review-event"><span>{first.label}</span><strong>{first.text}</strong></div><div className="review-arrow"><ArrowDownIcon /></div><div className="review-event"><span>{second.label}</span><strong>{second.text}</strong></div></div><div className="proposed-label"><Clock3 size={15} /> Proposed order · not yet confirmed</div><div className="relation-preview">{relation}</div><div className="modal-actions"><button className="button button-quiet" onClick={onClose}>Go back</button><button className="button button-primary" onClick={onConfirm}>Confirm this order <Check size={16} /></button></div></ModalShell>;
}

function ArrowDownIcon() {
  return <span className="arrow-down"><ArrowRight size={16} /></span>;
}

function EditCharacterModal({ character, onClose, onSave }: { character: Character; onClose: () => void; onSave: (source: string, notes: string) => void }) {
  const [source, setSource] = useState(character.source);
  const [notes, setNotes] = useState(character.notes);
  return <ModalShell onClose={onClose}><div className="modal-eyebrow"><UserRound size={15} /> Edit character information</div><h2>{character.role}</h2><p className="modal-intro">Keep established information and personal notes in their separate places.</p><label className="form-label">What we know <span>Exact wording is preserved</span><textarea autoFocus value={source} onChange={(event) => setSource(event.target.value)} rows={6} /></label><label className="form-label">My notes <span>Not established story information</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} /></label><div className="modal-actions"><button className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={() => onSave(source, notes)}>Save information <Check size={16} /></button></div></ModalShell>;
}

export default App;
