// src/index.ts
import { LitElement, css, html } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import {
  createModalController,
  createModalManager
} from "@modal-kit/core";
import { modalClassNames, themeClassNames } from "@modal-kit/ui";
var ModalKitHost = class extends LitElement {
  constructor() {
    super(...arguments);
    this.manager = createModalManager();
  }
  open(id) {
    this.manager.open(id);
    this.requestUpdate();
  }
  close(id) {
    this.manager.close(id);
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
var ModalKitConfirm = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "";
    this.description = "";
    this.details = "";
    this.confirmLabel = "Confirm";
    this.cancelLabel = "Cancel";
    this.variant = "approve";
    this.preset = "";
    this.icon = "";
    this.theme = "brutalist";
    this.manager = createModalManager();
    this.controller = null;
    this.panelRef = createRef();
    this.overlayRef = createRef();
    this.confirmButtonRef = createRef();
  }
  createRenderRoot() {
    return this;
  }
  firstUpdated() {
    if (!this.panelRef.value) {
      return;
    }
    this.controller = createModalController("confirm", this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? void 0,
      initialFocus: () => this.confirmButtonRef.value ?? null
    });
  }
  disconnectedCallback() {
    this.controller?.destroy();
    super.disconnectedCallback();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this.manager.open("confirm");
      } else {
        this.manager.close("confirm");
      }
    }
  }
  handleCancel() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("cancel"));
  }
  handleConfirm() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("confirm"));
  }
  render() {
    if (!this.open) {
      return null;
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
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]} ${modalClassNames.confirmVariant}"
        data-variant=${resolvedVariant}
      >
        <div class=${modalClassNames.overlay} ${ref(this.overlayRef)}>
          <div
            class=${modalClassNames.panel}
            ${ref(this.panelRef)}
          >
            <div class=${modalClassNames.header}>
              <div class=${modalClassNames.icon}>${resolvedIcon}</div>
              <div class=${modalClassNames.text}>
                <div class=${modalClassNames.title}>${resolvedTitle}</div>
                ${resolvedDescription ? html`<div class=${modalClassNames.description}>${resolvedDescription}</div>` : null}
                ${this.details ? html`<div class=${modalClassNames.details}>${this.details}</div>` : null}
              </div>
            </div>
            <div class=${modalClassNames.actions}>
              <button
                class="${modalClassNames.button} ${modalClassNames.cancelButton}"
                type="button"
                @click=${this.handleCancel}
              >
                ${resolvedCancel}
              </button>
              <button
                class="${modalClassNames.button} ${modalClassNames.confirmButton}"
                type="button"
                @click=${this.handleConfirm}
                ${ref(this.confirmButtonRef)}
              >
                ${resolvedConfirm}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitConfirm.properties = {
  open: { type: Boolean, reflect: true },
  title: { type: String },
  description: { type: String },
  details: { type: String },
  confirmLabel: { type: String, attribute: "confirm-label" },
  cancelLabel: { type: String, attribute: "cancel-label" },
  variant: { type: String },
  preset: { type: String },
  icon: { type: String },
  theme: { type: String }
};
ModalKitConfirm.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-confirm", ModalKitConfirm);
var ModalKitDrawer = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "";
    this.description = "";
    this.side = "right";
    this.theme = "brutalist";
    this.manager = createModalManager();
    this.controller = null;
    this.panelRef = createRef();
    this.overlayRef = createRef();
  }
  createRenderRoot() {
    return this;
  }
  firstUpdated() {
    if (!this.panelRef.value) {
      return;
    }
    this.controller = createModalController("drawer", this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? void 0
    });
  }
  disconnectedCallback() {
    this.controller?.destroy();
    super.disconnectedCallback();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this.manager.open("drawer");
      } else {
        this.manager.close("drawer");
      }
    }
  }
  handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
  render() {
    if (!this.open) {
      return null;
    }
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]} ${modalClassNames.drawerVariant}"
        data-side=${this.side}
      >
        <div class=${modalClassNames.overlay} ${ref(this.overlayRef)}>
          <div class=${modalClassNames.panel} ${ref(this.panelRef)}>
            ${this.title ? html`
                  <div class=${modalClassNames.header}>
                    <div class=${modalClassNames.text}>
                      <div class=${modalClassNames.title}>${this.title}</div>
                      ${this.description ? html`<div class=${modalClassNames.description}>${this.description}</div>` : null}
                    </div>
                  </div>
                ` : null}
            <div class=${modalClassNames.details}><slot></slot></div>
            <div class=${modalClassNames.actions}>
              <button
                class="${modalClassNames.button} ${modalClassNames.cancelButton}"
                type="button"
                @click=${this.handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitDrawer.properties = {
  open: { type: Boolean, reflect: true },
  title: { type: String },
  description: { type: String },
  side: { type: String },
  theme: { type: String }
};
ModalKitDrawer.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-drawer", ModalKitDrawer);
var ModalKitPopover = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "";
    this.description = "";
    this.anchor = "";
    this.theme = "brutalist";
    this.manager = createModalManager();
    this.controller = null;
    this.panelRef = createRef();
    this.overlayRef = createRef();
    this.positionRaf = 0;
    this.handleViewportChange = () => this.schedulePosition();
  }
  createRenderRoot() {
    return this;
  }
  firstUpdated() {
    if (!this.panelRef.value) {
      return;
    }
    this.controller = createModalController("popover", this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? void 0,
      trapFocus: false,
      lockScroll: false
    });
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, true);
  }
  disconnectedCallback() {
    this.controller?.destroy();
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    if (this.positionRaf) {
      cancelAnimationFrame(this.positionRaf);
      this.positionRaf = 0;
    }
    super.disconnectedCallback();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this.manager.open("popover");
        this.updateComplete.then(() => this.schedulePosition());
      } else {
        this.manager.close("popover");
      }
    }
    if (changed.has("anchor")) {
      this.schedulePosition();
    }
  }
  handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
  schedulePosition() {
    if (this.positionRaf) {
      cancelAnimationFrame(this.positionRaf);
    }
    this.positionRaf = requestAnimationFrame(() => {
      this.positionRaf = 0;
      this.updatePosition();
      const panel = this.panelRef.value;
      if (panel && panel.offsetWidth === 0) {
        this.schedulePosition();
      }
    });
  }
  updatePosition() {
    const panel = this.panelRef.value;
    if (!panel || !this.anchor) {
      return;
    }
    const anchorEl = document.querySelector(this.anchor);
    if (!anchorEl) {
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const panelWidth = panel.offsetWidth || 280;
    const top = rect.bottom + 8 + window.scrollY;
    const left = Math.min(
      rect.left + window.scrollX,
      window.scrollX + window.innerWidth - panelWidth - 12
    );
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }
  render() {
    if (!this.open) {
      return null;
    }
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]} ${modalClassNames.popoverVariant}"
      >
        <div class=${modalClassNames.overlay} ${ref(this.overlayRef)}>
          <div class=${modalClassNames.panel} ${ref(this.panelRef)}>
            ${this.title ? html`
                  <div class=${modalClassNames.header}>
                    <div class=${modalClassNames.text}>
                      <div class=${modalClassNames.title}>${this.title}</div>
                      ${this.description ? html`<div class=${modalClassNames.description}>${this.description}</div>` : null}
                    </div>
                  </div>
                ` : null}
            <div class=${modalClassNames.details}><slot></slot></div>
            <div class=${modalClassNames.actions}>
              <button
                class="${modalClassNames.button} ${modalClassNames.cancelButton}"
                type="button"
                @click=${this.handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitPopover.properties = {
  open: { type: Boolean, reflect: true },
  title: { type: String },
  description: { type: String },
  anchor: { type: String },
  theme: { type: String }
};
ModalKitPopover.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-popover", ModalKitPopover);
var ModalKitCommand = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "Command palette";
    this.description = "";
    this.placeholder = "Type a command";
    this.theme = "brutalist";
    this.manager = createModalManager();
    this.controller = null;
    this.panelRef = createRef();
    this.overlayRef = createRef();
    this.inputRef = createRef();
  }
  createRenderRoot() {
    return this;
  }
  firstUpdated() {
    if (!this.panelRef.value) {
      return;
    }
    this.controller = createModalController("command", this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? void 0,
      initialFocus: () => this.inputRef.value ?? null
    });
  }
  disconnectedCallback() {
    this.controller?.destroy();
    super.disconnectedCallback();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this.manager.open("command");
      } else {
        this.manager.close("command");
      }
    }
  }
  handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
  render() {
    if (!this.open) {
      return null;
    }
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]} ${modalClassNames.commandVariant}"
      >
        <div class=${modalClassNames.overlay} ${ref(this.overlayRef)}>
          <div class=${modalClassNames.panel} ${ref(this.panelRef)}>
            <div class=${modalClassNames.header}>
              <div class=${modalClassNames.text}>
                <div class=${modalClassNames.title}>${this.title}</div>
                ${this.description ? html`<div class=${modalClassNames.description}>${this.description}</div>` : null}
              </div>
            </div>
            <div class="mk-command">
              <input
                class="mk-command__input"
                ${ref(this.inputRef)}
                placeholder=${this.placeholder}
              />
              <slot></slot>
            </div>
            <div class=${modalClassNames.actions}>
              <button
                class="${modalClassNames.button} ${modalClassNames.cancelButton}"
                type="button"
                @click=${this.handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitCommand.properties = {
  open: { type: Boolean, reflect: true },
  title: { type: String },
  description: { type: String },
  placeholder: { type: String },
  theme: { type: String }
};
ModalKitCommand.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-command", ModalKitCommand);
var ModalKitToast = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "Toast";
    this.description = "";
    this.duration = 2600;
    this.theme = "brutalist";
    this.dismissTimer = null;
  }
  createRenderRoot() {
    return this;
  }
  disconnectedCallback() {
    if (this.dismissTimer) {
      window.clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    super.disconnectedCallback();
  }
  updated(changed) {
    if (changed.has("open") && this.open && this.duration > 0) {
      if (this.dismissTimer) {
        window.clearTimeout(this.dismissTimer);
      }
      this.dismissTimer = window.setTimeout(() => {
        this.open = false;
        this.dispatchEvent(new CustomEvent("close"));
      }, this.duration);
    }
  }
  handleClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
  render() {
    if (!this.open) {
      return null;
    }
    return html`
      <div
        class="${modalClassNames.root} ${themeClassNames[this.theme]} ${modalClassNames.toastVariant}"
      >
        <div class=${modalClassNames.overlay}>
          <div class=${modalClassNames.panel} role="status" aria-live="polite">
            <div class="mk-toast__title">${this.title}</div>
            ${this.description ? html`<div class="mk-toast__description">${this.description}</div>` : null}
            <button class="mk-toast__close" type="button" @click=${this.handleClose}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
ModalKitToast.properties = {
  open: { type: Boolean, reflect: true },
  title: { type: String },
  description: { type: String },
  duration: { type: Number },
  theme: { type: String }
};
ModalKitToast.styles = css`
    :host {
      display: contents;
    }
  `;
customElements.define("modal-kit-toast", ModalKitToast);
export {
  ModalKitCommand,
  ModalKitConfirm,
  ModalKitDrawer,
  ModalKitHost,
  ModalKitPopover,
  ModalKitToast
};
