import { MAX_QR_BYTES } from "./limits";
import { canvasToImageBlob } from "./image";
import type { ImageFormat } from "./image";

export function qrInputError(value: string) {
  if (!value) return "请输入二维码内容";
  if (new TextEncoder().encode(value).length > MAX_QR_BYTES) return `二维码内容不能超过 ${MAX_QR_BYTES} 个 UTF-8 字节`;
  return "";
}

export async function renderQrImage(svgText: string, size: number, format: ImageFormat, background: string) {
  const svgUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = svgUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 初始化失败");
    if (format === "image/jpeg") {
      context.fillStyle = background;
      context.fillRect(0, 0, size, size);
    }
    context.drawImage(image, 0, 0, size, size);
    return await canvasToImageBlob(canvas, format, 1);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
