export type ModalListener = () => void;

export interface ModalBehaviorOptions {
  closeOnEsc?: boolean;
  closeOnOverlay?: boolean;
  trapFocus?: boolean;
  lockScroll?: boolean;
  restoreFocus?: boolean;
}

export interface ModalState {
  stack: string[];
  topId?: string;
}

export interface ModalManager {
  open: (id: string, options?: ModalBehaviorOptions) => void;
  close: (id: string) => void;
  isOpen: (id: string) => boolean;
  getState: () => ModalState;
  getOptions: (id: string) => ModalBehaviorOptions | undefined;
  subscribe: (listener: ModalListener) => () => void;
}

class ModalManagerImpl implements ModalManager {
  private stack: string[] = [];
  private optionsById = new Map<string, ModalBehaviorOptions>();
  private listeners = new Set<ModalListener>();

  open(id: string, options: ModalBehaviorOptions = {}): void {
    this.optionsById.set(id, options);
    this.stack = this.stack.filter((entry) => entry !== id);
    this.stack.push(id);
    this.emit();
  }

  close(id: string): void {
    if (!this.optionsById.has(id)) {
      return;
    }

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

  getOptions(id: string): ModalBehaviorOptions | undefined {
    return this.optionsById.get(id);
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
}

export interface ModalController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

const defaultBehavior: Required<ModalBehaviorOptions> = {
  closeOnEsc: true,
  closeOnOverlay: true,
  trapFocus: true,
  lockScroll: true,
  restoreFocus: true
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

export const createModalController = (
  id: string,
  manager: ModalManager,
  options: ModalDomOptions
): ModalController => {
  const behavior: Required<ModalBehaviorOptions> = {
    ...defaultBehavior,
    ...options
  };
  let isActive = false;
  let cleanupFns: Array<() => void> = [];
  let lastFocused: HTMLElement | null = null;
  let addedTabIndex = false;

  const applyCloseEffects = () => {
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
      manager.close(id);
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
    manager.close(id);
  };

  const applyOpenEffects = () => {
    if (behavior.lockScroll) {
      lockScroll();
    }

    lastFocused = (document?.activeElement as HTMLElement | null) ?? null;
    options.container.setAttribute("aria-modal", "true");
    if (!options.container.hasAttribute("role")) {
      options.container.setAttribute("role", "dialog");
    }

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
  };

  const syncState = () => {
    const open = manager.isOpen(id);
    if (open && !isActive) {
      isActive = true;
      applyOpenEffects();
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
    close: () => manager.close(id),
    isOpen: () => manager.isOpen(id),
    destroy: () => {
      unsubscribe();
      applyCloseEffects();
    }
  };
};
