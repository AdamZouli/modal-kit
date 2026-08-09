# modal-kit

[![Deploy Docs](https://github.com/AdamZouli/modal-kit/actions/workflows/docs.yml/badge.svg)](https://github.com/AdamZouli/modal-kit/actions/workflows/docs.yml)
[![CI](https://github.com/AdamZouli/modal-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/AdamZouli/modal-kit/actions/workflows/ci.yml)
[![npm core](https://img.shields.io/npm/v/@modal-kit/core?label=core)](https://www.npmjs.com/package/@modal-kit/core)
[![npm ui](https://img.shields.io/npm/v/@modal-kit/ui?label=ui)](https://www.npmjs.com/package/@modal-kit/ui)
[![npm react](https://img.shields.io/npm/v/@modal-kit/react?label=react)](https://www.npmjs.com/package/@modal-kit/react)
[![npm vue](https://img.shields.io/npm/v/@modal-kit/vue?label=vue)](https://www.npmjs.com/package/@modal-kit/vue)
[![npm web-components](https://img.shields.io/npm/v/@modal-kit/web-components?label=web-components)](https://www.npmjs.com/package/@modal-kit/web-components)

Docs: https://adamzouli.github.io/modal-kit/

Modal Kit is a lightweight, accessible modal engine with adapters for React, Vue, and Web Components. It ships with a theme system and confirmation modal presets that are consistent across frameworks.

## Highlights
- Core logic separated from UI and framework adapters.
- Focus trap, ESC close, overlay close, scroll lock, and focus restore.
- Stacked modals with layer z-index, buried overlays, and close reasons.
- Theme system built on CSS variables with enter/exit motion.
- Confirm presets, async confirm with retry, multi-step confirm, and promise `confirm()`.

## Packages
- @modal-kit/core - core state and DOM behavior.
- @modal-kit/ui - CSS themes and class name helpers.
- @modal-kit/react - React provider, hooks, Modal shell, confirm APIs.
- @modal-kit/vue - Vue plugin, composables, Modal shell, confirm APIs.
- @modal-kit/web-components - Web Components based on Lit.

## Requirements
- Node.js 18+
- npm 9+

## Install (npm)

Core + UI:

```
npm install @modal-kit/core @modal-kit/ui
```

Adapters:

```
npm install @modal-kit/react
npm install @modal-kit/vue
npm install @modal-kit/web-components
```

## Install (local dev)

For local development, install workspace dependencies:

```
npm install
```

## Build and Test

```
npm run build
npm run test
```

## Usage

### Core (vanilla)

Use the manager to track state and the controller to wire DOM behavior.

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

### UI themes

Import the CSS and apply theme classes from the UI package.

```ts
import "@modal-kit/ui/styles.css";
import { modalClassNames, themeClassNames } from "@modal-kit/ui";

const modalClass = `${modalClassNames.panel} ${themeClassNames.cyber}`;
```

### React

```tsx
import "@modal-kit/ui/styles.css";
import { ModalProvider, useModal, ConfirmModal, ConfirmHost } from "@modal-kit/react";

const DemoModal = () => {
	const { open } = useModal("demo");
	return (
		<>
			<button type="button" onClick={() => open()}>
				Delete file
			</button>
			<ConfirmModal
				id="demo"
				title="Delete file?"
				description="This action cannot be undone."
				variant="destructive"
				theme="noir"
			/>
		</>
	);
};

const App = () => (
	<ModalProvider>
		<ConfirmHost>
			<DemoModal />
		</ConfirmHost>
	</ModalProvider>
);
```

Promise API:

```tsx
const { confirm } = useConfirm();
const ok = await confirm({ title: "Delete?", variant: "destructive" });
```

### Vue

```ts
import "@modal-kit/ui/styles.css";
import { createApp } from "vue";
import { ModalKitPlugin } from "@modal-kit/vue";
import App from "./App.vue";

createApp(App).use(ModalKitPlugin).mount("#app");
```

```vue
<script setup lang="ts">
import { useModal, ConfirmModal } from "@modal-kit/vue";

const { open } = useModal("confirm");
</script>

<template>
	<button type="button" @click="open()">Approve</button>
	<ConfirmModal
		id="confirm"
		title="Approve changes?"
		description="This will update production."
		variant="approve"
		theme="swiss"
	/>
</template>
```

### Web Components

```html
<link rel="stylesheet" href="./node_modules/@modal-kit/ui/styles.css" />
<script type="module">
	import "@modal-kit/web-components";
</script>

<modal-kit-host>
	<modal-kit-confirm
		open
		theme="retro"
		variant="info"
		title="Heads up"
		description="Settings will take effect after restart."
	></modal-kit-confirm>
</modal-kit-host>
```

## Confirm Modal API

The confirm modal supports the following props across adapters:

- `id` (string) - modal identifier.
- `title` (string)
- `description` (string)
- `details` (string, optional)
- `confirmLabel` / `cancelLabel` (string, optional)
- `variant` ("info" | "approve" | "destructive")
- `preset` ("delete" | "approve", optional)
- `theme` (one of the theme class names)
- `onConfirm` / `onCancel` (optional; `onConfirm` may return a Promise)

When performing destructive actions (delete, remove, revoke), use `variant="destructive"`.

Open/close is driven by the shared manager (`useModal(id).open()`), not by an `open` prop on React/Vue ConfirmModal. Web Components use a reflected `open` attribute.

## Themes

Themes are CSS variable overrides applied via classes from `themeClassNames`. The current set includes:

`brutalist`, `retro`, `swiss`, `cyber`, `paper`, `glass`, `y2k`, `mono`, `bauhaus`, `noir`, `pastel`, `terminal`, `candy`, `nature`, `futurist`, `gothic`, `signal`, `aurora`.

You can compose themes by overriding variables on a wrapper element.

## Behavior Options

Core behavior options are available on `createModalController` / adapter controllers:

- `closeOnEsc` (default true)
- `closeOnOverlay` (default true)
- `trapFocus` (default true)
- `lockScroll` (default true)
- `restoreFocus` (default true)
- `closeAfterMs` (default 0)

## Examples

- `examples/confirm-demo.html` - quick confirm modal demo and theme preview.
- `examples/theme-gallery.html` - visual gallery and theme comparison.

## Project Layout

```
packages/
	core/
	ui/
	react/
	vue/
	web-components/
examples/
	confirm-demo.html
	theme-gallery.html
```

## Accessibility Notes

| Check | Status |
| --- | --- |
| Focus trap inside active modal | Yes (core) |
| Topmost modal handles ESC / overlay | Yes |
| Scroll lock while open | Yes (ref-counted) |
| Focus restore on close | Yes |
| `role="dialog"` + `aria-modal` | Yes |
| `aria-labelledby` / `aria-describedby` | Yes (adapters) |
| Buried layers `aria-hidden` / inert | Yes |
| `prefers-reduced-motion` | Yes (CSS + exit delay) |

Automated smoke coverage lives in core + adapter tests (ESC, overlay, focus trap, confirm flows).

## Development Scripts

- `npm run build` - build all packages in order.
- `npm run test` - run vitest across packages.
- `npm run docs:sync-lib` - copy package builds into `docs/public/lib`.

## License

MIT
