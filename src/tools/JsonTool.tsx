import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { formatJson } from "../lib/json";
import { emptyOutput } from "../lib/output";


export function JsonTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "f"|"m") => { try { setOutput({ value: formatJson(input, m === "f"), error: "" }); } catch(e) { setOutput({ value: "", error: `无效 JSON：${e instanceof Error ? e.message : "解析失败"}` }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="粘贴要格式化或压缩的 JSON..." /><div className="button-row"><button onClick={() => run("f")}>格式化</button><button className="secondary-button" onClick={() => run("m")}>压缩</button></div></CardFrame>;
}
