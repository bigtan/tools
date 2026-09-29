import type { ToolDefinition } from "../types";
import { ImageTool } from "./ImageTool";
export function ImageConvertTool({ tool }: { tool: ToolDefinition }) {
  return <ImageTool tool={tool} compress={false} />;
}
