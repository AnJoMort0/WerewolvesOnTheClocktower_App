import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_GAME_RUNTIME, getGameRuntimeMs, normalizeGameRuntime, updateGameRuntime, type GameRuntime } from "@/lib/gameRuntime";

/** Store the timestamp, not timer ticks: refreshes and sleeping tabs retain time. */
export function useGameRuntime(roomId: string | undefined, status: string | undefined, ready: boolean) {
  const [runtime, setRuntime] = useState<GameRuntime>(EMPTY_GAME_RUNTIME);
  const [now, setNow] = useState(Date.now);
  const current = useRef(runtime);
  const loadedKey = useRef<string | null>(null);
  const storageKey = roomId ? `wotct_runtime_${roomId}` : null;

  const transition = useCallback((nextStatus: string, at: number = Date.now()) => {
    const next = updateGameRuntime(current.current, nextStatus, at);
    current.current = next;
    setRuntime(next);
    setNow(at);
    if (storageKey) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(next)); }
      catch { /* The clock still works when storage is unavailable. */ }
    }
    return getGameRuntimeMs(next, at);
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !storageKey || !status) return;
    if (loadedKey.current !== storageKey) {
      try { current.current = normalizeGameRuntime(JSON.parse(window.localStorage.getItem(storageKey) ?? "null")); }
      catch { current.current = EMPTY_GAME_RUNTIME; }
      loadedKey.current = storageKey;
    }
    transition(status);
  }, [ready, status, storageKey, transition]);

  useEffect(() => {
    if (runtime.runningSince === null) return;
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 10_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [runtime.runningSince]);

  return { elapsedMs: getGameRuntimeMs(runtime, now), transition };
}
