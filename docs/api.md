# API

## Core

### createModalManager()

Tracks open state, options, and stack order.

### createModalController(id, manager, options)

Wires DOM behavior for a modal:

- focus trap
- ESC close
- overlay close
- scroll lock
- restore focus

### Behavior Options

- `closeOnEsc` (default true)
- `closeOnOverlay` (default true)
- `trapFocus` (default true)
- `lockScroll` (default true)
- `restoreFocus` (default true)
- `container` (required)
- `overlay` (optional)
- `initialFocus` (optional)
- `restoreFocusTarget` (optional)

## React

- `ModalProvider`
- `useModal(id)`
- `useModalController(id, options)`
- `ConfirmModal`

## Vue

- `ModalKitPlugin`
- `useModal(id)`
- `useModalController(id, options)`
- `ConfirmModal`

## Web Components

- `modal-kit-host`
- `modal-kit-confirm`
