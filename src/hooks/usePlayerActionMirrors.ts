import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPlayerActionRequestId, type PlayerActionKind } from "@/lib/playerActions";

export type PlayerActionMirror = { id: string; actorPlayerId: string; kind: PlayerActionKind };
const kinds = new Set<PlayerActionKind>(["v10-assassinate", "v18-resurrect", "v23-web"]);
type Channel = ReturnType<typeof supabase.channel>;

/** Announce an open selection screen independently of submitting its action.
 * Heartbeats recover missed opens and GM reloads; closing never spends a use. */
export function usePlayerActionMirror(roomId: string | undefined, actorPlayerId: string | undefined,
  kind: PlayerActionKind | null, onClose: () => void) {
  const channel = useRef<Channel | null>(null);
  const mode = useRef<PlayerActionMirror | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const publish = useCallback((value: PlayerActionMirror | null, previousId?: string) => {
    void channel.current?.send({ type: "broadcast", event: "player-action-mode", payload: {
      ...(value ?? { id: previousId, actorPlayerId, kind: null }),
    } });
  }, [actorPlayerId]);

  useEffect(() => {
    if (!roomId || !actorPlayerId) return;
    const active = supabase.channel(`player-action-modes-${roomId}`);
    channel.current = active;
    active.on("broadcast", { event: "player-action-mode-closed" }, ({ payload }) => {
      if (payload?.id !== mode.current?.id || payload?.actorPlayerId !== actorPlayerId) return;
      const previous = mode.current;
      mode.current = null;
      publish(null, previous?.id);
      closeCallback.current();
    }).subscribe((status) => { if (status === "SUBSCRIBED" && mode.current) publish(mode.current); });
    const heartbeat = window.setInterval(() => { if (mode.current) publish(mode.current); }, 2500);
    return () => {
      if (mode.current) publish(null, mode.current.id);
      window.clearInterval(heartbeat);
      channel.current = null;
      void supabase.removeChannel(active);
    };
  }, [roomId, actorPlayerId, publish]);

  useEffect(() => {
    const previous = mode.current;
    mode.current = kind && actorPlayerId ? { id: createPlayerActionRequestId(actorPlayerId, kind), actorPlayerId, kind } : null;
    publish(mode.current, previous?.id);
  }, [kind, actorPlayerId, publish]);
  return useCallback((actionKind: PlayerActionKind) => mode.current?.kind === actionKind ? mode.current.id : undefined, []);
}

export function useGMPlayerActionMirrors(roomId: string | undefined, enabled: boolean,
  canOpen: (mode: PlayerActionMirror) => boolean) {
  const [modes, setModes] = useState<Record<string, PlayerActionMirror>>({});
  const current = useRef({ enabled, canOpen });
  current.current = { enabled, canOpen };
  const dismissed = useRef(new Set<string>());
  const channel = useRef<Channel | null>(null);
  useEffect(() => {
    if (!enabled) setModes({});
  }, [enabled]);
  useEffect(() => {
    setModes({});
    dismissed.current.clear();
    if (!roomId) return;
    const active = supabase.channel(`player-action-modes-${roomId}`);
    channel.current = active;
    active.on("broadcast", { event: "player-action-mode" }, ({ payload }) => {
      if (!payload || typeof payload.actorPlayerId !== "string" || typeof payload.id !== "string") return;
      if (payload.kind === null) {
        setModes((previous) => {
          if (previous[payload.actorPlayerId]?.id !== payload.id) return previous;
          const next = { ...previous }; delete next[payload.actorPlayerId]; return next;
        });
        return;
      }
      if (!kinds.has(payload.kind) || dismissed.current.has(payload.id) || !current.current.enabled) return;
      const mode = payload as PlayerActionMirror;
      if (!current.current.canOpen(mode)) return;
      setModes((previous) => previous[mode.actorPlayerId]?.id === mode.id ? previous : { ...previous, [mode.actorPlayerId]: mode });
    }).subscribe();
    return () => { channel.current = null; void supabase.removeChannel(active); };
  }, [roomId]);
  const close = useCallback((mode: PlayerActionMirror) => {
    dismissed.current.add(mode.id);
    setModes((previous) => {
      const next = { ...previous };
      if (next[mode.actorPlayerId]?.id === mode.id) delete next[mode.actorPlayerId];
      return next;
    });
    void channel.current?.send({ type: "broadcast", event: "player-action-mode-closed", payload: mode });
  }, []);
  return { mode: enabled ? Object.values(modes).find(canOpen) ?? null : null, close };
}
