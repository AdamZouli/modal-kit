import { describe, expect, it } from "vitest";
import { ModalKitPlugin, useModal } from "./index";

describe("vue exports", () => {
  it("exposes modal helpers", () => {
    expect(typeof ModalKitPlugin).toBe("object");
    expect(typeof useModal).toBe("function");
  });
});
