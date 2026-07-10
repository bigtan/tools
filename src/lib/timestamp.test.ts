import { describe, expect, it } from "vitest";
import { convertTimestamp } from "./timestamp";

describe("convertTimestamp", () => {
  it("preserves microsecond precision in every output unit", () => {
    const result = convertTimestamp("1720000000123456", "s", true);

    expect(result.unitDetected).toBe("us");
    expect(result.ms).toBe("1720000000123");
    expect(result.us).toBe("1720000000123456");
    expect(result.ns).toBe("1720000000123456000");
  });

  it("preserves nanosecond precision without converting through Number", () => {
    const result = convertTimestamp("1720000000123456789", "s", true);

    expect(result.unitDetected).toBe("ns");
    expect(result.us).toBe("1720000000123456");
    expect(result.ns).toBe("1720000000123456789");
  });

  it("rejects non-integer input and dates outside the supported range", () => {
    expect(() => convertTimestamp("123abc", "s", false)).toThrow("时间戳必须是整数");
    expect(() => convertTimestamp("8640000000000001", "ms", false)).toThrow("Date 支持范围");
  });
});
