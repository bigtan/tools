import { useMemo, useState, useEffect } from "react";
import type { ToolCategory } from "./types";
import { tools, categories } from "./catalog";
import { ToolPanel } from "./components/ToolPanel";

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
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

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      const matchesSearch = searchQuery.trim() === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
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
              type="text" 
              placeholder="搜索工具 (例如: AES, Base64, JSON...)" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery("")}>×</button>
            )}
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
        </div>
      </header>
      
      <section className="tool-grid">
        {filteredTools.map(t => <ToolPanel key={t.id} tool={t} onCopy={copyText} />)}
        {filteredTools.length === 0 && (
          <div className="no-results-panel">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            <p>未找到匹配的工具，请尝试其他关键词</p>
          </div>
        )}
      </section>


      {toast && (
        <div className="toast-container" key={toast.id}>
          <div className="toast">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
