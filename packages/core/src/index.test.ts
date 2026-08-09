// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createModalController, createModalManager } from "./index";

const makeFocusable = (element: HTMLElement) => {
  element.getClientRects = () => [{}, {}] as unknown as DOMRectList;
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("createModalManager", () => {
  it("tracks open and close states", () => {
    const manager = createModalManager();

    expect(manager.isOpen("demo")).toBe(false);

    manager.open("demo");
    expect(manager.isOpen("demo")).toBe(true);

    manager.close("demo");
    expect(manager.isOpen("demo")).toBe(false);
  });

  it("maintains stack order, layers, and options", () => {
    const manager = createModalManager();

    manager.open("first");
    manager.open("second", { closeOnEsc: false });
    expect(manager.getState().stack).toEqual(["first", "second"]);
    expect(manager.getState().topId).toBe("second");
    expect(manager.getLayer("first")).toBe(0);
    expect(manager.getLayer("second")).toBe(1);
    expect(manager.getOptions("second")?.closeOnEsc).toBe(false);

    manager.open("first");
    expect(manager.getState().stack).toEqual(["second", "first"]);
    expect(manager.getState().topId).toBe("first");
    expect(manager.getLayer("first")).toBe(1);
  });

  it("records close reasons", () => {
    const manager = createModalManager();
    manager.open("a");
    manager.close("a", "action");
    expect(manager.getLastCloseReason("a")).toBe("action");
  });

  it("handles rapid open and close", () => {
    const manager = createModalManager();
    manager.open("x");
    manager.close("x");
    manager.open("x");
    manager.open("y");
    manager.close("x");
    expect(manager.getState().stack).toEqual(["y"]);
    expect(manager.isOpen("x")).toBe(false);
  });
});

describe("modal DOM behavior", () => {
  it("closes on Escape when enabled and records reason", () => {
    const manager = createModalManager();
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(overlay, container);

    const controller = createModalController("esc", manager, { container, overlay });
    controller.open();
    expect(controller.isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(controller.isOpen()).toBe(false);
    expect(manager.getLastCloseReason("esc")).toBe("escape");

    controller.destroy();
  });

  it("only top modal handles Escape", () => {
    const manager = createModalManager();
    const overlayA = document.createElement("div");
    const containerA = document.createElement("div");
    const overlayB = document.createElement("div");
    const containerB = document.createElement("div");
    document.body.append(overlayA, containerA, overlayB, containerB);

    const a = createModalController("a", manager, { container: containerA, overlay: overlayA });
    const b = createModalController("b", manager, { container: containerB, overlay: overlayB });
    a.open();
    b.open();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(manager.isOpen("a")).toBe(true);
    expect(manager.isOpen("b")).toBe(false);

    a.destroy();
    b.destroy();
  });

  it("closes when clicking the overlay with overlay reason", () => {
    const manager = createModalManager();
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(overlay, container);

    const controller = createModalController("overlay", manager, { container, overlay });
    controller.open();
    expect(controller.isOpen()).toBe(true);

    overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(controller.isOpen()).toBe(false);
    expect(manager.getLastCloseReason("overlay")).toBe("overlay");

    controller.destroy();
  });

  it("auto-closes after closeAfterMs with timeout reason", () => {
    vi.useFakeTimers();
    const manager = createModalManager();
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(overlay, container);

    const controller = createModalController("timeout", manager, {
      container,
      overlay,
      closeAfterMs: 100
    });
    controller.open();
    expect(controller.isOpen()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(controller.isOpen()).toBe(false);
    expect(manager.getLastCloseReason("timeout")).toBe("timeout");

    controller.destroy();
  });

  it("traps focus within the container", () => {
    const manager = createModalManager();
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    const first = makeFocusable(document.createElement("button"));
    const last = makeFocusable(document.createElement("button"));
    container.append(first, last);
    document.body.append(overlay, container);

    const controller = createModalController("focus", manager, { container, overlay });
    controller.open();

    last.focus();
    const forward = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    first.focus();
    const backward = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    controller.destroy();
  });

  it("sets layer attributes on root", () => {
    const manager = createModalManager();
    const root = document.createElement("div");
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    root.append(overlay, container);
    document.body.append(root);

    const controller = createModalController("layer", manager, { container, overlay, root });
    controller.open();
    expect(root.getAttribute("data-layer")).toBe("0");
    expect(root.style.getPropertyValue("--mk-layer")).toBe("0");

    controller.destroy();
  });
});
