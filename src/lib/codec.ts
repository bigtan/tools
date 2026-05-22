const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBinary(bytes: Uint8Array) {
  let result = "";

  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }

  return result;
}

function binaryToBytes(binary: string) {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function transformByLine(
  value: string,
  preserveEmptyLines: boolean,
  transform: (line: string) => string
) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      if (!line) {
        return preserveEmptyLines ? "" : null;
      }

      return transform(line);
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function encodeBase64(value: string) {
  return btoa(bytesToBinary(encoder.encode(value)));
}

export function decodeBase64(value: string) {
  return decoder.decode(binaryToBytes(atob(value)));
}

export function decodeBase64Url(value: string) {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  return decodeBase64(base64);
}

export function encodeBase64ByLine(value: string, preserveEmptyLines: boolean) {
  return transformByLine(value, preserveEmptyLines, encodeBase64);
}

export function decodeBase64ByLine(value: string, preserveEmptyLines: boolean) {
  return transformByLine(value, preserveEmptyLines, decodeBase64);
}

export function encodeUrl(value: string, componentMode: boolean) {
  return componentMode ? encodeURIComponent(value) : encodeURI(value);
}

export function decodeUrl(value: string, componentMode: boolean) {
  return componentMode ? decodeURIComponent(value) : decodeURI(value);
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string) {
  const normalized = hex.trim().replace(/\s+/g, "");

  if (!normalized || normalized.length % 2 !== 0 || /[^0-9a-f]/i.test(normalized)) {
    throw new Error("Hex 输入不合法");
  }

  const bytes = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

export function textToHex(value: string) {
  return bytesToHex(encoder.encode(value));
}

export function hexToText(value: string) {
  return decoder.decode(hexToBytes(value));
}
