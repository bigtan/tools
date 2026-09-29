import { useMemo, useState, useEffect } from "react";
import type { ToolCategory } from "./types";
import { tools, categories } from "./catalog";
import { ToolPanel } from "./components/ToolPanel";

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [resetVersion, setResetVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
  };

  const copyText = async (value: string) => {
    if (!value) return;
    try {
      if (!navigator.clipboard) throw new Error("当前环境不支持剪贴板，请手动复制");
      await navigator.clipboard.writeText(value);
      showToast("已成功复制到剪贴板");
    } catch (cause) {
      showToast(cause instanceof Error ? `复制失败：${cause.message}` : "复制失败，请手动复制");
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tools.filter(t => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      const matchesSearch = query === "" ||
        t.name.toLowerCase().includes(query) ||
        t.summary.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="page-shell">
      <header className="header-container">
        <div className="header-left">
          <h1 className="header-title">开发者工具</h1>
          <p>简洁、安全、强大的工具集，本地处理保障隐私。</p>
        </div>
        <div className="header-search-nav">
          <div className="search-box-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              aria-label="搜索工具"
              type="text" 
              placeholder="搜索工具 (例如: AES, Base64, JSON...)" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button aria-label="清空搜索" className="search-clear-btn" onClick={() => setSearchQuery("")}>×</button>
            )}
          </div>
          <nav className="header-right">
            <div className="category-row">
              {categories.map(c => (
                <button key={c.id} aria-pressed={c.id === activeCategory} onClick={() => setActiveCategory(c.id)}
                  className={c.id === activeCategory ? "category-pill is-active" : "category-pill"}>
                  {c.label}
                </button>
              ))}
            </div>
          </nav>
          <button className="secondary-button" onClick={() => setResetVersion(v => v + 1)}>清空所有工具</button>
        </div>
      </header>
      
      <section className="tool-grid">
        {tools.map(t => (
          <div className="tool-slot" key={`${t.id}-${resetVersion}`} hidden={!filteredTools.includes(t)}>
            <ToolPanel tool={t} onCopy={copyText} />
          </div>
        ))}
        {filteredTools.length === 0 && (
          <div className="no-results-panel">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            <p>未找到匹配的工具，请尝试其他关键词</p>
          </div>
        )}
      </section>


      {toast && (
        <div className="toast-container" key={toast.id}>
          <div role="status" aria-live="polite" className="toast">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
