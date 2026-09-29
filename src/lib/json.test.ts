import { describe, expect, it } from "vitest";
import { formatJson } from "./json";
import { MAX_JSON_DEPTH, MAX_TEXT_LENGTH } from "./limits";

describe("lossless JSON formatting", () => {
  it("preserves integers, decimal precision, exponents and negative zero", () => {
    const input = '{"id":9007199254740993,"decimal":0.1234567890123456789,"exponent":1e400,"zero":-0}';
    expect(formatJson(formatJson(input, true), false)).toBe(input);
  });
  it("formats nested and empty containers without changing string escapes or duplicate keys", () => {
    const input = '{ "a": [ {}, [], "a, \\"b\\":[]", true, null ], "a": 2 }';
    expect(formatJson(input, true)).toBe('{\n  "a": [\n    {},\n    [],\n    "a, \\"b\\":[]",\n    true,\n    null\n  ],\n  "a": 2\n}');
  });
  it.each(['{"a":}', '[1,]', '{a:1}', '01', 'undefined'])("rejects invalid JSON %s", input => {
    expect(() => formatJson(input, true)).toThrow();
  });
  it("bounds input and nesting", () => {
    expect(() => formatJson(' '.repeat(MAX_TEXT_LENGTH + 1), true)).toThrow("文本不能超过");
    expect(() => formatJson('['.repeat(MAX_JSON_DEPTH + 1) + '0' + ']'.repeat(MAX_JSON_DEPTH + 1), true)).toThrow("嵌套");
    expect(formatJson('"hello"', true)).toBe('"hello"');
  });
});
