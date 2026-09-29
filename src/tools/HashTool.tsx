import { useAsyncTask } from "../hooks/useAsyncTask";
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
  const task = useAsyncTask();
  const invalidate = () => { task.invalidate(); setOutput(emptyOutput); };
  const run = () => { setOutput(emptyOutput); void task.run(() => digestText(algo, input), value => setOutput({ value, error: "" })); };
  return <CardFrame tool={tool} output={task.error ? { value: "", error: task.error } : output} onCopy={() => onCopy(output.value)} controls={
    <select aria-label="摘要算法" value={algo} onChange={e => { invalidate(); setAlgo(e.target.value as DigestAlgorithm); }}><option value="SHA-256">SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option></select>
  }><ControlledTextarea value={input} onChange={value => { invalidate(); setInput(value); }} placeholder="输入要计算摘要的文本..." /><button disabled={task.busy} onClick={run}>{task.busy ? "计算中…" : "计算摘要"}</button></CardFrame>;
}
