import { describe, expect, it } from "vitest";
import { MAX_TEXT_LENGTH } from "./limits";
import { decodeBase64, decodeBase64Url, encodeBase64, encodeBase64ByLine, decodeBase64ByLine, textToHex, hexToBytes, encodeUrl, decodeUrl } from "./codec";
import { digestText, encryptAes, decryptAes } from "./crypto";
import { convertTimestamp } from "./timestamp";
import { formatJson } from "./json";
const tooLarge = "a".repeat(MAX_TEXT_LENGTH + 1);
describe("processing limits", () => {
  it.each([decodeBase64, decodeBase64Url, encodeBase64, textToHex, hexToBytes])("rejects oversized codec input before allocation", transform => {
    expect(() => transform(tooLarge)).toThrow("文本不能超过");
  });
  it("limits the complete line input and URL input", () => {
    expect(() => encodeBase64ByLine(tooLarge, true)).toThrow("文本不能超过");
    expect(() => decodeBase64ByLine(tooLarge, true)).toThrow("文本不能超过");
    expect(() => encodeUrl(tooLarge, true)).toThrow("文本不能超过");
    expect(() => decodeUrl(tooLarge, true)).toThrow("文本不能超过");
  });
  it("bounds hashing, AES and timestamp conversion", async () => {
    await expect(digestText("SHA-256", tooLarge)).rejects.toThrow("文本不能超过");
    await expect(encryptAes({ mode: "AES-GCM", keyHex: "", ivHex: "", plainText: tooLarge, output: "hex" })).rejects.toThrow("文本不能超过");
    await expect(decryptAes({ mode: "AES-GCM", keyHex: "", ivHex: "", cipherText: tooLarge, input: "hex" })).rejects.toThrow("文本不能超过");
    expect(() => convertTimestamp("1".repeat(65), "s", false)).toThrow("64");
  });
  it("bounds indentation expansion while keeping compact JSON available", () => {
    const input = "[".repeat(99) + "0,".repeat(25_000) + "0" + "]".repeat(99);
    expect(() => formatJson(input, true)).toThrow("格式化结果过大");
    expect(formatJson(input, false)).toBe(input);
  });
});
