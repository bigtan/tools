import type { CSSProperties } from "react";
import { useAsyncTask } from "../hooks/useAsyncTask";

export function ControlledTextarea({
  value,
  onChange,
  placeholder,
  style,
  showPasteClear = true
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: CSSProperties;
  showPasteClear?: boolean;
}) {
  const task = useAsyncTask();
  const change = (text: string) => { task.invalidate(); onChange(text); };
  const handlePaste = () => task.run(async () => {
    if (!navigator.clipboard) throw new Error("当前环境不支持剪贴板，请手动粘贴");
    return navigator.clipboard.readText();
  }, onChange);

  return (
    <div className="input-textarea-wrapper">
      <textarea
        aria-label={placeholder || "输入文本"}
        value={value}
        onChange={e => change(e.target.value)}
        placeholder={placeholder}
        style={style}
        className="form-textarea"
      />
      {task.error && <p role="alert" className="form-error">粘贴失败：{task.error}</p>}
      {showPasteClear && (
        <div className="textarea-actions">
          <button type="button" className="textarea-action-btn" title="粘贴" disabled={task.busy} onClick={handlePaste}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            粘贴
          </button>
          {value && (
            <button type="button" className="textarea-action-btn clear-btn" title="清空" onClick={() => change("")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              清空
            </button>
          )}
        </div>
      )}
    </div>
  );
}
