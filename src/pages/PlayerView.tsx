import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Eye, EyeOff, X, Moon, Sun, Scale, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES, type RoleId } from "@/lib/roles";
import { VidenteRevealModal } from "@/components/game/VidenteRevealModal";
import { RevealModal, type RevealCard } from "@/components/game/RevealModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { LanguageContext, getRoleLabel, t, type Language, type WinKind } from "@/lib/i18n";
import villagerIcon from "@/assets/icons/villager.png";
import ghostImg from "@/assets/icons/ghost.png";
import { clearPlayerSession, getPlayerSession, touchPlayerSession } from "@/lib/playerSession";
import { playTimerAlarm, shouldPlayTimerAlarm, unlockTimerAlarm, type TimerAlarmState } from "@/lib/timerAlarm";

type RoomPlayer = {
  id: string;
  name: string;
  seat_position: number | null;
  is_alive: boolean;
};

const PlayerView = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
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
  const [videnteReveal, setVidenteReveal] = useState(false);
  const [videnteData, setVidenteData] = useState<{
    deadPlayerIds: string[];
    illusionPlayerId: string | null;
    isVidentePoisoned: boolean;
    fakeMap: Record<string, string> | null;
    roleAssignments: Record<string, RoleId>;
  } | null>(null);
  const [meninaReveal, setMeninaReveal] = useState(false);
  const [meninaCards, setMeninaCards] = useState<RevealCard[]>([]);
  const [faroleiroReveal, setFaroleiroReveal] = useState(false);
  const [faroleiroCards, setFaroleiroCards] = useState<RevealCard[]>([]);
  const [lvReveal, setLvReveal] = useState(false);
  const [lvCards, setLvCards] = useState<RevealCard[]>([]);
  const [spiderReveal, setSpiderReveal] = useState(false);
  const [spiderCards, setSpiderCards] = useState<RevealCard[]>([]);
  const [spyReveal, setSpyReveal] = useState(false);
  const [spyCards, setSpyCards] = useState<RevealCard[]>([]);
  const [phaseInfo, setPhaseInfo] = useState<{ phase: "night" | "day" | "tribunal"; number: number } | null>(null);
  const [timerState, setTimerState] = useState<{ phase: "day" | "tribunal"; timeLeft: number; isRunning: boolean; timerDone: boolean } | null>(null);
  const [language, setLanguage] = useState<Language>("pt");
  const [gameOver, setGameOver] = useState<{ kind: WinKind; outcome: "victory" | "defeat" } | null>(null);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const playerRef = useRef<typeof player>(null);
  const gameOverEventRef = useRef<string | null>(null);
  const previousTimerAlarmStateRef = useRef<TimerAlarmState | null>(null);
  useEffect(() => { playerRef.current = player; }, [player]);

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
        .select("status, language, phase_state, timer_state, game_over_state")
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
        };
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
    let videnteChannel: ReturnType<typeof supabase.channel> | null = null;

    if (roomId) {
      roomChannel = supabase
        .channel(`room-${roomId}-status`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
          (payload) => {
            setRoomStatus(payload.new.status);
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

      // Listen for Vidente reveal broadcasts
      videnteChannel = supabase
        .channel(`vidente-reveal-${roomId}`)
        .on("broadcast", { event: "vidente-reveal" }, (payload) => {
          const data = payload.payload;
          if (data.show) {
            setVidenteData({
              deadPlayerIds: data.deadPlayerIds,
              illusionPlayerId: data.illusionPlayerId,
              isVidentePoisoned: !!data.isVidentePoisoned,
              fakeMap: data.fakeMap || null,
              roleAssignments: data.roleAssignments || {},
            });
            setVidenteReveal(true);
          } else {
            setVidenteReveal(false);
          }
        })
        .subscribe();

      // Reveal channels: menina, faroleiro, lobisomem-vidente
      const meninaCh = supabase.channel(`menina-reveal-${roomId}`)
        .on("broadcast", { event: "menina-reveal" }, (payload) => {
          const d = payload.payload;
          if (d.show) { setMeninaCards(d.cards || []); setMeninaReveal(true); } else { setMeninaReveal(false); }
        }).subscribe();
      const faroleiroCh = supabase.channel(`faroleiro-reveal-${roomId}`)
        .on("broadcast", { event: "faroleiro-reveal" }, (payload) => {
          const d = payload.payload;
          if (d.show && d.role && ROLES[d.role as RoleId]) {
            const def = ROLES[d.role as RoleId];
            const checkboxes = Array.isArray(d.charges) && d.charges.length > 0 ? d.charges : undefined;
            setFaroleiroCards([{ image: def.image, label: def.label, roleId: d.role as RoleId, checkboxes }]);
            setFaroleiroReveal(true);
          } else { setFaroleiroReveal(false); }
        }).subscribe();
      const lvCh = supabase.channel(`lobisomem-vidente-reveal-${roomId}`)
        .on("broadcast", { event: "lv-reveal" }, async (payload) => {
          const d = payload.payload;
          if (d.show && d.victimId && d.role && ROLES[d.role as RoleId]) {
            const def = ROLES[d.role as RoleId];
            const { data: vp } = await supabase.from("players").select("name").eq("id", d.victimId).single();
            setLvCards([{ name: vp?.name, image: def.image, label: def.label, roleId: d.role as RoleId }]);
            setLvReveal(true);
          } else { setLvReveal(false); }
        }).subscribe();

      const spiderCh = supabase.channel(`spider-reveal-${roomId}`)
        .on("broadcast", { event: "spider-reveal" }, (payload) => {
          const d = payload.payload;
          if (d.show) { setSpiderCards(d.cards || []); setSpiderReveal(true); } else { setSpiderReveal(false); }
        }).subscribe();

      const spyCh = supabase.channel(`spy-reveal-${roomId}`)
        .on("broadcast", { event: "spy-reveal" }, (payload) => {
          const d = payload.payload;
          if (d.show) { setSpyCards(d.cards || []); setSpyReveal(true); } else { setSpyReveal(false); }
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
          const myRole = (playerRef.current?.character || null) as RoleId | null;
          let outcome: "victory" | "defeat" = "defeat";
          if (playerId && d.perPlayer?.[playerId]) outcome = d.perPlayer[playerId];
          else if (myRole && d.perRole && d.perRole[myRole]) outcome = d.perRole[myRole];
          gameOverEventRef.current = `${d.kind}:${outcome}`;
          setGameOver({ kind: d.kind, outcome });
          setGameOverDismissed(false);
        }).subscribe();

      return () => {
        supabase.removeChannel(playerChannel);
        if (roomChannel) supabase.removeChannel(roomChannel);
        if (playersChannel) supabase.removeChannel(playersChannel);
        if (videnteChannel) supabase.removeChannel(videnteChannel);
        supabase.removeChannel(meninaCh);
        supabase.removeChannel(faroleiroCh);
        supabase.removeChannel(lvCh);
        supabase.removeChannel(spiderCh);
        supabase.removeChannel(spyCh);
        supabase.removeChannel(phaseCh);
        supabase.removeChannel(timerCh);
        supabase.removeChannel(gameOverCh);
      };
    }

    return () => {
      supabase.removeChannel(playerChannel);
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (playersChannel) supabase.removeChannel(playersChannel);
      if (videnteChannel) supabase.removeChannel(videnteChannel);
    };
  }, [playerId, navigate, player?.room_id]);

  // Persist hidden state across reloads
  useEffect(() => {
    if (!playerId) return;
    try { window.localStorage.setItem(`wotct_hidden_${playerId}`, hidden ? "1" : "0"); } catch { /* ignore */ }
  }, [hidden, playerId]);



  const roleDef = player?.character
    ? ROLES[player.character as RoleId] ?? null
    : null;

  const isVidente = player?.character === "e04";
  const isMenina = player?.character === "v01";
  const isFaroleiro = player?.character === "v21";
  const isLobisomemVidente = player?.character === "m02";
  const isSpider = player?.character === "v23";
  const isSpy = player?.character === "f02";

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

  const isDead = !player.is_alive;
  const seatedPlayers = roomPlayers.filter((p) => p.seat_position !== null).sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0));
  const totalSlots = seatedPlayers.length || roomPlayers.length;

  return (
    <LanguageContext.Provider value={language}>
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="space-y-2 relative">
          <a
            href={language === "fr"
              ? "https://anjomort0.github.io/WerewolvesOnTheClocktower/Rulebook_FR.html"
              : "https://anjomort0.github.io/WerewolvesOnTheClocktower/Rulebook_PT.html"}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-0 right-0 text-muted-foreground/40 hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
            title={t("rulebook", language)}
            aria-label={t("rulebook", language)}
          >
            <BookOpen className="h-4 w-4" />
          </a>
          <h1 className="font-display text-3xl font-bold">{player.name}</h1>
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
              {hidden ? (
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
                      <a
                        href={`https://anjomort0.github.io/WerewolvesOnTheClocktower/Rulebook_${language === "fr" ? "FR" : "PT"}.html#${roleDef.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border-2 border-primary/40 shadow-lg block"
                      >
                        <img
                          src={roleDef.image}
                          alt={roleDef.label}
                          className={`w-full h-full object-cover ${isDead ? "grayscale" : ""}`}
                        />
                        {isDead && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <X className="w-24 h-24 text-muted-foreground" strokeWidth={2} />
                          </div>
                        )}
                      </a>
                    ) : null}
                    <p className="text-muted-foreground text-sm font-display tracking-widest uppercase">
                      {t("yourRole", language)}
                    </p>
                    <h2 className="font-display text-3xl font-bold text-gradient-blood">
                      {roleDef ? getRoleLabel(roleDef.id, language) : player.character}
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t("keepSecret", language)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

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
          </div>
        )}
      </motion.div>

      {/* Vidente Reveal Modal - only for Vidente player */}
      {isVidente && videnteData && (
        <VidenteRevealModal
          open={videnteReveal}
          onClose={() => setVidenteReveal(false)}
          deadPlayerIds={videnteData.deadPlayerIds}
          illusionPlayerId={videnteData.illusionPlayerId}
          roleAssignments={videnteData.roleAssignments}
          players={roomPlayers}
          isVidentePoisoned={videnteData.isVidentePoisoned}
          precomputedFakeMap={videnteData.fakeMap}
          dismissible={false}
        />
      )}

      {isMenina && (
        <RevealModal language={language} open={meninaReveal} onClose={() => setMeninaReveal(false)} title={t("revealLittleGirlTitle", language)} subtitle={t("revealLittleGirlSubtitle", language)} cards={meninaCards} dismissible={false} />
      )}
      {isFaroleiro && (
        <RevealModal language={language} open={faroleiroReveal} onClose={() => setFaroleiroReveal(false)} title={t("revealLamplighterTitle", language)} subtitle={t("revealLamplighterSubtitle", language)} cards={faroleiroCards} dismissible={false} />
      )}
      {isLobisomemVidente && (
        <RevealModal language={language} open={lvReveal} onClose={() => setLvReveal(false)} title={t("revealVampireWolfTitle", language)} subtitle={t("revealVampireWolfSubtitle", language)} cards={lvCards} dismissible={false} />
      )}
      {isSpider && (
        <RevealModal language={language} open={spiderReveal} onClose={() => setSpiderReveal(false)} title={t("spiderEyeReveal", language)} cards={spiderCards} dismissible={false} />
      )}
      {isSpy && (
        <RevealModal language={language} open={spyReveal} onClose={() => setSpyReveal(false)} title={t("spyEyeReveal", language)} cards={spyCards} dismissible={false} />
      )}
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
