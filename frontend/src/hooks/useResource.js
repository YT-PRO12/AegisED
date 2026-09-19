import { useEffect, useState, useCallback } from "react";
import { request } from "../services/api";
export default function useResource(path, interval = 0) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    if (!path) return;
    request(path, { signal: controller.signal })
      .then((result) =>
        setState({
          data: result.data,
          pagination: result.pagination,
          error: "",
          loading: false,
        }),
      )
      .catch((e) => {
        if (e.name !== "AbortError")
          setState((s) => ({ ...s, error: e.message, loading: false }));
      });
    return () => controller.abort();
  }, [path, version]);
  useEffect(() => {
    if (!interval) return;
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [interval, refresh]);
  return { ...state, refresh };
}
