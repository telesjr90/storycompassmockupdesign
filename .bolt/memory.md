# Project memory

## Product intent & audience

- Story Compass is a fiction-writer tool for managing manuscript, story bible, timeline, and consistency across a long-form writing project.
- Current work is UX prototype only — no backend, no production code, no real AI model calls.
- Target users are novelists who need structured story management without AI writing prose for them.
- Existing detective-story example is the synthetic test-data basis; uncertainty and unknowns must be preserved.

## Brand personality & voice

- Writer-ownership first: the tool references and organizes writer-authored content; it never generates or rewrites creative prose.
- Honest about prototype limitations: simulated interactions are labeled as reference-only; no simulated AI output presented as real model results.
- Respectful of uncertainty: established facts, tentative info, unanswered questions, and writer notes are visually and linguistically distinct.

## Visual design & UX direction

- **Framework:** Vite + React. Single `App.tsx` wires six views via sidebar nav: Home, Idea Inbox, Story Bible, Plot & Timeline, Writing, Tasks.
- **Writing page:** Three-panel desktop workspace — left manuscript nav (chapters, tasks, questions), center editor (save status, focus mode, context banner), right collapsible/resizable assistant panel (310–475px width slider). Below 900px, sidebar hides and assistant becomes fixed overlay. Focus Mode collapses to centered 800px column.
- **Information-type visual language:** green-tinted left border + checkmark = established fact; amber status = tentative/saved-not-confirmed; dashed border + question icon = unanswered question; amber/cream sticky-note style = writer-authored note.
- **Timeline page:** Multi-perspective explorer above existing story-moment list and decision panel. Two ordering modes (Book Order / Actual Chronology) via tab control. Optional comparison mode side-by-side. Group/filter by Character, Location, Story arc, Plot, Subplot (events can belong to multiple groups). Drag-and-drop cards with grip handles, drop-target green highlight, semi-transparent dragged card. Confirmation banner before persisting. Keyboard ordering (arrow keys + up/down buttons). Unplaced/Unknown area below columns. Mobile stacks comparison columns vertically.
- **Drag semantics:** Book Order drag = presentation order only; Chronology drag = before/after relationship only. Each mode's meaning shown in confirmation preview.
- No changes to existing six-item sidebar navigation.

## Decisions, constraints & rationale

- Prototype-local state only; no real persistence or AI claims.
- Existing screens preserved unless coherence required changes.
- Enhanced drag-and-drop with `dragOverId` state for visible drop-target highlighting (green outline + tinted background on target card).
- Build and typecheck both pass cleanly.
- Events may appear in multiple chapters (displayed as "Chapter 1 · Chapter 2").
- Switching modes or resetting filters preserves all saved order data in local state — context never lost.

## Open questions & assumptions

- Should writer notes persist across sessions or remain ephemeral?
- Should dragging from Unplaced into ordered list trigger event confirmation first?
- How should conflicting Book Order vs. Chronology orderings be surfaced?
- Should comparison mode highlight events whose positions differ between modes?
- When filtering to a single character, should "Not established" groupings be hidden or shown in a separate bucket?
- Should Focus Mode also hide the top breadcrumb bar, or only workspace panels?
- All locations currently "Not established" in test data — may need richer synthetic data later.