// src/index.ts
var ModalManagerImpl = class {
  constructor() {
    this.stack = [];
    this.optionsById = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
  }
  open(id, options = {}) {
    this.optionsById.set(id, options);
    this.stack = this.stack.filter((entry) => entry !== id);
    this.stack.push(id);
    this.emit();
  }
  close(id) {
    if (!this.optionsById.has(id)) {
      return;
    }
    this.optionsById.delete(id);
    this.stack = this.stack.filter((entry) => entry !== id);
    this.emit();
  }
  isOpen(id) {
    return this.optionsById.has(id);
  }
  getState() {
    const topId = this.stack[this.stack.length - 1];
    return {
      stack: [...this.stack],
      topId
    };
  }
  getOptions(id) {
    return this.optionsById.get(id);
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
};
var createModalManager = () => new ModalManagerImpl();
var defaultBehavior = {
  closeOnEsc: true,
  closeOnOverlay: true,
  trapFocus: true,
  lockScroll: true,
  restoreFocus: true
};
var focusableSelector = "a[href], button, input, textarea, select, details, [tabindex]:not([tabindex='-1'])";
var scrollLockCount = 0;
var previousOverflow = null;
var previousPaddingRight = null;
var lockScroll = () => {
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
var unlockScroll = () => {
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
var resolveElement = (target) => {
  if (!target) {
    return null;
  }
  return typeof target === "function" ? target() : target;
};
var getFocusableElements = (container) => {
  const elements = Array.from(container.querySelectorAll(focusableSelector));
  return elements.filter((element) => {
    if (element.hasAttribute("disabled")) {
      return false;
    }
    return element.tabIndex >= 0 && element.getClientRects().length > 0;
  });
};
var createModalController = (id, manager, options) => {
  const behavior = {
    ...defaultBehavior,
    ...options
  };
  let isActive = false;
  let cleanupFns = [];
  let lastFocused = null;
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
  const handleKeyDown = (event) => {
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
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const handleOverlayClick = (event) => {
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
    lastFocused = document?.activeElement ?? null;
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
export {
  createModalController,
  createModalManager
};
