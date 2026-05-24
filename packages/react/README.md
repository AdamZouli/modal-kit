# @modal-kit/react

React adapter for Modal Kit.

## Install

```
npm install @modal-kit/react @modal-kit/ui
```

## Usage

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

## API

- `ModalProvider`
- `useModal(id)`
- `useModalController(id, options)`
- `ConfirmModal`
