import { describe, expect, it } from "vitest";
import { buildAesMaterial, decryptAes, digestText, encryptAes } from "./crypto";

describe("digestText", () => {
  it("matches known SHA-256 vector", async () => {
    expect(await digestText("SHA-256", "abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("produces the expected digest length per algorithm", async () => {
    expect(await digestText("SHA-384", "abc")).toHaveLength(96);
    expect(await digestText("SHA-512", "abc")).toHaveLength(128);
  });
});

describe("buildAesMaterial", () => {
  it("derives hex lengths from key and iv sizes", () => {
    const { keyHex, ivHex } = buildAesMaterial(256, 12);
    expect(keyHex).toHaveLength(64);
    expect(ivHex).toHaveLength(24);
  });
});

describe("aes round-trip", () => {
  it("encrypts and decrypts with AES-GCM", async () => {
    const { keyHex, ivHex } = buildAesMaterial(256, 12);
    const plainText = "secret 你好";
    const cipher = await encryptAes({ mode: "AES-GCM", keyHex, ivHex, plainText, output: "hex" });
    const back = await decryptAes({ mode: "AES-GCM", keyHex, ivHex, cipherText: cipher, input: "hex" });
    expect(back).toBe(plainText);
  });

  it("encrypts and decrypts with AES-CBC", async () => {
    const { keyHex, ivHex } = buildAesMaterial(256, 16);
    const plainText = "block cipher payload";
    const cipher = await encryptAes({ mode: "AES-CBC", keyHex, ivHex, plainText, output: "base64" });
    const back = await decryptAes({ mode: "AES-CBC", keyHex, ivHex, cipherText: cipher, input: "base64" });
    expect(back).toBe(plainText);
  });
});
