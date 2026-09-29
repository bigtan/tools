import type { ToolDefinition } from "../types";
import { ImageTool } from "./ImageTool";
export function ImageCompressTool({ tool }: { tool: ToolDefinition }) {
  return <ImageTool tool={tool} compress />;
}
