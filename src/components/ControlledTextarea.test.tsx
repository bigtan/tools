// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ControlledTextarea } from "./ControlledTextarea";
afterEach(cleanup);
it("reports clipboard read failures", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: vi.fn().mockRejectedValue(new Error("Permission denied")) } });
  render(<ControlledTextarea value="" onChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "粘贴" }));
  expect((await screen.findByRole("alert")).textContent).toContain("粘贴失败");
});
it("does not overwrite manual input with a late clipboard response", async () => {
  let resolve!: (text: string) => void;
  const pending = new Promise<string>(yes => { resolve = yes; });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: () => pending } });
  const onChange = vi.fn();
  render(<ControlledTextarea value="" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "粘贴" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "typed" } });
  await act(async () => { resolve("old clipboard"); await pending; });
  expect(onChange).toHaveBeenCalledExactlyOnceWith("typed");
});
it("rejects oversized pasted text without silently truncating it", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: vi.fn().mockResolvedValue("a".repeat(1_000_001)) } });
  const onChange = vi.fn();
  render(<ControlledTextarea value="original" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "粘贴" }));
  expect((await screen.findByRole("alert")).textContent).toContain("文本不能超过");
  expect(onChange).not.toHaveBeenCalled();
});
