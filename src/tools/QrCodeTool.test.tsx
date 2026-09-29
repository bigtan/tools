// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QrCodeTool } from "./QrCodeTool";
import { renderQrImage } from "../lib/qrcode";
vi.mock("../lib/qrcode", async importOriginal => ({ ...await importOriginal<typeof import("../lib/qrcode")>(), renderQrImage: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const tool = { id: "qrcode", name: "二维码", summary: "", category: "generation" as const };
it("rejects oversized UTF-8 input without crashing and recovers after correction", () => {
  const { container } = render(<QrCodeTool tool={tool} onCopy={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "你".repeat(334) } });
  expect(screen.getByRole("alert").textContent).toContain("1000");
  expect(container.querySelector(".qr-preview")).toBeNull();
  expect((screen.getByRole("button", { name: "下载 WebP" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "你".repeat(333) } });
  fireEvent.change(screen.getByRole("combobox", { name: "纠错等级" }), { target: { value: "H" } });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(container.querySelector(".qr-preview svg")).toBeTruthy();
});
it("reports QR export failures", async () => {
  vi.mocked(renderQrImage).mockRejectedValue(new Error("图片导出失败"));
  render(<QrCodeTool tool={tool} onCopy={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "下载 WebP" }));
  expect((await screen.findByRole("alert")).textContent).toBe("图片导出失败");
});
