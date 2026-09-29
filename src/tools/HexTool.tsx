import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { emptyOutput } from "../lib/output";
import { hexToText, textToHex } from "../lib/codec";

export function HexTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "t"|"h") => { try { setOutput({ value: m === "t" ? textToHex(input) : hexToText(input), error: "" }); } catch { setOutput({ value: "", error: "Hex 输入不合法，请检查是否为偶数长度且仅包含十六进制字符" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="输入文本或 Hex 字符串 (支持空格分隔)..." /><div className="button-row"><button onClick={() => run("t")}>Text to Hex</button><button className="secondary-button" onClick={() => run("h")}>Hex to Text</button></div></CardFrame>;
}
