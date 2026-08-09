export type ModalListener = () => void;

export type ModalCloseReason =
  | "escape"
  | "overlay"
  | "programmatic"
  | "action"
  | "timeout";

export interface ModalBehaviorOptions {
  closeOnEsc?: boolean;
  closeOnOverlay?: boolean;
  trapFocus?: boolean;
  lockScroll?: boolean;
  restoreFocus?: boolean;
  /** Auto-close the modal after this many milliseconds. 0 disables auto-close. */
  closeAfterMs?: number;
}

export interface ModalState {
  stack: string[];
  topId?: string;
}

export interface ModalManager {
  open: (id: string, options?: ModalBehaviorOptions) => void;
  close: (id: string, reason?: ModalCloseReason) => void;
  isOpen: (id: string) => boolean;
  getState: () => ModalState;
  getLayer: (id: string) => number;
  getOptions: (id: string) => ModalBehaviorOptions | undefined;
  getLastCloseReason: (id: string) => ModalCloseReason | undefined;
  subscribe: (listener: ModalListener) => () => void;
}

class ModalManagerImpl implements ModalManager {
  private stack: string[] = [];
  private optionsById = new Map<string, ModalBehaviorOptions>();
  private lastCloseReasonById = new Map<string, ModalCloseReason>();
  private listeners = new Set<ModalListener>();

  open(id: string, options: ModalBehaviorOptions = {}): void {
    this.optionsById.set(id, options);
    this.lastCloseReasonById.delete(id);
    this.stack = this.stack.filter((entry) => entry !== id);
    this.stack.push(id);
    this.emit();
  }

  close(id: string, reason: ModalCloseReason = "programmatic"): void {
    if (!this.optionsById.has(id)) {
      return;
    }

    this.lastCloseReasonById.set(id, reason);
    this.optionsById.delete(id);
    this.stack = this.stack.filter((entry) => entry !== id);
    this.emit();
  }

  isOpen(id: string): boolean {
    return this.optionsById.has(id);
  }

  getState(): ModalState {
    const topId = this.stack[this.stack.length - 1];
    return {
      stack: [...this.stack],
      topId
    };
  }

  getLayer(id: string): number {
    const index = this.stack.indexOf(id);
    return index === -1 ? -1 : index;
  }

  getOptions(id: string): ModalBehaviorOptions | undefined {
    return this.optionsById.get(id);
  }

  getLastCloseReason(id: string): ModalCloseReason | undefined {
    return this.lastCloseReasonById.get(id);
  }

  subscribe(listener: ModalListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const createModalManager = (): ModalManager => new ModalManagerImpl();

export interface ModalDomOptions extends ModalBehaviorOptions {
  container: HTMLElement;
  overlay?: HTMLElement | null;
  initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
  restoreFocusTarget?: HTMLElement | (() => HTMLElement | null) | null;
  /** Element id to use for aria-labelledby on the dialog container. */
  labelledBy?: string;
  /** Element id to use for aria-describedby on the dialog container. */
  describedBy?: string;
  /** Root element that receives layer / buried attributes for stacking UI. */
  root?: HTMLElement | null;
}

export interface ModalController {
  open: () => void;
  close: (reason?: ModalCloseReason) => void;
  isOpen: () => boolean;
  destroy: () => void;
}

const defaultBehavior: Required<ModalBehaviorOptions> = {
  closeOnEsc: true,
  closeOnOverlay: true,
  trapFocus: true,
  lockScroll: true,
  restoreFocus: true,
  closeAfterMs: 0
};

const focusableSelector =
  "a[href], button, input, textarea, select, details, [tabindex]:not([tabindex='-1'])";

let scrollLockCount = 0;
let previousOverflow: string | null = null;
let previousPaddingRight: string | null = null;

const lockScroll = () => {
  if (typeof document === "undefined") {
    return;
  }

  if (scrollLockCount === 0) {
    const body = document.body;
    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    body.style.overflow = "hidden";
  }

  scrollLockCount += 1;
};

const unlockScroll = () => {
  if (typeof document === "undefined") {
    return;
  }

  if (scrollLockCount === 0) {
    return;
  }

  scrollLockCount -= 1;
  if (scrollLockCount === 0) {
    const body = document.body;
    body.style.overflow = previousOverflow ?? "";
    body.style.paddingRight = previousPaddingRight ?? "";
    previousOverflow = null;
    previousPaddingRight = null;
  }
};

const resolveElement = (
  target?: HTMLElement | (() => HTMLElement | null) | null
): HTMLElement | null => {
  if (!target) {
    return null;
  }
  return typeof target === "function" ? target() : target;
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
  return elements.filter((element) => {
    if (element.hasAttribute("disabled")) {
      return false;
    }
    return element.tabIndex >= 0 && element.getClientRects().length > 0;
  });
};

/** Mark non-top modal roots as buried for stacking UX / a11y. */
export const syncBuriedSurfaces = (
  manager: ModalManager,
  rootsById: Map<string, HTMLElement | null | undefined>
): void => {
  const { stack, topId } = manager.getState();
  for (const id of stack) {
    const root = rootsById.get(id);
    if (!root) {
      continue;
    }
    const layer = manager.getLayer(id);
    root.style.setProperty("--mk-layer", String(Math.max(layer, 0)));
    root.setAttribute("data-layer", String(Math.max(layer, 0)));
    if (id === topId) {
      root.classList.remove("mk-modal--buried");
      root.removeAttribute("aria-hidden");
      if ("inert" in root) {
        (root as HTMLElement & { inert: boolean }).inert = false;
      }
    } else {
      root.classList.add("mk-modal--buried");
      root.setAttribute("aria-hidden", "true");
      if ("inert" in root) {
        (root as HTMLElement & { inert: boolean }).inert = true;
      }
    }
  }
};

export const createModalController = (
  id: string,
  manager: ModalManager,
  options: ModalDomOptions
): ModalController => {
  const behavior: Required<ModalBehaviorOptions> = {
    closeOnEsc: options.closeOnEsc ?? defaultBehavior.closeOnEsc,
    closeOnOverlay: options.closeOnOverlay ?? defaultBehavior.closeOnOverlay,
    trapFocus: options.trapFocus ?? defaultBehavior.trapFocus,
    lockScroll: options.lockScroll ?? defaultBehavior.lockScroll,
    restoreFocus: options.restoreFocus ?? defaultBehavior.restoreFocus,
    closeAfterMs: options.closeAfterMs ?? defaultBehavior.closeAfterMs
  };
  let isActive = false;
  let cleanupFns: Array<() => void> = [];
  let lastFocused: HTMLElement | null = null;
  let addedTabIndex = false;

  const syncLayerAttrs = () => {
    const root = options.root ?? options.container.parentElement;
    if (!root) {
      return;
    }
    const layer = manager.getLayer(id);
    if (layer < 0) {
      return;
    }
    root.style.setProperty("--mk-layer", String(layer));
    root.setAttribute("data-layer", String(layer));
    const { topId } = manager.getState();
    if (topId === id) {
      root.classList.remove("mk-modal--buried");
      root.removeAttribute("aria-hidden");
      if ("inert" in root) {
        (root as HTMLElement & { inert: boolean }).inert = false;
      }
    } else {
      root.classList.add("mk-modal--buried");
      root.setAttribute("aria-hidden", "true");
      if ("inert" in root) {
        (root as HTMLElement & { inert: boolean }).inert = true;
      }
    }
  };

  const applyCloseEffects = () => {
    options.container.setAttribute("data-state", "closed");
    const root = options.root ?? options.container.parentElement;
    root?.setAttribute("data-state", "closed");

    cleanupFns.forEach((cleanup) => cleanup());
    cleanupFns = [];

    if (behavior.lockScroll) {
      unlockScroll();
    }

    if (behavior.restoreFocus) {
      const restoreTarget = resolveElement(options.restoreFocusTarget) ?? lastFocused;
      restoreTarget?.focus();
    }

    if (addedTabIndex) {
      options.container.removeAttribute("tabindex");
      addedTabIndex = false;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!manager.isOpen(id)) {
      return;
    }

    const { topId } = manager.getState();
    if (topId !== id) {
      return;
    }

    if (event.key === "Escape" && behavior.closeOnEsc) {
      event.stopPropagation();
      manager.close(id, "escape");
      return;
    }

    if (!behavior.trapFocus || event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(options.container);
    if (focusable.length === 0) {
      event.preventDefault();
      options.container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleOverlayClick = (event: MouseEvent) => {
    if (!behavior.closeOnOverlay) {
      return;
    }
    if (event.target !== options.overlay) {
      return;
    }
    const { topId } = manager.getState();
    if (topId !== id) {
      return;
    }
    manager.close(id, "overlay");
  };

  const applyOpenEffects = () => {
    if (behavior.lockScroll) {
      lockScroll();
    }

    lastFocused = (document?.activeElement as HTMLElement | null) ?? null;
    options.container.setAttribute("data-state", "open");
    const root = options.root ?? options.container.parentElement;
    root?.setAttribute("data-state", "open");
    options.container.setAttribute("aria-modal", "true");
    if (!options.container.hasAttribute("role")) {
      options.container.setAttribute("role", "dialog");
    }
    if (options.labelledBy) {
      options.container.setAttribute("aria-labelledby", options.labelledBy);
    }
    if (options.describedBy) {
      options.container.setAttribute("aria-describedby", options.describedBy);
    }

    syncLayerAttrs();

    const focusTarget = resolveElement(options.initialFocus);
    const focusable = getFocusableElements(options.container);
    const target = focusTarget ?? focusable[0];

    if (target) {
      target.focus();
    } else {
      options.container.setAttribute("tabindex", "-1");
      addedTabIndex = true;
      options.container.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    cleanupFns.push(() => document.removeEventListener("keydown", handleKeyDown));

    if (options.overlay) {
      options.overlay.addEventListener("click", handleOverlayClick);
      cleanupFns.push(() => options.overlay?.removeEventListener("click", handleOverlayClick));
    }

    if (behavior.closeAfterMs > 0) {
      const timerId = setTimeout(() => manager.close(id, "timeout"), behavior.closeAfterMs);
      cleanupFns.push(() => clearTimeout(timerId));
    }
  };

  const syncState = () => {
    const open = manager.isOpen(id);
    if (open && !isActive) {
      isActive = true;
      applyOpenEffects();
      return;
    }
    if (open && isActive) {
      syncLayerAttrs();
      return;
    }
    if (!open && isActive) {
      isActive = false;
      applyCloseEffects();
    }
  };

  const unsubscribe = manager.subscribe(syncState);
  syncState();

  return {
    open: () => manager.open(id, behavior),
    close: (reason: ModalCloseReason = "programmatic") => manager.close(id, reason),
    isOpen: () => manager.isOpen(id),
    destroy: () => {
      unsubscribe();
      if (isActive) {
        isActive = false;
        applyCloseEffects();
      }
    }
  };
};
