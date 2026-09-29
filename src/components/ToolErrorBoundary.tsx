import { Component } from "react";
import type { ReactNode } from "react";

export class ToolErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="tool-card" role="alert">
      <p>此工具处理失败，其他工具仍可使用。</p>
      <button onClick={() => this.setState({ failed: false })}>重置此工具</button>
    </div>;
    return this.props.children;
  }
}
