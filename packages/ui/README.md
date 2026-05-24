# @modal-kit/ui

CSS themes and class name helpers for Modal Kit.

## Install

```
npm install @modal-kit/ui
```

## Usage

```ts
import "@modal-kit/ui/styles.css";
import { modalClassNames, themeClassNames } from "@modal-kit/ui";

const modalClass = `${modalClassNames.panel} ${themeClassNames.cyber}`;
```

## Themes

Available themes:

brutalist, retro, swiss, cyber, paper, glass, y2k, mono, bauhaus, noir, pastel, terminal, candy, nature, futurist, gothic.

## Variants

The UI package supports `info`, `approve`, and `destructive` variants. Destructive is required for delete or remove actions.
