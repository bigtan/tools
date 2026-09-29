// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useAsyncTask } from "./useAsyncTask";
afterEach(cleanup);
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
it("only accepts the latest result and ignores stale errors", async () => {
  const { result } = renderHook(useAsyncTask);
  const first = deferred<string>();
  const second = deferred<string>();
  const accept = vi.fn();
  let a!: Promise<void>, b!: Promise<void>;
  act(() => { a = result.current.run(() => first.promise, accept); b = result.current.run(() => second.promise, accept); });
  await act(async () => { second.resolve("new"); await b; });
  await act(async () => { first.reject(new Error("old")); await a; });
  expect(accept).toHaveBeenCalledExactlyOnceWith("new");
  expect(result.current.error).toBe("");
  expect(result.current.busy).toBe(false);
});
it("does not accept results after invalidation or unmount", async () => {
  const { result, unmount } = renderHook(useAsyncTask);
  const first = deferred<string>(); const second = deferred<string>();
  const accept = vi.fn(); let a!: Promise<void>, b!: Promise<void>;
  act(() => { a = result.current.run(() => first.promise, accept); result.current.invalidate(); });
  await act(async () => { first.resolve("old"); await a; });
  act(() => { b = result.current.run(() => second.promise, accept); });
  unmount();
  await act(async () => { second.resolve("unmounted"); await b; });
  expect(accept).not.toHaveBeenCalled();
});
