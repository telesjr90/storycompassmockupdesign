import { useMemo, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Columns2,
  GripVertical,
  Layers3,
  MapPin,
  Move,
  RotateCcw,
  Tags,
  UsersRound,
  X,
} from 'lucide-react';

export type TimelineGroup = 'character' | 'location' | 'arc' | 'plot' | 'subplot';

export type TimelineEventRecord = {
  id: string;
  label: string;
  text: string;
  status: 'saved' | 'confirmed';
  date?: string;
  notes?: string;
  bookOrder: number | null;
  chronologyOrder: number | null;
  chapters: string[];
  groups: Record<TimelineGroup, string[]>;
};

type TimelineMode = 'book' | 'chronology';
type FilterType = 'all' | TimelineGroup;
type PendingChange = {
  mode: TimelineMode;
  sourceId: string;
  targetId: string;
  insertBefore: boolean;
  proposedIds: string[];
};

type TimelineExplorerProps = {
  events: TimelineEventRecord[];
  onUpdate: (events: TimelineEventRecord[]) => void;
  onToast: (message: string) => void;
};

const filterLabels: Record<FilterType, string> = {
  all: 'All groups',
  character: 'Character',
  location: 'Location',
  arc: 'Story arc',
  plot: 'Plot',
  subplot: 'Subplot',
};

const defaultFilterValues: Record<TimelineGroup, string[]> = {
  character: ['Detective', 'Secretary', 'IT worker', 'Muscle', 'Not established'],
  location: ['Not established'],
  arc: ['Main plot', 'Not grouped'],
  plot: ['Character-specific plot', 'Main plot', 'Not grouped'],
  subplot: ['Subplot', 'Not grouped'],
};

export function TimelineExplorer({ events, onUpdate, onToast }: TimelineExplorerProps) {
  const [mode, setMode] = useState<TimelineMode>('book');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterValue, setFilterValue] = useState('');
  const [compare, setCompare] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const orderedEvents = useMemo(() => getOrderedEvents(events, mode), [events, mode]);
  const filteredEvents = useMemo(() => events.filter((event) => matchesFilter(event, filterType, filterValue)), [events, filterType, filterValue]);
  const placedEvents = orderedEvents.filter((event) => matchesFilter(event, filterType, filterValue));
  const unplacedEvents = filteredEvents.filter((event) => getOrder(event, mode) === null);
  const filterValues = filterType === 'all' ? [] : Array.from(new Set([...defaultFilterValues[filterType], ...events.flatMap((event) => event.groups[filterType])])).sort();

  const changeMode = (nextMode: TimelineMode) => {
    setMode(nextMode);
    setPendingChange(null);
  };

  const proposeMove = (sourceId: string, targetId: string, insertBefore: boolean) => {
    if (sourceId === targetId) return;
    const currentIds = orderedEvents.map((event) => event.id);
    const sourceWasPlaced = currentIds.includes(sourceId);
    const workingIds = sourceWasPlaced ? currentIds.filter((id) => id !== sourceId) : [...currentIds, sourceId];
    const targetIndex = workingIds.indexOf(targetId);
    if (targetIndex < 0) return;
    const insertAt = insertBefore ? targetIndex : targetIndex + 1;
    workingIds.splice(insertAt, 0, sourceId);
    setPendingChange({ mode, sourceId, targetId, insertBefore, proposedIds: workingIds });
  };

  const proposeKeyboardMove = (event: TimelineEventRecord, direction: 'up' | 'down') => {
    const currentIds = orderedEvents.map((item) => item.id);
    const currentIndex = currentIds.indexOf(event.id);
    if (currentIndex < 0) {
      const target = orderedEvents[direction === 'up' ? 0 : orderedEvents.length - 1];
      if (target) proposeMove(event.id, target.id, direction === 'up');
      return;
    }
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const target = orderedEvents[targetIndex];
    if (target) proposeMove(event.id, target.id, direction === 'up');
  };

  const confirmChange = () => {
    if (!pendingChange) return;
    const orderField = pendingChange.mode === 'book' ? 'bookOrder' : 'chronologyOrder';
    const nextEvents = events.map((event) => ({ ...event, [orderField]: pendingChange.proposedIds.indexOf(event.id) >= 0 ? pendingChange.proposedIds.indexOf(event.id) + 1 : null } as TimelineEventRecord));
    onUpdate(nextEvents);
    const source = events.find((event) => event.id === pendingChange.sourceId);
    const target = events.find((event) => event.id === pendingChange.targetId);
    const relation = pendingChange.insertBefore ? 'before' : 'after';
    onToast(`${pendingChange.mode === 'book' ? 'Book order' : 'Actual chronology'} saved: ${source?.label ?? 'Event'} ${relation} ${target?.label ?? 'event'}.`);
    setPendingChange(null);
  };

  return <section className="multi-timeline-section">
    <div className="multi-timeline-heading"><div><div className="eyebrow">New timeline lens</div><h2>See the story from two directions.</h2><p>Book Order describes what the reader encounters. Actual Chronology describes what happened in the story world.</p></div><div className="timeline-view-actions"><button className={`button ${compare ? 'button-primary' : 'button-secondary'} compact-button`} onClick={() => setCompare((current) => !current)}><Columns2 size={15} /> {compare ? 'Exit comparison' : 'Compare views'}</button></div></div>
    <div className="timeline-mode-switch" role="tablist" aria-label="Timeline perspective"><button className={mode === 'book' ? 'active' : ''} onClick={() => changeMode('book')} role="tab" aria-selected={mode === 'book'}><Layers3 size={16} /><span><strong>Book Order</strong><small>Reader’s sequence</small></span></button><button className={mode === 'chronology' ? 'active' : ''} onClick={() => changeMode('chronology')} role="tab" aria-selected={mode === 'chronology'}><RotateCcw size={16} /><span><strong>Actual Chronology</strong><small>Story-world sequence</small></span></button></div>
    <div className="timeline-tools"><div className="filter-label"><Tags size={15} /> Group and filter</div><select value={filterType} onChange={(event) => { setFilterType(event.target.value as FilterType); setFilterValue(''); }} aria-label="Filter group type">{Object.entries(filterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{filterType !== 'all' && <select value={filterValue} onChange={(event) => setFilterValue(event.target.value)} aria-label={`Filter by ${filterLabels[filterType]}`}><option value="">All {filterLabels[filterType].toLowerCase()}s</option>{filterValues.map((value) => <option key={value}>{value}</option>)}</select>}<span className="filter-result">{filteredEvents.length} of {events.length} shown</span></div>
    {pendingChange && <TimelineChangePreview pending={pendingChange} events={events} mode={mode} onCancel={() => setPendingChange(null)} onConfirm={confirmChange} />}
    {compare ? <div className="comparison-grid"><TimelineColumn title="Book Order" subtitle="Reader’s sequence" events={events.filter((event) => matchesFilter(event, filterType, filterValue))} mode="book" activeMode={mode} onDrop={proposeMove} onKeyboardMove={proposeKeyboardMove} draggingId={draggingId} setDraggingId={setDraggingId} dragOverId={dragOverId} setDragOverId={setDragOverId} /><TimelineColumn title="Actual Chronology" subtitle="Story-world sequence" events={events.filter((event) => matchesFilter(event, filterType, filterValue))} mode="chronology" activeMode={mode} onDrop={proposeMove} onKeyboardMove={proposeKeyboardMove} draggingId={draggingId} setDraggingId={setDraggingId} dragOverId={dragOverId} setDragOverId={setDragOverId} /></div> : <TimelineColumn title={mode === 'book' ? 'Book Order' : 'Actual Chronology'} subtitle={mode === 'book' ? 'The sequence a reader encounters the story.' : 'The order events happened, without invented dates.'} events={filteredEvents} mode={mode} activeMode={mode} onDrop={proposeMove} onKeyboardMove={proposeKeyboardMove} draggingId={draggingId} setDraggingId={setDraggingId} dragOverId={dragOverId} setDragOverId={setDragOverId} />}
    {unplacedEvents.length > 0 && <UnplacedArea events={unplacedEvents} mode={mode} onDrop={proposeMove} onKeyboardMove={proposeKeyboardMove} draggingId={draggingId} setDraggingId={setDraggingId} dragOverId={dragOverId} setDragOverId={setDragOverId} />}
    <div className="timeline-interaction-note"><Move size={15} /><span><strong>How ordering works:</strong> Drag a card or use the arrow buttons. Every move opens a review first; nothing is saved silently.</span></div>
  </section>;
}

function TimelineColumn({ title, subtitle, events, mode, activeMode, onDrop, onKeyboardMove, draggingId, setDraggingId, dragOverId, setDragOverId }: { title: string; subtitle: string; events: TimelineEventRecord[]; mode: TimelineMode; activeMode: TimelineMode; onDrop: (sourceId: string, targetId: string, insertBefore: boolean) => void; onKeyboardMove: (event: TimelineEventRecord, direction: 'up' | 'down') => void; draggingId: string | null; setDraggingId: (id: string | null) => void; dragOverId: string | null; setDragOverId: (id: string | null) => void }) {
  const ordered = getOrderedEvents(events, mode);
  return <section className={`timeline-column ${activeMode === mode ? 'timeline-column-active' : ''}`}><div className="timeline-column-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><span className="mode-pill">{mode === 'book' ? 'Presentation only' : 'Relationships only'}</span></div><div className="timeline-column-list">{ordered.length ? ordered.map((event, index) => <DraggableTimelineCard key={event.id} event={event} mode={mode} position={index + 1} draggingId={draggingId} setDraggingId={setDraggingId} onDrop={onDrop} onKeyboardMove={onKeyboardMove} dragOverId={dragOverId} setDragOverId={setDragOverId} />) : <div className="timeline-empty"><CircleHelp size={18} /><span>No placed events match this view yet.</span></div>}</div></section>;
}

function DraggableTimelineCard({ event, mode, position, draggingId, setDraggingId, onDrop, onKeyboardMove, dragOverId, setDragOverId }: { event: TimelineEventRecord; mode: TimelineMode; position: number; draggingId: string | null; setDraggingId: (id: string | null) => void; onDrop: (sourceId: string, targetId: string, insertBefore: boolean) => void; onKeyboardMove: (event: TimelineEventRecord, direction: 'up' | 'down') => void; dragOverId: string | null; setDragOverId: (id: string | null) => void }) {
  const isDragOver = dragOverId === event.id && draggingId !== null && draggingId !== event.id;
  const handleDragOver = (dragEvent: DragEvent<HTMLElement>) => { dragEvent.preventDefault(); setDragOverId(event.id); };
  const handleDragLeave = () => { if (dragOverId === event.id) setDragOverId(null); };
  const handleDrop = (dropEvent: DragEvent<HTMLElement>) => {
    dropEvent.preventDefault();
    const sourceId = dropEvent.dataTransfer.getData('text/plain');
    const bounds = dropEvent.currentTarget.getBoundingClientRect();
    onDrop(sourceId, event.id, dropEvent.clientY < bounds.top + bounds.height / 2);
    setDraggingId(null);
    setDragOverId(null);
  };
  const handleKeyDown = (keyEvent: KeyboardEvent<HTMLElement>) => {
    if (keyEvent.key === 'ArrowUp' || keyEvent.key === 'ArrowDown') {
      keyEvent.preventDefault();
      onKeyboardMove(event, keyEvent.key === 'ArrowUp' ? 'up' : 'down');
    }
  };
  return <article className={`perspective-event-card ${draggingId === event.id ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`} draggable onDragStart={(dragEvent) => { dragEvent.dataTransfer.setData('text/plain', event.id); setDraggingId(event.id); }} onDragEnd={() => { setDraggingId(null); setDragOverId(null); }} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onKeyDown={handleKeyDown} tabIndex={0} aria-label={`${event.label}, position ${position}. Use arrow keys to propose a move.`}>
    <div className="perspective-event-handle" aria-hidden="true"><GripVertical size={17} /></div><div className="perspective-event-copy"><div className="perspective-event-top"><span className="event-label">{event.label}</span><span className={`event-status ${event.status}`}>{event.status === 'confirmed' ? <><CheckCircle2 size={13} /> Confirmed</> : 'Saved'}</span></div><p>{event.text}</p><div className="perspective-event-meta"><span>{mode === 'book' ? `Reader position ${position}` : `Chronology position ${position}`}</span><span>{event.chapters.join(' · ')}</span></div><div className="event-group-tags">{event.groups.character.filter((group) => group !== 'Not established').map((group) => <span key={`character-${group}`}><UsersRound size={11} /> {group}</span>)}{event.groups.location.filter((group) => group !== 'Not established').map((group) => <span key={`location-${group}`}><MapPin size={11} /> {group}</span>)}{event.groups.arc.filter((group) => group !== 'Not grouped').map((group) => <span key={`arc-${group}`}>{group}</span>)}</div></div><div className="perspective-event-controls"><button onClick={() => onKeyboardMove(event, 'up')} aria-label={`Propose moving ${event.label} up`}><ArrowUp size={14} /></button><button onClick={() => onKeyboardMove(event, 'down')} aria-label={`Propose moving ${event.label} down`}><ArrowDown size={14} /></button></div>
  </article>;
}

function UnplacedArea({ events, mode, onDrop, onKeyboardMove, draggingId, setDraggingId, dragOverId, setDragOverId }: { events: TimelineEventRecord[]; mode: TimelineMode; onDrop: (sourceId: string, targetId: string, insertBefore: boolean) => void; onKeyboardMove: (event: TimelineEventRecord, direction: 'up' | 'down') => void; draggingId: string | null; setDraggingId: (id: string | null) => void; dragOverId: string | null; setDragOverId: (id: string | null) => void }) {
  return <section className="unplaced-area"><div className="unplaced-heading"><div><h3>Unplaced / Unknown order</h3><p>These events are saved, but you have not approved a position in {mode === 'book' ? 'the reader’s sequence' : 'story chronology'}.</p></div><span>{events.length}</span></div><div className="unplaced-list">{events.map((event) => <DraggableTimelineCard key={event.id} event={event} mode={mode} position={0} draggingId={draggingId} setDraggingId={setDraggingId} onDrop={onDrop} onKeyboardMove={onKeyboardMove} dragOverId={dragOverId} setDragOverId={setDragOverId} />)}</div></section>;
}

function TimelineChangePreview({ pending, events, mode, onCancel, onConfirm }: { pending: PendingChange; events: TimelineEventRecord[]; mode: TimelineMode; onCancel: () => void; onConfirm: () => void }) {
  const source = events.find((event) => event.id === pending.sourceId);
  const target = events.find((event) => event.id === pending.targetId);
  const relation = pending.insertBefore ? 'before' : 'after';
  return <div className="timeline-change-preview"><div className="preview-icon"><ArrowLeftRight size={17} /></div><div className="preview-copy"><div className="panel-eyebrow">Review before saving · {mode === 'book' ? 'Book Order' : 'Actual Chronology'}</div><strong>Proposed change: {source?.label} {relation} {target?.label}</strong><p>{mode === 'book' ? 'This changes presentation order only. It does not claim the events happened in this order.' : 'This establishes a before/after relationship only. It does not add a date or cause.'}</p></div><div className="preview-actions"><button className="button button-quiet compact-button" onClick={onCancel}><X size={14} /> Cancel</button><button className="button button-primary compact-button" onClick={onConfirm}><Check size={14} /> Confirm change</button></div></div>;
}

function getOrder(event: TimelineEventRecord, mode: TimelineMode) {
  return mode === 'book' ? event.bookOrder : event.chronologyOrder;
}

function getOrderedEvents(events: TimelineEventRecord[], mode: TimelineMode) {
  return [...events].filter((event) => getOrder(event, mode) !== null).sort((first, second) => (getOrder(first, mode) ?? 0) - (getOrder(second, mode) ?? 0));
}

function matchesFilter(event: TimelineEventRecord, type: FilterType, value: string) {
  if (type === 'all' || !value) return true;
  return event.groups[type].includes(value);
}
