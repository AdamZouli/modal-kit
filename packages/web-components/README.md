# @modal-kit/web-components

Web Components adapter for Modal Kit, built on Lit.

## Install

```
npm install @modal-kit/web-components @modal-kit/ui
```

## Usage

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
+</modal-kit-host>
```

## Components

- `modal-kit-host`
- `modal-kit-confirm`
