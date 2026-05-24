# @modal-kit/vue

Vue adapter for Modal Kit.

## Install

```
npm install @modal-kit/vue @modal-kit/ui
```

## Setup

```ts
import "@modal-kit/ui/styles.css";
import { createApp } from "vue";
import { ModalKitPlugin } from "@modal-kit/vue";
import App from "./App.vue";

createApp(App).use(ModalKitPlugin).mount("#app");
```

## Usage

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

## API

- `ModalKitPlugin`
- `useModal(id)`
- `useModalController(id, options)`
- `ConfirmModal`
