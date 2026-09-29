import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { emptyOutput } from "../lib/output";
import { createRandomString } from "../lib/random";

export function RandomTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(5);
  const [lowercase, setLowercase] = useState(true);
  const [uppercase, setUppercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [excludeSimilar, setExcludeSimilar] = useState(true);
  const [customCharset, setCustomCharset] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const gen = () => {
    try {
      setOutput({ value: createRandomString({ length, count, lowercase, uppercase, digits, symbols, customCharset, excludeSimilar }), error: "" });
    } catch (e) {
      setOutput({ value: "", error: e instanceof Error ? e.message : "生成失败" });
    }
  };
  return (
    <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}>
      <div className="form-grid">
        <label><span>长度</span><input type="number" min="1" max="10000" value={length} onChange={e => setLength(Number(e.target.value))} /></label>
        <label><span>数量</span><input type="number" min="1" max="1000" value={count} onChange={e => setCount(Number(e.target.value))} /></label>
      </div>
      <div className="form-grid" style={{gap: "8px"}}>
        <label className="check-row" style={{userSelect: "none"}}><input type="checkbox" checked={lowercase} onChange={e => setLowercase(e.target.checked)} /><span>小写 a-z</span></label>
        <label className="check-row" style={{userSelect: "none"}}><input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} /><span>大写 A-Z</span></label>
        <label className="check-row" style={{userSelect: "none"}}><input type="checkbox" checked={digits} onChange={e => setDigits(e.target.checked)} /><span>数字 0-9</span></label>
        <label className="check-row" style={{userSelect: "none"}}><input type="checkbox" checked={symbols} onChange={e => setSymbols(e.target.checked)} /><span>符号</span></label>
        <label className="check-row" style={{userSelect: "none"}}><input type="checkbox" checked={excludeSimilar} onChange={e => setExcludeSimilar(e.target.checked)} /><span>排除易混字符</span></label>
      </div>
      <label><span>自定义字符集（填写后忽略上面的勾选）</span><input value={customCharset} onChange={e => setCustomCharset(e.target.value)} placeholder="例如 ABCDEF0123456789" /></label>
      <button onClick={gen}>生成</button>
    </CardFrame>
  );
}
