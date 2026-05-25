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
export {
  ModalKitConfirm,
  ModalKitHost
};
