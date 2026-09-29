// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("tool navigation", () => {
  it("preserves input and output across category and search changes and supports explicit reset", () => {
    render(<App />);
    const card = screen.getByRole("heading", { name: "JSON 格式化" }).closest("article")!;
    const input = within(card).getByRole("textbox", { name: /粘贴要格式化/ });
    fireEvent.change(input, { target: { value: '{"id":9007199254740993}' } });
    fireEvent.click(within(card).getByRole("button", { name: "格式化" }));
    const expected = '{\n  "id": 9007199254740993\n}';
    fireEvent.click(screen.getByRole("button", { name: "编码转换" }));
    expect(screen.queryByRole("heading", { name: "JSON 格式化" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "全部" }));
    expect((within(card).getByRole("textbox", { name: "JSON 格式化 输出结果" }) as HTMLTextAreaElement).value).toBe(expected);
    fireEvent.change(screen.getByRole("textbox", { name: "搜索工具" }), { target: { value: '  AES  ' } });
    expect(screen.getByRole("heading", { name: "AES 加解密" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "JSON 格式化" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "清空搜索" }));
    expect((input as HTMLTextAreaElement).value).toBe('{"id":9007199254740993}');
    fireEvent.click(screen.getByRole("button", { name: "清空所有工具" }));
    expect((screen.getByRole("textbox", { name: /粘贴要格式化/ }) as HTMLTextAreaElement).value).toBe("");
  });
  it("reports denied clipboard writes", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Permission denied")) } });
    render(<App />);
    const card = screen.getByRole("heading", { name: "UUID" }).closest("article")!;
    fireEvent.click(within(card).getByRole("button", { name: "复制" }));
    expect((await screen.findByRole("status")).textContent).toContain("复制失败");
  });
});
