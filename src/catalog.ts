import type { ToolCategory, ToolDefinition } from "./types";

export const tools: ToolDefinition[] = [
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

export const categories: Array<{ id: ToolCategory | "all"; label: string }> = [
  { id: "all", label: "全部" },
  { id: "encoding", label: "编码转换" },
  { id: "generation", label: "文本生成" },
  { id: "media", label: "图像媒体" },
  { id: "crypto", label: "安全加密" },
  { id: "developer", label: "日常辅助" }
];

