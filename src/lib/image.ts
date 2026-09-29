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
