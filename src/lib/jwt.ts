import { decodeBase64Url } from "./codec";
import { formatJson } from "./json";
import { assertTextLength } from "./limits";

export type JwtClaim = { claim: string; value: string; desc: string };

function parseObject(text: string, label: string): Record<string, unknown> {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} 必须是 JSON 对象`);
  }
  return value as Record<string, unknown>;
}

export function decodeJwt(token: string, now = Date.now()) {
  assertTextLength(token);
  const segments = token.trim().split(".");
  if (segments.length !== 3 || !segments[0] || !segments[1] ||
      segments.some(segment => !/^[A-Za-z0-9_-]*$/.test(segment))) {
    throw new Error("JWT 必须由三个 Base64URL 段组成");
  }
  const header = decodeBase64Url(segments[0]);
  const payload = decodeBase64Url(segments[1]);
  parseObject(header, "Header");
  const data = parseObject(payload, "Payload");
  const claims: JwtClaim[] = [];
  const labels = { exp: "过期时间 (exp)", iat: "签发时间 (iat)", nbf: "生效时间 (nbf)" };
  for (const key of ["exp", "iat", "nbf"] as const) {
    if (data[key] === undefined) continue;
    const value = data[key];
    if (typeof value !== "number" || !Number.isFinite(value) || !Number.isFinite(new Date(value * 1000).getTime())) {
      throw new Error(`${key} 必须是有效范围内的数值时间戳（秒）`);
    }
    const milliseconds = value * 1000;
    const desc = key === "exp" ? (now >= milliseconds ? "已过期" : "未过期")
      : key === "nbf" ? (now < milliseconds ? "尚未生效" : "已到生效时间") : "声明的签发时刻";
    claims.push({ claim: labels[key], value: new Date(milliseconds).toLocaleString(), desc });
  }
  for (const [key, label] of [["sub", "主题 (sub)"], ["iss", "签发方 (iss)"], ["aud", "受众 (aud)"]]) {
    if (data[key] !== undefined) claims.push({ claim: label, value: String(data[key]), desc: "未经验证的声明" });
  }
  return { header: formatJson(header, true), payload: formatJson(payload, true), claims };
}
