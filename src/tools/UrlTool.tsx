import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { emptyOutput } from "../lib/output";
import { decodeUrl, encodeUrl } from "../lib/codec";

export function UrlTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "e"|"d") => { try { setOutput({ value: m === "e" ? encodeUrl(input, true) : decodeUrl(input, true), error: "" }); } catch { setOutput({ value: "", error: m === "e" ? "编码失败" : "解码失败，请检查转义序列是否合法（如 %xx）" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="输入要 Encode 或 Decode 的 URL..." /><div className="button-row"><button onClick={() => run("e")}>编码</button><button className="secondary-button" onClick={() => run("d")}>解码</button></div></CardFrame>;
}
