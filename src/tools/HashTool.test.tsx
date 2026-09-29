// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HashTool } from "./HashTool";
import { digestText } from "../lib/crypto";
vi.mock("../lib/crypto", () => ({ digestText: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it("displays digest failures and allows retry", async () => {
  vi.mocked(digestText).mockRejectedValueOnce(new Error("Web Crypto unavailable")).mockResolvedValueOnce("digest");
  render(<HashTool tool={{ id: "hash", name: "Hash 摘要", summary: "", category: "crypto" }} onCopy={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "计算摘要" }));
  await screen.findByDisplayValue("Web Crypto unavailable");
  fireEvent.click(screen.getByRole("button", { name: "计算摘要" }));
  expect(await screen.findByDisplayValue("digest")).toBeTruthy();
});
