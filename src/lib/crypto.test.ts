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

describe("key and CSR generation", () => {
  it.each(["RSA", "P-256", "P-384", "P-521"] as const)("generates a verifiable CSR for %s", async algorithm => {
    const { generateRsaKeyPair, generateEccKeyPair, generateCsr } = await import("./crypto");
    const keys = algorithm === "RSA" ? await generateRsaKeyPair(2048) : await generateEccKeyPair(algorithm);
    const pem = await generateCsr(keys, { commonName: "example.com", organization: "Example, Inc", country: "CN" }, algorithm === "RSA" ? "RSA" : "ECC");
    const { Pkcs10CertificateRequest } = await import("@peculiar/x509");
    const csr = new Pkcs10CertificateRequest(pem);
    expect(await csr.verify()).toBe(true);
    expect(csr.subject).toContain("example.com");
  });
});
