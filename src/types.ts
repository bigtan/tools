export type ToolCategory = "encoding" | "generation" | "media" | "crypto" | "developer";

export type ToolDefinition = {
  id: string;
  name: string;
  summary: string;
  category: ToolCategory;
};
