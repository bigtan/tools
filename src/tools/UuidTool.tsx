import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { createUuidList } from "../lib/random";

export function UuidTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState(() => ({ value: createUuidList(5), error: "" }));
  const generate = () => {
    try {
      setOutput({ value: createUuidList(count), error: "" });
    } catch (error) {
      setOutput({ value: "", error: error instanceof Error ? error.message : "生成失败" });
    }
  };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><input type="number" min="1" max="10000" value={count} onChange={e => setCount(Number(e.target.value))} /><button onClick={generate}>生成 UUID</button></CardFrame>;
}
