import { useState } from "react";
import { useAsyncTask } from "../hooks/useAsyncTask";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { generateRsaKeyPair, generateEccKeyPair, generateCsr } from "../lib/crypto";
type EccCurve = "P-256" | "P-384" | "P-521";

export function AsymKeysTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [type, setType] = useState<"RSA" | "ECC">("RSA");
  const [size, setSize] = useState("2048");
  const [keys, setKeys] = useState<{ privateKey: string; publicKey: string; type: "RSA" | "ECC" } | null>(null);
  const [dn, setDn] = useState({ commonName: "", organization: "", country: "CN" });
  const [csr, setCsr] = useState("");
  const task = useAsyncTask();

  const clearKeys = () => { task.invalidate(); setKeys(null); setCsr(""); };
  const changeType = (next: "RSA" | "ECC") => {
    clearKeys();
    setType(next);
    setSize(next === "RSA" ? "2048" : "P-256");
  };
  const changeSize = (next: string) => { clearKeys(); setSize(next); };
  const changeDn = (next: typeof dn) => { task.invalidate(); setCsr(""); setDn(next); };
  const generate = () => {
    setKeys(null);
    setCsr("");
    void task.run(async () => {
      const pair = type === "RSA" ? await generateRsaKeyPair(Number(size)) : await generateEccKeyPair(size as EccCurve);
      return { ...pair, type };
    }, setKeys);
  };
  const createCsr = () => {
    if (!keys) return;
    setCsr("");
    void task.run(() => generateCsr(keys, dn, keys.type), setCsr);
  };

  return (
    <CardFrame tool={tool} controls={
      <select aria-label="密钥类型" value={type} onChange={e => changeType(e.target.value as "RSA" | "ECC")}>
        <option value="RSA">RSA</option><option value="ECC">ECC</option>
      </select>
    }>
      <div className="button-row" style={{justifyContent: "space-between", alignItems: "center"}}>
        <select aria-label="密钥参数" value={size} onChange={e => changeSize(e.target.value)} style={{width: "120px"}}>
          {type === "RSA" ? (<><option value="2048">2048 bit</option><option value="4096">4096 bit</option></>) : (<><option value="P-256">P-256</option><option value="P-384">P-384</option><option value="P-521">P-521</option></>)}
        </select>
        <button disabled={task.busy} onClick={generate}>{task.busy ? "处理中…" : "生成密钥对"}</button>
      </div>
      {task.error && <p role="alert" className="form-error">{task.error}</p>}
      {keys && (
        <div className="tool-card-body" style={{marginTop: "8px", gap: "16px"}}>
          <div className="form-grid">
            <div><span>Private Key</span><textarea aria-label="Private Key" readOnly value={keys.privateKey} className="code-area" style={{minHeight: "220px"}} /></div>
            <div><span>Public Key</span><textarea aria-label="Public Key" readOnly value={keys.publicKey} className="code-area" style={{minHeight: "220px"}} /></div>
          </div>
          <div style={{borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
            <span style={{fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px", display: "block"}}>CSR 申请信息</span>
            <div className="form-grid"><input placeholder="CN (域名)" value={dn.commonName} onChange={e => changeDn({...dn, commonName: e.target.value})} /><input placeholder="O (组织)" value={dn.organization} onChange={e => changeDn({...dn, organization: e.target.value})} /></div>
            <button disabled={task.busy} onClick={createCsr} style={{marginTop: "16px", width: "100%"}}>生成 CSR 请求</button>
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
