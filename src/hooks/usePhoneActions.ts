import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPlayerActionRequestId } from "@/lib/playerActions";
import {
  applyPhoneCommand, getHuntConsensus, getPhoneParticipants, getPhoneView, isPhoneTarget, reconcilePhoneSession,
  type PhoneAction, type PhoneCommand, type PhoneMode, type PhoneSession, type PhoneView, type PhoneWorld,
} from "@/lib/phoneActions";

type Channel = ReturnType<typeof supabase.channel>;
const topic = (roomId: string, playerId: string) => `phone-${roomId}-${playerId}`;

export function useGMPhoneActions({ roomId, contextKey, enabled, world, onAction, onComplete }: {
  roomId?: string;
  contextKey: string;
  enabled: boolean;
  world: PhoneWorld;
  onAction: (action: PhoneAction) => void;
  onComplete?: (session: PhoneSession) => void;
}) {
  const [session, setSession] = useState<PhoneSession | null>(null);
  const current = useRef({ session, world, onAction, onComplete, enabled, contextKey });
  current.current = { ...current.current, world, onAction, onComplete, enabled, contextKey };
  const channels = useRef(new Map<string, Channel>());
  const acknowledgments = useRef(new Map<string, string>());
  const publishedViews = useRef(new Map<string, string>());
  const revision = useRef(Date.now());
  const monkeySessions = useRef<Record<string, PhoneSession>>({});
  const foxSessions = useRef<Record<string, PhoneSession>>({});
  const storageKey = roomId ? `wotct_phone_${roomId}` : null;

  const publish = useCallback((playerId?: string, force = false) => {
    const state = current.current;
    for (const [id, channel] of channels.current) {
      if (playerId && id !== playerId) continue;
      const view = {
        session: state.enabled ? getPhoneView(state.session, id, state.world) : null,
        acknowledged: acknowledgments.current.get(id),
      };
      const signature = JSON.stringify(view);
      if (!force && publishedViews.current.get(id) === signature) continue;
      publishedViews.current.set(id, signature);
      revision.current = Math.max(Date.now(), revision.current + 1);
      void channel.send({ type: "broadcast", event: "state", payload: {
        revision: revision.current,
        ...view,
      } });
    }
  }, []);

  // Commit before executing an action, so retried phone messages cannot execute it twice.
  const commit = useCallback((next: PhoneSession | null) => {
    current.current.session = next;
    if (next?.mode === "monkey") {
      // Dragging and the script button address the same nightly reveal.
      for (const [key, entry] of Object.entries(monkeySessions.current)) {
        if (entry.sourcePlayerId === next.sourcePlayerId) delete monkeySessions.current[key];
      }
      monkeySessions.current[next.lineKey] = next;
    }
    if (next?.mode === "fox") {
      for (const [key, entry] of Object.entries(foxSessions.current)) {
        if (entry.sourcePlayerId === next.sourcePlayerId) delete foxSessions.current[key];
      }
      foxSessions.current[next.lineKey] = next;
    }
    setSession(next);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({
          contextKey: current.current.contextKey,
          session: next,
          monkeySessions: monkeySessions.current,
          foxSessions: foxSessions.current,
        }));
      } catch { /* Gameplay still works when browser storage is unavailable. */ }
    }
    publish();
  }, [publish, storageKey]);

  useEffect(() => {
    let restored: PhoneSession | null = null;
    monkeySessions.current = {};
    foxSessions.current = {};
    if (storageKey && enabled) {
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
        if (stored?.contextKey === contextKey && stored.monkeySessions && typeof stored.monkeySessions === "object") {
          for (const [key, value] of Object.entries(stored.monkeySessions)) {
            const entry = value as PhoneSession;
            if (entry?.mode === "monkey" && entry.id && Array.isArray(entry.participantIds) && entry.votes && entry.sequences) {
              const valid = reconcilePhoneSession(entry, current.current.world);
              if (valid) monkeySessions.current[key] = valid;
            }
          }
        }
        if (stored?.contextKey === contextKey && stored.foxSessions && typeof stored.foxSessions === "object") {
          for (const [key, value] of Object.entries(stored.foxSessions)) {
            const entry = value as PhoneSession;
            if (entry?.mode === "fox" && entry.id && Array.isArray(entry.participantIds) && entry.votes && entry.sequences) {
              const valid = reconcilePhoneSession(entry, current.current.world);
              if (valid) foxSessions.current[key] = valid;
            }
          }
        }
        if (stored?.contextKey === contextKey && stored.session?.id
          && Array.isArray(stored.session.participantIds) && stored.session.votes && stored.session.sequences) {
          restored = reconcilePhoneSession(stored.session, current.current.world);
        }
      } catch { /* Ignore obsolete or invalid local snapshots. */ }
    }
    // Wait for the GM snapshot to load before touching a recoverable phone session.
    if (enabled) commit(restored);
    else {
      current.current.session = null;
      setSession(null);
      publish();
    }
  }, [commit, contextKey, enabled, publish, storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const next = reconcilePhoneSession(current.current.session, world);
    if (next !== current.current.session) commit(next);
    else publish();
  }, [commit, enabled, publish, world]);

  const playerIdsKey = world.players.map((p) => p.id).sort().join(",");
  useEffect(() => {
    if (!roomId) return;
    const ids = playerIdsKey ? playerIdsKey.split(",") : [];
    for (const playerId of ids) {
      const channel = supabase.channel(topic(roomId, playerId));
      channels.current.set(playerId, channel);
      channel.on("broadcast", { event: "request" }, ({ payload }) => {
        if (payload?.type === "sync") { publish(playerId, true); return; }
        if (!current.current.enabled || !payload || typeof payload.id !== "string") return;
        const retry = acknowledgments.current.get(playerId) === payload.id;
        const result = applyPhoneCommand(current.current.session, playerId, payload as PhoneCommand, current.current.world);
        acknowledgments.current.set(playerId, payload.id);
        commit(result.session);
        if (result.action) current.current.onAction(result.action);
        if (result.completedSession) current.current.onComplete?.(result.completedSession);
        // A retried command must receive its acknowledgment even when its view
        // has not changed (the previous response may have been lost).
        if (retry) publish(playerId, true);
      }).subscribe((status) => { if (status === "SUBSCRIBED") publish(playerId, true); });
    }
    const activeChannels = channels.current;
    const activePublishedViews = publishedViews.current;
    return () => {
      for (const channel of activeChannels.values()) void supabase.removeChannel(channel);
      activeChannels.clear();
      activePublishedViews.clear();
    };
  }, [commit, playerIdsKey, publish, roomId]);

  const toggle = useCallback((mode: PhoneMode, lineKey: string, sourcePlayerId: string | null, progressOrder: number | null = null) => {
    if (!current.current.enabled) return false;
    if (mode === "monkey") {
      const saved = monkeySessions.current[lineKey] ?? Object.values(monkeySessions.current)
        .find((entry) => entry.sourcePlayerId === sourcePlayerId);
      const cached = reconcilePhoneSession(saved ?? null, current.current.world);
      if (cached) { commit({ ...cached, lineKey, progressOrder, visible: true }); return true; }
    }
    if (mode === "fox") {
      const saved = foxSessions.current[lineKey] ?? Object.values(foxSessions.current)
        .find((entry) => entry.sourcePlayerId === sourcePlayerId);
      const cached = reconcilePhoneSession(saved ?? null, current.current.world);
      if (cached) { commit({ ...cached, lineKey, progressOrder, visible: true }); return true; }
    }
    if (current.current.session?.lineKey === lineKey) { commit(null); return false; }
    const participantIds = getPhoneParticipants(mode, sourcePlayerId, current.current.world);
    if (participantIds.length === 0) return false;
    const next = { id: createPlayerActionRequestId("gm", lineKey), lineKey, mode, sourcePlayerId, progressOrder, participantIds, votes: {}, sequences: {} };
    commit(next);
    if (mode === "allies") current.current.onComplete?.(next);
    return true;
  }, [commit]);

  const resolveHunt = useCallback((sessionId: string, targetPlayerId: string, accepted: boolean) => {
    const latest = reconcilePhoneSession(current.current.session, current.current.world);
    if (!latest || latest.id !== sessionId || getHuntConsensus(latest) !== targetPlayerId) { commit(latest); return; }
    if (!accepted) { commit({ ...latest, votes: {} }); return; }
    commit(null);
    // A pending victim remains selectable so the phones do not reveal other night kills.
    if (!current.current.world.players.find((p) => p.id === targetPlayerId)?.redX) {
      current.current.onAction({ action: "kill", targetPlayerId, sourcePlayerId: latest.sourcePlayerId });
    }
    current.current.onComplete?.(latest);
  }, [commit]);

  const active = enabled ? reconcilePhoneSession(session, world) : null;
  const sendGM = useCallback((type: PhoneCommand["type"], targetPlayerId?: string) => {
    const latest = reconcilePhoneSession(current.current.session, current.current.world);
    if (!current.current.enabled || !latest) return;
    if (latest.mode === "hunt" && type === "confirm") {
      const target = current.current.world.players.find((p) => p.id === targetPlayerId && isPhoneTarget(latest, p));
      if (!target) return;
      commit(null);
      if (!target.redX) current.current.onAction({ action: "kill", targetPlayerId: target.id, sourcePlayerId: latest.sourcePlayerId });
      current.current.onComplete?.(latest);
      return;
    }
    const source = latest.sourcePlayerId ?? latest.participantIds[0];
    if (!source) return;
    const result = applyPhoneCommand(latest, source, {
      id: createPlayerActionRequestId("gm", targetPlayerId ?? type), sessionId: latest.id,
      sequence: Math.max(Date.now(), (latest.sequences[source] ?? 0) + 1), type, targetPlayerId,
    }, current.current.world);
    // A GM selection is authoritative but is not a command from the phone.
    // Preserve its sequence so the next phone close/reopen is never discarded.
    if (result.session) result.session = { ...result.session, sequences: latest.sequences };
    commit(result.session);
    if (result.action) current.current.onAction(result.action);
    if (result.completedSession) current.current.onComplete?.(result.completedSession);
  }, [commit]);
  const confirmMonkey = useCallback((targetPlayerId: string) => {
    if (current.current.session?.mode === "monkey") sendGM("confirm", targetPlayerId);
  }, [sendGM]);
  const confirmFox = useCallback((targetPlayerId: string) => {
    if (current.current.session?.mode === "fox") sendGM("confirm", targetPlayerId);
  }, [sendGM]);
  const resolveColossus = useCallback((sessionId: string, targetPlayerId: string, accepted: boolean) => {
    const latest = reconcilePhoneSession(current.current.session, current.current.world);
    if (!latest || latest.mode !== "colossus" || latest.id !== sessionId || latest.pendingTargetPlayerId !== targetPlayerId) { commit(latest); return; }
    if (!accepted) { commit({ ...latest, pendingTargetPlayerId: undefined }); return; }
    commit(null);
    current.current.onAction({ action: "colossus", targetPlayerId, sourcePlayerId: latest.sourcePlayerId });
    current.current.onComplete?.(latest);
  }, [commit]);
  const resolvePriest = useCallback((sessionId: string, targetPlayerId: string, accepted: boolean) => {
    const latest = reconcilePhoneSession(current.current.session, current.current.world);
    if (!latest || latest.mode !== "priest" || latest.id !== sessionId || latest.pendingTargetPlayerId !== targetPlayerId) {
      commit(latest);
      return;
    }
    if (!accepted) {
      commit({ ...latest, pendingTargetPlayerId: undefined });
      return;
    }
    const target = current.current.world.players.find((player) => player.id === targetPlayerId);
    const roleId = target?.illusion ? "a06" : target?.displayRole ?? target?.abilityRole;
    if (!roleId) {
      commit({ ...latest, pendingTargetPlayerId: undefined });
      return;
    }
    const revealed = { ...latest, pendingTargetPlayerId: undefined, priestReveal: { targetPlayerId, roleId } };
    commit(revealed);
    current.current.onComplete?.(revealed);
  }, [commit]);
  const close = useCallback(() => {
    const latest = current.current.session;
    commit(latest?.mode === "monkey" || latest?.mode === "fox" ? { ...latest, visible: false } : null);
  }, [commit]);
  const reset = useCallback(() => { monkeySessions.current = {}; foxSessions.current = {}; commit(null); }, [commit]);
  const monkeySourceIds = Object.values(monkeySessions.current)
    .filter((entry) => entry.monkeyReveal && entry.sourcePlayerId).map((entry) => entry.sourcePlayerId!);
  return { session: active, toggle, close, reset, confirmMonkey, confirmFox, sendGM, resolveColossus, resolvePriest, monkeySourceIds, consensus: getHuntConsensus(active), resolveHunt };
}

export function usePlayerPhoneActions(roomId?: string, playerId?: string) {
  const [session, setSession] = useState<PhoneView | null>(null);
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<Channel | null>(null);
  const pendingCommand = useRef<PhoneCommand | null>(null);
  const sequence = useRef(0);
  const lastRevision = useRef(0);
  const lastResponse = useRef(0);
  const activeSession = useRef<PhoneView | null>(null);
  const nextSyncAt = useRef(0);

  useEffect(() => {
    setSession(null);
    setPending(false);
    pendingCommand.current = null;
    lastRevision.current = 0;
    lastResponse.current = 0;
    activeSession.current = null;
    nextSyncAt.current = 0;
    setConnected(false);
    if (!roomId || !playerId) return;
    const channel = supabase.channel(topic(roomId, playerId));
    channelRef.current = channel;
    // Stagger background recovery checks across phones. Pushes still open and
    // update actions immediately; open actions and pending commands recover quickly.
    const stagger = Array.from(playerId).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0) % 2500;
    const sync = (force = false) => {
      if (!navigator.onLine || document.visibilityState === "hidden") return;
      const now = Date.now();
      if (!force && now < nextSyncAt.current) return;
      if (now - lastResponse.current > (activeSession.current ? 8000 : 70000)) setConnected(false);
      void channel.send({ type: "broadcast", event: "request", payload: pendingCommand.current ?? { type: "sync" } });
      nextSyncAt.current = now + (pendingCommand.current || activeSession.current ? 2500 : 30000 + stagger);
    };
    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (typeof payload?.revision !== "number" || payload.revision <= lastRevision.current) return;
      lastRevision.current = payload.revision;
      lastResponse.current = Date.now();
      setConnected(true);
      setSession(payload.session ?? null);
      activeSession.current = payload.session ?? null;
      if (!payload.session || pendingCommand.current?.sessionId !== payload.session.id
        || payload.acknowledged === pendingCommand.current?.id) {
        pendingCommand.current = null;
        setPending(false);
      }
      nextSyncAt.current = Date.now() + (pendingCommand.current || activeSession.current ? 2500 : 30000 + stagger);
    }).subscribe((status) => {
      if (status !== "SUBSCRIBED") setConnected(false);
      if (status === "SUBSCRIBED") sync(true);
    });
    const interval = window.setInterval(() => sync(), 2500);
    const recover = () => sync(true);
    const reconnect = () => { setConnected(false); recover(); };
    const disconnected = () => setConnected(false);
    window.addEventListener("focus", recover);
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", disconnected);
    document.addEventListener("visibilitychange", recover);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", recover);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", disconnected);
      document.removeEventListener("visibilitychange", recover);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, playerId]);

  const send = useCallback((type: PhoneCommand["type"], targetPlayerId?: string) => {
    if (!session || !channelRef.current) return;
    sequence.current = Math.max(Date.now(), sequence.current + 1);
    const command: PhoneCommand = { id: createPlayerActionRequestId(playerId ?? "phone", targetPlayerId ?? type), sessionId: session.id, sequence: sequence.current, type, targetPlayerId };
    pendingCommand.current = command;
    setPending(true);
    nextSyncAt.current = Date.now() + 2500;
    void channelRef.current.send({ type: "broadcast", event: "request", payload: command });
  }, [playerId, session]);

  return { session, pending, connected, send };
}
