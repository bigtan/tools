import { useState } from "react";
import type { ChangeEvent } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ImagePreview } from "../components/ImagePreview";
import { useAsyncTask } from "../hooks/useAsyncTask";
import { useBlobUrl } from "../hooks/useBlobUrl";
import { imageFormatOptions, formatBytes, processImage, downloadUrl, validateImageFile } from "../lib/image";
import type { ImageFormat, ImageResult } from "../lib/image";
import { MAX_IMAGE_DIMENSION } from "../lib/limits";

export function ImageTool({ tool, compress }: { tool: ToolDefinition; compress: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const source = useBlobUrl();
  const resultUrl = useBlobUrl();
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(compress ? 0.8 : 1);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState("");
  const task = useAsyncTask();
  const invalidate = () => { task.invalidate(); setError(""); };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    invalidate();
    setResult(null);
    resultUrl.replace(null);
    setFile(null);
    source.replace(null);
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      validateImageFile(selected);
      source.replace(selected);
      setFile(selected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片读取失败");
    }
  };
  const process = () => {
    if (!file) return;
    setError("");
    setResult(null);
    resultUrl.replace(null);
    void task.run(() => processImage(file, { format, quality, compress, maxWidth, maxHeight }), next => {
      resultUrl.replace(next.blob);
      setResult(next);
    });
  };
  const download = () => {
    if (!result) return;
    try { downloadUrl(resultUrl.url, result.filename); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "下载失败"); }
  };
  const outputFormat = imageFormatOptions.find(option => option.value === result?.format);
  const changePercent = result && result.sourceSize ? (1 - result.blob.size / result.sourceSize) * 100 : 0;
  const sizeChange = changePercent >= 0 ? `节省 ${changePercent.toFixed(1)}%` : `增大 ${Math.abs(changePercent).toFixed(1)}%`;
  return (
    <CardFrame tool={tool} controls={
      <select aria-label="输出格式" value={format} onChange={event => { invalidate(); setFormat(event.target.value as ImageFormat); }}>
        {imageFormatOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    }>
      <label className="file-picker"><span>选择图片</span><input type="file" accept="image/*" onChange={onFileChange} /></label>
      {compress && <div className="form-grid">
        <label><span>最大宽度</span><input type="number" min="1" max={MAX_IMAGE_DIMENSION} value={maxWidth} onChange={event => { invalidate(); setMaxWidth(Number(event.target.value)); }} /></label>
        <label><span>最大高度</span><input type="number" min="1" max={MAX_IMAGE_DIMENSION} value={maxHeight} onChange={event => { invalidate(); setMaxHeight(Number(event.target.value)); }} /></label>
      </div>}
      <label><span>质量 {format === "image/png" ? "PNG 无损" : `${Math.round(quality * 100)}%`}</span>
        <input type="range" min="0.1" max="1" step="0.05" value={quality} disabled={format === "image/png"} onChange={event => { invalidate(); setQuality(Number(event.target.value)); }} />
      </label>
      <p className="form-note">最多 20 MiB、2400 万像素，单边最多 8192 像素。动画转为静态图。修改选项后需重新处理，下载保留上次结果的格式。</p>
      <div className="button-row">
        <button onClick={process} disabled={!file || task.busy}>{task.busy ? "处理中…" : compress ? "压缩图片" : "转换类型"}</button>
        {result && <button className="secondary-button" onClick={download}>下载 {outputFormat?.label}</button>}
      </div>
      {(error || task.error) && <p role="alert" className="form-error">{error || task.error}</p>}
      {(file || result) && <div className="preview-grid">
        {file && <ImagePreview title="原图" src={source.url} meta={`${formatBytes(file.size)} · ${file.type || "unknown"}`} />}
        {result && <ImagePreview title={`${compress ? "压缩后 · " : ""}${outputFormat?.label}`} src={resultUrl.url} meta={`${formatBytes(result.blob.size)} · ${result.width}x${result.height} · ${sizeChange}`} />}
      </div>}
    </CardFrame>
  );
}
