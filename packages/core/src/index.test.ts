// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createModalController, createModalManager } from "./index";

const makeFocusable = (element: HTMLElement) => {
  element.getClientRects = () => [{}, {}] as unknown as DOMRectList;
  return element;
};

describe("createModalManager", () => {
  it("tracks open and close states", () => {
    const manager = createModalManager();

    expect(manager.isOpen("demo")).toBe(false);

    manager.open("demo");
    expect(manager.isOpen("demo")).toBe(true);

    manager.close("demo");
    expect(manager.isOpen("demo")).toBe(false);
  });

  it("maintains stack order and options", () => {
    const manager = createModalManager();

    manager.open("first");
    manager.open("second", { closeOnEsc: false });
    expect(manager.getState().stack).toEqual(["first", "second"]);
    expect(manager.getState().topId).toBe("second");
    expect(manager.getOptions("second")?.closeOnEsc).toBe(false);

    manager.open("first");
    expect(manager.getState().stack).toEqual(["second", "first"]);
    expect(manager.getState().topId).toBe("first");
  });
});

describe("modal DOM behavior", () => {
  it("closes on Escape when enabled", () => {
    const manager = createModalManager();
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(overlay, container);

    const controller = createModalController("esc", manager, { container, overlay });
    controller.open();
    expect(controller.isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(controller.isOpen()).toBe(false);

    controller.destroy();
  });

  it("closes when clicking the overlay", () => {
    const manager = createModalManager();
    const overlay = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(overlay, container);

    const controller = createModalController("overlay", manager, { container, overlay });
    controller.open();
    expect(controller.isOpen()).toBe(true);

    overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(controller.isOpen()).toBe(false);

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
});
