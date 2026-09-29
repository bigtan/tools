import { assertTextLength, MAX_JSON_DEPTH } from "./limits";

/** Validate JSON, then format its original tokens without reserializing numbers. */
export function formatJson(input: string, pretty: boolean) {
  assertTextLength(input);
  JSON.parse(input);
  const tokens = input.match(/"(?:\\[\s\S]|[^"\\])*"|[^\s{}[\],:]+|[{}[\],:]/g) ?? [];
  const output: string[] = [];
  let depth = 0;
  const newline = () => { if (pretty) output.push("\n", "  ".repeat(depth)); };

  tokens.forEach((token, index) => {
    if (token === "{" || token === "[") {
      depth += 1;
      if (depth > MAX_JSON_DEPTH) throw new Error(`JSON 嵌套不能超过 ${MAX_JSON_DEPTH} 层`);
      output.push(token);
      if (tokens[index + 1] !== "}" && tokens[index + 1] !== "]") newline();
    } else if (token === "}" || token === "]") {
      depth -= 1;
      if (tokens[index - 1] !== "{" && tokens[index - 1] !== "[") newline();
      output.push(token);
    } else if (token === ",") {
      output.push(token);
      newline();
    } else if (token === ":") {
      output.push(pretty ? ": " : ":");
    } else {
      output.push(token);
    }
  });
  return output.join("");
}
