export type ToolCategory = "encoding" | "generation" | "crypto" | "developer";

export type ToolDefinition = {
  id: string;
  name: string;
  summary: string;
  category: ToolCategory;
};
