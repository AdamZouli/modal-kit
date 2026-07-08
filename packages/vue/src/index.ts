import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  type App,
  type PropType,
  type Ref
} from "vue";
import {
  createModalController,
  createModalManager,
  type ModalBehaviorOptions,
  type ModalManager
} from "@modal-kit/core";
import {
  modalClassNames,
  themeClassNames,
  type ModalTheme
} from "@modal-kit/ui";

const ModalSymbol = Symbol("ModalManager");

export interface ModalKitOptions {
  manager?: ModalManager;
}

export const ModalKitPlugin = {
  install(app: App, options: ModalKitOptions = {}) {
    const manager = options.manager ?? createModalManager();
    app.provide(ModalSymbol, manager);
  }
};

export const useModal = (id: string) => {
  const manager = inject<ModalManager>(ModalSymbol);
  if (!manager) {
    throw new Error("ModalKitPlugin is missing in the Vue app");
  }

  const isOpen: Ref<boolean> = ref(manager.isOpen(id));
  const unsubscribe = manager.subscribe(() => {
    isOpen.value = manager.isOpen(id);
  });

  onBeforeUnmount(() => {
    unsubscribe();
  });

  return {
    isOpen,
    open: () => manager.open(id),
    close: () => manager.close(id)
  };
};

export type ElementOrGetter = HTMLElement | (() => HTMLElement | null) | null;

export interface UseModalControllerOptions extends ModalBehaviorOptions {
  overlay?: ElementOrGetter;
  container?: ElementOrGetter;
  initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
  restoreFocusTarget?: HTMLElement | (() => HTMLElement | null) | null;
}

const resolveElement = (target?: ElementOrGetter): HTMLElement | null => {
  if (!target) {
    return null;
  }
  return typeof target === "function" ? target() : target;
};

export const useModalController = (id: string, options: UseModalControllerOptions) => {
  const manager = inject<ModalManager>(ModalSymbol);
  if (!manager) {
    throw new Error("ModalKitPlugin is missing in the Vue app");
  }

  let controller: ReturnType<typeof createModalController> | null = null;

  const ensureController = () => {
    if (controller) {
      return;
    }

    const container = resolveElement(options.container);
    const overlay = resolveElement(options.overlay);
    if (!container) {
      return;
    }

    controller = createModalController(id, manager, {
      container,
      overlay,
      closeOnEsc: options.closeOnEsc,
      closeOnOverlay: options.closeOnOverlay,
      trapFocus: options.trapFocus,
      lockScroll: options.lockScroll,
      restoreFocus: options.restoreFocus,
      initialFocus: options.initialFocus,
      restoreFocusTarget: options.restoreFocusTarget
    });
  };

  onMounted(() => {
    ensureController();
  });

  onUpdated(() => {
    ensureController();
  });

  onBeforeUnmount(() => {
    controller?.destroy();
  });
};

export type ConfirmVariant = "destructive" | "approve" | "info";
export type ConfirmPreset = "delete" | "approve";

export interface ConfirmModalProps extends ModalBehaviorOptions {
  id: string;
  title?: string;
  description?: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  preset?: ConfirmPreset;
  icon?: string;
  theme?: ModalTheme;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export const ConfirmModal = defineComponent<ConfirmModalProps>({
  name: "ConfirmModal",
  props: {
    id: { type: String, required: true },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    details: { type: String, default: undefined },
    confirmLabel: { type: String, default: "Confirm" },
    cancelLabel: { type: String, default: "Cancel" },
    variant: { type: String as () => ConfirmVariant, default: "approve" },
    preset: { type: String as () => ConfirmPreset, default: undefined },
    icon: { type: String, default: undefined },
    theme: { type: String as () => ModalTheme, default: "brutalist" },
    closeOnEsc: { type: Boolean, default: undefined },
    closeOnOverlay: { type: Boolean, default: undefined },
    trapFocus: { type: Boolean, default: undefined },
    lockScroll: { type: Boolean, default: undefined },
    restoreFocus: { type: Boolean, default: undefined },
    onConfirm: { type: Function as PropType<() => void | Promise<void>>, default: undefined },
    onCancel: { type: Function as PropType<() => void>, default: undefined }
  },
  setup(props) {
    const { isOpen, close } = useModal(props.id);
    const overlayRef = ref<HTMLDivElement | null>(null);
    const panelRef = ref<HTMLDivElement | null>(null);
    const confirmButtonRef = ref<HTMLButtonElement | null>(null);
    const status = ref<"idle" | "loading" | "error">("idle");
    const asyncError = ref<string | null>(null);
    const modalId = `mk-modal-${Math.random().toString(36).slice(2, 9)}`;
    const titleId = `${modalId}-title`;
    const descId = `${modalId}-desc`;

    useModalController(props.id, {
      overlay: () => overlayRef.value,
      container: () => panelRef.value,
      initialFocus: () => confirmButtonRef.value,
      labelledBy: titleId,
      describedBy: descId,
      closeOnEsc: props.closeOnEsc,
      closeOnOverlay: props.closeOnOverlay,
      trapFocus: props.trapFocus,
      lockScroll: props.lockScroll,
      restoreFocus: props.restoreFocus
    });

    const presetDefaults = () => {
      if (props.preset === "delete") {
        return {
          title: "Delete this item?",
          description: "This action cannot be undone.",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          variant: "destructive" as ConfirmVariant,
          icon: "!"
        };
      }
      if (props.preset === "approve") {
        return {
          title: "Approve this change?",
          description: "It will be applied immediately.",
          confirmLabel: "Approve",
          cancelLabel: "Cancel",
          variant: "approve" as ConfirmVariant,
          icon: "+"
        };
      }
      return null;
    };

    const handleConfirm = () => {
      if (!props.onConfirm) {
        close();
        return;
      }

      const result = props.onConfirm();

      if (result instanceof Promise) {
        status.value = "loading";
        asyncError.value = null;
        result.then(() => {
          status.value = "idle";
          close();
        }).catch((err: unknown) => {
          status.value = "error";
          asyncError.value = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        });
      } else {
        close();
      }
    };

    const handleCancel = () => {
      if (status.value === "loading") {
        return;
      }
      props.onCancel?.();
      close();
    };

    return () => {
      if (!isOpen.value) {
        return null;
      }

      const preset = presetDefaults();
      const resolvedTitle = props.title ?? preset?.title ?? "Confirm action";
      const resolvedDescription = props.description ?? preset?.description;
      const resolvedConfirm = props.confirmLabel ?? preset?.confirmLabel ?? "Confirm";
      const resolvedCancel = props.cancelLabel ?? preset?.cancelLabel ?? "Cancel";
      const resolvedVariant = props.variant ?? preset?.variant ?? "approve";
      const resolvedIcon = props.icon ?? preset?.icon ?? "?";
      const resolvedTheme = props.theme ?? "brutalist";

      return h(
        "div",
        {
          class: `${modalClassNames.root} ${themeClassNames[resolvedTheme]} ${modalClassNames.confirmVariant}`,
          "data-variant": resolvedVariant,
          "data-state": "open"
        },
        h(
          "div",
          { class: modalClassNames.overlay, ref: overlayRef },
          h(
            "div",
            {
              class: modalClassNames.panel,
              ref: panelRef,
              "aria-labelledby": titleId,
              "aria-describedby": resolvedDescription ? descId : undefined
            },
            [
              h("div", { class: modalClassNames.header }, [
                h("div", { class: modalClassNames.icon, "aria-hidden": "true" }, resolvedIcon),
                h("div", { class: modalClassNames.text }, [
                  h("div", { class: modalClassNames.title, id: titleId }, resolvedTitle),
                  resolvedDescription
                    ? h("div", { class: modalClassNames.description, id: descId }, resolvedDescription)
                    : null,
                  props.details
                    ? h("div", { class: modalClassNames.details }, props.details)
                    : null
                ])
              ]),
              asyncError.value
                ? h("div", { class: modalClassNames.asyncError, role: "alert" }, asyncError.value)
                : null,
              h("div", { class: modalClassNames.actions }, [
                h(
                  "button",
                  {
                    class: `${modalClassNames.button} ${modalClassNames.cancelButton}`,
                    type: "button",
                    onClick: handleCancel,
                    disabled: status.value === "loading"
                  },
                  resolvedCancel
                ),
                h(
                  "button",
                  {
                    class: `${modalClassNames.button} ${modalClassNames.confirmButton}`,
                    type: "button",
                    onClick: handleConfirm,
                    ref: confirmButtonRef,
                    disabled: status.value === "loading",
                    "aria-busy": status.value === "loading"
                  },
                  status.value === "loading" ? "…" : resolvedConfirm
                )
              ])
            ]
          )
        )
      );
    };
  }
});
