import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, Maximize, Moon, Scale, ScrollText, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerCircle } from "@/components/game/PlayerCircle";
import { GameLogModal } from "@/components/game/GameLogModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { RulebookModal } from "@/components/game/RulebookModal";
import { LanguageContext, type Language } from "@/lib/i18n";
import { getRoomDisplayStorageKey, readRoomDisplaySnapshot, type RoomDisplaySnapshot } from "@/lib/roomDisplay";
import type { StatusEffect } from "@/components/game/PlayerStatusPopover";

const COPY: Record<Language, {
  title: string;
  waiting: string;
  log: string;
  rulebook: string;
  fullscreen: string;
  close: string;
  night: string;
  day: string;
  tribunal: string;
}> = {
  pt: {
    title: "Ecrã da sala",
    waiting: "Abre este ecrã a partir da sala do Mestre de Jogo.",
    log: "Registo do jogo",
    rulebook: "Regras",
    fullscreen: "Ecrã inteiro",
    close: "Fechar ecrã",
    night: "Noite",
    day: "Dia",
    tribunal: "Tribunal",
  },
  fr: {
    title: "Écran de salle",
    waiting: "Ouvrez cet écran depuis la salle du Meneur de Jeu.",
    log: "Journal de partie",
    rulebook: "Règles",
    fullscreen: "Plein écran",
    close: "Fermer l'écran",
    night: "Nuit",
    day: "Jour",
    tribunal: "Tribunal",
  },
};

function formatTimer(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function RoomDisplay() {
  const { roomId = "" } = useParams<{ roomId: string }>();
  const [snapshot, setSnapshot] = useState<RoomDisplaySnapshot | null>(() => readRoomDisplaySnapshot(roomId));
  const [gameLogOpen, setGameLogOpen] = useState(false);
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [dismissedGameOverId, setDismissedGameOverId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    setSnapshot(readRoomDisplaySnapshot(roomId));
    const storageKey = getRoomDisplayStorageKey(roomId);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setSnapshot(readRoomDisplaySnapshot(roomId));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [roomId]);

  const language = snapshot?.language ?? "pt";
  const copy = COPY[language];
  const permanentlyDead = useMemo(() => new Set(snapshot?.permanentlyDead ?? []), [snapshot?.permanentlyDead]);
  const playerEffects = useMemo(() => Object.fromEntries(
    Object.entries(snapshot?.playerEffects ?? {}).map(([playerId, effects]) => [playerId, new Set(effects)]),
  ) as Record<string, Set<StatusEffect>>, [snapshot?.playerEffects]);
  const totalSlots = Math.max(snapshot?.players.filter((player) => player.seat_position !== null).length ?? 0, 1);
  const visibleTimer = snapshot?.phase !== "night" && snapshot?.timerState?.phase === snapshot?.phase
    ? snapshot.timerState
    : null;

  if (!snapshot) {
    return (
      <LanguageContext.Provider value={language}>
        <div className="flex min-h-screen items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <ScrollText className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="font-display text-2xl text-foreground">{copy.title}</h1>
            <p className="text-muted-foreground">{copy.waiting}</p>
          </div>
        </div>
      </LanguageContext.Provider>
    );
  }

  const phaseLabel = snapshot.phase === "night" ? copy.night : snapshot.phase === "day" ? copy.day : copy.tribunal;

  return (
    <LanguageContext.Provider value={language}>
      <div className="min-h-screen overflow-hidden bg-background">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/60 px-3 sm:px-5">
          <div className="min-w-0">
            <h1 className="truncate font-display text-base text-foreground sm:text-lg">{copy.title}</h1>
            <p className="font-display text-[10px] tracking-[0.18em] text-muted-foreground">{snapshot.roomCode}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="secondary" onClick={() => setGameLogOpen(true)} title={copy.log} aria-label={copy.log}>
              <ScrollText className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="secondary" onClick={() => setRulebookOpen(true)} title={copy.rulebook} aria-label={copy.rulebook}>
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="secondary" onClick={() => document.documentElement.requestFullscreen?.()} title={copy.fullscreen} aria-label={copy.fullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="secondary" onClick={() => window.close()} title={copy.close} aria-label={copy.close}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="h-[calc(100vh-3.5rem)] overflow-auto px-3 py-4">
          <section className="mx-auto flex w-max min-w-full flex-col items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              {snapshot.phase === "night" ? <Moon className="h-5 w-5 text-moon" /> : snapshot.phase === "day" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Scale className="h-5 w-5 text-yellow-400" />}
              <p className="font-display text-xl tracking-widest text-foreground">{phaseLabel} {snapshot.phaseNumber}</p>
            </div>
            {visibleTimer && (
              <p className={`mt-1 font-display text-4xl tracking-wider ${visibleTimer.timeLeft <= 30 ? "text-destructive" : "text-foreground"}`}>
                {formatTimer(visibleTimer.timeLeft)}
              </p>
            )}
            <PlayerCircle
              players={snapshot.players}
              totalSlots={totalSlots}
              onDropPlayer={() => undefined}
              playerStatuses={snapshot.playerStatuses}
              permanentlyDead={permanentlyDead}
              playerEffects={playerEffects}
              hideSensitiveInfo
            />
          </section>
        </main>

        <GameLogModal
          open={gameLogOpen}
          onOpenChange={setGameLogOpen}
          language={language}
          events={snapshot.gameLogEvents}
          players={snapshot.players}
          roleAssignments={snapshot.roleAssignments}
          playerStatuses={snapshot.playerStatuses}
          permanentlyDead={permanentlyDead}
          playerEffects={playerEffects}
          poisonedPlayerId={snapshot.poisonedPlayerId}
          illusionPlayerId={snapshot.illusionPlayerId}
        />
        <RulebookModal open={rulebookOpen} onOpenChange={setRulebookOpen} language={language} />
        <GameOverModal
          open={!!snapshot.gameOver && snapshot.gameOver.id !== dismissedGameOverId}
          kind={snapshot.gameOver?.kind ?? null}
          outcome="victory"
          onDismiss={() => setDismissedGameOverId(snapshot.gameOver?.id ?? null)}
        />
      </div>
    </LanguageContext.Provider>
  );
}
