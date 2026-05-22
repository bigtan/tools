import type { ChangeEvent, ReactNode } from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  decodeBase64,
  decodeBase64Url,
  decodeUrl,
  encodeBase64,
  encodeUrl,
  hexToText,
  textToHex
} from "./lib/codec";
import { 
  buildAesMaterial, 
  decryptAes, 
  digestText, 
  encryptAes, 
  generateRsaKeyPair, 
  generateEccKeyPair,
  generateCsr
} from "./lib/crypto";
import { createRandomString, createUuidList } from "./lib/random";
import type { ToolCategory, ToolDefinition } from "./types";

const tools: ToolDefinition[] = [
  { id: "base64", name: "Base64", summary: "UTF-8 Base64 编解码，支持按行模式。", category: "encoding" },
  { id: "url", name: "URL Encode", summary: "URI / Component URL 编解码。", category: "encoding" },
  { id: "hex", name: "Hex / Text", summary: "文本与 Hex 的双向转换。", category: "encoding" },
  { id: "random", name: "随机字符串", summary: "可配置字符集、长度、数量生成。", category: "generation" },
  { id: "uuid", name: "UUID", summary: "批量生成 UUID v4。", category: "generation" },
  { id: "qrcode", name: "二维码生成", summary: "生成可下载 SVG 二维码，支持纠错等级和边距。", category: "generation" },
  { id: "image-compress", name: "图片压缩", summary: "本地压缩图片，默认 WebP，支持 JPEG/WebP/PNG 输出。", category: "media" },
  { id: "image-convert", name: "图像类型转换", summary: "本地转换常见图像格式，支持 PNG/JPEG/WebP 输出。", category: "media" },
  { id: "aes", name: "AES 加解密", summary: "CBC/GCM 编解码及 Key/IV 生成。", category: "crypto" },
  { id: "asym-keys", name: "证书与密钥", summary: "生成 RSA/ECC 密钥对及 CSR 请求。", category: "crypto" },
  { id: "hash", name: "Hash 摘要", summary: "SHA-256 / 384 / 512 计算。", category: "crypto" },
  { id: "timestamp", name: "时间戳", summary: "Unix 时间戳与本地时间互转。", category: "developer" },
  { id: "jwt", name: "JWT 解析", summary: "纯前端解析 Header 和 Payload。", category: "developer" },
  { id: "json", name: "JSON 格式化", summary: "格式化和压缩 JSON。", category: "developer" }
];

const categories: Array<{ id: ToolCategory | "all"; label: string }> = [
  { id: "all", label: "全部" },
  { id: "encoding", label: "编码转换" },
  { id: "generation", label: "文本生成" },
  { id: "media", label: "图像媒体" },
  { id: "crypto", label: "安全加密" },
  { id: "developer", label: "日常辅助" }
];

type OutputState = { value: string; error: string; };
const emptyOutput: OutputState = { value: "", error: "" };
type ImageFormat = "image/jpeg" | "image/webp" | "image/png";
type QrErrorLevel = "L" | "M" | "Q" | "H";

const imageFormatOptions: Array<{ value: ImageFormat; label: string; extension: string }> = [
  { value: "image/webp", label: "WebP", extension: "webp" },
  { value: "image/jpeg", label: "JPEG", extension: "jpg" },
  { value: "image/png", label: "PNG", extension: "png" }
];

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function filenameBase(name: string) {
  return name.replace(/\.[^/.]+$/, "") || "image";
}

async function canvasToImageBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality?: number) {
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

function ControlledTextarea({
  value,
  onChange,
  placeholder,
  style,
  showPasteClear = true
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: any;
  showPasteClear?: boolean;
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="input-textarea-wrapper">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={style}
        className="form-textarea"
      />
      {showPasteClear && (
        <div className="textarea-actions">
          <button type="button" className="textarea-action-btn" title="粘贴" onClick={handlePaste}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            粘贴
          </button>
          {value && (
            <button type="button" className="textarea-action-btn clear-btn" title="清空" onClick={() => onChange("")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              清空
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(null); // 先清除旧的
    setTimeout(() => setToast(message), 10);
  };

  const copyText = (value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      showToast("已成功复制到剪贴板");
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      const matchesSearch = searchQuery.trim() === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="page-shell">
      <header className="header-container">
        <div className="header-left">
          <h1 className="header-title">开发者工具</h1>
          <p>简洁、安全、强大的工具集，本地处理保障隐私。</p>
        </div>
        <div className="header-search-nav">
          <div className="search-box-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="搜索工具 (例如: AES, Base64, JSON...)" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery("")}>×</button>
            )}
          </div>
          <nav className="header-right">
            <div className="category-row">
              {categories.map(c => (
                <button key={c.id} onClick={() => setActiveCategory(c.id)}
                  className={c.id === activeCategory ? "category-pill is-active" : "category-pill"}>
                  {c.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>
      
      <section className="tool-grid">
        {filteredTools.map(t => <ToolPanel key={t.id} tool={t} onCopy={copyText} />)}
        {filteredTools.length === 0 && (
          <div className="no-results-panel">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            <p>未找到匹配的工具，请尝试其他关键词</p>
          </div>
        )}
      </section>


      {toast && (
        <div className="toast-container">
          <div className="toast">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolPanel({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const components: Record<string, ReactNode> = {
    base64: <Base64Tool tool={tool} onCopy={onCopy} />,
    url: <UrlTool tool={tool} onCopy={onCopy} />,
    hex: <HexTool tool={tool} onCopy={onCopy} />,
    random: <RandomTool tool={tool} onCopy={onCopy} />,
    uuid: <UuidTool tool={tool} onCopy={onCopy} />,
    qrcode: <QrCodeTool tool={tool} onCopy={onCopy} />,
    "image-compress": <ImageCompressTool tool={tool} />,
    "image-convert": <ImageConvertTool tool={tool} />,
    aes: <AesTool tool={tool} onCopy={onCopy} />,
    "asym-keys": <AsymKeysTool tool={tool} onCopy={onCopy} />,
    hash: <HashTool tool={tool} onCopy={onCopy} />,
    timestamp: <TimestampTool tool={tool} onCopy={onCopy} />,
    jwt: <JwtTool tool={tool} onCopy={onCopy} />,
    json: <JsonTool tool={tool} onCopy={onCopy} />
  };
  return components[tool.id] || null;
}

function CardFrame({ tool, controls, output, onCopy, children }: { 
  tool: ToolDefinition; controls?: ReactNode; output?: OutputState; onCopy?: () => void; children: ReactNode; 
}) {
  return (
    <article className="tool-card">
      <div className="tool-card-head">
        <div><h2>{tool.name}</h2><p>{tool.summary}</p></div>
        {controls && <div className="tool-inline-controls">{controls}</div>}
      </div>
      <div className="tool-card-body">{children}</div>
      {output && (
        <div className="output-panel">
          <div className="output-head">
            <strong>输出结果</strong>
            <button onClick={onCopy} disabled={!output.value}>复制</button>
          </div>
          <textarea readOnly value={output.error || output.value} className={output.error ? "is-error" : ""} />
        </div>
      )}
    </article>
  );
}

function ImageCompressTool({ tool }: { tool: ToolDefinition }) {
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

function ImagePreview({ title, src, meta }: { title: string; src: string; meta: string }) {
  return (
    <div className="media-preview">
      <div className="media-preview-head"><strong>{title}</strong><span>{meta}</span></div>
      <img src={src} alt={title} />
    </div>
  );
}

function ImageConvertTool({ tool }: { tool: ToolDefinition }) {
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

function QrCodeTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
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
    let blob: Blob | null = null;
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
      blob = await canvasToImageBlob(canvas, format, 1);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qrcode.${currentFormat.extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
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
        <label><span>尺寸</span><input type="number" min="96" max="1024" value={size} onChange={event => setSize(Number(event.target.value))} /></label>
        <label><span>边距模块</span><input type="number" min="0" max="8" value={margin} onChange={event => setMargin(Number(event.target.value))} /></label>
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

// --- Combined Cert Tool ---
function AsymKeysTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [type, setType] = useState<"RSA" | "ECC">("RSA");
  const [size, setSize] = useState("2048");
  const [keys, setKeys] = useState({ privateKey: "", publicKey: "" });
  const [dn, setDn] = useState({ commonName: "", organization: "", country: "CN" });
  const [csr, setCsr] = useState("");

  useEffect(() => { setSize(type === "RSA" ? "2048" : "P-256"); }, [type]);

  const generate = async () => {
    try {
      const res = type === "RSA" ? await generateRsaKeyPair(Number(size)) : await generateEccKeyPair(size as any);
      setKeys(res);
      setCsr("");
    } catch (e) { console.error(e); }
  };

  const createCsr = async () => {
    if (!keys.privateKey) return;
    const res = await generateCsr(keys, dn, type);
    setCsr(res);
  };

  return (
    <CardFrame tool={tool} controls={
      <select value={type} onChange={e => setType(e.target.value as any)}>
        <option value="RSA">RSA</option><option value="ECC">ECC</option>
      </select>
    }>
      <div className="button-row" style={{justifyContent: "space-between", alignItems: "center"}}>
        <select value={size} onChange={e => setSize(e.target.value)} style={{width: "120px"}}>
          {type === "RSA" ? (<><option value="2048">2048 bit</option><option value="4096">4096 bit</option></>) : (<><option value="P-256">P-256</option><option value="P-384">P-384</option></>)}
        </select>
        <button onClick={generate}>生成密钥对</button>
      </div>
      {keys.privateKey && (
        <div className="tool-card-body" style={{marginTop: "8px", gap: "16px"}}>
          <div className="form-grid">
            <div><span>Private Key</span><textarea readOnly value={keys.privateKey} style={{minHeight: "220px", fontSize: "11px", fontFamily: "var(--mono-font)"}} /></div>
            <div><span>Public Key</span><textarea readOnly value={keys.publicKey} style={{minHeight: "220px", fontSize: "11px", fontFamily: "var(--mono-font)"}} /></div>
          </div>
          <div style={{borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
            <span style={{fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px", display: "block"}}>CSR 申请信息</span>
            <div className="form-grid"><input placeholder="CN (域名)" value={dn.commonName} onChange={e => setDn({...dn, commonName: e.target.value})} /><input placeholder="O (组织)" value={dn.organization} onChange={e => setDn({...dn, organization: e.target.value})} /></div>
            <button onClick={createCsr} style={{marginTop: "16px", width: "100%"}}>生成 CSR 请求</button>
          </div>
          {csr && (
            <div className="output-panel">
              <div className="output-head"><strong>CSR PEM</strong><button onClick={() => onCopy(csr)}>复制</button></div>
              <textarea readOnly value={csr} style={{minHeight: "180px", fontSize: "11px", fontFamily: "var(--mono-font)"}} />
            </div>
          )}
        </div>
      )}
    </CardFrame>
  );
}

// --- Timestamp Tool ---
function TimestampTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<"s" | "ms" | "us" | "ns">("s");
  const [autoDetect, setAutoDetect] = useState(true);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const convert = () => {
    if (!input) return;
    try {
      let ms = 0;
      const cleanInput = input.replace(/\D/g, "");
      const val = BigInt(cleanInput);
      
      let finalUnit = unit;
      if (autoDetect) {
        if (cleanInput.length >= 19) {
          finalUnit = "ns";
        } else if (cleanInput.length >= 16) {
          finalUnit = "us";
        } else if (cleanInput.length >= 13) {
          finalUnit = "ms";
        } else {
          finalUnit = "s";
        }
      }

      if (finalUnit === "s") ms = Number(val * 1000n);
      else if (finalUnit === "ms") ms = Number(val);
      else if (finalUnit === "us") ms = Number(val / 1000n);
      else if (finalUnit === "ns") ms = Number(val / 1000000n);
      const d = new Date(ms);
      const baseMs = BigInt(ms);
      setResult({ 
        date: d.toLocaleString(), 
        unitDetected: finalUnit,
        s: String(baseMs / 1000n), 
        ms: String(baseMs), 
        us: String(baseMs * 1000n), 
        ns: String(baseMs * 1000000n) 
      });
    } catch { alert("无效格式"); }
  };

  return (
    <CardFrame tool={tool}>
      <div style={{display: "flex", justifyContent: "center", marginBottom: "16px"}}>
        <div className="output-panel" style={{padding: "10px 24px", width: "100%", maxWidth: "420px"}}>
          <div style={{width: "100%", maxWidth: "320px", margin: "0 auto"}}>
          <span style={{color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "6px"}}>当前时间戳 (s)</span>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px"}}>
            <div style={{fontFamily: "var(--mono-font)", fontSize: "20px", fontWeight: "600", color: "var(--accent)"}}>{now}</div>
            <button className="secondary-button" style={{padding: "4px 10px", fontSize: "12px", marginLeft: "auto"}} onClick={() => onCopy(String(now))}>
              复制
            </button>
          </div>
          </div>
        </div>
      </div>
      <div className="button-row" style={{gap: "8px", flexDirection: "column"}}>
        <div style={{display: "flex", gap: "8px", width: "100%"}}>
          <input style={{flex: 1}} value={input} onChange={e => setInput(e.target.value)} placeholder="输入时间戳数字..." />
          <select style={{width: "80px"}} value={unit} disabled={autoDetect} onChange={e => setUnit(e.target.value as any)}>
            <option value="s">秒</option><option value="ms">毫秒</option><option value="us">微秒</option><option value="ns">纳秒</option>
          </select>
          <button onClick={convert}>转换</button>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "0 4px"}}>
          <label className="check-row" style={{userSelect: "none"}}>
            <input type="checkbox" checked={autoDetect} onChange={e => setAutoDetect(e.target.checked)} />
            <span>智能自动检测时间精度 (按位数识别)</span>
          </label>
        </div>
      </div>
      {result && (
        <div style={{marginTop: "16px", borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
          {result.unitDetected && autoDetect && (
            <div className="detected-badge" style={{fontSize: "11px", color: "var(--accent)", marginBottom: "8px"}}>
              🎯 自动识别精度: <strong>{result.unitDetected === "s" ? "秒 (s)" : result.unitDetected === "ms" ? "毫秒 (ms)" : result.unitDetected === "us" ? "微秒 (us)" : "纳秒 (ns)"}</strong>
            </div>
          )}
          <div style={{marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
            <div><span style={{fontSize: "12px", color: "var(--text-secondary)"}}>本地时间</span><div style={{fontSize: "18px", fontWeight: "600", color: "var(--accent)"}}>{result.date}</div></div>
            <button className="secondary-button" onClick={() => onCopy(result.date)}>复制日期</button>
          </div>
          <div className="form-grid" style={{gap: "8px"}}>
            {["s", "ms", "us", "ns"].map(u => (
              <div key={u} className="output-panel" style={{padding: "8px"}}>
                <div style={{display: "flex", justifyContent: "space-between"}}><span style={{fontSize: "11px", color: "var(--text-secondary)"}}>{u}</span><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(result[u])}>复制</button></div>
                <div style={{fontSize: "13px", fontFamily: "var(--mono-font)"}}>{result[u]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardFrame>
  );
}

// --- JWT Decoder ---
function JwtTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [token, setToken] = useState("");
  const [parts, setParts] = useState({ header: "", payload: "" });
  const [claims, setClaims] = useState<Array<{ claim: string; value: string; desc: string }>>([]);

  const decode = () => {
    try {
      const segments = token.split(".");
      if (segments.length < 2) {
        throw new Error("格式错误");
      }
      
      const headerStr = decodeBase64Url(segments[0]);
      const payloadStr = decodeBase64Url(segments[1]);
      
      const headerJson = JSON.parse(headerStr);
      const payloadJson = JSON.parse(payloadStr);

      setParts({
        header: JSON.stringify(headerJson, null, 2),
        payload: JSON.stringify(payloadJson, null, 2)
      });

      const parsedClaims: Array<{ claim: string; value: string; desc: string }> = [];

      if (payloadJson.exp !== undefined) {
        const date = new Date(Number(payloadJson.exp) * 1000);
        const expired = Date.now() > date.getTime();
        const diff = Math.floor((date.getTime() - Date.now()) / 1000);
        let statusText = "";
        if (expired) {
          const absDiff = Math.abs(diff);
          const days = Math.floor(absDiff / 86400);
          const hours = Math.floor((absDiff % 86400) / 3600);
          statusText = `🔴 已过期 (${days > 0 ? days + "天" : ""}${hours}小时前)`;
        } else {
          const days = Math.floor(diff / 86400);
          const hours = Math.floor((diff % 86400) / 3600);
          statusText = `🟢 有效 (剩 ${days > 0 ? days + "天" : ""}${hours}小时)`;
        }
        parsedClaims.push({ claim: "过期时间 (exp)", value: date.toLocaleString(), desc: statusText });
      }

      if (payloadJson.iat !== undefined) {
        parsedClaims.push({ claim: "签发时间 (iat)", value: new Date(Number(payloadJson.iat) * 1000).toLocaleString(), desc: "Token 签发时刻" });
      }
      if (payloadJson.nbf !== undefined) {
        parsedClaims.push({ claim: "生效时间 (nbf)", value: new Date(Number(payloadJson.nbf) * 1000).toLocaleString(), desc: "Token 生效时刻" });
      }
      if (payloadJson.sub !== undefined) {
        parsedClaims.push({ claim: "主题 (sub)", value: String(payloadJson.sub), desc: "用户或业务主体 ID" });
      }
      if (payloadJson.iss !== undefined) {
        parsedClaims.push({ claim: "签发方 (iss)", value: String(payloadJson.iss), desc: "Token 签署人/服务器" });
      }
      if (payloadJson.aud !== undefined) {
        parsedClaims.push({ claim: "受众 (aud)", value: String(payloadJson.aud), desc: "Token 接收方" });
      }

      setClaims(parsedClaims);
    } catch { 
      setParts({ header: "解析失败", payload: "无效的 JWT Token 结构" }); 
      setClaims([]);
    }
  };

  return (
    <CardFrame tool={tool}>
      <ControlledTextarea value={token} onChange={setToken} placeholder="在此处粘贴 JWT Token..." style={{minHeight: "80px"}} />
      <button onClick={decode}>解析</button>
      {parts.header && (
        <div className="tool-card-body" style={{gap: "12px", marginTop: "4px"}}>
          <div className="form-grid">
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}><strong>Header</strong><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(parts.header)}>复制</button></div>
              <textarea readOnly value={parts.header} style={{minHeight: "150px", fontSize: "11px", width: "100%", fontFamily: "var(--mono-font)"}} />
            </div>
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}><strong>Payload</strong><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(parts.payload)}>复制</button></div>
              <textarea readOnly value={parts.payload} style={{minHeight: "150px", fontSize: "11px", width: "100%", fontFamily: "var(--mono-font)"}} />
            </div>
          </div>
          {claims.length > 0 && (
            <div className="jwt-claims-panel" style={{borderTop: "1px solid var(--card-border)", paddingTop: "12px", marginTop: "4px"}}>
              <span style={{fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px", display: "block"}}>标准 Claim 解析</span>
              <div className="jwt-claims-list" style={{display: "flex", flexDirection: "column", gap: "6px"}}>
                {claims.map((c, i) => (
                  <div key={i} className="jwt-claim-row" style={{display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 8px", background: "var(--input-bg)", borderRadius: "6px", alignItems: "center"}}>
                    <span style={{fontWeight: "500"}}>{c.claim}</span>
                    <span style={{fontFamily: "var(--mono-font)", color: "var(--text-primary)"}}>{c.value}</span>
                    <span style={{fontWeight: "600", fontSize: "11px"}}>{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CardFrame>
  );
}

// --- 其他工具升级版本以匹配组件接口 ---
function Base64Tool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "e"|"d") => { try { setOutput({ value: m === "e" ? encodeBase64(input) : decodeBase64(input), error: "" }); } catch(e) { setOutput({ value: "", error: "失败" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="输入要编码或解码的文本..." /><div className="button-row"><button onClick={() => run("e")}>编码</button><button className="secondary-button" onClick={() => run("d")}>解码</button></div></CardFrame>;
}

function UrlTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "e"|"d") => { try { setOutput({ value: m === "e" ? encodeUrl(input, true) : decodeUrl(input, true), error: "" }); } catch(e) { setOutput({ value: "", error: "失败" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="输入要 Encode 或 Decode 的 URL..." /><div className="button-row"><button onClick={() => run("e")}>编码</button><button className="secondary-button" onClick={() => run("d")}>解码</button></div></CardFrame>;
}

function HexTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "t"|"h") => { try { setOutput({ value: m === "t" ? textToHex(input) : hexToText(input), error: "" }); } catch(e) { setOutput({ value: "", error: "Hex 输入不合法，请检查是否为偶数长度且仅包含十六进制字符" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="输入文本或 Hex 字符串 (支持空格分隔)..." /><div className="button-row"><button onClick={() => run("t")}>Text to Hex</button><button className="secondary-button" onClick={() => run("h")}>Hex to Text</button></div></CardFrame>;
}

function RandomTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [length, setLength] = useState(16);
  const [output, setOutput] = useState(emptyOutput);
  const gen = () => setOutput({ value: createRandomString({ length, count: 5, lowercase: true, uppercase: true, digits: true, symbols: false, customCharset: "", excludeSimilar: true }), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><div className="form-grid"><span>长度</span><input type="number" value={length} onChange={e => setLength(Number(e.target.value))} /></div><button onClick={gen}>生成</button></CardFrame>;
}

function UuidTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState({ value: createUuidList(5), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><input type="number" value={count} onChange={e => setCount(Number(e.target.value))} /><button onClick={() => setOutput({value: createUuidList(count), error: ""})}>生成 UUID</button></CardFrame>;
}

function AesTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [mode, setMode] = useState<"AES-GCM"|"AES-CBC">("AES-GCM");
  const [keyHex, setKeyHex] = useState("");
  const [ivHex, setIvHex] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);

  const gen = () => { 
    const m = buildAesMaterial(256, mode === "AES-GCM" ? 12 : 16); 
    setKeyHex(m.keyHex); 
    setIvHex(m.ivHex); 
  };

  const isKeyValid = useMemo(() => {
    const cleaned = keyHex.trim().replace(/\s+/g, "");
    if (!cleaned) return null;
    const isHex = /^[0-9a-fA-F]*$/.test(cleaned);
    const len = cleaned.length;
    const isCorrectLen = len === 32 || len === 48 || len === 64;
    return isHex && isCorrectLen;
  }, [keyHex]);

  const isIvValid = useMemo(() => {
    const cleaned = ivHex.trim().replace(/\s+/g, "");
    if (!cleaned) return null;
    const isHex = /^[0-9a-fA-F]*$/.test(cleaned);
    const len = cleaned.length;
    const isCorrectLen = mode === "AES-GCM" ? len === 24 : len === 32;
    return isHex && isCorrectLen;
  }, [ivHex, mode]);

  const run = async (a: "e"|"d") => { 
    try { 
      setOutput({ 
        value: a === "e" 
          ? await encryptAes({ mode, keyHex: keyHex.trim(), ivHex: ivHex.trim(), plainText: input, output: "hex" }) 
          : await decryptAes({ mode, keyHex: keyHex.trim(), ivHex: ivHex.trim(), cipherText: input, input: "hex" }), 
        error: "" 
      }); 
    } catch(e) { 
      setOutput({ value: "", error: "加解密失败，请检查 Key/IV 长度及格式是否正确" }); 
    } 
  };

  return (
    <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)} controls={
      <select value={mode} onChange={e => setMode(e.target.value as any)}><option value="AES-GCM">GCM</option><option value="AES-CBC">CBC</option></select>
    }>
      <div className="form-grid" style={{gap: "12px"}}>
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)"}}>KEY (十六进制)</span>
            {isKeyValid !== null && (
              <span style={{fontSize: "11px", fontWeight: "600", color: isKeyValid ? "var(--accent)" : "var(--danger)"}}>
                {isKeyValid ? "✔ 格式正确" : "✘ 应为32/48/64位"}
              </span>
            )}
          </div>
          <input 
            value={keyHex} 
            onChange={e => setKeyHex(e.target.value)} 
            placeholder="32位/48位/64位十六进制" 
            className={isKeyValid === false ? "is-invalid" : isKeyValid === true ? "is-valid" : ""}
          />
        </div>
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)"}}>IV (十六进制)</span>
            {isIvValid !== null && (
              <span style={{fontSize: "11px", fontWeight: "600", color: isIvValid ? "var(--accent)" : "var(--danger)"}}>
                {isIvValid ? "✔ 格式正确" : mode === "AES-GCM" ? "应为24位" : "应为32位"}
              </span>
            )}
          </div>
          <input 
            value={ivHex} 
            onChange={e => setIvHex(e.target.value)} 
            placeholder={mode === "AES-GCM" ? "24位十六进制" : "32位十六进制"} 
            className={isIvValid === false ? "is-invalid" : isIvValid === true ? "is-valid" : ""}
          />
        </div>
      </div>
      <button className="secondary-button" style={{alignSelf: "flex-start"}} onClick={gen}>随机生成 Key/IV (256-bit)</button>
      <ControlledTextarea value={input} onChange={setInput} placeholder="输入要加密的明文，或解密的 Hex 密文..." />
      <div className="button-row">
        <button onClick={() => run("e")} disabled={!keyHex || !ivHex}>加密</button>
        <button className="secondary-button" onClick={() => run("d")} disabled={!keyHex || !ivHex}>解密</button>
      </div>
    </CardFrame>
  );
}

function HashTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<any>("SHA-256");
  const [output, setOutput] = useState(emptyOutput);
  const run = async () => setOutput({ value: await digestText(algo, input), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)} controls={
    <select value={algo} onChange={e => setAlgo(e.target.value)}><option value="SHA-256">SHA-256</option><option value="SHA-512">SHA-512</option></select>
  }><ControlledTextarea value={input} onChange={setInput} placeholder="输入要计算摘要的文本..." /><button onClick={run}>计算摘要</button></CardFrame>;
}

function JsonTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "f"|"m") => { try { const p = JSON.parse(input); setOutput({ value: m === "f" ? JSON.stringify(p, null, 2) : JSON.stringify(p), error: "" }); } catch(e) { setOutput({ value: "", error: "无效 JSON 格式" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="粘贴要格式化或压缩的 JSON..." /><div className="button-row"><button onClick={() => run("f")}>格式化</button><button className="secondary-button" onClick={() => run("m")}>压缩</button></div></CardFrame>;
}
