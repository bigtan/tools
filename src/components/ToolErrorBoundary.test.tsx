// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ToolErrorBoundary } from "./ToolErrorBoundary";
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("isolates rendering failures and supports resetting the affected tool", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  let broken = true;
  function Tool() { if (broken) throw new Error("render failed"); return <p>recovered</p>; }
  render(<><p>other tool</p><ToolErrorBoundary><Tool /></ToolErrorBoundary></>);
  expect(screen.getByText("other tool")).toBeTruthy();
  expect(screen.getByRole("alert")).toBeTruthy();
  broken = false;
  fireEvent.click(screen.getByRole("button", { name: "重置此工具" }));
  expect(screen.getByText("recovered")).toBeTruthy();
});
