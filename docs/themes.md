# Themes

## Theme Gallery

Use the gallery to compare every theme and variant in one place:

- Theme Gallery: /themes

Themes are CSS variable overrides applied via classes from `themeClassNames`.

## Available Themes

- brutalist
- retro
- swiss
- cyber
- paper
- glass
- y2k
- mono
- bauhaus
- noir
- pastel
- terminal
- candy
- nature
- futurist
- gothic

## Variants

`info`, `approve`, and `destructive` variants are supported. Use destructive for delete or remove actions.

## Usage

```ts
import "@modal-kit/ui/styles.css";
import { modalClassNames, themeClassNames } from "@modal-kit/ui";

const modalClass = `${modalClassNames.panel} ${themeClassNames.cyber}`;
```
