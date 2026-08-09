# API

## Core

### createModalManager()

Tracks open state, options, stack order, layers, and last close reason.

- `open(id, options?)`
- `close(id, reason?)` — reason: `escape | overlay | programmatic | action | timeout`
- `isOpen(id)`
- `getState()` — `{ stack, topId }`
- `getLayer(id)` — stack index for z-index
- `getOptions(id)`
- `getLastCloseReason(id)`
- `subscribe(listener)`

### createModalController(id, manager, options)

Wires DOM behavior for a modal:

- focus trap
- ESC close (top of stack only)
- overlay close (top of stack only)
- scroll lock
- restore focus
- layer / buried attributes on `root`
- optional `closeAfterMs` (closes with reason `timeout`)

### Behavior Options

- `closeOnEsc` (default true)
- `closeOnOverlay` (default true)
- `trapFocus` (default true)
- `lockScroll` (default true)
- `restoreFocus` (default true)
- `closeAfterMs` (default 0)
- `container` (required)
- `overlay` (optional)
- `root` (optional — stacking attrs)
- `initialFocus` (optional)
- `restoreFocusTarget` (optional)
- `labelledBy` / `describedBy` (optional)

## React

- `ModalProvider`
- `ConfirmHost` + `useConfirm()` — promise `confirm()` / `alert()`
- `useModal(id)` — `{ isOpen, layer, open(options?), close(reason?), lastCloseReason() }`
- `useModalController(id, options)`
- `ModalPortal`
- `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`
- `ConfirmModal` — async confirm, success flash, retry on error
- `MultiStepConfirm` — stepper + shared confirm flow

## Vue

- `ModalKitPlugin`
- `ConfirmHost` + `useConfirm()`
- `useModal(id)`
- `useModalController(id, options)`
- `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`
- `ConfirmModal`
- `MultiStepConfirm`

## Web Components

- `modal-kit-host` — shared `ModalManager` for descendants
- `modal-kit-confirm` — confirm dialog (`modal-id`, async via `confirm` event detail)
- `modal-kit-dialog` — generic portal-less dialog shell with default slot
