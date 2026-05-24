# @modal-kit/core

Core modal state and DOM behavior utilities for Modal Kit.

## Install

```
npm install @modal-kit/core
```

## Usage

```ts
import { createModalController, createModalManager } from "@modal-kit/core";

const manager = createModalManager();
const controller = createModalController("demo", manager, {
  container: document.querySelector(".modal") as HTMLElement,
  overlay: document.querySelector(".overlay") as HTMLElement,
  closeOnEsc: true,
  closeOnOverlay: true,
  trapFocus: true,
  lockScroll: true,
  restoreFocus: true
});

controller.open();
```

## API

### createModalManager()

Creates a modal manager for tracking open state and stack order.

### createModalController(id, manager, options)

Wires modal DOM behavior for the given `id` using the manager.

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

## Notes

This package does not ship UI. Use `@modal-kit/ui` for styles and themes.
