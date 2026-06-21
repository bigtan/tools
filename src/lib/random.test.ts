import { describe, expect, it } from "vitest";
import { createRandomString, createUuidList } from "./random";

const baseOptions = {
  length: 12,
  count: 3,
  lowercase: true,
  uppercase: false,
  digits: false,
  symbols: false,
  customCharset: "",
  excludeSimilar: false
};

describe("createRandomString", () => {
  it("produces the requested count and length", () => {
    const lines = createRandomString(baseOptions).split("\n");
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toHaveLength(12);
  });

  it("only emits characters from the selected charset", () => {
    const out = createRandomString({ ...baseOptions, length: 200, count: 1, digits: true });
    expect(out).toMatch(/^[a-z0-9]+$/);
  });

  it("excludes similar characters when requested", () => {
    const out = createRandomString({
      ...baseOptions,
      length: 500,
      count: 1,
      lowercase: true,
      uppercase: true,
      digits: true,
      excludeSimilar: true
    });
    expect(out).not.toMatch(/[0OolI1]/);
  });

  it("uses the custom charset and ignores the toggles", () => {
    const out = createRandomString({ ...baseOptions, customCharset: "AB", length: 50, count: 1 });
    expect(out).toMatch(/^[AB]+$/);
  });

  it("throws when no charset resolves", () => {
    expect(() =>
      createRandomString({ ...baseOptions, lowercase: false })
    ).toThrow();
  });
});

describe("createUuidList", () => {
  it("returns the requested number of v4 UUIDs", () => {
    const list = createUuidList(4).split("\n");
    expect(list).toHaveLength(4);
    const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const uuid of list) expect(uuid).toMatch(v4);
  });
});
