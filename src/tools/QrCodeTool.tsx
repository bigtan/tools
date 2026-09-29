import { useAsyncTask } from "../hooks/useAsyncTask";
import { qrInputError, renderQrImage } from "../lib/qrcode";
import { useState, useRef, useMemo } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { QRCodeSVG } from "qrcode.react";
import { downloadBlob, imageFormatOptions } from "../lib/image";
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
  const task = useAsyncTask();
  const inputError = useMemo(() => qrInputError(value), [value]);
  const currentFormat = imageFormatOptions.find(option => option.value === format) ?? imageFormatOptions[0];

  const getSvgText = () => {
    if (!svgRef.current) return "";
    return new XMLSerializer().serializeToString(svgRef.current);
  };

  const copySvg = () => {
    const svgText = getSvgText();
    if (svgText) onCopy(svgText);
  };

  const downloadQrCode = () => {
    const svgText = getSvgText();
    if (!svgText || inputError) return;
    void task.run(() => renderQrImage(svgText, size, format, bgColor), blob => {
      downloadBlob(blob, `qrcode.${currentFormat.extension}`);
    });
  };

  return (
    <CardFrame tool={tool} controls={
      <>
        <select aria-label="纠错等级" value={level} onChange={event => { task.invalidate(); setLevel(event.target.value as QrErrorLevel); }}>
          <option value="L">纠错 L</option><option value="M">纠错 M</option><option value="Q">纠错 Q</option><option value="H">纠错 H</option>
        </select>
        <select aria-label="二维码输出格式" value={format} onChange={event => { task.invalidate(); setFormat(event.target.value as ImageFormat); }}>
          {imageFormatOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </>
    }>
      <ControlledTextarea value={value} onChange={text => { task.invalidate(); setValue(text); }} placeholder="输入文本、链接或其他内容..." />
      <div className="form-grid">
        <label><span>尺寸</span><input type="number" min={QR_MIN_SIZE} max={QR_MAX_SIZE} value={size} onChange={event => { task.invalidate(); setSize(clampInteger(Number(event.target.value), QR_MIN_SIZE, QR_MAX_SIZE, QR_MIN_SIZE)); }} /></label>
        <label><span>边距模块</span><input type="number" min={QR_MIN_MARGIN} max={QR_MAX_MARGIN} value={margin} onChange={event => { task.invalidate(); setMargin(clampInteger(Number(event.target.value), QR_MIN_MARGIN, QR_MAX_MARGIN, QR_MIN_MARGIN)); }} /></label>
        <label><span>前景色</span><input type="color" value={fgColor} onChange={event => { task.invalidate(); setFgColor(event.target.value); }} /></label>
        <label><span>背景色</span><input type="color" value={bgColor} onChange={event => { task.invalidate(); setBgColor(event.target.value); }} /></label>
      </div>
      <p className="form-note">内容最多 1000 个 UTF-8 字节，适用于全部纠错等级。</p>
      {(inputError || task.error) && <p role="alert" className="form-error">{inputError || task.error}</p>}
      {!inputError && <div className="qr-preview">
        <QRCodeSVG ref={svgRef} value={value} size={size} level={level} marginSize={margin} fgColor={fgColor} bgColor={bgColor} title="QR Code" />
      </div>}
      <div className="button-row"><button disabled={Boolean(inputError) || task.busy} onClick={downloadQrCode}>{task.busy ? "导出中…" : `下载 ${currentFormat.label}`}</button><button className="secondary-button" disabled={Boolean(inputError)} onClick={copySvg}>复制 SVG</button></div>
    </CardFrame>
  );
}
