import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { emptyOutput } from "../lib/output";
import { decodeBase64, decodeBase64ByLine, encodeBase64, encodeBase64ByLine } from "../lib/codec";

export function Base64Tool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [byLine, setByLine] = useState(false);
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "e"|"d") => {
    try {
      const value = m === "e"
        ? (byLine ? encodeBase64ByLine(input, true) : encodeBase64(input))
        : (byLine ? decodeBase64ByLine(input, true) : decodeBase64(input));
      setOutput({ value, error: "" });
    } catch {
      setOutput({ value: "", error: m === "e" ? "编码失败" : "解码失败，请检查输入是否为合法 Base64" });
    }
  };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><ControlledTextarea value={input} onChange={setInput} placeholder="输入要编码或解码的文本..." /><label className="check-row" style={{userSelect: "none"}}><input type="checkbox" checked={byLine} onChange={e => setByLine(e.target.checked)} /><span>按行处理（每行单独编解码）</span></label><div className="button-row"><button onClick={() => run("e")}>编码</button><button className="secondary-button" onClick={() => run("d")}>解码</button></div></CardFrame>;
}
