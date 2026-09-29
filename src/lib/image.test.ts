// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processImage } from "./image";
import { MAX_IMAGE_BYTES } from "./limits";
const options = { format: "image/jpeg" as const, quality: 0.8, compress: true, maxWidth: 200, maxHeight: 100 };
const context = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn(), imageSmoothingEnabled: false, imageSmoothingQuality: "low" };
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback, type) { callback(new Blob(["output"], { type })); });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("image processing", () => {
  it("scales proportionally, flattens JPEG transparency and snapshots metadata", async () => {
    const bitmap = { width: 800, height: 200, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    const file = new File(["input"], "photo.png", { type: "image/png" });
    const result = await processImage(file, options);
    expect(result).toMatchObject({ width: 200, height: 50, filename: "photo-compressed.jpg", format: "image/jpeg", sourceSize: 5 });
    expect(result.blob.type).toBe("image/jpeg");
    expect(context.fillStyle).toBe("#ffffff");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 200, 50);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it("rejects large files before decoding", async () => {
    const decode = vi.fn(); vi.stubGlobal("createImageBitmap", decode);
    const file = new File([], "huge.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: MAX_IMAGE_BYTES + 1 });
    await expect(processImage(file, options)).rejects.toThrow("20 MiB");
    expect(decode).not.toHaveBeenCalled();
  });
  it("closes decoded oversized bitmaps without allocating a canvas", async () => {
    const bitmap = { width: 6000, height: 5000, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    await expect(processImage(new File([], "huge.png"), options)).rejects.toThrow("2400 万");
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it("reports unsupported output formats and still closes the bitmap", async () => {
    const bitmap = { width: 100, height: 100, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(callback => callback(new Blob([], { type: "image/png" })));
    await expect(processImage(new File([], "a.png"), options)).rejects.toThrow("不受当前浏览器支持");
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
});
