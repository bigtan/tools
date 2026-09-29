import { useState, useEffect } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import type { ChangeEvent } from "react";
import { ImagePreview } from "../components/ImagePreview";
import { imageFormatOptions, formatBytes, filenameBase, canvasToImageBlob } from "../lib/image";
import type { ImageFormat } from "../lib/image";

export function ImageConvertTool({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(1);
  const [result, setResult] = useState<{ url: string; blob: Blob; width: number; height: number } | null>(null);
  const [error, setError] = useState("");
  const currentFormat = imageFormatOptions.find(option => option.value === format) ?? imageFormatOptions[0];
  const usesQuality = format !== "image/png";

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

  const convert = async () => {
    if (!file) {
      setError("请先选择图片文件。");
      return;
    }

    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 初始化失败");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap, 0, 0);
      const blob = await canvasToImageBlob(canvas, format, usesQuality ? quality : undefined);
      setResult({ url: URL.createObjectURL(blob), blob, width: bitmap.width, height: bitmap.height });
      setError("");
    } catch (cause) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "图像转换失败，请确认文件格式可被当前浏览器解码。");
    } finally {
      bitmap?.close();
    }
  };

  const download = () => {
    if (!result || !file) return;
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = `${filenameBase(file.name)}.${currentFormat.extension}`;
    anchor.click();
  };

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
      <label>
        <span>质量 {usesQuality ? `${Math.round(quality * 100)}%` : "PNG 无损"}</span>
        <input type="range" min="0.1" max="1" step="0.05" value={quality} disabled={!usesQuality} onChange={event => setQuality(Number(event.target.value))} />
      </label>
      <p className="form-note">动画图片会按浏览器解码结果转换为静态图。</p>
      <div className="button-row"><button onClick={convert} disabled={!file}>转换类型</button>{result && <button className="secondary-button" onClick={download}>下载</button>}</div>
      {error && <p className="form-error">{error}</p>}
      {(sourceUrl || result) && (
        <div className="preview-grid">
          {sourceUrl && file && <ImagePreview title="原图" src={sourceUrl} meta={`${formatBytes(file.size)} · ${file.type || "unknown"}`} />}
          {result && <ImagePreview title={currentFormat.label} src={result.url} meta={`${formatBytes(result.blob.size)} · ${result.width}x${result.height}`} />}
        </div>
      )}
    </CardFrame>
  );
}
