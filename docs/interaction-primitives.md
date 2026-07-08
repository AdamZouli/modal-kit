# Interaction Primitives Spec

This spec defines the shared behavior for Modal Kit interaction-driven components.

## Goals

- One engine, consistent accessibility, and shared theming across primitives.
- Familiar API surface across React, Vue, and Web Components.
- Clear animation philosophy and predictable focus behavior.

## Primitives in scope

- Drawer
- Command palette
- Popover
- Alert dialog
- Toast
- Onboarding flow
- Action sheet
- Context menu
- Spotlight search
- Side panel

## Shared behavior contract

### Accessibility

- Trap focus when a surface is modal.
- Return focus to the trigger on close.
- Support ESC to close when dismissible.
- Overlay click closes when allowed.
- Announce role and label with ARIA.
- Honor `prefers-reduced-motion`.

### State model

- Controlled and uncontrolled open state.
- Explicit `open`, `onOpenChange` (or equivalent).
- `reason` is passed on close: `escape`, `overlay`, `programmatic`, `action`.

### Overlay policy

- Overlay required for modal surfaces.
- No overlay for anchored/inline surfaces.
- Overlay scroll lock for modal surfaces.

### Focus policy

- Initial focus target is configurable.
- Focus trap optional for non-modal surfaces.
- Tabbing loops within modal when enabled.

### Composition

- Host + surface pattern across frameworks.
- Named slots for header/body/footer (or equivalents).
- Slot or prop for `title`, `description`, `actions`.

## Animation philosophy

- Fast, readable, and reversible.
- Enter: 180-220ms ease-out; Exit: 140-180ms ease-in.
- Motion tied to theme tokens, not hard-coded per component.

## Theming contract

- Uses `themeClassNames` and shared CSS variables.
- Variants: `info`, `approve`, `destructive`.
- Tokens:
  - `--mk-surface`, `--mk-surface-contrast`
  - `--mk-overlay`, `--mk-border`, `--mk-shadow`
  - `--mk-radius`, `--mk-focus`, `--mk-info`, `--mk-success`, `--mk-danger`

## Proposed API surface (draft)

### Core engine

- `createSurfaceController()`
- `createSurfaceManager()`

### React

- `<SurfaceHost>`
- `<Drawer>`
- `<Popover>`
- `<CommandPalette>`

### Vue

- `createSurfaceHost()`
- `<Drawer />`, `<Popover />`, `<CommandPalette />`

### Web Components

- `<mk-surface-host>`
- `<mk-drawer>`, `<mk-popover>`, `<mk-command>`

## Milestones

1. Drawer (modal)
2. Popover (anchored)
3. Command palette (modal)
4. Toast (non-modal)
5. Action sheet (modal)

## Demos

See live demos for the first primitives:

- <a href="./demos" target="_self">Open demos</a>
- <a href="./examples/command-toast.html" target="_self">Command + toast demo</a>

## Open questions

- Anchoring API for popovers and context menus.
- Motion token naming for per-theme animation curves.
- Shared keyboard shortcuts for command palette.
