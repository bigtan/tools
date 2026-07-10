export type TimestampUnit = "s" | "ms" | "us" | "ns";

type TimestampConversion = {
  unitDetected: TimestampUnit;
  dateMilliseconds: bigint;
  s: string;
  ms: string;
  us: string;
  ns: string;
};

const NANOSECONDS_PER_UNIT: Record<TimestampUnit, bigint> = {
  s: 1_000_000_000n,
  ms: 1_000_000n,
  us: 1_000n,
  ns: 1n
};
const MAX_DATE_MILLISECONDS = 8_640_000_000_000_000n;

function detectUnit(digitCount: number): TimestampUnit {
  if (digitCount >= 19) return "ns";
  if (digitCount >= 16) return "us";
  if (digitCount >= 13) return "ms";
  return "s";
}

export function convertTimestamp(
  input: string,
  selectedUnit: TimestampUnit,
  autoDetect: boolean
): TimestampConversion {
  const normalized = input.trim();
  if (!/^[+-]?\d+$/.test(normalized)) {
    throw new Error("时间戳必须是整数");
  }

  const digits = normalized.replace(/^[+-]/, "");
  const unitDetected = autoDetect ? detectUnit(digits.length) : selectedUnit;
  const nanoseconds = BigInt(normalized) * NANOSECONDS_PER_UNIT[unitDetected];
  const dateMilliseconds = nanoseconds / NANOSECONDS_PER_UNIT.ms;

  if (
    dateMilliseconds < -MAX_DATE_MILLISECONDS ||
    dateMilliseconds > MAX_DATE_MILLISECONDS
  ) {
    throw new Error("时间戳超出 JavaScript Date 支持范围");
  }

  return {
    unitDetected,
    dateMilliseconds,
    s: String(nanoseconds / NANOSECONDS_PER_UNIT.s),
    ms: String(dateMilliseconds),
    us: String(nanoseconds / NANOSECONDS_PER_UNIT.us),
    ns: String(nanoseconds)
  };
}
