import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { emptyOutput } from "../lib/output";
import { digestText } from "../lib/crypto";
type DigestAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";

export function HashTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<DigestAlgorithm>("SHA-256");
  const [output, setOutput] = useState(emptyOutput);
  const run = async () => setOutput({ value: await digestText(algo, input), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)} controls={
    <select value={algo} onChange={e => setAlgo(e.target.value as DigestAlgorithm)}><option value="SHA-256">SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option></select>
  }><ControlledTextarea value={input} onChange={setInput} placeholder="输入要计算摘要的文本..." /><button onClick={run}>计算摘要</button></CardFrame>;
}
