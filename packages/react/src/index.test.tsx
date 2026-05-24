import { describe, expect, it } from "vitest";
import { ModalProvider, useModal } from "./index";

describe("react exports", () => {
  it("exposes modal helpers", () => {
    expect(typeof ModalProvider).toBe("function");
    expect(typeof useModal).toBe("function");
  });
});
