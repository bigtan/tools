import type { ReactNode } from "react";
import type { ToolDefinition } from "../types";
import type { OutputState } from "../lib/output";

export function CardFrame({ tool, controls, output, onCopy, children }: { 
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
