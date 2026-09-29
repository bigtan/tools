import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { decodeJwt } from "../lib/jwt";

export function JwtTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ReturnType<typeof decodeJwt> | null>(null);
  const [error, setError] = useState("");
  const decode = () => {
    try {
      setResult(decodeJwt(token));
      setError("");
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "JWT 解析失败");
    }
  };
  const changeToken = (value: string) => { setToken(value); setResult(null); setError(""); };
  return (
    <CardFrame tool={tool}>
      <ControlledTextarea value={token} onChange={changeToken} placeholder="在此处粘贴 JWT Token..." />
      <p className="form-note">仅解码，未验证签名。时间状态以点击解析时为准，不代表 Token 可信或可用于认证。</p>
      <button onClick={decode}>解析</button>
      {error && <p role="alert" className="form-error">{error}</p>}
      {result && <>
        <div className="form-grid">
          {(["header", "payload"] as const).map(part => <div key={part}>
            <div className="output-head"><strong>{part === "header" ? "Header" : "Payload"}</strong><button onClick={() => onCopy(result[part])}>复制</button></div>
            <textarea aria-label={part === "header" ? "Header" : "Payload"} readOnly value={result[part]} className="code-area" />
          </div>)}
        </div>
        <div className="jwt-claims-list">
          {result.claims.map(claim => <div key={claim.claim} className="jwt-claim-row">
            <strong>{claim.claim}</strong><span>{claim.value}</span><span>{claim.desc}</span>
          </div>)}
        </div>
      </>}
    </CardFrame>
  );
}
