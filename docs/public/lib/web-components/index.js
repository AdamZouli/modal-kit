// src/index.ts
import { LitElement, css, html, nothing } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import {
  createModalController,
  createModalManager
} from "@modal-kit/core";
import { MODAL_EXIT_MS, modalClassNames, themeClassNames } from "@modal-kit/ui";
var HOST_MANAGER = /* @__PURE__ */ Symbol("modal-kit-host-manager");
var findHostManager = (el) => {
  let node = el;
  while (node) {
    const host = node;
    if (host.getManager) {
      return host.getManager();
    }
    if (host[HOST_MANAGER]) {
      return host[HOST_MANAGER];
    }
    node = node.parentElement;
  }
  return null;
};
var wcIdSeq = 0;
var nextId = (prefix) => `${prefix}-${++wcIdSeq}`;
var ModalKitHost = class extends LitElement {
  constructor() {
    super(...arguments);
    this.manager = createModalManager();
  }
  connectedCallback() {
    super.connectedCallback();
    this[HOST_MANAGER] = this.manager;
  }
  getManager() {
    return this.manager;
  }
  open(id) {
    this.manager.open(id);
    this.requestUpdate();
  }
  close(id, reason = "programmatic") {
    this.manager.close(id, reason);
    this.requestUpdate();
  }
  isOpen(id) {
    return this.manager.isOpen(id);
  }
  render() {
    return html`<slot></slot>`;
  }
};
ModalKitHost.styles = css`
    :host {
      display: block;
    }
  `;
customElements.define("modal-kit-host", ModalKitHost);
var ModalKitDialog = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.modalId = "";
    this.theme = "brutalist";
    this.labelledBy = "";
    this.describedBy = "";
    this.manager = null;
    this.controller = null;
    this.panelRef = createRef();
    this.overlayRef = createRef();
    this.rootRef = createRef();
    this.resolvedId = "";
    this.visible = false;
    this.dataState = "closed";
    this.exitTimer = null;
    this.unsubscribe = null;
  }
  createRenderRoot() {
    return this;
  }
  connectedCallback() {
    super.connectedCallback();
    this.resolvedId = this.modalId || nextId("mk-dialog");
    this.manager = findHostManager(this) ?? createModalManager();
    this.unsubscribe = this.manager.subscribe(() => this.syncFromManager());
  }
  disconnectedCallback() {
    this.controller?.destroy();
    this.unsubscribe?.();
    if (this.exitTimer) {
      window.clearTimeout(this.exitTimer);
    }
    super.disconnectedCallback();
  }
  firstUpdated() {
    this.ensureController();
    this.syncFromManager();
  }
  updated(changed) {
    if (changed.has("open") && this.manager) {
      if (this.open) {
        this.manager.open(this.resolvedId);
      } else if (this.manager.isOpen(this.resolvedId)) {
        this.manager.close(this.resolvedId, "programmatic");
      }
    }
    this.ensureController();
  }
  ensureController() {
    if (!this.manager || !this.panelRef.value || this.controller) {
      return;
    }
    this.controller = createModalController(this.resolvedId, this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? void 0,
      root: this.rootRef.value ?? void 0,
      labelledBy: this.labelledBy || void 0,
      describedBy: this.describedBy || void 0
    });
  }
  syncFromManager() {
    if (!this.manager) {
      return;
    }
    const isOpen = this.manager.isOpen(this.resolvedId);
    if (isOpen) {
      this.visible = true;
      this.dataState = "open";
      this.open = true;
      if (this.exitTimer) {
        window.clearTimeout(this.exitTimer);
        this.exitTimer = null;
      }
    } else if (this.visible) {
      this.dataState = "closed";
      this.open = false;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      this.exitTimer = window.setTimeout(
        () => {
          this.visible = false;
          this.requestUpdate();
        },
        reduced ? 0 : MODAL_EXIT_MS
      );
    }
    this.requestUpdate();
  }
  render() {
    if (!this.visible) {
      return nothing;
    }
    const layer = this.manager?.getLayer(this.resolvedId) ?? 0;
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]}"
        data-state=${this.dataState}
        data-layer=${Math.max(layer, 0)}
        style="--mk-layer: ${Math.max(layer, 0)}"
        ${ref(this.rootRef)}
      >
        <div class=${modalClassNames.overlay} ${ref(this.overlayRef)}>
          <div
            class=${modalClassNames.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby=${this.labelledBy || nothing}
            aria-describedby=${this.describedBy || nothing}
            ${ref(this.panelRef)}
          >
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitDialog.properties = {
  open: { type: Boolean, reflect: true },
  modalId: { type: String, attribute: "modal-id" },
  theme: { type: String },
  labelledBy: { type: String, attribute: "labelled-by" },
  describedBy: { type: String, attribute: "described-by" }
};
ModalKitDialog.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-dialog", ModalKitDialog);
var ModalKitConfirm = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.modalId = "";
    this.title = "";
    this.description = "";
    this.details = "";
    this.confirmLabel = "Confirm";
    this.cancelLabel = "Cancel";
    this.variant = "approve";
    this.preset = "";
    this.icon = "";
    this.theme = "brutalist";
    this.hideCancel = false;
    this.manager = null;
    this.controller = null;
    this.panelRef = createRef();
    this.overlayRef = createRef();
    this.rootRef = createRef();
    this.confirmButtonRef = createRef();
    this.resolvedId = "";
    this.titleId = "";
    this.descId = "";
    this.visible = false;
    this.dataState = "closed";
    this.exitTimer = null;
    this.unsubscribe = null;
    this.status = "idle";
    this.asyncError = null;
  }
  createRenderRoot() {
    return this;
  }
  connectedCallback() {
    super.connectedCallback();
    this.resolvedId = this.modalId || nextId("mk-confirm");
    this.titleId = `${this.resolvedId}-title`;
    this.descId = `${this.resolvedId}-desc`;
    this.manager = findHostManager(this) ?? createModalManager();
    this.unsubscribe = this.manager.subscribe(() => this.syncFromManager());
  }
  disconnectedCallback() {
    this.controller?.destroy();
    this.unsubscribe?.();
    if (this.exitTimer) {
      window.clearTimeout(this.exitTimer);
    }
    super.disconnectedCallback();
  }
  firstUpdated() {
    this.ensureController();
    this.syncFromManager();
  }
  updated(changed) {
    if (changed.has("open") && this.manager) {
      if (this.open) {
        this.status = "idle";
        this.asyncError = null;
        this.manager.open(this.resolvedId);
      } else if (this.manager.isOpen(this.resolvedId)) {
        this.manager.close(this.resolvedId, "programmatic");
      }
    }
    this.ensureController();
  }
  ensureController() {
    if (!this.manager || !this.panelRef.value || this.controller) {
      return;
    }
    this.controller = createModalController(this.resolvedId, this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? void 0,
      root: this.rootRef.value ?? void 0,
      initialFocus: () => this.confirmButtonRef.value ?? null,
      labelledBy: this.titleId,
      describedBy: this.descId
    });
  }
  syncFromManager() {
    if (!this.manager) {
      return;
    }
    const isOpen = this.manager.isOpen(this.resolvedId);
    if (isOpen) {
      this.visible = true;
      this.dataState = "open";
      this.open = true;
      if (this.exitTimer) {
        window.clearTimeout(this.exitTimer);
        this.exitTimer = null;
      }
    } else if (this.visible) {
      this.dataState = "closed";
      this.open = false;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      this.exitTimer = window.setTimeout(
        () => {
          this.visible = false;
          this.requestUpdate();
        },
        reduced ? 0 : MODAL_EXIT_MS
      );
    }
    this.requestUpdate();
  }
  handleCancel() {
    if (this.status === "loading" || this.status === "success") {
      return;
    }
    this.manager?.close(this.resolvedId, "action");
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true }));
  }
  async handleConfirm() {
    const detail = { waitUntil: (p) => p };
    this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, detail }));
    const maybePromise = detail.promise;
    if (maybePromise) {
      this.status = "loading";
      this.asyncError = null;
      this.requestUpdate();
      try {
        await maybePromise;
        this.status = "success";
        this.requestUpdate();
        window.setTimeout(() => {
          this.status = "idle";
          this.manager?.close(this.resolvedId, "action");
        }, 600);
      } catch (err) {
        this.status = "error";
        this.asyncError = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        this.requestUpdate();
      }
      return;
    }
    this.manager?.close(this.resolvedId, "action");
  }
  handleRetry() {
    this.asyncError = null;
    this.status = "idle";
    this.requestUpdate();
    void this.handleConfirm();
  }
  render() {
    if (!this.visible) {
      return nothing;
    }
    const preset = this.preset === "delete" ? {
      title: "Delete this item?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "destructive",
      icon: "!"
    } : this.preset === "approve" ? {
      title: "Approve this change?",
      description: "It will be applied immediately.",
      confirmLabel: "Approve",
      cancelLabel: "Cancel",
      variant: "approve",
      icon: "+"
    } : null;
    const resolvedTitle = this.title || preset?.title || "Confirm action";
    const resolvedDescription = this.description || preset?.description || "";
    const resolvedConfirm = this.confirmLabel || preset?.confirmLabel || "Confirm";
    const resolvedCancel = this.cancelLabel || preset?.cancelLabel || "Cancel";
    const resolvedVariant = this.variant || preset?.variant || "approve";
    const resolvedIcon = this.icon || preset?.icon || "?";
    const layer = this.manager?.getLayer(this.resolvedId) ?? 0;
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]} ${modalClassNames.confirmVariant}"
        data-variant=${resolvedVariant}
        data-state=${this.dataState}
        data-layer=${Math.max(layer, 0)}
        style="--mk-layer: ${Math.max(layer, 0)}"
        ${ref(this.rootRef)}
      >
        <div class=${modalClassNames.overlay} ${ref(this.overlayRef)}>
          <div
            class=${modalClassNames.panel}
            aria-labelledby=${this.titleId}
            aria-describedby=${resolvedDescription ? this.descId : nothing}
            ${ref(this.panelRef)}
          >
            <div class=${modalClassNames.header}>
              <div class=${modalClassNames.icon} aria-hidden="true">${resolvedIcon}</div>
              <div class=${modalClassNames.text}>
                <div class=${modalClassNames.title} id=${this.titleId}>${resolvedTitle}</div>
                ${resolvedDescription ? html`<div class=${modalClassNames.description} id=${this.descId}>
                      ${resolvedDescription}
                    </div>` : nothing}
                ${this.details ? html`<div class=${modalClassNames.details}>${this.details}</div>` : nothing}
              </div>
            </div>
            ${this.asyncError ? html`<div class=${modalClassNames.asyncError} role="alert">${this.asyncError}</div>` : nothing}
            ${this.status === "success" ? html`<div class=${modalClassNames.asyncSuccess} role="status">Done</div>` : nothing}
            <div class=${modalClassNames.actions}>
              ${!this.hideCancel ? html`<button
                    class="${modalClassNames.button} ${modalClassNames.cancelButton}"
                    type="button"
                    ?disabled=${this.status === "loading" || this.status === "success"}
                    @click=${this.handleCancel}
                  >
                    ${resolvedCancel}
                  </button>` : nothing}
              ${this.status === "error" ? html`<button
                    class="${modalClassNames.button} ${modalClassNames.confirmButton}"
                    type="button"
                    @click=${this.handleRetry}
                    ${ref(this.confirmButtonRef)}
                  >
                    Retry
                  </button>` : html`<button
                    class="${modalClassNames.button} ${modalClassNames.confirmButton}"
                    type="button"
                    ?disabled=${this.status === "loading" || this.status === "success"}
                    aria-busy=${this.status === "loading"}
                    @click=${this.handleConfirm}
                    ${ref(this.confirmButtonRef)}
                  >
                    ${this.status === "loading" ? "\u2026" : resolvedConfirm}
                  </button>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitConfirm.properties = {
  open: { type: Boolean, reflect: true },
  modalId: { type: String, attribute: "modal-id" },
  title: { type: String },
  description: { type: String },
  details: { type: String },
  confirmLabel: { type: String, attribute: "confirm-label" },
  cancelLabel: { type: String, attribute: "cancel-label" },
  variant: { type: String },
  preset: { type: String },
  icon: { type: String },
  theme: { type: String },
  hideCancel: { type: Boolean, attribute: "hide-cancel" }
};
ModalKitConfirm.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-confirm", ModalKitConfirm);
export {
  ModalKitConfirm,
  ModalKitDialog,
  ModalKitHost
};
