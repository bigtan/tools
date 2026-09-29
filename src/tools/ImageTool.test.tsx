// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ImageTool } from "./ImageTool";
import { processImage, downloadUrl } from "../lib/image";
import type { ImageResult } from "../lib/image";
vi.mock("../lib/image", async importOriginal => ({ ...await importOriginal<typeof import("../lib/image")>(), processImage: vi.fn(), downloadUrl: vi.fn() }));
const tool = { id: "image-convert", name: "图片", summary: "", category: "media" as const };
const output = (filename: string): ImageResult => ({ blob: new Blob(["out"], { type: "image/webp" }), width: 10, height: 10, format: "image/webp", filename, sourceSize: 10 });
beforeEach(() => {
  let id = 0;
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => `blob:${++id}`);
    static revokeObjectURL = vi.fn();
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
function select(name: string) {
  fireEvent.change(screen.getByLabelText("选择图片"), { target: { files: [new File(["input"], name, { type: "image/png" })] } });
}
it.each([false, true])("keeps download format and filename tied to the actual result (compress=%s)", async compress => {
  vi.mocked(processImage).mockResolvedValue(output("a.webp"));
  render(<ImageTool tool={tool} compress={compress} />);
  select("a.png");
  fireEvent.click(screen.getByRole("button", { name: compress ? "压缩图片" : "转换类型" }));
  await screen.findByRole("button", { name: "下载 WebP" });
  fireEvent.change(screen.getByRole("combobox", { name: "输出格式" }), { target: { value: "image/jpeg" } });
  fireEvent.click(screen.getByRole("button", { name: "下载 WebP" }));
  expect(downloadUrl).toHaveBeenCalledWith("blob:2", "a.webp");
});
it("discards old file results and releases owned URLs on replacement and unmount", async () => {
  let resolve!: (value: ImageResult) => void;
  const pending = new Promise<ImageResult>(yes => { resolve = yes; });
  vi.mocked(processImage).mockReturnValueOnce(pending).mockResolvedValueOnce(output("new.webp"));
  const { unmount } = render(<ImageTool tool={tool} compress={false} />);
  select("old.png");
  fireEvent.click(screen.getByRole("button", { name: "转换类型" }));
  select("new.png");
  fireEvent.click(screen.getByRole("button", { name: "转换类型" }));
  await screen.findByRole("button", { name: "下载 WebP" });
  await act(async () => { resolve(output("old.webp")); await pending; });
  fireEvent.click(screen.getByRole("button", { name: "下载 WebP" }));
  expect(downloadUrl).toHaveBeenCalledWith("blob:3", "new.webp");
  expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
});
it("does not allocate output URLs after unmount", async () => {
  let resolve!: (value: ImageResult) => void;
  const pending = new Promise<ImageResult>(yes => { resolve = yes; });
  vi.mocked(processImage).mockReturnValue(pending);
  const { unmount } = render(<ImageTool tool={tool} compress={false} />);
  select("a.png"); fireEvent.click(screen.getByRole("button", { name: "转换类型" }));
  unmount();
  await act(async () => { resolve(output("a.webp")); await pending; });
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:1");
});
