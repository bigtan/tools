import { useAsyncTask } from "../hooks/useAsyncTask";
import { useState, useMemo } from "react";
import type { ToolDefinition } from "../types";
import { CardFrame } from "../components/CardFrame";
import { ControlledTextarea } from "../components/ControlledTextarea";
import { emptyOutput } from "../lib/output";
import { buildAesMaterial, encryptAes, decryptAes } from "../lib/crypto";

export function AesTool({ tool, onCopy }: { tool: ToolDefinition; onCopy: (v: string) => void }) {
  const [mode, setMode] = useState<"AES-GCM"|"AES-CBC">("AES-GCM");
  const [keyHex, setKeyHex] = useState("");
  const [ivHex, setIvHex] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(emptyOutput);

  const task = useAsyncTask();
  const invalidate = () => { task.invalidate(); setOutput(emptyOutput); };
  const gen = () => {
    setOutput(emptyOutput);
    void task.run(async () => buildAesMaterial(256, mode === "AES-GCM" ? 12 : 16), material => {
      setKeyHex(material.keyHex);
      setIvHex(material.ivHex);
    });
  };

  const isKeyValid = useMemo(() => {
    const cleaned = keyHex.trim().replace(/\s+/g, "");
    if (!cleaned) return null;
    const isHex = /^[0-9a-fA-F]*$/.test(cleaned);
    const len = cleaned.length;
    const isCorrectLen = len === 32 || len === 48 || len === 64;
    return isHex && isCorrectLen;
  }, [keyHex]);

  const isIvValid = useMemo(() => {
    const cleaned = ivHex.trim().replace(/\s+/g, "");
    if (!cleaned) return null;
    const isHex = /^[0-9a-fA-F]*$/.test(cleaned);
    const len = cleaned.length;
    const isCorrectLen = mode === "AES-GCM" ? len === 24 : len === 32;
    return isHex && isCorrectLen;
  }, [ivHex, mode]);

  const run = (action: "e" | "d") => {
    setOutput(emptyOutput);
    void task.run(() => action === "e"
      ? encryptAes({ mode, keyHex, ivHex, plainText: input, output: "hex" })
      : decryptAes({ mode, keyHex, ivHex, cipherText: input, input: "hex" }),
    value => setOutput({ value, error: "" }));
  };

  return (
    <CardFrame tool={tool} output={task.error ? { value: "", error: `加解密失败：${task.error}` } : output} onCopy={() => onCopy(output.value)} controls={
      <select value={mode} aria-label="AES 模式" onChange={e => { invalidate(); setMode(e.target.value as "AES-GCM" | "AES-CBC"); setIvHex(""); }}><option value="AES-GCM">GCM</option><option value="AES-CBC">CBC</option></select>
    }>
      <div className="form-grid" style={{gap: "12px"}}>
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)"}}>KEY (十六进制)</span>
            {isKeyValid !== null && (
              <span style={{fontSize: "11px", fontWeight: "600", color: isKeyValid ? "var(--accent)" : "var(--danger)"}}>
                {isKeyValid ? "✔ 格式正确" : "✘ 应为32/48/64位"}
              </span>
            )}
          </div>
          <input
            value={keyHex}
            aria-label="AES Key" onChange={e => { invalidate(); setKeyHex(e.target.value); }}
            placeholder="32位/48位/64位十六进制"
            className={isKeyValid === false ? "is-invalid" : isKeyValid === true ? "is-valid" : ""}
          />
        </div>
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)"}}>IV (十六进制)</span>
            {isIvValid !== null && (
              <span style={{fontSize: "11px", fontWeight: "600", color: isIvValid ? "var(--accent)" : "var(--danger)"}}>
                {isIvValid ? "✔ 格式正确" : mode === "AES-GCM" ? "应为24位" : "应为32位"}
              </span>
            )}
          </div>
          <input
            value={ivHex}
            aria-label="AES IV" onChange={e => { invalidate(); setIvHex(e.target.value); }}
            placeholder={mode === "AES-GCM" ? "24位十六进制" : "32位十六进制"}
            className={isIvValid === false ? "is-invalid" : isIvValid === true ? "is-valid" : ""}
          />
        </div>
      </div>
      <button className="secondary-button" style={{alignSelf: "flex-start"}} disabled={task.busy} onClick={gen}>随机生成 Key/IV (256-bit)</button>
      <ControlledTextarea value={input} onChange={value => { invalidate(); setInput(value); }} placeholder="输入要加密的明文，或解密的 Hex 密文..." />
      <div className="button-row">
        <button onClick={() => run("e")} disabled={task.busy || !isKeyValid || !isIvValid}>加密</button>
        <button className="secondary-button" onClick={() => run("d")} disabled={task.busy || !isKeyValid || !isIvValid}>解密</button>
      </div>
    </CardFrame>
  );
}
