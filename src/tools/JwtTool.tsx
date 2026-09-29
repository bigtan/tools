import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { decodeBase64Url } from "../lib/codec";

export function JwtTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [token, setToken] = useState("");
  const [parts, setParts] = useState({ header: "", payload: "" });
  const [claims, setClaims] = useState<Array<{ claim: string; value: string; desc: string }>>([]);

  const decode = () => {
    try {
      const segments = token.split(".");
      if (segments.length < 2) {
        throw new Error("格式错误");
      }
      
      const headerStr = decodeBase64Url(segments[0]);
      const payloadStr = decodeBase64Url(segments[1]);
      
      const headerJson = JSON.parse(headerStr);
      const payloadJson = JSON.parse(payloadStr);

      setParts({
        header: JSON.stringify(headerJson, null, 2),
        payload: JSON.stringify(payloadJson, null, 2)
      });

      const parsedClaims: Array<{ claim: string; value: string; desc: string }> = [];

      if (payloadJson.exp !== undefined) {
        const date = new Date(Number(payloadJson.exp) * 1000);
        const expired = Date.now() > date.getTime();
        const diff = Math.floor((date.getTime() - Date.now()) / 1000);
        let statusText = "";
        if (expired) {
          const absDiff = Math.abs(diff);
          const days = Math.floor(absDiff / 86400);
          const hours = Math.floor((absDiff % 86400) / 3600);
          statusText = `🔴 已过期 (${days > 0 ? days + "天" : ""}${hours}小时前)`;
        } else {
          const days = Math.floor(diff / 86400);
          const hours = Math.floor((diff % 86400) / 3600);
          statusText = `🟢 有效 (剩 ${days > 0 ? days + "天" : ""}${hours}小时)`;
        }
        parsedClaims.push({ claim: "过期时间 (exp)", value: date.toLocaleString(), desc: statusText });
      }

      if (payloadJson.iat !== undefined) {
        parsedClaims.push({ claim: "签发时间 (iat)", value: new Date(Number(payloadJson.iat) * 1000).toLocaleString(), desc: "Token 签发时刻" });
      }
      if (payloadJson.nbf !== undefined) {
        parsedClaims.push({ claim: "生效时间 (nbf)", value: new Date(Number(payloadJson.nbf) * 1000).toLocaleString(), desc: "Token 生效时刻" });
      }
      if (payloadJson.sub !== undefined) {
        parsedClaims.push({ claim: "主题 (sub)", value: String(payloadJson.sub), desc: "用户或业务主体 ID" });
      }
      if (payloadJson.iss !== undefined) {
        parsedClaims.push({ claim: "签发方 (iss)", value: String(payloadJson.iss), desc: "Token 签署人/服务器" });
      }
      if (payloadJson.aud !== undefined) {
        parsedClaims.push({ claim: "受众 (aud)", value: String(payloadJson.aud), desc: "Token 接收方" });
      }

      setClaims(parsedClaims);
    } catch { 
      setParts({ header: "解析失败", payload: "无效的 JWT Token 结构" }); 
      setClaims([]);
    }
  };

  return (
    <CardFrame tool={tool}>
      <ControlledTextarea value={token} onChange={setToken} placeholder="在此处粘贴 JWT Token..." style={{minHeight: "80px"}} />
      <button onClick={decode}>解析</button>
      {parts.header && (
        <div className="tool-card-body" style={{gap: "12px", marginTop: "4px"}}>
          <div className="form-grid">
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}><strong>Header</strong><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(parts.header)}>复制</button></div>
              <textarea readOnly value={parts.header} className="code-area" style={{minHeight: "150px"}} />
            </div>
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}><strong>Payload</strong><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(parts.payload)}>复制</button></div>
              <textarea readOnly value={parts.payload} className="code-area" style={{minHeight: "150px"}} />
            </div>
          </div>
          {claims.length > 0 && (
            <div className="jwt-claims-panel" style={{borderTop: "1px solid var(--card-border)", paddingTop: "12px", marginTop: "4px"}}>
              <span style={{fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px", display: "block"}}>标准 Claim 解析</span>
              <div className="jwt-claims-list" style={{display: "flex", flexDirection: "column", gap: "6px"}}>
                {claims.map((c, i) => (
                  <div key={i} className="jwt-claim-row" style={{display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 8px", background: "var(--input-bg)", borderRadius: "6px", alignItems: "center"}}>
                    <span style={{fontWeight: "500"}}>{c.claim}</span>
                    <span style={{fontFamily: "var(--mono-font)", color: "var(--text-primary)"}}>{c.value}</span>
                    <span style={{fontWeight: "600", fontSize: "11px"}}>{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CardFrame>
  );
}
