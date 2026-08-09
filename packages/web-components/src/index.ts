import { LitElement, css, html, nothing } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import {
  createModalController,
  createModalManager,
  type ModalCloseReason,
  type ModalManager
} from "@modal-kit/core";
import { MODAL_EXIT_MS, modalClassNames, themeClassNames, type ModalTheme } from "@modal-kit/ui";

const HOST_MANAGER = Symbol("modal-kit-host-manager");

type HostWithManager = HTMLElement & { [HOST_MANAGER]?: ModalManager; getManager?: () => ModalManager };

const findHostManager = (el: HTMLElement): ModalManager | null => {
  let node: HTMLElement | null = el;
  while (node) {
    const host = node as HostWithManager;
    if (host.getManager) {
      return host.getManager();
    }
    if (host[HOST_MANAGER]) {
      return host[HOST_MANAGER]!;
    }
    node = node.parentElement;
  }
  return null;
};

let wcIdSeq = 0;
const nextId = (prefix: string) => `${prefix}-${++wcIdSeq}`;

export class ModalKitHost extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  private manager: ModalManager = createModalManager();

  connectedCallback() {
    super.connectedCallback();
    (this as HostWithManager)[HOST_MANAGER] = this.manager;
  }

  getManager() {
    return this.manager;
  }

  open(id: string) {
    this.manager.open(id);
    this.requestUpdate();
  }

  close(id: string, reason: ModalCloseReason = "programmatic") {
    this.manager.close(id, reason);
    this.requestUpdate();
  }

  isOpen(id: string) {
    return this.manager.isOpen(id);
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define("modal-kit-host", ModalKitHost);

type ThemeName = ModalTheme;

export class ModalKitDialog extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    modalId: { type: String, attribute: "modal-id" },
    theme: { type: String },
    labelledBy: { type: String, attribute: "labelled-by" },
    describedBy: { type: String, attribute: "described-by" }
  };

  static styles = css`
    :host {
      display: contents;
    }
  `;

  createRenderRoot() {
    return this;
  }

  open = false;
  modalId = "";
  theme: ThemeName = "brutalist";
  labelledBy = "";
  describedBy = "";

  private manager: ModalManager | null = null;
  private controller: ReturnType<typeof createModalController> | null = null;
  private panelRef = createRef<HTMLDivElement>();
  private overlayRef = createRef<HTMLDivElement>();
  private rootRef = createRef<HTMLDivElement>();
  private resolvedId = "";
  private visible = false;
  private dataState: "open" | "closed" = "closed";
  private exitTimer: number | null = null;
  private unsubscribe: (() => void) | null = null;

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

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.manager) {
      if (this.open) {
        this.manager.open(this.resolvedId);
      } else if (this.manager.isOpen(this.resolvedId)) {
        this.manager.close(this.resolvedId, "programmatic");
      }
    }
    this.ensureController();
  }

  private ensureController() {
    if (!this.manager || !this.panelRef.value || this.controller) {
      return;
    }
    this.controller = createModalController(this.resolvedId, this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? undefined,
      root: this.rootRef.value ?? undefined,
      labelledBy: this.labelledBy || undefined,
      describedBy: this.describedBy || undefined
    });
  }

  private syncFromManager() {
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
}

customElements.define("modal-kit-dialog", ModalKitDialog);

export class ModalKitConfirm extends LitElement {
  static properties = {
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

  static styles = css`
    :host {
      display: contents;
    }
  `;

  createRenderRoot() {
    return this;
  }

  open = false;
  modalId = "";
  title = "";
  description = "";
  details = "";
  confirmLabel = "Confirm";
  cancelLabel = "Cancel";
  variant: "destructive" | "approve" | "info" = "approve";
  preset: "delete" | "approve" | "" = "";
  icon = "";
  theme: ThemeName = "brutalist";
  hideCancel = false;

  private manager: ModalManager | null = null;
  private controller: ReturnType<typeof createModalController> | null = null;
  private panelRef = createRef<HTMLDivElement>();
  private overlayRef = createRef<HTMLDivElement>();
  private rootRef = createRef<HTMLDivElement>();
  private confirmButtonRef = createRef<HTMLButtonElement>();
  private resolvedId = "";
  private titleId = "";
  private descId = "";
  private visible = false;
  private dataState: "open" | "closed" = "closed";
  private exitTimer: number | null = null;
  private unsubscribe: (() => void) | null = null;
  private status: "idle" | "loading" | "error" | "success" = "idle";
  private asyncError: string | null = null;

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

  updated(changed: Map<string, unknown>) {
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

  private ensureController() {
    if (!this.manager || !this.panelRef.value || this.controller) {
      return;
    }
    this.controller = createModalController(this.resolvedId, this.manager, {
      container: this.panelRef.value,
      overlay: this.overlayRef.value ?? undefined,
      root: this.rootRef.value ?? undefined,
      initialFocus: () => this.confirmButtonRef.value ?? null,
      labelledBy: this.titleId,
      describedBy: this.descId
    });
  }

  private syncFromManager() {
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

  private handleCancel() {
    if (this.status === "loading" || this.status === "success") {
      return;
    }
    this.manager?.close(this.resolvedId, "action");
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true }));
  }

  private async handleConfirm() {
    const detail = { waitUntil: (p: Promise<void>) => p };
    this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, detail }));

    // If listeners attach async work via detail.waitUntil pattern consumers can await;
    // for parity, also support returning promise from event.detail.promise
    const maybePromise = (detail as { promise?: Promise<void> }).promise;
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

  private handleRetry() {
    this.asyncError = null;
    this.status = "idle";
    this.requestUpdate();
    void this.handleConfirm();
  }

  render() {
    if (!this.visible) {
      return nothing;
    }

    const preset =
      this.preset === "delete"
        ? {
            title: "Delete this item?",
            description: "This action cannot be undone.",
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
            variant: "destructive" as const,
            icon: "!"
          }
        : this.preset === "approve"
          ? {
              title: "Approve this change?",
              description: "It will be applied immediately.",
              confirmLabel: "Approve",
              cancelLabel: "Cancel",
              variant: "approve" as const,
              icon: "+"
            }
          : null;

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
                ${resolvedDescription
                  ? html`<div class=${modalClassNames.description} id=${this.descId}>
                      ${resolvedDescription}
                    </div>`
                  : nothing}
                ${this.details
                  ? html`<div class=${modalClassNames.details}>${this.details}</div>`
                  : nothing}
              </div>
            </div>
            ${this.asyncError
              ? html`<div class=${modalClassNames.asyncError} role="alert">${this.asyncError}</div>`
              : nothing}
            ${this.status === "success"
              ? html`<div class=${modalClassNames.asyncSuccess} role="status">Done</div>`
              : nothing}
            <div class=${modalClassNames.actions}>
              ${!this.hideCancel
                ? html`<button
                    class="${modalClassNames.button} ${modalClassNames.cancelButton}"
                    type="button"
                    ?disabled=${this.status === "loading" || this.status === "success"}
                    @click=${this.handleCancel}
                  >
                    ${resolvedCancel}
                  </button>`
                : nothing}
              ${this.status === "error"
                ? html`<button
                    class="${modalClassNames.button} ${modalClassNames.confirmButton}"
                    type="button"
                    @click=${this.handleRetry}
                    ${ref(this.confirmButtonRef)}
                  >
                    Retry
                  </button>`
                : html`<button
                    class="${modalClassNames.button} ${modalClassNames.confirmButton}"
                    type="button"
                    ?disabled=${this.status === "loading" || this.status === "success"}
                    aria-busy=${this.status === "loading"}
                    @click=${this.handleConfirm}
                    ${ref(this.confirmButtonRef)}
                  >
                    ${this.status === "loading" ? "…" : resolvedConfirm}
                  </button>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("modal-kit-confirm", ModalKitConfirm);
