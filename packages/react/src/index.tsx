import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore
} from "react";
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
    () => manager.isOpen(id)
  );

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
  const manager = useManager();

  useEffect(() => {
    const container = resolveElement(options.container);
    const overlay = resolveElement(options.overlay);
    if (!container) {
      return;
    }

    const controller = createModalController(id, manager, {
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

    return () => controller.destroy();
  }, [
    id,
    manager,
    options.container,
    options.overlay,
    options.closeOnEsc,
    options.closeOnOverlay,
    options.trapFocus,
    options.lockScroll,
    options.restoreFocus,
    options.initialFocus,
    options.restoreFocusTarget
  ]);
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
  onConfirm?: () => void;
  onCancel?: () => void;
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
  closeOnEsc,
  closeOnOverlay,
  trapFocus,
  lockScroll,
  restoreFocus
}: ConfirmModalProps) => {
  const { isOpen, close } = useModal(id);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useModalController(id, {
    overlay: () => overlayRef.current,
    container: () => panelRef.current,
    initialFocus: () => confirmButtonRef.current,
    closeOnEsc,
    closeOnOverlay,
    trapFocus,
    lockScroll,
    restoreFocus
  });

  if (!isOpen) {
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

  const handleConfirm = () => {
    onConfirm?.();
    close();
  };

  const handleCancel = () => {
    onCancel?.();
    close();
  };

  return (
    <div
      className={`${modalClassNames.root} ${themeClassNames[theme]} ${modalClassNames.confirmVariant}`}
      data-variant={resolvedVariant}
    >
      <div className={modalClassNames.overlay} ref={overlayRef}>
        <div
          className={modalClassNames.panel}
          ref={panelRef}
        >
          <div className={modalClassNames.header}>
            <div className={modalClassNames.icon}>{resolvedIcon}</div>
            <div className={modalClassNames.text}>
              <div className={modalClassNames.title}>{resolvedTitle}</div>
              {resolvedDescription ? (
                <div className={modalClassNames.description}>{resolvedDescription}</div>
              ) : null}
              {details ? <div className={modalClassNames.details}>{details}</div> : null}
            </div>
          </div>
          <div className={modalClassNames.actions}>
            <button
              className={`${modalClassNames.button} ${modalClassNames.cancelButton}`}
              type="button"
              onClick={handleCancel}
            >
              {resolvedCancel}
            </button>
            <button
              className={`${modalClassNames.button} ${modalClassNames.confirmButton}`}
              type="button"
              onClick={handleConfirm}
              ref={confirmButtonRef}
            >
              {resolvedConfirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
