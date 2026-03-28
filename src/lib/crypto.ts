import { bytesToHex, hexToBytes } from "./codec";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function parseCipherBytes(value: string, format: "hex" | "base64") {
  return format === "hex" ? hexToBytes(value) : base64ToBytes(value);
}

function encodeCipherBytes(bytes: Uint8Array, format: "hex" | "base64") {
  return format === "hex" ? bytesToHex(bytes) : bytesToBase64(bytes);
}

export async function digestText(
  algorithm: "SHA-256" | "SHA-384" | "SHA-512",
  value: string
) {
  const digest = await crypto.subtle.digest(algorithm, encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function generateRandomBytesHex(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function buildAesMaterial(length: 128 | 192 | 256, ivBytes: number) {
  return {
    keyHex: generateRandomBytesHex(length / 8),
    ivHex: generateRandomBytesHex(ivBytes)
  };
}

export async function encryptAes(options: {
  mode: "AES-GCM" | "AES-CBC";
  keyHex: string;
  ivHex: string;
  plainText: string;
  output: "hex" | "base64";
}) {
  const keyBytes = hexToBytes(options.keyHex);
  const ivBytes = hexToBytes(options.ivHex);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: options.mode, length: keyBytes.length * 8 },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: options.mode, iv: ivBytes },
    key,
    encoder.encode(options.plainText)
  );

  return encodeCipherBytes(new Uint8Array(encrypted), options.output);
}

export async function decryptAes(options: {
  mode: "AES-GCM" | "AES-CBC";
  keyHex: string;
  ivHex: string;
  cipherText: string;
  input: "hex" | "base64";
}) {
  const keyBytes = hexToBytes(options.keyHex);
  const ivBytes = hexToBytes(options.ivHex);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: options.mode, length: keyBytes.length * 8 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: options.mode, iv: ivBytes },
    key,
    parseCipherBytes(options.cipherText, options.input)
  );

  return decoder.decode(decrypted);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function formatAsPem(b64: string, label: string) {
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

export async function generateRsaKeyPair(modulusLength: number) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );

  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: formatAsPem(arrayBufferToBase64(privateKey), "PRIVATE KEY"),
    publicKey: formatAsPem(arrayBufferToBase64(publicKey), "PUBLIC KEY")
  };
}

export async function generateEccKeyPair(namedCurve: "P-256" | "P-384" | "P-521") {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve },
    true,
    ["sign", "verify"]
  );

  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: formatAsPem(arrayBufferToBase64(privateKey), "PRIVATE KEY"),
    publicKey: formatAsPem(arrayBufferToBase64(publicKey), "PUBLIC KEY")
  };
}

export async function generateCsr(_keyPair: { privateKey: string; publicKey: string }, dn: any, type: "RSA" | "ECC") {
  const info = `CN=${dn.commonName}, O=${dn.organization}, C=${dn.country}`;
  const mockB64 = btoa(encoder.encode(`CSR_FOR_${type}_${info}_${Date.now()}`).toString());
  return formatAsPem(mockB64, "CERTIFICATE REQUEST");
}
