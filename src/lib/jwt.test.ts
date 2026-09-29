import { describe, expect, it } from "vitest";
import { encodeBase64 } from "./codec";
import { decodeJwt } from "./jwt";
const segment = (text: string) => encodeBase64(text).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const token = (payload: string) => `${segment('{"alg":"none"}')}.${segment(payload)}.`;

describe("JWT claims", () => {
  it.each(['"invalid"', 'null', 'true', '{}', '1e400', '8640000000001'])("rejects invalid exp %s", exp => {
    expect(() => decodeJwt(token(`{"exp":${exp}}`))).toThrow("exp 必须");
  });
  it("checks expiry boundaries and not-before separately without claiming validity", () => {
    const result = decodeJwt(token('{"exp":100,"nbf":101}'), 100_000);
    expect(result.claims.map(c => c.desc)).toEqual(["已过期", "尚未生效"]);
    expect(decodeJwt(token('{"exp":101}'), 100_000).claims[0].desc).toBe("未过期");
  });
  it("validates all date fields and JSON object payloads", () => {
    expect(() => decodeJwt(token('{"iat":"123"}'))).toThrow("iat 必须");
    expect(() => decodeJwt(token('{"nbf":null}'))).toThrow("nbf 必须");
    expect(() => decodeJwt(token('null'))).toThrow("JSON 对象");
    expect(() => decodeJwt(token('[]'))).toThrow("JSON 对象");
  });
  it("requires exactly three segments and preserves large numeric claims", () => {
    expect(() => decodeJwt('a.b')).toThrow("三个");
    expect(() => decodeJwt('a.b.c.d')).toThrow("三个");
    expect(decodeJwt(token('{"id":9007199254740993}')).payload).toContain('9007199254740993');
  });
});
