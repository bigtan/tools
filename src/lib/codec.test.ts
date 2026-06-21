import { describe, expect, it } from "vitest";
import {
  decodeBase64,
  decodeBase64ByLine,
  decodeBase64Url,
  decodeUrl,
  encodeBase64,
  encodeBase64ByLine,
  encodeUrl,
  hexToBytes,
  hexToText,
  textToHex
} from "./codec";

describe("base64", () => {
  it("round-trips ASCII", () => {
    expect(encodeBase64("hello")).toBe("aGVsbG8=");
    expect(decodeBase64("aGVsbG8=")).toBe("hello");
  });

  it("round-trips multi-byte UTF-8", () => {
    const text = "你好, 世界 🌍";
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it("throws on invalid base64", () => {
    expect(() => decodeBase64("not base64!!")).toThrow();
  });
});

describe("base64url", () => {
  it("decodes URL-safe alphabet without padding", () => {
    const payload = encodeBase64('{"a":1}').replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    expect(decodeBase64Url(payload)).toBe('{"a":1}');
  });
});

describe("base64 by line", () => {
  it("encodes each line independently and preserves blanks", () => {
    expect(encodeBase64ByLine("a\n\nb", true)).toBe("YQ==\n\nYg==");
  });

  it("drops blank lines when not preserving", () => {
    expect(encodeBase64ByLine("a\n\nb", false)).toBe("YQ==\nYg==");
  });

  it("round-trips by line", () => {
    const input = "one\ntwo\nthree";
    expect(decodeBase64ByLine(encodeBase64ByLine(input, true), true)).toBe(input);
  });
});

describe("url", () => {
  it("component-encodes reserved characters", () => {
    expect(encodeUrl("a b&c", true)).toBe("a%20b%26c");
    expect(decodeUrl("a%20b%26c", true)).toBe("a b&c");
  });
});

describe("hex", () => {
  it("round-trips text", () => {
    expect(textToHex("AB")).toBe("4142");
    expect(hexToText("4142")).toBe("AB");
  });

  it("ignores whitespace between bytes", () => {
    expect(hexToBytes("41 42")).toEqual(new Uint8Array([0x41, 0x42]));
  });

  it("rejects odd length and non-hex characters", () => {
    expect(() => hexToBytes("abc")).toThrow();
    expect(() => hexToBytes("zz")).toThrow();
  });
});
