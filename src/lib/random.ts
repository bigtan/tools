const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/|";
const MAX_RANDOM_LENGTH = 10_000;
const MAX_RANDOM_COUNT = 1_000;
const MAX_RANDOM_OUTPUT_LENGTH = 1_000_000;
const MAX_UUID_COUNT = 10_000;

function assertCount(value: number, maximum: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name}必须是 1 到 ${maximum} 之间的整数`);
  }
}

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
  assertCount(options.length, MAX_RANDOM_LENGTH, "长度");
  assertCount(options.count, MAX_RANDOM_COUNT, "数量");
  if (options.length * options.count > MAX_RANDOM_OUTPUT_LENGTH) {
    throw new Error(`生成结果不能超过 ${MAX_RANDOM_OUTPUT_LENGTH.toLocaleString()} 个字符`);
  }

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

  const characters = Array.from(new Set(Array.from(charset)));

  if (!characters.length) {
    throw new Error("请至少选择一种字符集");
  }

  const values = new Uint32Array(1_024);
  const maxUnbiasedValue = Math.floor(0x1_0000_0000 / characters.length) * characters.length;
  let valueIndex = values.length;
  const nextCharacter = () => {
    for (;;) {
      if (valueIndex === values.length) {
        crypto.getRandomValues(values);
        valueIndex = 0;
      }
      const value = values[valueIndex];
      valueIndex += 1;
      if (value < maxUnbiasedValue) return characters[value % characters.length];
    }
  };
  const lines: string[] = [];

  for (let row = 0; row < options.count; row += 1) {
    let output = "";

    for (let index = 0; index < options.length; index += 1) {
      output += nextCharacter();
    }

    lines.push(output);
  }

  return lines.join("\n");
}

export function createUuidList(count: number) {
  assertCount(count, MAX_UUID_COUNT, "数量");
  return Array.from({ length: count }, () => crypto.randomUUID()).join("\n");
}
