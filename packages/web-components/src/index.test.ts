// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import "./index";
import { ModalKitConfirm, ModalKitDialog, ModalKitHost } from "./index";

describe("web components", () => {
  it("registers elements", () => {
    expect(customElements.get("modal-kit-host")).toBe(ModalKitHost);
    expect(customElements.get("modal-kit-confirm")).toBe(ModalKitConfirm);
    expect(customElements.get("modal-kit-dialog")).toBe(ModalKitDialog);
  });

  it("shares manager between host and confirm", async () => {
    const host = document.createElement("modal-kit-host") as ModalKitHost;
    const confirm = document.createElement("modal-kit-confirm") as ModalKitConfirm;
    confirm.setAttribute("modal-id", "shared");
    confirm.title = "Shared confirm";
    host.append(confirm);
    document.body.append(host);
    await host.updateComplete;
    await confirm.updateComplete;

    host.open("shared");
    await confirm.updateComplete;
    expect(host.isOpen("shared")).toBe(true);
    expect(confirm.open).toBe(true);
    expect(host.textContent).toContain("Shared confirm");

    host.close("shared");
    await confirm.updateComplete;
    // exit animation may keep visible briefly; manager state is closed
    expect(host.isOpen("shared")).toBe(false);

    host.remove();
  });

  it("renders dialog shell with slot content", async () => {
    const host = document.createElement("modal-kit-host") as ModalKitHost;
    const dialog = document.createElement("modal-kit-dialog") as ModalKitDialog;
    dialog.setAttribute("modal-id", "dlg");
    dialog.innerHTML = "<p>Custom body</p>";
    host.append(dialog);
    document.body.append(host);
    await host.updateComplete;
    await dialog.updateComplete;

    dialog.open = true;
    await dialog.updateComplete;
    expect(host.isOpen("dlg")).toBe(true);
    expect(host.textContent).toContain("Custom body");

    host.remove();
  });
});
