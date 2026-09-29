import { assertTextLength, MAX_JSON_DEPTH, MAX_JSON_OUTPUT_LENGTH } from "./limits";

/** Validate JSON, then format its original tokens without reserializing numbers. */
export function formatJson(input: string, pretty: boolean) {
  assertTextLength(input);
  JSON.parse(input);
  const tokens = input.match(/"(?:\\[\s\S]|[^"\\])*"|[^\s{}[\],:]+|[{}[\],:]/g) ?? [];
  const output: string[] = [];
  let outputLength = 0;
  const append = (...parts: string[]) => {
    outputLength += parts.reduce((length, part) => length + part.length, 0);
    if (outputLength > MAX_JSON_OUTPUT_LENGTH) throw new Error("格式化结果过大，请减少缩进层数或使用压缩模式");
    output.push(...parts);
  };
  let depth = 0;
  const newline = () => { if (pretty) append("\n", "  ".repeat(depth)); };

  tokens.forEach((token, index) => {
    if (token === "{" || token === "[") {
      depth += 1;
      if (depth > MAX_JSON_DEPTH) throw new Error(`JSON 嵌套不能超过 ${MAX_JSON_DEPTH} 层`);
      append(token);
      if (tokens[index + 1] !== "}" && tokens[index + 1] !== "]") newline();
    } else if (token === "}" || token === "]") {
      depth -= 1;
      if (tokens[index - 1] !== "{" && tokens[index - 1] !== "[") newline();
      append(token);
    } else if (token === ",") {
      append(token);
      newline();
    } else if (token === ":") {
      append(pretty ? ": " : ":");
    } else {
      append(token);
    }
  });
  return output.join("");
}
