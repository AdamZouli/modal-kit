// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ModalKitHost } from "./index";

describe("web components", () => {
  it("registers the modal host element", () => {
    expect(customElements.get("modal-kit-host")).toBe(ModalKitHost);
  });
});
