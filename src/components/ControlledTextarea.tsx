import type { CSSProperties } from "react";

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
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="input-textarea-wrapper">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={style}
        className="form-textarea"
      />
      {showPasteClear && (
        <div className="textarea-actions">
          <button type="button" className="textarea-action-btn" title="粘贴" onClick={handlePaste}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            粘贴
          </button>
          {value && (
            <button type="button" className="textarea-action-btn clear-btn" title="清空" onClick={() => onChange("")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              清空
            </button>
          )}
        </div>
      )}
    </div>
  );
}
