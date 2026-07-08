# Demos

## Live primitives demo

See Drawer and Popover in action:

- <a href="./examples/primitives.html" target="_self">Open primitives demo</a>

## Command + Toast demo

- <a href="./examples/command-toast.html" target="_self">Open command + toast demo</a>

## React

### Drawer

```tsx
import "@modal-kit/ui/styles.css";
import { Drawer, useModal } from "@modal-kit/react";

const DrawerDemo = () => {
  const { isOpen, open, close } = useModal("settings");

  return (
    <>
      <button onClick={open}>Open drawer</button>
      {isOpen ? (
        <Drawer
          id="settings"
          title="Settings"
          description="Drawer for long-form content"
          onClose={close}
        >
          <p>Put settings, forms, and stacks here.</p>
        </Drawer>
      ) : null}
    </>
  );
};
```

### Popover

```tsx
import "@modal-kit/ui/styles.css";
import { Popover, useModal } from "@modal-kit/react";

const PopoverDemo = () => {
  const anchorRef = React.useRef<HTMLButtonElement | null>(null);
  const { isOpen, open, close } = useModal("menu");

  return (
    <>
      <button ref={anchorRef} onClick={open}>Open popover</button>
      {isOpen ? (
        <Popover
          id="menu"
          anchor={() => anchorRef.current}
          title="Quick actions"
          description="Anchored content"
          onClose={close}
        >
          <p>Compact list of actions.</p>
        </Popover>
      ) : null}
    </>
  );
};
```

## Vue

### Drawer

```ts
import "@modal-kit/ui/styles.css";
import { Drawer, useModal } from "@modal-kit/vue";

export default {
  setup() {
    const { isOpen, open, close } = useModal("settings");
    return { isOpen, open, close };
  },
  render() {
    return (
      <>
        <button onClick={this.open}>Open drawer</button>
        {this.isOpen ? (
          <Drawer id="settings" title="Settings" description="Drawer content" onClose={this.close}>
            <p>Settings content here.</p>
          </Drawer>
        ) : null}
      </>
    );
  }
};
```

### Popover

```ts
import "@modal-kit/ui/styles.css";
import { Popover, useModal } from "@modal-kit/vue";

export default {
  setup() {
    const { isOpen, open, close } = useModal("menu");
    const anchor = () => document.getElementById("popover-anchor");
    return { isOpen, open, close, anchor };
  },
  render() {
    return (
      <>
        <button id="popover-anchor" onClick={this.open}>Open popover</button>
        {this.isOpen ? (
          <Popover id="menu" anchor={this.anchor} title="Quick actions" onClose={this.close}>
            <p>Compact list of actions.</p>
          </Popover>
        ) : null}
      </>
    );
  }
};
```

## Web Components

```html
<link rel="stylesheet" href="./node_modules/@modal-kit/ui/styles.css" />
<script type="module">
  import "@modal-kit/web-components";

  const drawer = document.querySelector("modal-kit-drawer");
  const popover = document.querySelector("modal-kit-popover");

  document.getElementById("open-drawer").addEventListener("click", () => {
    drawer.open = true;
  });

  document.getElementById("open-popover").addEventListener("click", () => {
    popover.open = true;
  });
</script>

<button id="open-drawer">Open drawer</button>
<button id="open-popover">Open popover</button>

<modal-kit-drawer title="Settings" description="Drawer content"></modal-kit-drawer>
<modal-kit-popover anchor="#open-popover" title="Quick actions"></modal-kit-popover>
```
