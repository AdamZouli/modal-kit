# Getting Started

## Requirements

- Node.js 18+
- npm 9+

## Install

Core + UI:

```
npm install @modal-kit/core @modal-kit/ui
```

Choose one adapter:

```
npm install @modal-kit/react
```

```
npm install @modal-kit/vue
```

```
npm install @modal-kit/web-components
```

## Build and Test

```
npm run build
npm run test
```

## Theme Gallery

Explore the full theme catalog and variants:

- Theme Gallery: /themes

## Choose an Adapter

### React

```tsx
import "@modal-kit/ui/styles.css";
import {
  ModalProvider,
  ConfirmHost,
  useModal,
  ConfirmModal,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@modal-kit/react";

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

export const App = () => (
  <ModalProvider>
    <ConfirmHost>
      <DemoModal />
    </ConfirmHost>
  </ModalProvider>
);
```

Generic shell:

```tsx
const Custom = () => {
  const { open, close } = useModal("custom");
  return (
    <>
      <button type="button" onClick={() => open()}>
        Open
      </button>
      <Modal id="custom" theme="swiss">
        <ModalHeader>
          <div className="mk-modal__title">Settings</div>
        </ModalHeader>
        <ModalBody>Your content</ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => close("action")}>
            Close
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};
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

Custom dialog content:

```html
<modal-kit-host>
  <modal-kit-dialog modal-id="settings" theme="mono">
    <h2 id="settings-title">Settings</h2>
    <p>Slot your own markup here.</p>
  </modal-kit-dialog>
</modal-kit-host>
```

## FAQ

### Nested modals

Open multiple ids on the same manager. Only the top modal receives ESC / overlay clicks. Buried layers get `mk-modal--buried` and reduced overlay opacity.

### SSR

React adapters use `useId` for stable aria ids. Vue uses sequential ids generated once per component instance. Portal / Teleport targets `document.body` only in the browser (`typeof document` guarded).

### Close reasons

Core `close(id, reason)` records `escape | overlay | programmatic | action | timeout`. Adapters expose this via `onOpenChange(open, reason)` (React) / `openChange` (Vue).

### Exit animations

Closing keeps the modal mounted briefly (`data-state="closed"`) so exit CSS can run. Reduced motion skips the delay.
