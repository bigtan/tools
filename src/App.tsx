import type { ReactNode } from "react";
import { useMemo, useState, useEffect } from "react";
import {
  decodeBase64,
  decodeBase64ByLine,
  decodeUrl,
  encodeBase64,
  encodeBase64ByLine,
  encodeUrl,
  hexToText,
  textToHex
} from "./lib/codec";
import { 
  buildAesMaterial, 
  decryptAes, 
  digestText, 
  encryptAes, 
  generateRsaKeyPair, 
  generateEccKeyPair,
  generateCsr
} from "./lib/crypto";
import { createRandomString, createUuidList } from "./lib/random";
import type { ToolCategory, ToolDefinition } from "./types";

const tools: ToolDefinition[] = [
  { id: "base64", name: "Base64", summary: "UTF-8 Base64 编解码，支持按行模式。", category: "encoding" },
  { id: "url", name: "URL Encode", summary: "URI / Component URL 编解码。", category: "encoding" },
  { id: "hex", name: "Hex / Text", summary: "文本与 Hex 的双向转换。", category: "encoding" },
  { id: "random", name: "随机字符串", summary: "可配置字符集、长度、数量生成。", category: "generation" },
  { id: "uuid", name: "UUID", summary: "批量生成 UUID v4。", category: "generation" },
  { id: "aes", name: "AES 加解密", summary: "CBC/GCM 编解码及 Key/IV 生成。", category: "crypto" },
  { id: "asym-keys", name: "证书与密钥", summary: "生成 RSA/ECC 密钥对及 CSR 请求。", category: "crypto" },
  { id: "hash", name: "Hash 摘要", summary: "SHA-256 / 384 / 512 计算。", category: "crypto" },
  { id: "timestamp", name: "时间戳", summary: "Unix 时间戳与本地时间互转。", category: "developer" },
  { id: "jwt", name: "JWT 解析", summary: "纯前端解析 Header 和 Payload。", category: "developer" },
  { id: "json", name: "JSON 格式化", summary: "格式化和压缩 JSON。", category: "developer" }
];

const categories: Array<{ id: ToolCategory | "all"; label: string }> = [
  { id: "all", label: "全部" },
  { id: "encoding", label: "编码转换" },
  { id: "generation", label: "文本生成" },
  { id: "crypto", label: "安全加密" },
  { id: "developer", label: "日常辅助" }
];

type OutputState = { value: string; error: string; };
const emptyOutput: OutputState = { value: "", error: "" };

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(null); // 先清除旧的
    setTimeout(() => setToast(message), 10);
  };

  const copyText = (value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      showToast("已成功复制到剪贴板");
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredTools = useMemo(() => 
    tools.filter(t => activeCategory === "all" || t.category === activeCategory), [activeCategory]);

  return (
    <div className="page-shell">
      <header className="header-container">
        <div className="header-left">
          <h1>开发者工具</h1>
          <p>简洁、安全、强大的工具集，本地处理保障隐私。</p>
        </div>
        <nav className="header-right">
          <div className="category-row">
            {categories.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                className={c.id === activeCategory ? "category-pill is-active" : "category-pill"}>
                {c.label}
              </button>
            ))}
          </div>
        </nav>
      </header>
      
      <section className="tool-grid">
        {filteredTools.map(t => <ToolPanel key={t.id} tool={t} onCopy={copyText} />)}
      </section>

      {toast && (
        <div className="toast-container">
          <div className="toast">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolPanel({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const components: Record<string, ReactNode> = {
    base64: <Base64Tool tool={tool} onCopy={onCopy} />,
    url: <UrlTool tool={tool} onCopy={onCopy} />,
    hex: <HexTool tool={tool} onCopy={onCopy} />,
    random: <RandomTool tool={tool} onCopy={onCopy} />,
    uuid: <UuidTool tool={tool} onCopy={onCopy} />,
    aes: <AesTool tool={tool} onCopy={onCopy} />,
    "asym-keys": <AsymKeysTool tool={tool} onCopy={onCopy} />,
    hash: <HashTool tool={tool} onCopy={onCopy} />,
    timestamp: <TimestampTool tool={tool} onCopy={onCopy} />,
    jwt: <JwtTool tool={tool} onCopy={onCopy} />,
    json: <JsonTool tool={tool} onCopy={onCopy} />
  };
  return components[tool.id] || null;
}

function CardFrame({ tool, controls, output, onCopy, children }: { 
  tool: ToolDefinition; controls?: ReactNode; output?: OutputState; onCopy?: () => void; children: ReactNode; 
}) {
  return (
    <article className="tool-card">
      <div className="tool-card-head">
        <div><h2>{tool.name}</h2><p>{tool.summary}</p></div>
        {controls && <div className="tool-inline-controls">{controls}</div>}
      </div>
      <div className="tool-card-body">{children}</div>
      {output && (
        <div className="output-panel">
          <div className="output-head">
            <strong>输出结果</strong>
            <button onClick={onCopy} disabled={!output.value}>复制</button>
          </div>
          <textarea readOnly value={output.error || output.value} className={output.error ? "is-error" : ""} />
        </div>
      )}
    </article>
  );
}

// --- Combined Cert Tool ---
function AsymKeysTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [type, setType] = useState<"RSA" | "ECC">("RSA");
  const [size, setSize] = useState("2048");
  const [keys, setKeys] = useState({ privateKey: "", publicKey: "" });
  const [dn, setDn] = useState({ commonName: "", organization: "", country: "CN" });
  const [csr, setCsr] = useState("");

  useEffect(() => { setSize(type === "RSA" ? "2048" : "P-256"); }, [type]);

  const generate = async () => {
    try {
      const res = type === "RSA" ? await generateRsaKeyPair(Number(size)) : await generateEccKeyPair(size as any);
      setKeys(res);
      setCsr("");
    } catch (e) { console.error(e); }
  };

  const createCsr = async () => {
    if (!keys.privateKey) return;
    const res = await generateCsr(keys, dn, type);
    setCsr(res);
  };

  return (
    <CardFrame tool={tool} controls={
      <select value={type} onChange={e => setType(e.target.value as any)}>
        <option value="RSA">RSA</option><option value="ECC">ECC</option>
      </select>
    }>
      <div className="button-row" style={{justifyContent: "space-between", alignItems: "center"}}>
        <select value={size} onChange={e => setSize(e.target.value)} style={{width: "120px"}}>
          {type === "RSA" ? (<><option value="2048">2048 bit</option><option value="4096">4096 bit</option></>) : (<><option value="P-256">P-256</option><option value="P-384">P-384</option></>)}
        </select>
        <button onClick={generate}>生成密钥对</button>
      </div>
      {keys.privateKey && (
        <div className="tool-card-body" style={{marginTop: "8px", gap: "16px"}}>
          <div className="form-grid">
            <div><span>Private Key</span><textarea readOnly value={keys.privateKey} style={{minHeight: "220px", fontSize: "11px", fontFamily: "var(--mono-font)"}} /></div>
            <div><span>Public Key</span><textarea readOnly value={keys.publicKey} style={{minHeight: "220px", fontSize: "11px", fontFamily: "var(--mono-font)"}} /></div>
          </div>
          <div style={{borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
            <span style={{fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px", display: "block"}}>CSR 申请信息</span>
            <div className="form-grid"><input placeholder="CN (域名)" value={dn.commonName} onChange={e => setDn({...dn, commonName: e.target.value})} /><input placeholder="O (组织)" value={dn.organization} onChange={e => setDn({...dn, organization: e.target.value})} /></div>
            <button onClick={createCsr} style={{marginTop: "16px", width: "100%"}}>生成 CSR 请求</button>
          </div>
          {csr && (
            <div className="output-panel">
              <div className="output-head"><strong>CSR PEM</strong><button onClick={() => onCopy(csr)}>复制</button></div>
              <textarea readOnly value={csr} style={{minHeight: "180px", fontSize: "11px", fontFamily: "var(--mono-font)"}} />
            </div>
          )}
        </div>
      )}
    </CardFrame>
  );
}

// --- Timestamp Tool ---
function TimestampTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<"s" | "ms" | "us" | "ns">("s");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const convert = () => {
    if (!input) return;
    try {
      let ms = 0;
      const val = BigInt(input.replace(/\D/g, ""));
      if (unit === "s") ms = Number(val * 1000n);
      else if (unit === "ms") ms = Number(val);
      else if (unit === "us") ms = Number(val / 1000n);
      else if (unit === "ns") ms = Number(val / 1000000n);
      const d = new Date(ms);
      const baseMs = BigInt(ms);
      setResult({ date: d.toLocaleString(), s: String(baseMs / 1000n), ms: String(baseMs), us: String(baseMs * 1000n), ns: String(baseMs * 1000000n) });
    } catch { alert("无效格式"); }
  };

  return (
    <CardFrame tool={tool}>
      <div style={{display: "flex", justifyContent: "center", marginBottom: "16px"}}>
        <div className="output-panel" style={{padding: "10px 24px", textAlign: "center"}}>
          <span style={{color: "var(--text-secondary)", fontSize: "12px"}}>当前时间戳 (s)</span>
          <div style={{fontFamily: "var(--mono-font)", fontSize: "20px", fontWeight: "600", color: "var(--accent)"}}>{now}</div>
        </div>
      </div>
      <div className="button-row" style={{gap: "8px"}}>
        <input style={{flex: 1}} value={input} onChange={e => setInput(e.target.value)} placeholder="输入数值..." />
        <select style={{width: "80px"}} value={unit} onChange={e => setUnit(e.target.value as any)}><option value="s">秒</option><option value="ms">毫秒</option><option value="us">微秒</option><option value="ns">纳秒</option></select>
        <button onClick={convert}>转换</button>
      </div>
      {result && (
        <div style={{marginTop: "16px", borderTop: "1px solid var(--card-border)", paddingTop: "16px"}}>
          <div style={{marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
            <div><span style={{fontSize: "12px", color: "var(--text-secondary)"}}>本地时间</span><div style={{fontSize: "18px", fontWeight: "600", color: "var(--accent)"}}>{result.date}</div></div>
            <button className="secondary-button" onClick={() => onCopy(result.date)}>复制日期</button>
          </div>
          <div className="form-grid" style={{gap: "8px"}}>
            {["s", "ms", "us", "ns"].map(u => (
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

// --- JWT Decoder ---
function JwtTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [token, setToken] = useState("");
  const [parts, setParts] = useState({ header: "", payload: "" });
  const decode = () => {
    try {
      const segments = token.split(".");
      setParts({
        header: JSON.stringify(JSON.parse(atob(segments[0])), null, 2),
        payload: JSON.stringify(JSON.parse(atob(segments[1].replace(/-/g, "+").replace(/_/g, "/"))), null, 2)
      });
    } catch { setParts({ header: "失败", payload: "无效格式" }); }
  };
  return (
    <CardFrame tool={tool}>
      <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="粘贴 JWT Token..." style={{minHeight: "80px"}} />
      <button onClick={decode}>解析</button>
      {parts.header && (
        <div className="form-grid" style={{marginTop: "12px"}}>
          <div><div style={{display: "flex", justifyContent: "space-between"}}><span>Header</span><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(parts.header)}>复制</button></div><textarea readOnly value={parts.header} style={{minHeight: "150px", fontSize: "12px"}} /></div>
          <div><div style={{display: "flex", justifyContent: "space-between"}}><span>Payload</span><button className="secondary-button" style={{padding: "2px 6px", fontSize: "10px"}} onClick={() => onCopy(parts.payload)}>复制</button></div><textarea readOnly value={parts.payload} style={{minHeight: "150px", fontSize: "12px"}} /></div>
        </div>
      )}
    </CardFrame>
  );
}

// --- 其他工具简写版本以匹配组件接口 ---
function Base64Tool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "e"|"d") => { try { setOutput({ value: m === "e" ? encodeBase64(input) : decodeBase64(input), error: "" }); } catch(e) { setOutput({ value: "", error: "失败" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><textarea value={input} onChange={e => setInput(e.target.value)} /><div className="button-row"><button onClick={() => run("e")}>编码</button><button className="secondary-button" onClick={() => run("d")}>解码</button></div></CardFrame>;
}

function UrlTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "e"|"d") => { try { setOutput({ value: m === "e" ? encodeUrl(input, true) : decodeUrl(input, true), error: "" }); } catch(e) { setOutput({ value: "", error: "失败" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><textarea value={input} onChange={e => setInput(e.target.value)} /><div className="button-row"><button onClick={() => run("e")}>编码</button><button className="secondary-button" onClick={() => run("d")}>解码</button></div></CardFrame>;
}

function HexTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "t"|"h") => { try { setOutput({ value: m === "t" ? textToHex(input) : hexToText(input), error: "" }); } catch(e) { setOutput({ value: "", error: "失败" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><textarea value={input} onChange={e => setInput(e.target.value)} /><div className="button-row"><button onClick={() => run("t")}>Text to Hex</button><button className="secondary-button" onClick={() => run("h")}>Hex to Text</button></div></CardFrame>;
}

function RandomTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [length, setLength] = useState(16);
  const [output, setOutput] = useState(emptyOutput);
  const gen = () => setOutput({ value: createRandomString({ length, count: 5, lowercase: true, uppercase: true, digits: true, symbols: false, customCharset: "", excludeSimilar: true }), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><div className="form-grid"><span>长度</span><input type="number" value={length} onChange={e => setLength(Number(e.target.value))} /></div><button onClick={gen}>生成</button></CardFrame>;
}

function UuidTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState({ value: createUuidList(5), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><input type="number" value={count} onChange={e => setCount(Number(e.target.value))} /><button onClick={() => setOutput({value: createUuidList(count), error: ""})}>生成 UUID</button></CardFrame>;
}

function AesTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [mode, setMode] = useState<"AES-GCM"|"AES-CBC">("AES-GCM");
  const [keyHex, setKeyHex] = useState("");
  const [ivHex, setIvHex] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const gen = () => { const m = buildAesMaterial(256, mode === "AES-GCM" ? 12 : 16); setKeyHex(m.keyHex); setIvHex(m.ivHex); };
  const run = async (a: "e"|"d") => { try { setOutput({ value: a === "e" ? await encryptAes({ mode, keyHex, ivHex, plainText: input, output: "hex" }) : await decryptAes({ mode, keyHex, ivHex, cipherText: input, input: "hex" }), error: "" }); } catch(e) { setOutput({ value: "", error: "失败" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)} controls={
    <select value={mode} onChange={e => setMode(e.target.value as any)}><option value="AES-GCM">GCM</option><option value="AES-CBC">CBC</option></select>
  }><div className="form-grid"><div><span>Key</span><input value={keyHex} onChange={e => setKeyHex(e.target.value)} /></div><div><span>IV</span><input value={ivHex} onChange={e => setIvHex(e.target.value)} /></div></div><button className="secondary-button" onClick={gen}>随机生成 Key/IV</button><textarea value={input} onChange={e => setInput(e.target.value)} /><div className="button-row"><button onClick={() => run("e")}>加密</button><button className="secondary-button" onClick={() => run("d")}>解密</button></div></CardFrame>;
}

function HashTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<any>("SHA-256");
  const [output, setOutput] = useState(emptyOutput);
  const run = async () => setOutput({ value: await digestText(algo, input), error: "" });
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)} controls={
    <select value={algo} onChange={e => setAlgo(e.target.value)}><option value="SHA-256">SHA-256</option><option value="SHA-512">SHA-512</option></select>
  }><textarea value={input} onChange={e => setInput(e.target.value)} /><button onClick={run}>计算摘要</button></CardFrame>;
}

function JsonTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);
  const run = (m: "f"|"m") => { try { const p = JSON.parse(input); setOutput({ value: m === "f" ? JSON.stringify(p, null, 2) : JSON.stringify(p), error: "" }); } catch(e) { setOutput({ value: "", error: "无效 JSON" }); } };
  return <CardFrame tool={tool} output={output} onCopy={() => onCopy(output.value)}><textarea value={input} onChange={e => setInput(e.target.value)} /><div className="button-row"><button onClick={() => run("f")}>格式化</button><button className="secondary-button" onClick={() => run("m")}>压缩</button></div></CardFrame>;
}
