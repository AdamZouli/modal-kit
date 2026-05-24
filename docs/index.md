# Modal Kit

Accessible modal engine with adapters for React, Vue, and Web Components. Includes a theme system and confirmation modal presets.

## Quick Start

```
npm install
npm run build
```

## Install Packages

```
npm install @modal-kit/core @modal-kit/ui
```

## Core Example

```ts
import { createModalController, createModalManager } from "@modal-kit/core";

const manager = createModalManager();
const controller = createModalController("demo", manager, {
  container: document.querySelector(".modal") as HTMLElement,
  overlay: document.querySelector(".overlay") as HTMLElement
});

controller.open();
```

## Adapters

- React: `@modal-kit/react`
- Vue: `@modal-kit/vue`
- Web Components: `@modal-kit/web-components`

## Themes

See the Themes page for available theme classes and variants.
