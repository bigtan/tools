import { MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, MAX_IMAGE_DIMENSION } from "./limits";

export type ImageFormat = "image/jpeg" | "image/webp" | "image/png";

export const imageFormatOptions: Array<{ value: ImageFormat; label: string; extension: string }> = [
  { value: "image/webp", label: "WebP", extension: "webp" },
  { value: "image/jpeg", label: "JPEG", extension: "jpg" },
  { value: "image/png", label: "PNG", extension: "png" }
];

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function filenameBase(name: string) {
  return name.replace(/\.[^/.]+$/, "") || "image";
}

export async function canvasToImageBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality?: number) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      nextBlob => nextBlob ? resolve(nextBlob) : reject(new Error("图片导出失败")),
      format,
      format === "image/png" ? undefined : quality
    );
  });
  if (blob.type && blob.type !== format) throw new Error(`${format} 输出不受当前浏览器支持`);
  return blob;
}

export function validateImageFile(file: File) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("图片文件不能超过 20 MiB");
  if (file.type && !file.type.startsWith("image/")) throw new Error("请选择图片文件");
}

export type ImageResult = {
  blob: Blob;
  width: number;
  height: number;
  format: ImageFormat;
  filename: string;
  sourceSize: number;
};

export async function processImage(file: File, options: {
  format: ImageFormat;
  quality: number;
  compress: boolean;
  maxWidth: number;
  maxHeight: number;
}): Promise<ImageResult> {
  validateImageFile(file);
  if (!Number.isFinite(options.quality) || options.quality < 0.1 || options.quality > 1) {
    throw new Error("质量必须在 0.1 到 1 之间");
  }
  if (options.compress && [options.maxWidth, options.maxHeight].some(value => !Number.isSafeInteger(value) || value < 1 || value > MAX_IMAGE_DIMENSION)) {
    throw new Error(`最大宽高必须是 1 到 ${MAX_IMAGE_DIMENSION} 之间的整数`);
  }
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    // Check before allocating the additional canvas buffer. Decoding itself is browser-owned.
    if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS || Math.max(bitmap.width, bitmap.height) > MAX_IMAGE_DIMENSION) {
      throw new Error("图片不能超过 2400 万像素，单边不能超过 8192 像素");
    }
    const ratio = options.compress ? Math.min(1, options.maxWidth / bitmap.width, options.maxHeight / bitmap.height) : 1;
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 初始化失败");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (options.format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToImageBlob(canvas, options.format, options.quality);
    const format = imageFormatOptions.find(option => option.value === options.format)!;
    return {
      blob, width, height, format: options.format, sourceSize: file.size,
      filename: `${filenameBase(file.name)}${options.compress ? "-compressed" : ""}.${format.extension}`
    };
  } finally {
    bitmap?.close();
  }
}

export function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    downloadUrl(url, filename);
  } finally {
    // Allow the browser to consume the clicked URL before revoking it.
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}
