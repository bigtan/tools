import type { ReactNode } from "react";
import type { ToolDefinition } from "../types";
import { Base64Tool } from "../tools/Base64Tool";
import { UrlTool } from "../tools/UrlTool";
import { HexTool } from "../tools/HexTool";
import { RandomTool } from "../tools/RandomTool";
import { UuidTool } from "../tools/UuidTool";
import { AesTool } from "../tools/AesTool";
import { HashTool } from "../tools/HashTool";
import { JsonTool } from "../tools/JsonTool";
import { JwtTool } from "../tools/JwtTool";
import { AsymKeysTool } from "../tools/AsymKeysTool";
import { TimestampTool } from "../tools/TimestampTool";
import { QrCodeTool } from "../tools/QrCodeTool";
import { ImageCompressTool } from "../tools/ImageCompressTool";
import { ImageConvertTool } from "../tools/ImageConvertTool";

export function ToolPanel({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
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
