import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Crosshair, Eye, EyeOff, X, Moon, Sun, Scale, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EVIL_ROLES, ROLES, WEREWOLF_ROLES, type RoleId } from "@/lib/roles";
import { FortuneTellerRevealModal } from "@/components/game/FortuneTellerRevealModal";
import { RevealModal, type RevealCard } from "@/components/game/RevealModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { RulebookModal } from "@/components/game/RulebookModal";
import { SkinPackSelectButton } from "@/components/game/SkinPackSelector";
import { LanguageContext, format, getRoleLabel, t, type Language, type WinKind } from "@/lib/i18n";
import villagerIcon from "@/assets/icons/villager.png";
import ghostImg from "@/assets/icons/ghost.png";
import loverIcon from "@/assets/icons/lover.png";
import evilBeingIcon from "@/assets/icons/evil_being.png";
import werewolfIcon from "@/assets/icons/werewolf.png";
import soloIcon from "@/assets/icons/solo.png";
import { clearPlayerSession, getPlayerSession, touchPlayerSession } from "@/lib/playerSession";
import { playTimerAlarm, shouldPlayTimerAlarm, unlockTimerAlarm, type TimerAlarmState } from "@/lib/timerAlarm";
import { parsePlayerCharacter, shouldShowActorBadge } from "@/lib/actor";
import { parsePlayerCharacterMetadata } from "@/lib/playerCharacter";
import { createPlayerActionRequest, normalizePlayerActionState, upsertPowerUses, type PlayerActionState } from "@/lib/playerActions";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";

type RoomPlayer = {
  id: string;
  name: string;
  seat_position: number | null;
  is_alive: boolean;
};

const FAKE_ASSASSINATION_PENDING_MS = 10000;

const PlayerView = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { skinPackId } = useSkinPack();
  const [player, setPlayer] = useState<{
    name: string;
    character: string | null;
    is_alive: boolean;
    room_id?: string;
  } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [roomStatus, setRoomStatus] = useState<string>("lobby");
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(`wotct_hidden_${playerId}`) === "1"; } catch { return false; }
  });
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [characterKey, setCharacterKey] = useState(0);
  const [fortuneTellerReveal, setFortuneTellerReveal] = useState(false);
  const [fortuneTellerData, setFortuneTellerData] = useState<{
    deadPlayerIds: string[];
    illusionPlayerId: string | null;
    illusionPlayerIds?: string[];
    isFortuneTellerPoisoned: boolean;
    fakeMap: Record<string, string> | null;
    roleAssignments: Record<string, RoleId>;
  } | null>(null);
  const [littleGirlReveal, setLittleGirlReveal] = useState(false);
  const [littleGirlCards, setLittleGirlCards] = useState<RevealCard[]>([]);
  const [lamplighterReveal, setLamplighterReveal] = useState(false);
  const [lamplighterCards, setLamplighterCards] = useState<RevealCard[]>([]);
  const [lvReveal, setLvReveal] = useState(false);
  const [lvCards, setLvCards] = useState<RevealCard[]>([]);
  const [spiderReveal, setSpiderReveal] = useState(false);
  const [spiderCards, setSpiderCards] = useState<RevealCard[]>([]);
  const [spyReveal, setSpyReveal] = useState(false);
  const [spyCards, setSpyCards] = useState<RevealCard[]>([]);
  const [mimeReveal, setMimeReveal] = useState(false);
  const [mimeCards, setMimeCards] = useState<RevealCard[]>([]);
  const [phaseInfo, setPhaseInfo] = useState<{ phase: "night" | "day" | "tribunal"; number: number } | null>(null);
  const [timerState, setTimerState] = useState<{ phase: "day" | "tribunal"; timeLeft: number; isRunning: boolean; timerDone: boolean } | null>(null);
  const [playerActionState, setPlayerActionState] = useState<PlayerActionState>(() => normalizePlayerActionState(null));
  const [assassinationMode, setAssassinationMode] = useState(false);
  const [assassinationTargetId, setAssassinationTargetId] = useState<string | null>(null);
  const [assassinationSubmitting, setAssassinationSubmitting] = useState(false);
  const [fakeAssassinationPending, setFakeAssassinationPending] = useState(false);
  const [assassinationMessage, setAssassinationMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("pt");
  const [gameOver, setGameOver] = useState<{ kind: WinKind; outcome: "victory" | "defeat" } | null>(null);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [rulebookRoleId, setRulebookRoleId] = useState<RoleId | null>(null);
  const playerRef = useRef<typeof player>(null);
  const gameOverEventRef = useRef<string | null>(null);
  const previousTimerAlarmStateRef = useRef<TimerAlarmState | null>(null);
  const resolvedPlayerActionRequestIdsRef = useRef<Set<string>>(new Set());
  const fakeAssassinationPendingTimeoutRef = useRef<number | null>(null);
  useEffect(() => { playerRef.current = player; }, [player]);

  const clearFakeAssassinationPendingTimer = useCallback(() => {
    if (fakeAssassinationPendingTimeoutRef.current === null) return;
    window.clearTimeout(fakeAssassinationPendingTimeoutRef.current);
    fakeAssassinationPendingTimeoutRef.current = null;
  }, []);

  const clearFakeAssassinationPending = useCallback(() => {
    clearFakeAssassinationPendingTimer();
    setFakeAssassinationPending(false);
  }, [clearFakeAssassinationPendingTimer]);

  const showFakeAssassinationPending = useCallback(() => {
    clearFakeAssassinationPendingTimer();
    setFakeAssassinationPending(true);
    fakeAssassinationPendingTimeoutRef.current = window.setTimeout(() => {
      fakeAssassinationPendingTimeoutRef.current = null;
      setFakeAssassinationPending(false);
      setAssassinationMessage(null);
    }, FAKE_ASSASSINATION_PENDING_MS);
  }, [clearFakeAssassinationPendingTimer]);

  useEffect(() => clearFakeAssassinationPendingTimer, [clearFakeAssassinationPendingTimer]);

  const applyRoomPlayerActionState = useCallback((value: unknown) => {
    const normalized = normalizePlayerActionState(value);
    setPlayerActionState({
      ...normalized,
      requests: normalized.requests.filter((request) => !resolvedPlayerActionRequestIdsRef.current.has(request.id)),
    });
  }, []);

  useEffect(() => {
    const unlock = () => {
      unlockTimerAlarm();
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };
  }, []);

  useEffect(() => {
    if (!timerState) return;
    const current = { phase: timerState.phase, timerDone: timerState.timerDone };
    if (shouldPlayTimerAlarm(previousTimerAlarmStateRef.current, current)) playTimerAlarm();
    previousTimerAlarmStateRef.current = current;
  }, [timerState]);

  useEffect(() => {
    if (!playerId || !player?.room_id) return;

    const markSeen = () => {
      touchPlayerSession(playerId);
      supabase
        .from("players")
        .update({ is_ready: true, last_seen_at: new Date().toISOString() })
        .eq("id", playerId);
    };

    markSeen();
    const interval = window.setInterval(markSeen, 20000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") markSeen();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playerId, player?.room_id]);

  useEffect(() => {
    if (!playerId || !player?.room_id) return;
    const roomId = player.room_id;

    const refreshPlayerState = async () => {
      const { data } = await supabase
        .from("players")
        .select("name, character, is_alive, room_id")
        .eq("id", playerId)
        .single();

      if (!data) {
        setRemoved(true);
        return;
      }

      setPlayer((prev) => {
        if (prev?.character !== data.character) setCharacterKey((k) => k + 1);
        return data;
      });

      const { data: allPlayers } = await supabase
        .from("players")
        .select("id, name, seat_position, is_alive")
        .eq("room_id", roomId)
        .order("created_at");
      if (allPlayers) setRoomPlayers(allPlayers);
    };

    const syncChannel = supabase
      .channel(`player-sync-${roomId}`)
      .on("broadcast", { event: "sync" }, () => {
        // Every device refreshes the room circle; the resurrected player's own
        // row is refreshed in the same query so stale dead markers cannot linger.
        refreshPlayerState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
    };
  }, [playerId, player?.room_id]);

  useEffect(() => {
    if (!playerId) return;

    const fetchPlayer = async () => {
      const { data } = await supabase
        .from("players")
        .select("name, character, is_alive, room_id")
        .eq("id", playerId)
        .single();

      if (!data) {
        setRemoved(true);
        return;
      }
      setPlayer(data);

      const { data: roomData } = await supabase
        .from("rooms")
        .select("status, language, player_action_state, phase_state, timer_state, game_over_state")
        .eq("id", data.room_id)
        .single();
      if (roomData) {
        setRoomStatus(roomData.status);
        const lang = (roomData as { language?: string }).language;
        if (lang === "fr" || lang === "pt") setLanguage(lang);
        const durable = roomData as unknown as {
          phase_state?: { phase: "night" | "day" | "tribunal"; number: number } | null;
          timer_state?: { phase: "day" | "tribunal"; timeLeft: number; isRunning: boolean; timerDone: boolean } | null;
          game_over_state?: { kind: WinKind; perPlayer?: Record<string, "victory" | "defeat"> } | null;
          player_action_state?: PlayerActionState | null;
        };
        applyRoomPlayerActionState(durable.player_action_state);
        if (durable.phase_state) setPhaseInfo(durable.phase_state);
        if (durable.timer_state) setTimerState(durable.timer_state);
        if (durable.game_over_state?.kind) {
          const outcome = durable.game_over_state.perPlayer?.[playerId] ?? "defeat";
          gameOverEventRef.current = `${durable.game_over_state.kind}:${outcome}`;
          setGameOver({
            kind: durable.game_over_state.kind,
            outcome,
          });
          setGameOverDismissed(false);
        } else {
          gameOverEventRef.current = null;
        }
      }

      const { data: allPlayers } = await supabase
        .from("players")
        .select("id, name, seat_position, is_alive")
        .eq("room_id", data.room_id)
        .order("created_at");
      if (allPlayers) setRoomPlayers(allPlayers);
    };
    fetchPlayer();

    const playerChannel = supabase
      .channel(`player-${playerId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players", filter: `id=eq.${playerId}` },
        (payload) => {
          setPlayer((prev) => {
            if (!prev) return prev;
            const charChanged = prev.character !== payload.new.character;
            if (charChanged) setCharacterKey((k) => k + 1);
            return {
              ...prev,
              character: payload.new.character,
              is_alive: payload.new.is_alive,
            };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "players", filter: `id=eq.${playerId}` },
        () => {
          setRemoved(true);
          clearPlayerSession();
        }
      )
      .subscribe();

    const roomId = player?.room_id ?? getPlayerSession()?.roomId ?? null;
    let roomChannel: ReturnType<typeof supabase.channel> | null = null;
    let playersChannel: ReturnType<typeof supabase.channel> | null = null;
    let fortuneTellerChannel: ReturnType<typeof supabase.channel> | null = null;

    if (roomId) {
      roomChannel = supabase
        .channel(`room-${roomId}-status`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
          (payload) => {
            setRoomStatus(payload.new.status);
            if ("player_action_state" in payload.new) {
              applyRoomPlayerActionState(payload.new.player_action_state);
            }
            if (payload.new.phase_state) setPhaseInfo(payload.new.phase_state);
            if (payload.new.timer_state) setTimerState(payload.new.timer_state);
            const durableGameOver = payload.new.game_over_state as {
              kind?: WinKind;
              perPlayer?: Record<string, "victory" | "defeat">;
            } | null;
            if (durableGameOver?.kind) {
              const outcome = durableGameOver.perPlayer?.[playerId] ?? "defeat";
              const eventKey = `${durableGameOver.kind}:${outcome}`;
              if (gameOverEventRef.current !== eventKey) {
                gameOverEventRef.current = eventKey;
                setGameOver({ kind: durableGameOver.kind, outcome });
                setGameOverDismissed(false);
              }
            } else {
              gameOverEventRef.current = null;
            }
          }
        )
        .subscribe();

      playersChannel = supabase
        .channel(`room-${roomId}-all-players`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
          async () => {
            const { data } = await supabase
              .from("players")
              .select("id, name, seat_position, is_alive")
              .eq("room_id", roomId)
              .order("created_at");
            if (data) setRoomPlayers(data);
          }
        )
        .subscribe();

      // Listen for FortuneTeller reveal broadcasts
      fortuneTellerChannel = supabase
        .channel(`fortune-teller-reveal-${roomId}`)
        .on("broadcast", { event: "fortune-teller-reveal" }, (payload) => {
          const broadcast = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "e04";
          const data = broadcast.byPlayerId?.[playerId] ?? (legacyViewer ? broadcast : null);
          if (broadcast.show && data) {
            setFortuneTellerData({
              deadPlayerIds: data.deadPlayerIds,
              illusionPlayerId: data.illusionPlayerId,
              illusionPlayerIds: data.illusionPlayerIds,
              isFortuneTellerPoisoned: !!data.isFortuneTellerPoisoned,
              fakeMap: data.fakeMap || null,
              roleAssignments: data.roleAssignments || {},
            });
            setFortuneTellerReveal(true);
          } else if (!broadcast.show || data) {
            setFortuneTellerReveal(false);
          }
        })
        .subscribe();

      // Reveal channels: Little Girl, Lamplighter, Werewolf Seer
      const littleGirlCh = supabase.channel(`little-girl-reveal-${roomId}`)
        .on("broadcast", { event: "little-girl-reveal" }, (payload) => {
          const d = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "v01";
          const result = d.byPlayerId?.[playerId] ?? (legacyViewer ? d : null);
          if (d.show && result) { setLittleGirlCards(result.cards || []); setLittleGirlReveal(true); }
          else if (!d.show || result) { setLittleGirlReveal(false); }
        }).subscribe();
      const lamplighterCh = supabase.channel(`lamplighter-reveal-${roomId}`)
        .on("broadcast", { event: "lamplighter-reveal" }, (payload) => {
          const d = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "v21";
          const result = d.byPlayerId?.[playerId] ?? (legacyViewer ? d : null);
          if (d.show && result?.role && ROLES[result.role as RoleId]) {
            const def = ROLES[result.role as RoleId];
            const checkboxes = Array.isArray(result.charges) && result.charges.length > 0 ? result.charges : undefined;
            setLamplighterCards([{ image: def.image, label: def.label, roleId: result.role as RoleId, checkboxes }]);
            setLamplighterReveal(true);
          } else if (!d.show || result) { setLamplighterReveal(false); }
        }).subscribe();
      const lvCh = supabase.channel(`werewolf-seer-reveal-${roomId}`)
        .on("broadcast", { event: "lv-reveal" }, async (payload) => {
          const d = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "m02";
          const result = d.byPlayerId?.[playerId] ?? (legacyViewer ? d : null);
          if (d.show && result?.victimId && result.role && ROLES[result.role as RoleId]) {
            const def = ROLES[result.role as RoleId];
            const { data: vp } = await supabase.from("players").select("name").eq("id", result.victimId).single();
            setLvCards([{ name: vp?.name, image: def.image, label: def.label, roleId: result.role as RoleId }]);
            setLvReveal(true);
          } else if (!d.show || result) { setLvReveal(false); }
        }).subscribe();

      const spiderCh = supabase.channel(`spider-reveal-${roomId}`)
        .on("broadcast", { event: "spider-reveal" }, (payload) => {
          const d = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "v23";
          const result = d.byPlayerId?.[playerId] ?? (legacyViewer ? d : null);
          if (d.show && result) { setSpiderCards(result.cards || []); setSpiderReveal(true); }
          else if (!d.show || result) { setSpiderReveal(false); }
        }).subscribe();

      const spyCh = supabase.channel(`spy-reveal-${roomId}`)
        .on("broadcast", { event: "spy-reveal" }, (payload) => {
          const d = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "f02";
          const result = d.byPlayerId?.[playerId] ?? (legacyViewer ? d : null);
          if (d.show && result) { setSpyCards(result.cards || []); setSpyReveal(true); }
          else if (!d.show || result) { setSpyReveal(false); }
        }).subscribe();

      const mimeCh = supabase.channel(`mime-reveal-${roomId}`)
        .on("broadcast", { event: "mime-reveal" }, (payload) => {
          const d = payload.payload;
          const legacyViewer = parsePlayerCharacter(playerRef.current?.character).displayRole === "a03";
          const result = d.byPlayerId?.[playerId] ?? (legacyViewer ? d : null);
          if (d.show && result) {
            setMimeCards(result.cards || []);
            setMimeReveal(true);
          }
        }).subscribe();

      // Phase sync from GM (Noite/Dia/Tribunal X)
      const phaseCh = supabase.channel(`room-phase-${roomId}`)
        .on("broadcast", { event: "phase" }, (payload) => {
          setPhaseInfo(payload.payload);
        }).subscribe();

      // Live Day/Tribunal timer sync from GM
      const timerCh = supabase.channel(`room-timer-${roomId}`)
        .on("broadcast", { event: "timer" }, (payload) => {
          setTimerState(payload.payload);
        }).subscribe();

      const gameOverCh = supabase.channel(`game-over-${roomId}`)
        .on("broadcast", { event: "game-over" }, (payload) => {
          const d = payload.payload as {
            kind: WinKind;
            perPlayer?: Record<string, "victory" | "defeat">;
            perRole?: Record<string, "victory" | "defeat">;
          };
          if (!d?.kind) return;
          const myRole = parsePlayerCharacter(playerRef.current?.character).displayRole;
          let outcome: "victory" | "defeat" = "defeat";
          if (playerId && d.perPlayer?.[playerId]) outcome = d.perPlayer[playerId];
          else if (myRole && d.perRole && d.perRole[myRole]) outcome = d.perRole[myRole];
          gameOverEventRef.current = `${d.kind}:${outcome}`;
          setGameOver({ kind: d.kind, outcome });
          setGameOverDismissed(false);
        }).subscribe();

      const playerActionCh = supabase.channel(`player-actions-${roomId}`)
        .on("broadcast", { event: "player-action-resolved" }, (payload) => {
          const resolution = payload.payload as {
            requestId?: string;
            kind?: string;
            actorPlayerId?: string;
            role?: RoleId;
            uses?: number;
          };
          if (resolution.actorPlayerId !== playerId) return;
          if (typeof resolution.requestId === "string") {
            resolvedPlayerActionRequestIdsRef.current.add(resolution.requestId);
          }
          setPlayerActionState((current) => {
            let next: PlayerActionState = {
              ...current,
              requests: current.requests.filter((request) => (
                request.id !== resolution.requestId
                && !(request.kind === resolution.kind && request.actorPlayerId === playerId)
              )),
            };
            if (resolution.role === "v10" && typeof resolution.uses === "number") {
              next = upsertPowerUses(next, "v10", {
                ...(next.powerUses.v10 ?? {}),
                [playerId]: resolution.uses,
              });
            }
            return next;
          });
          setAssassinationMode(false);
          setAssassinationTargetId(null);
          setAssassinationMessage(null);
          clearFakeAssassinationPending();
        }).subscribe();

      return () => {
        supabase.removeChannel(playerChannel);
        if (roomChannel) supabase.removeChannel(roomChannel);
        if (playersChannel) supabase.removeChannel(playersChannel);
        if (fortuneTellerChannel) supabase.removeChannel(fortuneTellerChannel);
        supabase.removeChannel(littleGirlCh);
        supabase.removeChannel(lamplighterCh);
        supabase.removeChannel(lvCh);
        supabase.removeChannel(spiderCh);
        supabase.removeChannel(spyCh);
        supabase.removeChannel(mimeCh);
        supabase.removeChannel(phaseCh);
        supabase.removeChannel(timerCh);
        supabase.removeChannel(gameOverCh);
        supabase.removeChannel(playerActionCh);
      };
    }

    return () => {
      supabase.removeChannel(playerChannel);
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (playersChannel) supabase.removeChannel(playersChannel);
      if (fortuneTellerChannel) supabase.removeChannel(fortuneTellerChannel);
    };
  }, [applyRoomPlayerActionState, clearFakeAssassinationPending, playerId, navigate, player?.room_id]);

  // Persist hidden state across reloads
  useEffect(() => {
    if (!playerId) return;
    try { window.localStorage.setItem(`wotct_hidden_${playerId}`, hidden ? "1" : "0"); } catch { /* ignore */ }
  }, [hidden, playerId]);



  const parsedCharacter = parsePlayerCharacter(player?.character);
  const characterMetadata = parsePlayerCharacterMetadata(player?.character);
  const isDogActorCopying = !!characterMetadata.dogActorCopiedRole;
  const isMimeCopying = !!characterMetadata.mimeCopiedRole;
  const displayRole = characterMetadata.mimeCopiedRole ?? characterMetadata.dogActorCopiedRole ?? parsedCharacter.displayRole;
  const roleDef = displayRole ? ROLES[displayRole] ?? null : null;
  const isActorCopying = shouldShowActorBadge(player?.character);
  const ownerRoleDef = characterMetadata.ownerRole ? ROLES[characterMetadata.ownerRole] : null;
  const objectiveRoleDef = characterMetadata.objectiveRole
    ? ROLES[characterMetadata.objectiveRole]
    : isMimeCopying ? null : ownerRoleDef;
  const canUseFlexibleSkin = !!displayRole && parsedCharacter.baseRole === displayRole;
  const displayedRoleImage = roleDef
    ? resolveRoleImage(roleDef.id, {
      skinPackId,
      flexible: canUseFlexibleSkin
        ? {
          objectiveRoleId: characterMetadata.objectiveRole ?? characterMetadata.ownerRole,
          effects: characterMetadata.objectiveEffects,
        }
        : undefined,
    }).src
    : null;
  const getSkinImage = (roleId: RoleId) => resolveRoleImage(roleId, { skinPackId }).src;
  const objectiveIndicators = (() => {
    const indicators: Array<{ id: string; image: string; label: string }> = [];
    for (const effect of characterMetadata.objectiveEffects) {
      if (effect === "namorado") {
        indicators.push({ id: effect, image: loverIcon, label: t("objectiveLovers", language) });
      } else if (effect === "evil_being") {
        indicators.push({ id: effect, image: evilBeingIcon, label: t("objectiveEvilBeing", language) });
      } else if (effect === "werewolf_turned") {
        indicators.push({ id: effect, image: werewolfIcon, label: t("objectiveWerewolf", language) });
      }
    }
    if (objectiveRoleDef && indicators.length === 0) {
      const ownerRole = objectiveRoleDef.id;
      if (ownerRole === "s01") {
        indicators.push({ id: "owner", image: soloIcon, label: t("objectiveLovers", language) });
      } else if (ownerRole === "s02") {
        indicators.push({ id: "owner", image: soloIcon, label: t("objectiveWhiteWolf", language) });
      } else if (ownerRole === "as01b") {
        indicators.push({ id: "owner", image: soloIcon, label: t("objectiveSecretLover", language) });
      } else if (WEREWOLF_ROLES.includes(ownerRole)) {
        indicators.push({ id: "owner", image: werewolfIcon, label: t("objectiveWerewolf", language) });
      } else if (EVIL_ROLES.includes(ownerRole)) {
        indicators.push({ id: "owner", image: evilBeingIcon, label: t("objectiveEvilBeing", language) });
      } else {
        indicators.push({ id: "owner", image: villagerIcon, label: t("objectiveVillage", language) });
      }
    }
    return indicators;
  })();

  const isFortuneTeller = displayRole === "e04";
  const isLittleGirl = displayRole === "v01";
  const isLamplighter = displayRole === "v21";
  const isWerewolfSeer = displayRole === "m02";
  const isSpider = displayRole === "v23";
  const isSpy = displayRole === "f02";
  const isMime = parsedCharacter.baseRole === "a03";
  const playerIsDead = !!player && !player.is_alive;
  const currentRoomId = player?.room_id ?? null;
  const isParanoidPower = displayRole === "v10";
  const v10HasUnlimitedUses = parsedCharacter.baseRole === "a03" && characterMetadata.mimeCopiedRole === "v10";
  const pendingV10Request = !!playerId && playerActionState.requests.some((request) => (
    request.kind === "v10-assassinate" && request.actorPlayerId === playerId
  ));
  const visiblePendingV10Request = pendingV10Request || fakeAssassinationPending;
  const v10Uses = playerId ? playerActionState.powerUses.v10?.[playerId] ?? 0 : 0;
  const canStartAssassination = isParanoidPower
    && roomStatus === "playing"
    && !playerIsDead
    && !visiblePendingV10Request;

  useEffect(() => {
    if (isParanoidPower) return;
    setAssassinationMode(false);
    setAssassinationTargetId(null);
    clearFakeAssassinationPending();
  }, [clearFakeAssassinationPending, isParanoidPower]);

  const previousPendingV10RequestRef = useRef(pendingV10Request);
  useEffect(() => {
    if (previousPendingV10RequestRef.current && !pendingV10Request) {
      setAssassinationMode(false);
      setAssassinationTargetId(null);
      setAssassinationMessage(null);
    }
    previousPendingV10RequestRef.current = pendingV10Request;
  }, [pendingV10Request]);

  useEffect(() => {
    if (!pendingV10Request || !currentRoomId) return;
    let cancelled = false;

    const refreshPlayerActionState = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("player_action_state")
        .eq("id", currentRoomId)
        .single();
      if (cancelled) return;
      applyRoomPlayerActionState((data as { player_action_state?: PlayerActionState | null } | null)?.player_action_state);
    };

    refreshPlayerActionState();
    const interval = window.setInterval(refreshPlayerActionState, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyRoomPlayerActionState, currentRoomId, pendingV10Request]);

  const sendAssassinationRequest = useCallback(async () => {
    if (!playerId || !currentRoomId || !assassinationTargetId || !isParanoidPower) return;
    if (assassinationTargetId === playerId) return;

    setAssassinationSubmitting(true);
    setAssassinationMessage(null);

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("player_action_state")
        .eq("id", currentRoomId)
        .single();

      if (error) {
        setAssassinationMessage(t("assassinationRequestError", language));
        return;
      }

      const latestState = normalizePlayerActionState(
        (data as { player_action_state?: PlayerActionState | null } | null)?.player_action_state,
      );
      const hasPending = latestState.requests.some((request) => (
        request.kind === "v10-assassinate" && request.actorPlayerId === playerId
      ));
      if (hasPending) {
        setPlayerActionState(latestState);
        setAssassinationMode(false);
        setAssassinationTargetId(null);
        setAssassinationMessage(null);
        return;
      }

      const latestUses = latestState.powerUses.v10?.[playerId] ?? v10Uses;
      if (!v10HasUnlimitedUses && latestUses >= 2) {
        setPlayerActionState(latestState);
        setAssassinationMode(false);
        setAssassinationTargetId(null);
        showFakeAssassinationPending();
        return;
      }

      const nextState: PlayerActionState = {
        ...latestState,
        requests: [
          ...latestState.requests,
          createPlayerActionRequest("v10-assassinate", playerId, assassinationTargetId),
        ],
      };
      const { error: updateError } = await supabase
        .from("rooms")
        .update({ player_action_state: nextState })
        .eq("id", currentRoomId);

      if (updateError) {
        setAssassinationMessage(t("assassinationRequestError", language));
        return;
      }

      setPlayerActionState(nextState);
      setAssassinationMode(false);
      setAssassinationTargetId(null);
      setAssassinationMessage(null);
    } finally {
      setAssassinationSubmitting(false);
    }
  }, [assassinationTargetId, currentRoomId, isParanoidPower, language, playerId, showFakeAssassinationPending, v10HasUnlimitedUses, v10Uses]);

  if (removed) {
    return (
      <LanguageContext.Provider value={language}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <X className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="font-display text-2xl font-bold text-gradient-blood">{t("sessionEnded", language)}</h1>
          <p className="text-muted-foreground font-body">
            {t("sessionEndedDesc", language)}
          </p>
          <Button onClick={() => navigate("/")} variant="secondary" className="font-display">
            {t("backHome", language)}
          </Button>
        </div>
      </div>
      </LanguageContext.Provider>
    );
  }

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground font-display">{t("loading", language)}</div>
      </div>
    );
  }

  const isDead = playerIsDead;
  const seatedPlayers = roomPlayers.filter((p) => p.seat_position !== null).sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0));
  const totalSlots = seatedPlayers.length || roomPlayers.length;
  const assassinationPlayers = seatedPlayers.length > 0 ? seatedPlayers : roomPlayers;
  const assassinationTotalSlots = assassinationPlayers.length || 1;
  const openRulebook = (roleId: RoleId | null = null) => {
    setRulebookRoleId(roleId);
    setRulebookOpen(true);
  };

  return (
    <LanguageContext.Provider value={language}>
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="space-y-2 relative">
          <div className="absolute right-0 top-0 flex items-center gap-1">
            <SkinPackSelectButton
              language={language}
              className="h-9 w-10 border-transparent bg-transparent shadow-none text-muted-foreground/40 hover:bg-secondary hover:text-foreground"
            />
            <button
              type="button"
              onClick={() => openRulebook()}
              className="rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground"
              title={t("rulebook", language)}
              aria-label={t("rulebook", language)}
            >
              <BookOpen className="h-4 w-4" />
            </button>
          </div>
          <h1 className="px-14 font-display text-3xl font-bold">{player.name}</h1>
          <p className="text-muted-foreground/60 text-xs font-body">
            {t("appTitle", language)}
          </p>
        </div>

        {!player.character ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 py-8"
          >
            <Clock className="mx-auto h-10 w-10 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground text-lg">
              {roomStatus === "lobby"
                ? t("waitingGame", language)
                : t("gmAssigning", language)}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {phaseInfo && (
              <div className="bg-card/50 border border-border/30 rounded-lg p-4 text-center flex flex-col items-center gap-2">
                {phaseInfo.phase === "night" ? (
                  <Moon className="h-6 w-6 text-blue-400" />
                ) : phaseInfo.phase === "day" ? (
                  <Sun className="h-6 w-6 text-yellow-400" />
                ) : (
                  <Scale className="h-6 w-6 text-yellow-400" />
                )}
                <p className="font-display text-2xl tracking-widest">
                  {phaseInfo.phase === "night"
                    ? `${t("night", language)} ${phaseInfo.number}`
                    : phaseInfo.phase === "day"
                    ? `${t("day", language)} ${phaseInfo.number}`
                    : `${t("tribunal", language)} ${phaseInfo.number}`}
                </p>
                {phaseInfo.phase === "night" && (
                  <p className="text-xs text-muted-foreground italic">{t("nightFalls", language)}</p>
                )}
                {phaseInfo.phase !== "night" && timerState && timerState.phase === phaseInfo.phase && (
                  <>
                    <div className={`font-display text-4xl tracking-wider mt-1 ${timerState.timeLeft <= 30 ? "text-destructive animate-pulse" : "text-foreground"}`}>
                      {String(Math.floor(timerState.timeLeft / 60)).padStart(2, "0")}:{String(timerState.timeLeft % 60).padStart(2, "0")}
                    </div>
                    {timerState.timerDone && (
                      <p className="font-display text-yellow-400 text-xs">
                        {phaseInfo.phase === "day" ? t("dayTimerEnded", language) : t("tribunalTimerEnded", language)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
            <AnimatePresence mode="wait">
              {assassinationMode ? (
                <motion.div
                  key="assassination-mode"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-4 shadow-lg"
                >
                  <div className="space-y-1">
                    <Crosshair className="mx-auto h-8 w-8 text-destructive" />
                    <h2 className="font-display text-2xl font-bold text-destructive">
                      {t("assassinationMode", language)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("assassinationChooseTarget", language)}
                    </p>
                  </div>
                  <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border border-destructive/40 bg-destructive/10" />
                    </div>
                    {assassinationPlayers.map((p, i) => {
                      const angle = (2 * Math.PI * i) / assassinationTotalSlots - Math.PI / 2;
                      const r = 120;
                      const cx = r * Math.cos(angle) + 140;
                      const cy = r * Math.sin(angle) + 140;
                      const isMe = p.id === playerId;
                      const pDead = !p.is_alive;
                      const selectable = !isMe && !pDead;
                      const selected = assassinationTargetId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!selectable}
                          onClick={() => setAssassinationTargetId(p.id)}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-transform ${selectable ? "hover:scale-105" : "cursor-not-allowed opacity-45"}`}
                          style={{ left: cx, top: cy }}
                        >
                          <span className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${selected ? "border-destructive bg-destructive/30 shadow-[0_0_18px_hsl(var(--destructive)/0.45)]" : isMe ? "border-primary bg-primary/20" : "border-border/50 bg-card"} ${pDead ? "grayscale" : ""}`}>
                            <span className="font-display text-xs font-bold">
                              {p.name.charAt(0).toUpperCase()}
                            </span>
                            {pDead && (
                              <X className="absolute h-6 w-6 text-muted-foreground" strokeWidth={3} />
                            )}
                          </span>
                          <span className={`mt-0.5 max-w-[64px] truncate text-[10px] font-body ${pDead ? "text-muted-foreground/50" : selected ? "text-destructive" : ""}`}>
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setAssassinationMode(false);
                        setAssassinationTargetId(null);
                      }}
                      className="font-display"
                    >
                      {t("assassinationExit", language)}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={!assassinationTargetId || assassinationSubmitting}
                      onClick={sendAssassinationRequest}
                      className="font-display"
                    >
                      <Crosshair className="mr-2 h-4 w-4" />
                      {t("assassinationConfirm", language)}
                    </Button>
                  </div>
                </motion.div>
              ) : hidden ? (
                <motion.div
                  key="circle-view"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isDead ? (
                        <img src={ghostImg} alt="" className="w-16 h-16 opacity-30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-border/30" />
                      )}
                    </div>
                    {seatedPlayers.map((p, i) => {
                      const angle = (2 * Math.PI * i) / totalSlots - Math.PI / 2;
                      const r = 120;
                      const cx = r * Math.cos(angle) + 140;
                      const cy = r * Math.sin(angle) + 140;
                      const isMe = p.id === playerId;
                      const pDead = !p.is_alive;
                      return (
                        <div
                          key={p.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          style={{ left: cx, top: cy }}
                        >
                          <div className={`relative w-9 h-9 rounded-full border-2 flex items-center justify-center ${isMe ? "border-primary bg-primary/20" : "border-border/50 bg-card"} ${pDead ? "opacity-40 grayscale" : ""}`}>
                            <span className="font-display text-xs font-bold">
                              {p.name.charAt(0).toUpperCase()}
                            </span>
                            {pDead && (
                              <X className="absolute w-6 h-6 text-muted-foreground" strokeWidth={3} />
                            )}
                          </div>
                          <span className={`text-[10px] font-body truncate max-w-[60px] mt-0.5 ${pDead ? "text-muted-foreground/50" : ""}`}>
                            {p.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`role-${characterKey}`}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <div className={`bg-card border border-border rounded-2xl p-6 paper-texture glow-blood space-y-4 ${isDead ? "grayscale opacity-60" : ""}`}>
                    {roleDef ? (
                      <button
                        type="button"
                        onClick={() => openRulebook(roleDef.id)}
                        className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border-2 border-primary/40 shadow-lg block"
                      >
                        <img
                          src={displayedRoleImage ?? roleDef.image}
                          alt={roleDef.label}
                          className={`w-full h-full object-cover ${isDead ? "grayscale" : ""}`}
                        />
                        {isActorCopying && !isDogActorCopying && (
                          <img
                            src={getSkinImage("a04")}
                            alt={getRoleLabel("a04", language)}
                            title={getRoleLabel("a04", language)}
                            onClick={(event) => {
                              event.stopPropagation();
                              openRulebook("a04");
                            }}
                            className="absolute bottom-2 right-2 h-14 w-14 cursor-pointer rounded-md border-2 border-primary object-cover shadow-lg"
                          />
                        )}
                        {isMimeCopying && (
                          <img
                            src={getSkinImage("a03")}
                            alt={getRoleLabel("a03", language)}
                            title={getRoleLabel("a03", language)}
                            onClick={(event) => {
                              event.stopPropagation();
                              openRulebook("a03");
                            }}
                            className="absolute bottom-2 right-2 h-14 w-14 cursor-pointer rounded-md border-2 border-cyan-300 object-cover shadow-lg"
                          />
                        )}
                        {ownerRoleDef && !isDogActorCopying && (
                          <img
                            src={getSkinImage(ownerRoleDef.id)}
                            alt={getRoleLabel(ownerRoleDef.id, language)}
                            title={getRoleLabel(ownerRoleDef.id, language)}
                            onClick={(event) => {
                              event.stopPropagation();
                              openRulebook(ownerRoleDef.id);
                            }}
                            className="absolute bottom-2 left-2 h-14 w-14 rounded-md border-2 border-amber-400 object-cover shadow-lg"
                          />
                        )}
                        {isDogActorCopying && (
                          <div className="absolute bottom-2 left-2 h-14 w-14">
                            <img
                              src={getSkinImage("a02")}
                              alt={getRoleLabel("a02", language)}
                              onClick={(event) => {
                                event.stopPropagation();
                                openRulebook("a02");
                              }}
                              className="block h-full w-full cursor-pointer rounded-md border-2 border-amber-400 object-cover shadow-lg"
                              title={getRoleLabel("a02", language)}
                            />
                            <img
                              src={getSkinImage("a04")}
                              alt={getRoleLabel("a04", language)}
                              onClick={(event) => {
                                event.stopPropagation();
                                openRulebook("a04");
                              }}
                              className="absolute -bottom-1 -right-1 h-7 w-7 cursor-pointer rounded border-2 border-primary object-cover shadow"
                              title={getRoleLabel("a04", language)}
                            />
                          </div>
                        )}
                        {isDead && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <X className="w-24 h-24 text-muted-foreground" strokeWidth={2} />
                          </div>
                        )}
                      </button>
                    ) : null}
                    <p className="text-muted-foreground text-sm font-display tracking-widest uppercase">
                      {t("yourRole", language)}
                    </p>
                    <h2 className="font-display text-3xl font-bold text-gradient-blood">
                      {roleDef ? getRoleLabel(roleDef.id, language) : player.character}
                    </h2>
                    {objectiveIndicators.length > 0 && (
                      <div className="flex justify-center gap-2">
                        {objectiveIndicators.map((indicator) => (
                          <Popover key={indicator.id}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="h-10 w-10 rounded-md border border-border/60 bg-background/60 p-1 shadow"
                                aria-label={format(t("currentObjective", language), { objective: indicator.label })}
                              >
                                <img src={indicator.image} alt="" className="h-full w-full rounded-sm object-cover" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 text-sm" side="top">
                              {format(t("currentObjective", language), { objective: indicator.label })}
                            </PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t("keepSecret", language)}
                  </p>
                  {isParanoidPower && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={!canStartAssassination}
                        onClick={() => {
                          setAssassinationMode(true);
                          setAssassinationTargetId(null);
                          setAssassinationMessage(null);
                        }}
                        className="w-full font-display tracking-wider"
                      >
                        <Crosshair className="mr-2 h-4 w-4" />
                        {t("assassinate", language)}
                      </Button>
                      {visiblePendingV10Request && (
                        <p className="text-xs text-yellow-400">
                          {t("assassinationRequestPending", language)}
                        </p>
                      )}
                    </div>
                  )}
                  {assassinationMessage && (
                    <p className="text-xs text-muted-foreground">
                      {assassinationMessage}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!assassinationMode && (
              <Button
                variant="secondary"
                onClick={() => setHidden(!hidden)}
                className="w-full font-display tracking-wider"
              >
                {hidden ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("showRole", language)}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t("hideRole", language)}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* FortuneTeller Reveal Modal - only for FortuneTeller player */}
      {(isFortuneTeller || fortuneTellerReveal) && fortuneTellerData && (
        <FortuneTellerRevealModal
          open={fortuneTellerReveal}
          onClose={() => setFortuneTellerReveal(false)}
          deadPlayerIds={fortuneTellerData.deadPlayerIds}
          illusionPlayerId={fortuneTellerData.illusionPlayerId}
          illusionPlayerIds={fortuneTellerData.illusionPlayerIds}
          roleAssignments={fortuneTellerData.roleAssignments}
          players={roomPlayers}
          isFortuneTellerPoisoned={fortuneTellerData.isFortuneTellerPoisoned}
          precomputedFakeMap={fortuneTellerData.fakeMap}
          dismissible={false}
          onRoleClick={(roleId) => openRulebook(roleId)}
        />
      )}

      {(isLittleGirl || littleGirlReveal) && (
        <RevealModal language={language} open={littleGirlReveal} onClose={() => setLittleGirlReveal(false)} title={t("revealLittleGirlTitle", language)} subtitle={t("revealLittleGirlSubtitle", language)} cards={littleGirlCards} dismissible={false} onRoleClick={(roleId) => openRulebook(roleId)} />
      )}
      {(isLamplighter || lamplighterReveal) && (
        <RevealModal language={language} open={lamplighterReveal} onClose={() => setLamplighterReveal(false)} title={t("revealLamplighterTitle", language)} subtitle={t("revealLamplighterSubtitle", language)} cards={lamplighterCards} dismissible={false} onRoleClick={(roleId) => openRulebook(roleId)} />
      )}
      {(isWerewolfSeer || lvReveal) && (
        <RevealModal language={language} open={lvReveal} onClose={() => setLvReveal(false)} title={t("revealVampireWolfTitle", language)} subtitle={t("revealVampireWolfSubtitle", language)} cards={lvCards} dismissible={false} onRoleClick={(roleId) => openRulebook(roleId)} />
      )}
      {(isSpider || spiderReveal) && (
        <RevealModal language={language} open={spiderReveal} onClose={() => setSpiderReveal(false)} title={t("spiderEyeReveal", language)} cards={spiderCards} dismissible={false} onRoleClick={(roleId) => openRulebook(roleId)} />
      )}
      {(isSpy || spyReveal) && (
        <RevealModal language={language} open={spyReveal} onClose={() => setSpyReveal(false)} title={t("spyEyeReveal", language)} cards={spyCards} dismissible={false} onRoleClick={(roleId) => openRulebook(roleId)} />
      )}
      {(isMime || mimeReveal) && (
        <RevealModal language={language} open={mimeReveal} onClose={() => setMimeReveal(false)} title={getRoleLabel("a03", language)} cards={mimeCards} dismissible={false} actionLabel="OK" onRoleClick={(roleId) => openRulebook(roleId)} />
      )}
      <RulebookModal
        open={rulebookOpen}
        onOpenChange={setRulebookOpen}
        language={language}
        roleId={rulebookRoleId}
      />
      <GameOverModal
        open={!!gameOver && !gameOverDismissed}
        kind={gameOver?.kind ?? null}
        outcome={gameOver?.outcome ?? "defeat"}
        onDismiss={() => setGameOverDismissed(true)}
      />
    </div>
    </LanguageContext.Provider>
  );
};

export default PlayerView;
