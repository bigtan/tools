// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AsymKeysTool } from "./AsymKeysTool";
import { generateRsaKeyPair, generateEccKeyPair, generateCsr } from "../lib/crypto";
vi.mock("../lib/crypto", () => ({ generateRsaKeyPair: vi.fn(), generateEccKeyPair: vi.fn(), generateCsr: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const tool = { id: "asym-keys", name: "证书与密钥", category: "crypto" as const, summary: "" };
it("clears existing keys and CSR controls when key type changes", async () => {
  vi.mocked(generateRsaKeyPair).mockResolvedValue({ privateKey: "rsa-private", publicKey: "rsa-public" });
  render(<AsymKeysTool tool={tool} onCopy={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "生成密钥对" }));
  await screen.findByRole("textbox", { name: "Private Key" });
  fireEvent.change(screen.getByRole("combobox", { name: "密钥类型" }), { target: { value: "ECC" } });
  expect(screen.queryByRole("textbox", { name: "Private Key" })).toBeNull();
  expect(screen.queryByRole("button", { name: "生成 CSR 请求" })).toBeNull();
  expect(generateCsr).not.toHaveBeenCalled();
});
it("ignores a pending RSA result after switching to ECC", async () => {
  let resolve!: (value: { privateKey: string; publicKey: string }) => void;
  const pending = new Promise<{ privateKey: string; publicKey: string }>(yes => { resolve = yes; });
  vi.mocked(generateRsaKeyPair).mockReturnValue(pending);
  vi.mocked(generateEccKeyPair).mockResolvedValue({ privateKey: "ecc-private", publicKey: "ecc-public" });
  vi.mocked(generateCsr).mockResolvedValue("csr");
  render(<AsymKeysTool tool={tool} onCopy={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "生成密钥对" }));
  fireEvent.change(screen.getByRole("combobox", { name: "密钥类型" }), { target: { value: "ECC" } });
  fireEvent.click(screen.getByRole("button", { name: "生成密钥对" }));
  await screen.findByRole("textbox", { name: "Private Key" });
  await act(async () => { resolve({ privateKey: "rsa-private", publicKey: "rsa-public" }); await pending; });
  expect((screen.getByRole("textbox", { name: "Private Key" }) as HTMLTextAreaElement).value).toBe("ecc-private");
  fireEvent.click(screen.getByRole("button", { name: "生成 CSR 请求" }));
  expect(generateCsr).toHaveBeenCalledWith(expect.objectContaining({ privateKey: "ecc-private", type: "ECC" }), expect.any(Object), "ECC");
  await screen.findByDisplayValue("csr");
});
