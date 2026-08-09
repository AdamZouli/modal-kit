import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
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

const ModalContext = createContext<ModalManager | null>(null);

export interface ModalProviderProps {
  children: React.ReactNode;
  manager?: ModalManager;
}

export const ModalProvider = ({ children, manager }: ModalProviderProps) => {
  const value = useMemo(() => manager ?? createModalManager(), [manager]);
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

const useManager = (): ModalManager => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("ModalProvider is missing in the React tree");
  }
  return context;
};

export const useModal = (id: string) => {
  const manager = useManager();
  const isOpen = useSyncExternalStore(
    (listener) => manager.subscribe(listener),
    () => manager.isOpen(id),
    () => false
  );
  const layer = useSyncExternalStore(
    (listener) => manager.subscribe(listener),
    () => manager.getLayer(id),
    () => -1
  );

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
  /** When false, skip wiring until the modal DOM is mounted. */
  ready?: boolean;
}

const resolveElement = (target?: ElementOrGetter): HTMLElement | null => {
  if (!target) {
    return null;
  }
  return typeof target === "function" ? target() : target;
};

export const useModalController = (id: string, options: UseModalControllerOptions) => {
  const manager = useManager();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useLayoutEffect(() => {
    if (options.ready === false) {
      return;
    }

    const opts = optionsRef.current;
    const container = resolveElement(opts.container);
    const overlay = resolveElement(opts.overlay);
    const root = resolveElement(opts.root);
    if (!container) {
      return;
    }

    const controller = createModalController(id, manager, {
      container,
      overlay,
      root,
      closeOnEsc: opts.closeOnEsc,
      closeOnOverlay: opts.closeOnOverlay,
      trapFocus: opts.trapFocus,
      lockScroll: opts.lockScroll,
      restoreFocus: opts.restoreFocus,
      closeAfterMs: opts.closeAfterMs,
      initialFocus: () => resolveElement(optionsRef.current.initialFocus as ElementOrGetter),
      restoreFocusTarget: () =>
        resolveElement(optionsRef.current.restoreFocusTarget as ElementOrGetter),
      labelledBy: opts.labelledBy,
      describedBy: opts.describedBy
    });

    return () => controller.destroy();
  }, [
    id,
    manager,
    options.ready,
    options.closeOnEsc,
    options.closeOnOverlay,
    options.trapFocus,
    options.lockScroll,
    options.restoreFocus,
    options.closeAfterMs,
    options.labelledBy,
    options.describedBy
  ]);
};

const usePresence = (isOpen: boolean, exitMs = MODAL_EXIT_MS) => {
  const [mounted, setMounted] = useState(isOpen);
  const [state, setState] = useState<"open" | "closed">(isOpen ? "open" : "closed");

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setState("open");
      return;
    }
    if (!mounted) {
      return;
    }
    setState("closed");
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : exitMs;
    const timer = window.setTimeout(() => setMounted(false), delay);
    return () => window.clearTimeout(timer);
  }, [isOpen, mounted, exitMs]);

  return { mounted, state };
};

export interface ModalPortalProps {
  children: ReactNode;
  container?: Element | null;
}

export const ModalPortal = ({ children, container }: ModalPortalProps) => {
  if (typeof document === "undefined") {
    return null;
  }
  return createPortal(children, container ?? document.body);
};

export interface ModalProps extends ModalBehaviorOptions {
  id: string;
  theme?: ModalTheme;
  className?: string;
  children?: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
  portalContainer?: Element | null;
  onOpenChange?: (open: boolean, reason?: ModalCloseReason) => void;
}

export const Modal = ({
  id,
  theme = "brutalist",
  className,
  children,
  labelledBy,
  describedBy,
  initialFocus,
  portalContainer,
  onOpenChange,
  closeOnEsc,
  closeOnOverlay,
  trapFocus,
  lockScroll,
  restoreFocus,
  closeAfterMs
}: ModalProps) => {
  const manager = useManager();
  const { isOpen, layer } = useModal(id);
  const { mounted, state } = usePresence(isOpen);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prevOpen = useRef(isOpen);

  useModalController(id, {
    ready: mounted,
    overlay: () => overlayRef.current,
    container: () => panelRef.current,
    root: () => rootRef.current,
    initialFocus,
    labelledBy,
    describedBy,
    closeOnEsc,
    closeOnOverlay,
    trapFocus,
    lockScroll,
    restoreFocus,
    closeAfterMs
  });

  useEffect(() => {
    if (prevOpen.current === isOpen) {
      return;
    }
    prevOpen.current = isOpen;
    onOpenChange?.(isOpen, isOpen ? undefined : manager.getLastCloseReason(id));
  }, [isOpen, id, manager, onOpenChange]);

  if (!mounted) {
    return null;
  }

  const style = { "--mk-layer": String(Math.max(layer, 0)) } as CSSProperties;

  return (
    <ModalPortal container={portalContainer}>
      <div
        ref={rootRef}
        className={[modalClassNames.root, themeClassNames[theme], className]
          .filter(Boolean)
          .join(" ")}
        data-state={state}
        data-layer={Math.max(layer, 0)}
        style={style}
      >
        <div className={modalClassNames.overlay} ref={overlayRef}>
          <div className={modalClassNames.panel} ref={panelRef} role="dialog" aria-modal="true">
            {children}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export const ModalHeader = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <div className={[modalClassNames.header, className].filter(Boolean).join(" ")}>{children}</div>
);

export const ModalBody = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <div className={[modalClassNames.body, className].filter(Boolean).join(" ")}>{children}</div>
);

export const ModalFooter = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <div className={[modalClassNames.footer, className].filter(Boolean).join(" ")}>{children}</div>
);

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
  successMessage?: string;
  successCloseAfterMs?: number;
  hideCancel?: boolean;
  portalContainer?: Element | null;
  onOpenChange?: (open: boolean, reason?: ModalCloseReason) => void;
}

export const ConfirmModal = ({
  id,
  title,
  description,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "approve",
  preset,
  icon,
  theme = "brutalist",
  onConfirm,
  onCancel,
  successMessage = "Done",
  successCloseAfterMs = 600,
  hideCancel = false,
  portalContainer,
  onOpenChange,
  closeOnEsc,
  closeOnOverlay,
  trapFocus,
  lockScroll,
  restoreFocus,
  closeAfterMs
}: ConfirmModalProps) => {
  const manager = useManager();
  const { isOpen, layer, close } = useModal(id);
  const { mounted, state } = usePresence(isOpen);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const prevOpen = useRef(isOpen);

  useModalController(id, {
    ready: mounted,
    overlay: () => overlayRef.current,
    container: () => panelRef.current,
    root: () => rootRef.current,
    initialFocus: () => confirmButtonRef.current,
    labelledBy: titleId,
    describedBy: description ? descriptionId : undefined,
    closeOnEsc,
    closeOnOverlay,
    trapFocus,
    lockScroll,
    restoreFocus,
    closeAfterMs
  });

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setAsyncError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (prevOpen.current === isOpen) {
      return;
    }
    prevOpen.current = isOpen;
    onOpenChange?.(isOpen, isOpen ? undefined : manager.getLastCloseReason(id));
  }, [isOpen, id, manager, onOpenChange]);

  if (!mounted) {
    return null;
  }

  const presetDefaults =
    preset === "delete"
      ? {
          title: "Delete this item?",
          description: "This action cannot be undone.",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          variant: "destructive" as ConfirmVariant,
          icon: "!"
        }
      : preset === "approve"
        ? {
            title: "Approve this change?",
            description: "It will be applied immediately.",
            confirmLabel: "Approve",
            cancelLabel: "Cancel",
            variant: "approve" as ConfirmVariant,
            icon: "+"
          }
        : null;

  const resolvedTitle = title ?? presetDefaults?.title ?? "Confirm action";
  const resolvedDescription = description ?? presetDefaults?.description;
  const resolvedConfirm = confirmLabel ?? presetDefaults?.confirmLabel ?? "Confirm";
  const resolvedCancel = cancelLabel ?? presetDefaults?.cancelLabel ?? "Cancel";
  const resolvedVariant = variant ?? presetDefaults?.variant ?? "approve";
  const resolvedIcon = icon ?? presetDefaults?.icon ?? "?";

  const finishSuccess = () => {
    if (successCloseAfterMs <= 0) {
      setStatus("idle");
      close("action");
      return;
    }
    setStatus("success");
    window.setTimeout(() => {
      setStatus("idle");
      close("action");
    }, successCloseAfterMs);
  };

  const handleConfirm = () => {
    if (!onConfirm) {
      close("action");
      return;
    }

    const result = onConfirm();

    if (result instanceof Promise) {
      setStatus("loading");
      setAsyncError(null);
      result
        .then(() => {
          finishSuccess();
        })
        .catch((err: unknown) => {
          setStatus("error");
          setAsyncError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        });
    } else {
      close("action");
    }
  };

  const handleCancel = () => {
    if (status === "loading" || status === "success") {
      return;
    }
    onCancel?.();
    close("action");
  };

  const handleRetry = () => {
    setAsyncError(null);
    setStatus("idle");
    handleConfirm();
  };

  const style = { "--mk-layer": String(Math.max(layer, 0)) } as CSSProperties;

  return (
    <ModalPortal container={portalContainer}>
      <div
        ref={rootRef}
        className={`${modalClassNames.root} ${themeClassNames[theme]} ${modalClassNames.confirmVariant}`}
        data-variant={resolvedVariant}
        data-state={state}
        data-layer={Math.max(layer, 0)}
        style={style}
      >
        <div className={modalClassNames.overlay} ref={overlayRef}>
          <div
            className={modalClassNames.panel}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={resolvedDescription ? descriptionId : undefined}
          >
            <div className={modalClassNames.header}>
              <div className={modalClassNames.icon} aria-hidden="true">
                {resolvedIcon}
              </div>
              <div className={modalClassNames.text}>
                <div className={modalClassNames.title} id={titleId}>
                  {resolvedTitle}
                </div>
                {resolvedDescription ? (
                  <div className={modalClassNames.description} id={descriptionId}>
                    {resolvedDescription}
                  </div>
                ) : null}
                {details ? <div className={modalClassNames.details}>{details}</div> : null}
              </div>
            </div>
            {asyncError ? (
              <div className={modalClassNames.asyncError} role="alert">
                {asyncError}
              </div>
            ) : null}
            {status === "success" ? (
              <div className={modalClassNames.asyncSuccess} role="status">
                {successMessage}
              </div>
            ) : null}
            <div className={modalClassNames.actions}>
              {!hideCancel ? (
                <button
                  className={`${modalClassNames.button} ${modalClassNames.cancelButton}`}
                  type="button"
                  onClick={handleCancel}
                  disabled={status === "loading" || status === "success"}
                >
                  {resolvedCancel}
                </button>
              ) : null}
              {status === "error" ? (
                <button
                  className={`${modalClassNames.button} ${modalClassNames.confirmButton}`}
                  type="button"
                  onClick={handleRetry}
                  ref={confirmButtonRef}
                >
                  Retry
                </button>
              ) : (
                <button
                  className={`${modalClassNames.button} ${modalClassNames.confirmButton}`}
                  type="button"
                  onClick={handleConfirm}
                  ref={confirmButtonRef}
                  disabled={status === "loading" || status === "success"}
                  aria-busy={status === "loading"}
                >
                  {status === "loading" ? "…" : resolvedConfirm}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export interface ConfirmStep {
  title: string;
  description?: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: string;
}

export interface MultiStepConfirmProps extends ModalBehaviorOptions {
  id: string;
  steps: ConfirmStep[];
  theme?: ModalTheme;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  successMessage?: string;
  successCloseAfterMs?: number;
  portalContainer?: Element | null;
}

export const MultiStepConfirm = ({
  id,
  steps,
  theme = "brutalist",
  onConfirm,
  onCancel,
  successMessage = "Done",
  successCloseAfterMs = 600,
  portalContainer,
  closeOnEsc,
  closeOnOverlay,
  trapFocus,
  lockScroll,
  restoreFocus,
  closeAfterMs
}: MultiStepConfirmProps) => {
  const { isOpen, layer, close } = useModal(id);
  const { mounted, state } = usePresence(isOpen);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useModalController(id, {
    ready: mounted,
    overlay: () => overlayRef.current,
    container: () => panelRef.current,
    root: () => rootRef.current,
    initialFocus: () => primaryRef.current,
    labelledBy: titleId,
    describedBy: descriptionId,
    closeOnEsc,
    closeOnOverlay,
    trapFocus,
    lockScroll,
    restoreFocus,
    closeAfterMs
  });

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setStatus("idle");
      setAsyncError(null);
    }
  }, [isOpen]);

  if (!mounted || steps.length === 0) {
    return null;
  }

  const isLast = stepIndex >= steps.length - 1;
  const step = steps[stepIndex];
  const resolvedVariant = isLast
    ? step.variant === "destructive"
      ? "destructive"
      : step.variant ?? "approve"
    : step.variant ?? "info";

  const finishSuccess = () => {
    if (successCloseAfterMs <= 0) {
      setStatus("idle");
      close("action");
      return;
    }
    setStatus("success");
    window.setTimeout(() => {
      setStatus("idle");
      close("action");
    }, successCloseAfterMs);
  };

  const handlePrimary = () => {
    if (!isLast) {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      return;
    }
    if (!onConfirm) {
      close("action");
      return;
    }
    const result = onConfirm();
    if (result instanceof Promise) {
      setStatus("loading");
      setAsyncError(null);
      result
        .then(() => finishSuccess())
        .catch((err: unknown) => {
          setStatus("error");
          setAsyncError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        });
    } else {
      close("action");
    }
  };

  const handleBackOrCancel = () => {
    if (status === "loading" || status === "success") {
      return;
    }
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    onCancel?.();
    close("action");
  };

  const style = { "--mk-layer": String(Math.max(layer, 0)) } as CSSProperties;
  const primaryLabel = isLast
    ? step.confirmLabel ?? "Confirm"
    : step.confirmLabel ?? "Next";
  const secondaryLabel = stepIndex === 0 ? step.cancelLabel ?? "Cancel" : "Back";

  return (
    <ModalPortal container={portalContainer}>
      <div
        ref={rootRef}
        className={`${modalClassNames.root} ${themeClassNames[theme]} ${modalClassNames.confirmVariant}`}
        data-variant={resolvedVariant}
        data-state={state}
        data-layer={Math.max(layer, 0)}
        style={style}
      >
        <div className={modalClassNames.overlay} ref={overlayRef}>
          <div
            className={modalClassNames.panel}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <ol className={modalClassNames.stepper} aria-label="Steps">
              {steps.map((_, index) => (
                <li
                  key={index}
                  className={[
                    modalClassNames.step,
                    index === stepIndex ? modalClassNames.stepActive : "",
                    index < stepIndex ? modalClassNames.stepDone : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={index === stepIndex ? "step" : undefined}
                />
              ))}
            </ol>
            <div className={modalClassNames.header}>
              <div className={modalClassNames.icon} aria-hidden="true">
                {step.icon ?? (isLast ? "!" : String(stepIndex + 1))}
              </div>
              <div className={modalClassNames.text}>
                <div className={modalClassNames.title} id={titleId}>
                  {step.title}
                </div>
                {step.description ? (
                  <div className={modalClassNames.description} id={descriptionId}>
                    {step.description}
                  </div>
                ) : (
                  <div id={descriptionId} className={modalClassNames.description} hidden>
                    Step {stepIndex + 1} of {steps.length}
                  </div>
                )}
                {step.details ? <div className={modalClassNames.details}>{step.details}</div> : null}
              </div>
            </div>
            {asyncError ? (
              <div className={modalClassNames.asyncError} role="alert">
                {asyncError}
              </div>
            ) : null}
            {status === "success" ? (
              <div className={modalClassNames.asyncSuccess} role="status">
                {successMessage}
              </div>
            ) : null}
            <div className={modalClassNames.actions}>
              <button
                className={`${modalClassNames.button} ${modalClassNames.cancelButton}`}
                type="button"
                onClick={handleBackOrCancel}
                disabled={status === "loading" || status === "success"}
              >
                {secondaryLabel}
              </button>
              <button
                className={`${modalClassNames.button} ${modalClassNames.confirmButton}`}
                type="button"
                onClick={handlePrimary}
                ref={primaryRef}
                disabled={status === "loading" || status === "success"}
                aria-busy={status === "loading"}
              >
                {status === "loading" ? "…" : primaryLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

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

const ImperativeConfirmContext = createContext<{
  confirm: (options?: ImperativeConfirmOptions) => Promise<boolean>;
  alert: (options?: ImperativeConfirmOptions) => Promise<void>;
} | null>(null);

let confirmSeq = 0;

export const ConfirmHost = ({ children }: { children?: ReactNode }) => {
  const manager = useManager();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const api = useMemo(
    () => ({
      confirm: (options: ImperativeConfirmOptions = {}) =>
        new Promise<boolean>((resolve) => {
          const id = `mk-confirm-${++confirmSeq}`;
          setPending({ id, mode: "confirm", options, resolve });
        }),
      alert: (options: ImperativeConfirmOptions = {}) =>
        new Promise<void>((resolve) => {
          const id = `mk-alert-${++confirmSeq}`;
          setPending({
            id,
            mode: "alert",
            options: {
              ...options,
              confirmLabel: options.confirmLabel ?? "OK",
              variant: options.variant ?? "info"
            },
            resolve: () => resolve()
          });
        })
    }),
    []
  );

  useEffect(() => {
    if (pending) {
      manager.open(pending.id);
    }
  }, [pending, manager]);

  const finish = (value: boolean) => {
    const current = pendingRef.current;
    if (!current) {
      return;
    }
    current.resolve(value);
    setPending(null);
  };

  return (
    <ImperativeConfirmContext.Provider value={api}>
      {children}
      {pending ? (
        <ConfirmModal
          id={pending.id}
          title={pending.options.title}
          description={pending.options.description}
          details={pending.options.details}
          confirmLabel={pending.options.confirmLabel}
          cancelLabel={pending.options.cancelLabel}
          variant={pending.options.variant}
          preset={pending.options.preset}
          theme={pending.options.theme}
          icon={pending.options.icon}
          hideCancel={pending.mode === "alert"}
          successCloseAfterMs={0}
          successMessage=""
          onConfirm={() => finish(true)}
          onCancel={() => finish(false)}
          onOpenChange={(openState, reason) => {
            if (!openState && (reason === "escape" || reason === "overlay" || reason === "timeout")) {
              finish(false);
            }
          }}
        />
      ) : null}
    </ImperativeConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ImperativeConfirmContext);
  if (!ctx) {
    throw new Error("ConfirmHost is missing in the React tree (wrap under ModalProvider)");
  }
  return ctx;
};
