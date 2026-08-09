// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import {
  ConfirmModal,
  Modal,
  ModalBody,
  ModalHeader,
  ModalKitPlugin,
  MultiStepConfirm,
  useModal
} from "./index";

describe("vue adapters", () => {
  it("exposes plugin and helpers", () => {
    expect(typeof ModalKitPlugin).toBe("object");
    expect(typeof useModal).toBe("function");
  });

  it("opens ConfirmModal and confirms", async () => {
    let confirmed = false;
    const Root = defineComponent({
      setup() {
        const { open } = useModal("v1");
        return () =>
          h("div", [
            h("button", { onClick: () => open() }, "Open"),
            h(ConfirmModal, {
              id: "v1",
              title: "Vue confirm",
              onConfirm: () => {
                confirmed = true;
              }
            })
          ]);
      }
    });

    const wrapper = mount(Root, {
      global: { plugins: [ModalKitPlugin] },
      attachTo: document.body
    });

    await wrapper.find("button").trigger("click");
    await nextTick();
    expect(document.body.textContent).toContain("Vue confirm");
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const confirmBtn = buttons.find((b) => b.textContent === "Confirm");
    confirmBtn?.click();
    await nextTick();
    expect(confirmed).toBe(true);
    wrapper.unmount();
  });

  it("renders Modal shell content", async () => {
    const Root = defineComponent({
      setup() {
        const { open } = useModal("vm");
        return () =>
          h("div", [
            h("button", { onClick: () => open() }, "Open"),
            h(Modal, { id: "vm" }, () => [
              h(ModalHeader, () => "Header"),
              h(ModalBody, () => "Body text")
            ])
          ]);
      }
    });

    const wrapper = mount(Root, {
      global: { plugins: [ModalKitPlugin] },
      attachTo: document.body
    });
    await wrapper.find("button").trigger("click");
    await nextTick();
    expect(document.body.textContent).toContain("Header");
    expect(document.body.textContent).toContain("Body text");
    wrapper.unmount();
  });

  it("advances MultiStepConfirm", async () => {
    let done = false;
    const Root = defineComponent({
      setup() {
        const { open } = useModal("ms");
        return () =>
          h("div", [
            h("button", { onClick: () => open() }, "Open"),
            h(MultiStepConfirm, {
              id: "ms",
              steps: [
                { title: "One" },
                { title: "Two", confirmLabel: "Finish" }
              ],
              onConfirm: () => {
                done = true;
              }
            })
          ]);
      }
    });

    const wrapper = mount(Root, {
      global: { plugins: [ModalKitPlugin] },
      attachTo: document.body
    });
    await wrapper.find("button").trigger("click");
    await nextTick();
    expect(document.body.textContent).toContain("One");
    const next = Array.from(document.body.querySelectorAll("button")).find((b) => b.textContent === "Next");
    next?.click();
    await nextTick();
    expect(document.body.textContent).toContain("Two");
    const finish = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent === "Finish"
    );
    finish?.click();
    await nextTick();
    expect(done).toBe(true);
    wrapper.unmount();
  });
});
