import { useState, useEffect } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import type { ChangeEvent } from "react";
import { ImagePreview } from "../components/ImagePreview";
import { imageFormatOptions, formatBytes, filenameBase, canvasToImageBlob } from "../lib/image";
import type { ImageFormat } from "../lib/image";

export function ImageCompressTool({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [result, setResult] = useState<{ url: string; blob: Blob; width: number; height: number } | null>(null);
  const [error, setError] = useState("");
  const currentFormat = imageFormatOptions.find(option => option.value === format) ?? imageFormatOptions[0];

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    setResult(null);
    setFile(selected);
    setSourceUrl(selected ? URL.createObjectURL(selected) : "");
  };

  const compress = async () => {
    if (!file) {
      setError("请先选择图片文件。");
      return;
    }

    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const widthLimit = Number.isFinite(maxWidth) && maxWidth > 0 ? maxWidth : bitmap.width;
      const heightLimit = Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : bitmap.height;
      const ratio = Math.min(1, widthLimit / bitmap.width, heightLimit / bitmap.height);
      const width = Math.max(1, Math.round(bitmap.width * ratio));
      const height = Math.max(1, Math.round(bitmap.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 初始化失败");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await canvasToImageBlob(canvas, format, format === "image/png" ? undefined : quality);
      setResult({ url: URL.createObjectURL(blob), blob, width, height });
      setError("");
    } catch (cause) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "图片处理失败，请确认文件格式可被当前浏览器解码。");
    } finally {
      bitmap?.close();
    }
  };

  const download = () => {
    if (!result || !file) return;
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = `${filenameBase(file.name)}-compressed.${currentFormat.extension}`;
    anchor.click();
  };

  const reduction = file && result ? Math.max(0, 1 - result.blob.size / file.size) * 100 : 0;

  return (
    <CardFrame tool={tool} controls={
      <select value={format} onChange={event => setFormat(event.target.value as ImageFormat)}>
        {imageFormatOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    }>
      <label className="file-picker">
        <span>选择图片</span>
        <input type="file" accept="image/*" onChange={onFileChange} />
      </label>
      <div className="form-grid">
        <label><span>最大宽度</span><input type="number" min="1" value={maxWidth} onChange={event => setMaxWidth(Number(event.target.value))} /></label>
        <label><span>最大高度</span><input type="number" min="1" value={maxHeight} onChange={event => setMaxHeight(Number(event.target.value))} /></label>
      </div>
      <label>
        <span>质量 {Math.round(quality * 100)}%</span>
        <input type="range" min="0.1" max="1" step="0.05" value={quality} disabled={format === "image/png"} onChange={event => setQuality(Number(event.target.value))} />
      </label>
      <div className="button-row"><button onClick={compress} disabled={!file}>压缩图片</button>{result && <button className="secondary-button" onClick={download}>下载</button>}</div>
      {error && <p className="form-error">{error}</p>}
      {(sourceUrl || result) && (
        <div className="preview-grid">
          {sourceUrl && file && <ImagePreview title="原图" src={sourceUrl} meta={`${formatBytes(file.size)} · ${file.type || "unknown"}`} />}
          {result && <ImagePreview title="压缩后" src={result.url} meta={`${formatBytes(result.blob.size)} · ${result.width}x${result.height} · 节省 ${reduction.toFixed(1)}%`} />}
        </div>
      )}
    </CardFrame>
  );
}
