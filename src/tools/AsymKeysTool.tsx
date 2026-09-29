import { useState } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { generateRsaKeyPair, generateEccKeyPair, generateCsr } from "../lib/crypto";
type EccCurve = "P-256" | "P-384" | "P-521";

export function AsymKeysTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [type, setType] = useState<"RSA" | "ECC">("RSA");
  const [size, setSize] = useState("2048");
  const [keys, setKeys] = useState({ privateKey: "", publicKey: "" });
  const [dn, setDn] = useState({ commonName: "", organization: "", country: "CN" });
  const [csr, setCsr] = useState("");
  const [error, setError] = useState("");

  const changeType = (next: "RSA" | "ECC") => {
    setType(next);
    setSize(next === "RSA" ? "2048" : "P-256");
  };

  const generate = async () => {
    setError("");
    try {
      const res = type === "RSA" ? await generateRsaKeyPair(Number(size)) : await generateEccKeyPair(size as EccCurve);
      setKeys(res);
      setCsr("");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "密钥对生成失败");
    }
  };

  const createCsr = async () => {
    if (!keys.privateKey) return;
    setError("");
    try {
      const res = await generateCsr(keys, dn, type);
      setCsr(res);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "CSR 生成失败");
    }
  };

  return (
    <CardFrame tool={tool} controls={
      <select value={type} onChange={e => changeType(e.target.value as "RSA" | "ECC")}>
        <option value="RSA">RSA</option><option value="ECC">ECC</option>
      </select>
    }>
      <div className="button-row" style={{justifyContent: "space-between", alignItems: "center"}}>
        <select value={size} onChange={e => setSize(e.target.value)} style={{width: "120px"}}>
          {type === "RSA" ? (<><option value="2048">2048 bit</option><option value="4096">4096 bit</option></>) : (<><option value="P-256">P-256</option><option value="P-384">P-384</option><option value="P-521">P-521</option></>)}
        </select>
        <button onClick={generate}>生成密钥对</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {keys.privateKey && (
        <div className="tool-card-body" style={{marginTop: "8px", gap: "16px"}}>
          <div className="form-grid">
            <div><span>Private Key</span><textarea readOnly value={keys.privateKey} className="code-area" style={{minHeight: "220px"}} /></div>
            <div><span>Public Key</span><textarea readOnly value={keys.publicKey} className="code-area" style={{minHeight: "220px"}} /></div>
          </div>
          <div style={{borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
            <span style={{fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px", display: "block"}}>CSR 申请信息</span>
            <div className="form-grid"><input placeholder="CN (域名)" value={dn.commonName} onChange={e => setDn({...dn, commonName: e.target.value})} /><input placeholder="O (组织)" value={dn.organization} onChange={e => setDn({...dn, organization: e.target.value})} /></div>
            <button onClick={createCsr} style={{marginTop: "16px", width: "100%"}}>生成 CSR 请求</button>
          </div>
          {csr && (
            <div className="output-panel">
              <div className="output-head"><strong>CSR PEM</strong><button onClick={() => onCopy(csr)}>复制</button></div>
              <textarea readOnly value={csr} className="code-area" style={{minHeight: "180px"}} />
            </div>
          )}
        </div>
      )}
    </CardFrame>
  );
}
