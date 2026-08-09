import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  ref,
  Teleport,
  watch,
  type App,
  type PropType,
  type Ref,
  type VNode
} from "vue";
import {
  createModalController,
  createModalManager,
  type ModalBehaviorOptions,
  type ModalCloseReason,
  type ModalManager
} from "@modal-kit/core";
import {
  MODAL_EXIT_MS,
  modalClassNames,
  themeClassNames,
  type ModalTheme
} from "@modal-kit/ui";

const ModalSymbol = Symbol("ModalManager");
const ConfirmApiSymbol = Symbol("ConfirmApi");

export interface ModalKitOptions {
  manager?: ModalManager;
}

export const ModalKitPlugin = {
  install(app: App, options: ModalKitOptions = {}) {
    const manager = options.manager ?? createModalManager();
    app.provide(ModalSymbol, manager);
  }
};

const useManager = (): ModalManager => {
  const manager = inject<ModalManager>(ModalSymbol);
  if (!manager) {
    throw new Error("ModalKitPlugin is missing in the Vue app");
  }
  return manager;
};

export const useModal = (id: string) => {
  const manager = useManager();
  const isOpen: Ref<boolean> = ref(manager.isOpen(id));
  const layer: Ref<number> = ref(manager.getLayer(id));
  const unsubscribe = manager.subscribe(() => {
    isOpen.value = manager.isOpen(id);
    layer.value = manager.getLayer(id);
  });

  onBeforeUnmount(() => {
    unsubscribe();
  });

  return {
    isOpen,
    layer,
    open: (options?: ModalBehaviorOptions) => manager.open(id, options),
    close: (reason: ModalCloseReason = "programmatic") => manager.close(id, reason),
    lastCloseReason: () => manager.getLastCloseReason(id)
  };
};

export type ElementOrGetter = HTMLElement | (() => HTMLElement | null) | null;

export interface UseModalControllerOptions extends ModalBehaviorOptions {
  overlay?: ElementOrGetter;
  container?: ElementOrGetter;
  root?: ElementOrGetter;
  initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
  restoreFocusTarget?: HTMLElement | (() => HTMLElement | null) | null;
  labelledBy?: string;
  describedBy?: string;
}

const resolveElement = (target?: ElementOrGetter): HTMLElement | null => {
  if (!target) {
    return null;
  }
  return typeof target === "function" ? target() : target;
};

export const useModalController = (id: string, options: UseModalControllerOptions) => {
  const manager = useManager();
  let controller: ReturnType<typeof createModalController> | null = null;

  const ensureController = () => {
    if (controller) {
      return;
    }

    const container = resolveElement(options.container);
    const overlay = resolveElement(options.overlay);
    const root = resolveElement(options.root);
    if (!container) {
      return;
    }

    controller = createModalController(id, manager, {
      container,
      overlay,
      root,
      closeOnEsc: options.closeOnEsc,
      closeOnOverlay: options.closeOnOverlay,
      trapFocus: options.trapFocus,
      lockScroll: options.lockScroll,
      restoreFocus: options.restoreFocus,
      closeAfterMs: options.closeAfterMs,
      initialFocus: options.initialFocus,
      restoreFocusTarget: options.restoreFocusTarget,
      labelledBy: options.labelledBy,
      describedBy: options.describedBy
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

const usePresence = (isOpen: Ref<boolean>, exitMs = MODAL_EXIT_MS) => {
  const mounted = ref(isOpen.value);
  const state = ref<"open" | "closed">(isOpen.value ? "open" : "closed");
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(
    isOpen,
    (open) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (open) {
        mounted.value = true;
        state.value = "open";
        return;
      }
      if (!mounted.value) {
        return;
      }
      state.value = "closed";
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      timer = setTimeout(() => {
        mounted.value = false;
      }, reduced ? 0 : exitMs);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });

  return { mounted, state };
};

let vueIdSeq = 0;
const nextStableId = (prefix: string) => `${prefix}-${++vueIdSeq}`;

export type ConfirmVariant = "destructive" | "approve" | "info";
export type ConfirmPreset = "delete" | "approve";

export interface ConfirmStep {
  title: string;
  description?: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: string;
}

export interface ImperativeConfirmOptions {
  title?: string;
  description?: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  preset?: ConfirmPreset;
  theme?: ModalTheme;
  icon?: string;
}

type PendingConfirm = {
  id: string;
  mode: "confirm" | "alert";
  options: ImperativeConfirmOptions;
  resolve: (value: boolean) => void;
};

export const Modal = defineComponent({
  name: "Modal",
  props: {
    id: { type: String, required: true },
    theme: { type: String as () => ModalTheme, default: "brutalist" },
    className: { type: String, default: undefined },
    labelledBy: { type: String, default: undefined },
    describedBy: { type: String, default: undefined },
    closeOnEsc: { type: Boolean, default: undefined },
    closeOnOverlay: { type: Boolean, default: undefined },
    trapFocus: { type: Boolean, default: undefined },
    lockScroll: { type: Boolean, default: undefined },
    restoreFocus: { type: Boolean, default: undefined },
    closeAfterMs: { type: Number, default: undefined }
  },
  emits: ["openChange"],
  setup(props, { slots, emit }) {
    const manager = useManager();
    const { isOpen, layer } = useModal(props.id);
    const { mounted, state } = usePresence(isOpen);
    const overlayRef = ref<HTMLDivElement | null>(null);
    const panelRef = ref<HTMLDivElement | null>(null);
    const rootRef = ref<HTMLDivElement | null>(null);

    useModalController(props.id, {
      overlay: () => overlayRef.value,
      container: () => panelRef.value,
      root: () => rootRef.value,
      labelledBy: props.labelledBy,
      describedBy: props.describedBy,
      closeOnEsc: props.closeOnEsc,
      closeOnOverlay: props.closeOnOverlay,
      trapFocus: props.trapFocus,
      lockScroll: props.lockScroll,
      restoreFocus: props.restoreFocus,
      closeAfterMs: props.closeAfterMs
    });

    watch(isOpen, (open, wasOpen) => {
      if (open === wasOpen) {
        return;
      }
      emit("openChange", open, open ? undefined : manager.getLastCloseReason(props.id));
    });

    return () => {
      if (!mounted.value) {
        return null;
      }
      return h(Teleport, { to: "body" }, [
        h(
          "div",
          {
            ref: rootRef,
            class: [modalClassNames.root, themeClassNames[props.theme], props.className]
              .filter(Boolean)
              .join(" "),
            "data-state": state.value,
            "data-layer": Math.max(layer.value, 0),
            style: { "--mk-layer": String(Math.max(layer.value, 0)) }
          },
          h(
            "div",
            { class: modalClassNames.overlay, ref: overlayRef },
            h(
              "div",
              { class: modalClassNames.panel, ref: panelRef, role: "dialog", "aria-modal": "true" },
              slots.default?.()
            )
          )
        )
      ]);
    };
  }
});

export const ModalHeader = defineComponent({
  name: "ModalHeader",
  setup(_, { slots }) {
    return () => h("div", { class: modalClassNames.header }, slots.default?.());
  }
});

export const ModalBody = defineComponent({
  name: "ModalBody",
  setup(_, { slots }) {
    return () => h("div", { class: modalClassNames.body }, slots.default?.());
  }
});

export const ModalFooter = defineComponent({
  name: "ModalFooter",
  setup(_, { slots }) {
    return () => h("div", { class: modalClassNames.footer }, slots.default?.());
  }
});

export const ConfirmModal = defineComponent({
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
    successMessage: { type: String, default: "Done" },
    successCloseAfterMs: { type: Number, default: 600 },
    hideCancel: { type: Boolean, default: false },
    closeOnEsc: { type: Boolean, default: undefined },
    closeOnOverlay: { type: Boolean, default: undefined },
    trapFocus: { type: Boolean, default: undefined },
    lockScroll: { type: Boolean, default: undefined },
    restoreFocus: { type: Boolean, default: undefined },
    closeAfterMs: { type: Number, default: undefined },
    onConfirm: { type: Function as PropType<() => void | Promise<void>>, default: undefined },
    onCancel: { type: Function as PropType<() => void>, default: undefined }
  },
  emits: ["openChange"],
  setup(props, { emit }) {
    const manager = useManager();
    const { isOpen, layer, close } = useModal(props.id);
    const { mounted, state } = usePresence(isOpen);
    const overlayRef = ref<HTMLDivElement | null>(null);
    const panelRef = ref<HTMLDivElement | null>(null);
    const rootRef = ref<HTMLDivElement | null>(null);
    const confirmButtonRef = ref<HTMLButtonElement | null>(null);
    const status = ref<"idle" | "loading" | "error" | "success">("idle");
    const asyncError = ref<string | null>(null);
    const titleId = nextStableId("mk-title");
    const descId = nextStableId("mk-desc");

    useModalController(props.id, {
      overlay: () => overlayRef.value,
      container: () => panelRef.value,
      root: () => rootRef.value,
      initialFocus: () => confirmButtonRef.value,
      labelledBy: titleId,
      describedBy: descId,
      closeOnEsc: props.closeOnEsc,
      closeOnOverlay: props.closeOnOverlay,
      trapFocus: props.trapFocus,
      lockScroll: props.lockScroll,
      restoreFocus: props.restoreFocus,
      closeAfterMs: props.closeAfterMs
    });

    watch(isOpen, (open, was) => {
      if (open) {
        status.value = "idle";
        asyncError.value = null;
      }
      if (open !== was) {
        emit("openChange", open, open ? undefined : manager.getLastCloseReason(props.id));
      }
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

    const finishSuccess = () => {
      if (props.successCloseAfterMs <= 0) {
        status.value = "idle";
        close("action");
        return;
      }
      status.value = "success";
      window.setTimeout(() => {
        status.value = "idle";
        close("action");
      }, props.successCloseAfterMs);
    };

    const handleConfirm = () => {
      if (!props.onConfirm) {
        close("action");
        return;
      }
      const result = props.onConfirm();
      if (result instanceof Promise) {
        status.value = "loading";
        asyncError.value = null;
        result
          .then(() => finishSuccess())
          .catch((err: unknown) => {
            status.value = "error";
            asyncError.value =
              err instanceof Error ? err.message : "Something went wrong. Please try again.";
          });
      } else {
        close("action");
      }
    };

    const handleCancel = () => {
      if (status.value === "loading" || status.value === "success") {
        return;
      }
      props.onCancel?.();
      close("action");
    };

    const handleRetry = () => {
      asyncError.value = null;
      status.value = "idle";
      handleConfirm();
    };

    return () => {
      if (!mounted.value) {
        return null;
      }

      const preset = presetDefaults();
      const resolvedTitle = props.title ?? preset?.title ?? "Confirm action";
      const resolvedDescription = props.description ?? preset?.description;
      const resolvedConfirm = props.confirmLabel ?? preset?.confirmLabel ?? "Confirm";
      const resolvedCancel = props.cancelLabel ?? preset?.cancelLabel ?? "Cancel";
      const resolvedVariant = props.variant ?? preset?.variant ?? "approve";
      const resolvedIcon = props.icon ?? preset?.icon ?? "?";

      return h(Teleport, { to: "body" }, [
        h(
          "div",
          {
            ref: rootRef,
            class: `${modalClassNames.root} ${themeClassNames[props.theme]} ${modalClassNames.confirmVariant}`,
            "data-variant": resolvedVariant,
            "data-state": state.value,
            "data-layer": Math.max(layer.value, 0),
            style: { "--mk-layer": String(Math.max(layer.value, 0)) }
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
                    props.details ? h("div", { class: modalClassNames.details }, props.details) : null
                  ])
                ]),
                asyncError.value
                  ? h("div", { class: modalClassNames.asyncError, role: "alert" }, asyncError.value)
                  : null,
                status.value === "success"
                  ? h("div", { class: modalClassNames.asyncSuccess, role: "status" }, props.successMessage)
                  : null,
                h("div", { class: modalClassNames.actions }, [
                  !props.hideCancel
                    ? h(
                        "button",
                        {
                          class: `${modalClassNames.button} ${modalClassNames.cancelButton}`,
                          type: "button",
                          onClick: handleCancel,
                          disabled: status.value === "loading" || status.value === "success"
                        },
                        resolvedCancel
                      )
                    : null,
                  status.value === "error"
                    ? h(
                        "button",
                        {
                          class: `${modalClassNames.button} ${modalClassNames.confirmButton}`,
                          type: "button",
                          onClick: handleRetry,
                          ref: confirmButtonRef
                        },
                        "Retry"
                      )
                    : h(
                        "button",
                        {
                          class: `${modalClassNames.button} ${modalClassNames.confirmButton}`,
                          type: "button",
                          onClick: handleConfirm,
                          ref: confirmButtonRef,
                          disabled: status.value === "loading" || status.value === "success",
                          "aria-busy": status.value === "loading"
                        },
                        status.value === "loading" ? "…" : resolvedConfirm
                      )
                ])
              ]
            )
          )
        )
      ]);
    };
  }
});

export const MultiStepConfirm = defineComponent({
  name: "MultiStepConfirm",
  props: {
    id: { type: String, required: true },
    steps: { type: Array as PropType<ConfirmStep[]>, required: true },
    theme: { type: String as () => ModalTheme, default: "brutalist" },
    successMessage: { type: String, default: "Done" },
    successCloseAfterMs: { type: Number, default: 600 },
    closeOnEsc: { type: Boolean, default: undefined },
    closeOnOverlay: { type: Boolean, default: undefined },
    trapFocus: { type: Boolean, default: undefined },
    lockScroll: { type: Boolean, default: undefined },
    restoreFocus: { type: Boolean, default: undefined },
    closeAfterMs: { type: Number, default: undefined },
    onConfirm: { type: Function as PropType<() => void | Promise<void>>, default: undefined },
    onCancel: { type: Function as PropType<() => void>, default: undefined }
  },
  setup(props) {
    const { isOpen, layer, close } = useModal(props.id);
    const { mounted, state } = usePresence(isOpen);
    const overlayRef = ref<HTMLDivElement | null>(null);
    const panelRef = ref<HTMLDivElement | null>(null);
    const rootRef = ref<HTMLDivElement | null>(null);
    const primaryRef = ref<HTMLButtonElement | null>(null);
    const stepIndex = ref(0);
    const status = ref<"idle" | "loading" | "error" | "success">("idle");
    const asyncError = ref<string | null>(null);
    const titleId = nextStableId("mk-ms-title");
    const descId = nextStableId("mk-ms-desc");

    useModalController(props.id, {
      overlay: () => overlayRef.value,
      container: () => panelRef.value,
      root: () => rootRef.value,
      initialFocus: () => primaryRef.value,
      labelledBy: titleId,
      describedBy: descId,
      closeOnEsc: props.closeOnEsc,
      closeOnOverlay: props.closeOnOverlay,
      trapFocus: props.trapFocus,
      lockScroll: props.lockScroll,
      restoreFocus: props.restoreFocus,
      closeAfterMs: props.closeAfterMs
    });

    watch(isOpen, (open) => {
      if (open) {
        stepIndex.value = 0;
        status.value = "idle";
        asyncError.value = null;
      }
    });

    return () => {
      if (!mounted.value || props.steps.length === 0) {
        return null;
      }

      const isLast = stepIndex.value >= props.steps.length - 1;
      const step = props.steps[stepIndex.value];
      const resolvedVariant = isLast
        ? step.variant === "destructive"
          ? "destructive"
          : step.variant ?? "approve"
        : step.variant ?? "info";

      const finishSuccess = () => {
        if (props.successCloseAfterMs <= 0) {
          status.value = "idle";
          close("action");
          return;
        }
        status.value = "success";
        window.setTimeout(() => {
          status.value = "idle";
          close("action");
        }, props.successCloseAfterMs);
      };

      const handlePrimary = () => {
        if (!isLast) {
          stepIndex.value = Math.min(stepIndex.value + 1, props.steps.length - 1);
          return;
        }
        if (!props.onConfirm) {
          close("action");
          return;
        }
        const result = props.onConfirm();
        if (result instanceof Promise) {
          status.value = "loading";
          asyncError.value = null;
          result
            .then(() => finishSuccess())
            .catch((err: unknown) => {
              status.value = "error";
              asyncError.value =
                err instanceof Error ? err.message : "Something went wrong. Please try again.";
            });
        } else {
          close("action");
        }
      };

      const handleBackOrCancel = () => {
        if (status.value === "loading" || status.value === "success") {
          return;
        }
        if (stepIndex.value > 0) {
          stepIndex.value -= 1;
          return;
        }
        props.onCancel?.();
        close("action");
      };

      const primaryLabel = isLast ? step.confirmLabel ?? "Confirm" : step.confirmLabel ?? "Next";
      const secondaryLabel = stepIndex.value === 0 ? step.cancelLabel ?? "Cancel" : "Back";

      return h(Teleport, { to: "body" }, [
        h(
          "div",
          {
            ref: rootRef,
            class: `${modalClassNames.root} ${themeClassNames[props.theme]} ${modalClassNames.confirmVariant}`,
            "data-variant": resolvedVariant,
            "data-state": state.value,
            "data-layer": Math.max(layer.value, 0),
            style: { "--mk-layer": String(Math.max(layer.value, 0)) }
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
                "aria-describedby": descId
              },
              [
                h(
                  "ol",
                  { class: modalClassNames.stepper, "aria-label": "Steps" },
                  props.steps.map((_, index) =>
                    h("li", {
                      key: index,
                      class: [
                        modalClassNames.step,
                        index === stepIndex.value ? modalClassNames.stepActive : "",
                        index < stepIndex.value ? modalClassNames.stepDone : ""
                      ]
                        .filter(Boolean)
                        .join(" "),
                      "aria-current": index === stepIndex.value ? "step" : undefined
                    })
                  )
                ),
                h("div", { class: modalClassNames.header }, [
                  h(
                    "div",
                    { class: modalClassNames.icon, "aria-hidden": "true" },
                    step.icon ?? (isLast ? "!" : String(stepIndex.value + 1))
                  ),
                  h("div", { class: modalClassNames.text }, [
                    h("div", { class: modalClassNames.title, id: titleId }, step.title),
                    step.description
                      ? h("div", { class: modalClassNames.description, id: descId }, step.description)
                      : h(
                          "div",
                          { id: descId, class: modalClassNames.description, hidden: true },
                          `Step ${stepIndex.value + 1} of ${props.steps.length}`
                        ),
                    step.details ? h("div", { class: modalClassNames.details }, step.details) : null
                  ])
                ]),
                asyncError.value
                  ? h("div", { class: modalClassNames.asyncError, role: "alert" }, asyncError.value)
                  : null,
                status.value === "success"
                  ? h("div", { class: modalClassNames.asyncSuccess, role: "status" }, props.successMessage)
                  : null,
                h("div", { class: modalClassNames.actions }, [
                  h(
                    "button",
                    {
                      class: `${modalClassNames.button} ${modalClassNames.cancelButton}`,
                      type: "button",
                      onClick: handleBackOrCancel,
                      disabled: status.value === "loading" || status.value === "success"
                    },
                    secondaryLabel
                  ),
                  h(
                    "button",
                    {
                      class: `${modalClassNames.button} ${modalClassNames.confirmButton}`,
                      type: "button",
                      onClick: handlePrimary,
                      ref: primaryRef,
                      disabled: status.value === "loading" || status.value === "success",
                      "aria-busy": status.value === "loading"
                    },
                    status.value === "loading" ? "…" : primaryLabel
                  )
                ])
              ]
            )
          )
        )
      ]);
    };
  }
});

export const ConfirmHost = defineComponent({
  name: "ConfirmHost",
  setup(_, { slots }) {
    const manager = useManager();
    const pending = ref<PendingConfirm | null>(null);
    let seq = 0;

    const api = {
      confirm: (options: ImperativeConfirmOptions = {}) =>
        new Promise<boolean>((resolve) => {
          const id = `mk-confirm-${++seq}`;
          pending.value = { id, mode: "confirm", options, resolve };
        }),
      alert: (options: ImperativeConfirmOptions = {}) =>
        new Promise<void>((resolve) => {
          const id = `mk-alert-${++seq}`;
          pending.value = {
            id,
            mode: "alert",
            options: {
              ...options,
              confirmLabel: options.confirmLabel ?? "OK",
              variant: options.variant ?? "info"
            },
            resolve: () => resolve()
          };
        })
    };

    provide(ConfirmApiSymbol, api);

    watch(pending, (value) => {
      if (value) {
        manager.open(value.id);
      }
    });

    const finish = (value: boolean) => {
      if (!pending.value) {
        return;
      }
      pending.value.resolve(value);
      pending.value = null;
    };

    return () => {
      const nodes: VNode[] = [];
      const child = slots.default?.();
      if (child) {
        nodes.push(...(Array.isArray(child) ? child : [child]));
      }
      if (pending.value) {
        const current = pending.value;
        nodes.push(
          h(ConfirmModal, {
            id: current.id,
            title: current.options.title,
            description: current.options.description,
            details: current.options.details,
            confirmLabel: current.options.confirmLabel,
            cancelLabel: current.options.cancelLabel,
            variant: current.options.variant,
            preset: current.options.preset,
            theme: current.options.theme,
            icon: current.options.icon,
            hideCancel: current.mode === "alert",
            successCloseAfterMs: 0,
            successMessage: "",
            onConfirm: () => finish(true),
            onCancel: () => finish(false),
            onOpenChange: (open: boolean, reason?: ModalCloseReason) => {
              if (!open && (reason === "escape" || reason === "overlay" || reason === "timeout")) {
                finish(false);
              }
            }
          })
        );
      }
      return nodes;
    };
  }
});

export const useConfirm = () => {
  const api = inject<{
    confirm: (options?: ImperativeConfirmOptions) => Promise<boolean>;
    alert: (options?: ImperativeConfirmOptions) => Promise<void>;
  }>(ConfirmApiSymbol);
  if (!api) {
    throw new Error("ConfirmHost is missing in the Vue tree");
  }
  return api;
};
