# Demos

Shipped demos match what is published on npm (confirm modals, themes, core behavior).

## Confirm + themes

- <a href="./examples/confirm-demo.html" target="_self">Confirm demo</a>
- <a href="./examples/theme-gallery.html" target="_self">Theme gallery</a>

## React confirm

```tsx
import "@modal-kit/ui/styles.css";
import { ModalProvider, useModal, ConfirmModal } from "@modal-kit/react";

const Demo = () => {
  const { open } = useModal("demo");
  return (
    <>
      <button type="button" onClick={() => open()}>
        Open
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
    <Demo />
  </ModalProvider>
);
```

## Promise confirm (React)

```tsx
import { ModalProvider, ConfirmHost, useConfirm } from "@modal-kit/react";

const DeleteButton = () => {
  const { confirm } = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await confirm({
          title: "Delete?",
          description: "Cannot be undone.",
          variant: "destructive",
          confirmLabel: "Delete"
        });
        if (ok) {
          // proceed
        }
      }}
    >
      Delete
    </button>
  );
};

export const App = () => (
  <ModalProvider>
    <ConfirmHost>
      <DeleteButton />
    </ConfirmHost>
  </ModalProvider>
);
```

## Multi-step confirm (React)

```tsx
import { MultiStepConfirm, useModal } from "@modal-kit/react";

const Wizard = () => {
  const { open } = useModal("wizard");
  return (
    <>
      <button type="button" onClick={() => open()}>
        Start
      </button>
      <MultiStepConfirm
        id="wizard"
        steps={[
          { title: "Review changes", description: "Check the diff." },
          {
            title: "Delete production data?",
            description: "This cannot be undone.",
            variant: "destructive",
            confirmLabel: "Delete"
          }
        ]}
        onConfirm={async () => {
          /* await api */
        }}
      />
    </>
  );
};
```

## Phase 2 roadmap demos

The following HTML experiments are **not part of the npm packages yet** (drawers, popovers, command palette, toasts). Treat them as Phase 2 previews only:

- <a href="./examples/primitives.html" target="_self">Primitives preview (roadmap)</a>
- <a href="./examples/command-toast.html" target="_self">Command + toast preview (roadmap)</a>

See [Interaction Primitives](/interaction-primitives/) for the Phase 2 spec.
