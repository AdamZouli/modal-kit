// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import {
  ConfirmHost,
  ConfirmModal,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalProvider,
  MultiStepConfirm,
  useConfirm,
  useModal
} from "./index";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const OpenButton = ({ id }: { id: string }) => {
  const { open } = useModal(id);
  return (
    <button type="button" onClick={() => open()}>
      Open
    </button>
  );
};

describe("react ConfirmModal", () => {
  it("opens, confirms, and closes", async () => {
    const onConfirm = vi.fn();
    render(
      <ModalProvider>
        <OpenButton id="c1" />
        <ConfirmModal id="c1" title="Delete?" description="Sure?" onConfirm={onConfirm} />
      </ModalProvider>
    );

    fireEvent.click(screen.getByText("Open"));
    expect(await screen.findByText("Delete?")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("Delete?")).toBeNull();
    });
  });

  it("shows async error and retry", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error("Nope"))
      .mockResolvedValueOnce(undefined);

    render(
      <ModalProvider>
        <OpenButton id="c2" />
        <ConfirmModal
          id="c2"
          title="Save?"
          onConfirm={onConfirm}
          successCloseAfterMs={0}
        />
      </ModalProvider>
    );

    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(await screen.findByText("Confirm"));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Nope");
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2));
  });

  it("closes on Escape", async () => {
    render(
      <ModalProvider>
        <OpenButton id="c3" />
        <ConfirmModal id="c3" title="Esc me" />
      </ModalProvider>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await waitFor(() => expect(screen.queryByText("Esc me")).toBeNull());
  });
});

describe("react Modal shell", () => {
  it("renders portalized content", async () => {
    render(
      <ModalProvider>
        <OpenButton id="m1" />
        <Modal id="m1" theme="noir">
          <ModalHeader>
            <div>Hello</div>
          </ModalHeader>
          <ModalBody>Body</ModalBody>
          <ModalFooter>
            <button type="button">Ok</button>
          </ModalFooter>
        </Modal>
      </ModalProvider>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(await screen.findByText("Hello")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
  });
});

describe("react MultiStepConfirm", () => {
  it("advances steps then confirms", async () => {
    const onConfirm = vi.fn();
    render(
      <ModalProvider>
        <OpenButton id="ms1" />
        <MultiStepConfirm
          id="ms1"
          onConfirm={onConfirm}
          steps={[
            { title: "Step one", description: "First" },
            { title: "Step two", description: "Last", variant: "destructive", confirmLabel: "Delete" }
          ]}
        />
      </ModalProvider>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(await screen.findByText("Step one")).toBeTruthy();
    fireEvent.click(screen.getByText("Next"));
    expect(await screen.findByText("Step two")).toBeTruthy();
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe("react useConfirm", () => {
  const Trigger = () => {
    const { confirm } = useConfirm();
    return (
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({ title: "Are you sure?", confirmLabel: "Yes" });
          if (ok) {
            document.body.dataset.result = "yes";
          }
        }}
      >
        Ask
      </button>
    );
  };

  it("resolves promise confirm", async () => {
    render(
      <ModalProvider>
        <ConfirmHost>
          <Trigger />
        </ConfirmHost>
      </ModalProvider>
    );
    fireEvent.click(screen.getByText("Ask"));
    expect(await screen.findByText("Are you sure?")).toBeTruthy();
    fireEvent.click(screen.getByText("Yes"));
    await waitFor(() => expect(document.body.dataset.result).toBe("yes"));
  });
});
