const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/|";

export function createRandomString(options: {
  length: number;
  count: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  customCharset: string;
  excludeSimilar: boolean;
}) {
  const custom = options.customCharset.trim();
  let charset = custom;

  if (!custom) {
    if (options.lowercase) charset += LOWER;
    if (options.uppercase) charset += UPPER;
    if (options.digits) charset += DIGITS;
    if (options.symbols) charset += SYMBOLS;
  }

  if (options.excludeSimilar) {
    charset = charset.replace(/[0OolI1]/g, "");
  }

  const deduped = Array.from(new Set(charset.split(""))).join("");

  if (!deduped) {
    throw new Error("请至少选择一种字符集");
  }

  const values = new Uint32Array(options.length);
  const lines: string[] = [];

  for (let row = 0; row < options.count; row += 1) {
    crypto.getRandomValues(values);
    let output = "";

    for (let index = 0; index < options.length; index += 1) {
      output += deduped[values[index] % deduped.length];
    }

    lines.push(output);
  }

  return lines.join("\n");
}

export function createUuidList(count: number) {
  return Array.from({ length: count }, () => crypto.randomUUID()).join("\n");
}
