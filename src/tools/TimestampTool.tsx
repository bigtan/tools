import { useState, useEffect } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { convertTimestamp } from "../lib/timestamp";
import type { TimestampUnit } from "../lib/timestamp";
type TimestampResult = {
  date: string;
  unitDetected: TimestampUnit;
  s: string;
  ms: string;
  us: string;
  ns: string;
};



export function TimestampTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<TimestampUnit>("s");
  const [autoDetect, setAutoDetect] = useState(true);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [result, setResult] = useState<TimestampResult | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const convert = () => {
    setError("");
    setResult(null);
    if (!input) { setError("请输入时间戳"); return; }
    try {
      const converted = convertTimestamp(input, unit, autoDetect);
      const d = new Date(Number(converted.dateMilliseconds));
      setResult({ 
        date: d.toLocaleString(), 
        unitDetected: converted.unitDetected,
        s: converted.s,
        ms: converted.ms,
        us: converted.us,
        ns: converted.ns
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无效格式或超出日期范围"); }
  };

  return (
    <CardFrame tool={tool}>
      <div style={{display: "flex", justifyContent: "center", marginBottom: "16px"}}>
        <div className="output-panel" style={{padding: "10px 24px", width: "100%", maxWidth: "420px"}}>
          <div style={{width: "100%", maxWidth: "320px", margin: "0 auto"}}>
          <span style={{color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "6px"}}>当前时间戳 (s)</span>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px"}}>
            <div style={{fontFamily: "var(--mono-font)", fontSize: "20px", fontWeight: "600", color: "var(--accent)"}}>{now}</div>
            <button className="secondary-button" style={{padding: "4px 10px", fontSize: "12px", marginLeft: "auto"}} onClick={() => onCopy(String(now))}>
              复制
            </button>
          </div>
          </div>
        </div>
      </div>
      <div className="button-row" style={{gap: "8px", flexDirection: "column"}}>
        <div style={{display: "flex", gap: "8px", width: "100%"}}>
          <input style={{flex: 1}} value={input} maxLength={64} onChange={e => { setInput(e.target.value); setResult(null); setError(""); }} placeholder="输入时间戳数字..." />
          <select style={{width: "80px"}} value={unit} disabled={autoDetect} onChange={e => setUnit(e.target.value as TimestampUnit)}>
            <option value="s">秒</option><option value="ms">毫秒</option><option value="us">微秒</option><option value="ns">纳秒</option>
          </select>
          <button onClick={convert}>转换</button>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "0 4px"}}>
          <label className="check-row" style={{userSelect: "none"}}>
            <input type="checkbox" checked={autoDetect} onChange={e => setAutoDetect(e.target.checked)} />
            <span>智能自动检测时间精度 (按位数识别)</span>
          </label>
        </div>
      </div>
      {error && <p role="alert" className="form-error">{error}</p>}
      {result && (
        <div style={{marginTop: "16px", borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
          {result.unitDetected && autoDetect && (
            <div className="detected-badge" style={{fontSize: "11px", color: "var(--accent)", marginBottom: "8px"}}>
              🎯 自动识别精度: <strong>{result.unitDetected === "s" ? "秒 (s)" : result.unitDetected === "ms" ? "毫秒 (ms)" : result.unitDetected === "us" ? "微秒 (us)" : "纳秒 (ns)"}</strong>
            </div>
          )}
          <div style={{marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
            <div><span style={{fontSize: "12px", color: "var(--text-secondary)"}}>本地时间</span><div style={{fontSize: "18px", fontWeight: "600", color: "var(--accent)"}}>{result.date}</div></div>
            <button className="secondary-button" onClick={() => onCopy(result.date)}>复制日期</button>
          </div>
          <div className="form-grid" style={{gap: "8px"}}>
            {(["s", "ms", "us", "ns"] as TimestampUnit[]).map(u => (
              <div key={u} className="output-panel" style={{padding: "8px"}}>
                <div style={{display: "flex", justifyContent: "space-between"}}><span style={{fontSize: "11px", color: "var(--text-secondary)"}}>{u}</span><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(result[u])}>复制</button></div>
                <div style={{fontSize: "13px", fontFamily: "var(--mono-font)"}}>{result[u]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardFrame>
  );
}
