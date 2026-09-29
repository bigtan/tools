// Limits are measured in UTF-16 code units unless explicitly stated otherwise.
export const MAX_TEXT_LENGTH = 1_000_000;
export const MAX_JSON_DEPTH = 100;
export const MAX_QR_BYTES = 1_000;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 24_000_000;
export const MAX_IMAGE_DIMENSION = 8_192;

export function assertTextLength(value: string) {
  if (value.length > MAX_TEXT_LENGTH) {
    throw new Error(`文本不能超过 ${MAX_TEXT_LENGTH.toLocaleString()} 个 UTF-16 字符单位`);
  }
}
