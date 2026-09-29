import { useState, useRef } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { QRCodeSVG } from "qrcode.react";
import { canvasToImageBlob, imageFormatOptions } from "../lib/image";
import type { ImageFormat } from "../lib/image";
type QrErrorLevel = "L" | "M" | "Q" | "H";
const QR_MIN_SIZE = 96;
const QR_MAX_SIZE = 1024;
const QR_MIN_MARGIN = 0;
const QR_MAX_MARGIN = 8;

function clampInteger(value: number, minimum: number, maximum: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}


export function QrCodeTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [value, setValue] = useState("https://example.com");
  const [size, setSize] = useState(220);
  const [level, setLevel] = useState<QrErrorLevel>("M");
  const [margin, setMargin] = useState(4);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentFormat = imageFormatOptions.find(option => option.value === format) ?? imageFormatOptions[0];

  const getSvgText = () => {
    if (!svgRef.current) return "";
    return new XMLSerializer().serializeToString(svgRef.current);
  };

  const copySvg = () => {
    const svgText = getSvgText();
    if (svgText) onCopy(svgText);
  };

  const downloadQrCode = async () => {
    const svgText = getSvgText();
    if (!svgText) return;
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
        context.fillStyle = bgColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, size, size);
      const blob = await canvasToImageBlob(canvas, format, 1);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `qrcode.${currentFormat.extension}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  return (
    <CardFrame tool={tool} controls={
      <>
        <select value={level} onChange={event => setLevel(event.target.value as QrErrorLevel)}>
          <option value="L">纠错 L</option><option value="M">纠错 M</option><option value="Q">纠错 Q</option><option value="H">纠错 H</option>
        </select>
        <select value={format} onChange={event => setFormat(event.target.value as ImageFormat)}>
          {imageFormatOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </>
    }>
      <ControlledTextarea value={value} onChange={setValue} placeholder="输入文本、链接或其他内容..." />
      <div className="form-grid">
        <label><span>尺寸</span><input type="number" min={QR_MIN_SIZE} max={QR_MAX_SIZE} value={size} onChange={event => setSize(clampInteger(Number(event.target.value), QR_MIN_SIZE, QR_MAX_SIZE, QR_MIN_SIZE))} /></label>
        <label><span>边距模块</span><input type="number" min={QR_MIN_MARGIN} max={QR_MAX_MARGIN} value={margin} onChange={event => setMargin(clampInteger(Number(event.target.value), QR_MIN_MARGIN, QR_MAX_MARGIN, QR_MIN_MARGIN))} /></label>
        <label><span>前景色</span><input type="color" value={fgColor} onChange={event => setFgColor(event.target.value)} /></label>
        <label><span>背景色</span><input type="color" value={bgColor} onChange={event => setBgColor(event.target.value)} /></label>
      </div>
      <div className="qr-preview">
        <QRCodeSVG ref={svgRef} value={value || " "} size={size} level={level} marginSize={margin} fgColor={fgColor} bgColor={bgColor} title="QR Code" />
      </div>
      <div className="button-row"><button onClick={downloadQrCode}>下载 {currentFormat.label}</button><button className="secondary-button" onClick={copySvg}>复制 SVG</button></div>
    </CardFrame>
  );
}
