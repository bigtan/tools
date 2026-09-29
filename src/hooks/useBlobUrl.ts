import { useCallback, useEffect, useRef, useState } from "react";

/** Own each URL immediately, including replacements before React commits a render. */
export function useBlobUrl() {
  const owned = useRef("");
  const [url, setUrl] = useState("");
  const replace = useCallback((blob: Blob | null) => {
    if (owned.current) URL.revokeObjectURL(owned.current);
    owned.current = blob ? URL.createObjectURL(blob) : "";
    setUrl(owned.current);
  }, []);
  useEffect(() => () => {
    if (owned.current) URL.revokeObjectURL(owned.current);
    owned.current = "";
  }, []);
  return { url, replace };
}
