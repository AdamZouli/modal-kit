# modal-kit

Modal Kit is a lightweight, accessible modal engine with adapters for React, Vue, and Web Components. It ships with a theme system and confirmation modal presets that are consistent across frameworks.

## Highlights
- Core logic separated from UI and framework adapters.
- Focus trap, ESC close, overlay close, scroll lock, and focus restore.
- Theme system built on CSS variables with multiple design systems.
- Confirm modal presets (info, approve, destructive) with strict styling rules (delete always destructive).

## Packages
- @modal-kit/core - core state and DOM behavior.
- @modal-kit/ui - CSS themes and class name helpers.
- @modal-kit/react - React provider, hooks, and confirm modal.
- @modal-kit/vue - Vue plugin, composables, and confirm modal.
- @modal-kit/web-components - Web Components based on Lit.

## Requirements
- Node.js 18+
- npm 9+

## Install

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
import { ModalProvider, useModal, ConfirmModal } from "@modal-kit/react";

const DemoModal = () => {
	const { isOpen, close } = useModal("demo");
	return (
		<ConfirmModal
			id="demo"
			open={isOpen}
			onClose={close}
			title="Delete file?"
			body="This action cannot be undone."
			variant="destructive"
			theme="noir"
		/>
	);
};

const App = () => (
	<ModalProvider>
		<DemoModal />
	</ModalProvider>
);
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

const { isOpen, close } = useModal("confirm");
</script>

<template>
	<ConfirmModal
		id="confirm"
		:open="isOpen"
		@close="close"
		title="Approve changes?"
		body="This will update production."
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
		body="Settings will take effect after restart."
	></modal-kit-confirm>
</modal-kit-host>
```

## Confirm Modal API

The confirm modal supports the following props across adapters:

- `id` (string) - modal identifier.
- `open` (boolean) - whether the modal is open.
- `title` (string)
- `body` (string)
- `confirmLabel` (string, optional)
- `cancelLabel` (string, optional)
- `variant` ("info" | "approve" | "destructive")
- `theme` (one of the theme class names)

When performing destructive actions (delete, remove, revoke), use `variant="destructive"`.

## Themes

Themes are CSS variable overrides applied via classes from `themeClassNames`. The current set includes:

`brutalist`, `retro`, `swiss`, `cyber`, `paper`, `glass`, `y2k`, `mono`, `bauhaus`, `noir`, `pastel`, `terminal`, `candy`, `nature`, `futurist`, `gothic`.

You can compose themes by overriding variables on a wrapper element.

## Behavior Options

Core behavior options are available on `createModalController`:

- `closeOnEsc` (default true)
- `closeOnOverlay` (default true)
- `trapFocus` (default true)
- `lockScroll` (default true)
- `restoreFocus` (default true)

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

- Focus is trapped inside the active modal.
- The topmost modal handles ESC and overlay clicks.
- Scroll is locked while a modal is open.
- Focus is restored on close.

## Development Scripts

- `npm run build` - build all packages in order.
- `npm run test` - run vitest across packages.

## License

MIT
