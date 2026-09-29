// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { qrInputError, renderQrImage } from "./qrcode";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("counts QR bytes rather than JavaScript string length", () => {
  expect(qrInputError("a".repeat(1000))).toBe("");
  expect(qrInputError("😀".repeat(250))).toBe("");
  expect(qrInputError("😀".repeat(251))).toContain("1000");
  expect(qrInputError("")).toContain("请输入");
});
it("releases the SVG URL even when image decoding fails", async () => {
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:qr");
    static revokeObjectURL = vi.fn();
  });
  vi.stubGlobal("Image", class { decode() { return Promise.reject(new Error("decode failed")); } });
  await expect(renderQrImage("<svg/>", 220, "image/webp", "#fff")).rejects.toThrow("decode failed");
  expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:qr");
});
