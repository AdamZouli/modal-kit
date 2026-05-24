# Getting Started

## Requirements

- Node.js 18+
- npm 9+

## Install

```
npm install
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

export const App = () => (
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
