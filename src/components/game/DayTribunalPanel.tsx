import { forwardRef, useState, useEffect, useCallback, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Sun, Scale, Play, Pause, RotateCcw, Settings, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { parseScriptText } from "@/lib/nightScript";
import { format, getTranslation, useLanguage, useT } from "@/lib/i18n";
import type { TimerProjection } from "@/lib/timerState";

interface DayTribunalPanelProps {
  nightNumber: number;
  alivePlayers: number;
  travellerCount?: number;
  totalPlayers?: number;
  onStartNight: () => void;
  onStartTribunal: () => void;
  gamePhase: "day" | "tribunal";
  onPhaseChange: (phase: "day" | "tribunal") => void;
  tribunalLines?: string[];
  dayDeadNames?: string[];
  dayDefaultSeconds?: number;
  tribunalDefaultSeconds?: number;
  timer: TimerProjection | null;
  timerPending?: boolean;
  onTimerAction: (action: "start" | "pause" | "reset" | "set_duration", duration?: number) => void;
  completedLineKeys?: Set<string>;
  onLineCompletedChange?: (key: string, completed: boolean) => void;
}

export interface DayTribunalPanelHandle {
  toggleTimer: () => void;
  resetTimer: () => void;
  setDuration: (seconds: number) => void;
}

export const DayTribunalPanel = forwardRef<DayTribunalPanelHandle, DayTribunalPanelProps>(({
  nightNumber,
  alivePlayers,
  travellerCount = 0,
  totalPlayers = 0,
  onStartNight,
  onStartTribunal,
  gamePhase,
  onPhaseChange,
  tribunalLines = [],
  dayDeadNames = [],
  dayDefaultSeconds = 300,
  tribunalDefaultSeconds = 180,
  timer,
  timerPending = false,
  onTimerAction,
  completedLineKeys = new Set(),
  onLineCompletedChange,
}, ref) => {
  const t = useT();
  const language = useLanguage();
  const [dayDefault, setDayDefault] = useState(dayDefaultSeconds);
  const [tribunalDefault, setTribunalDefault] = useState(tribunalDefaultSeconds);
  const timeLeft = timer?.timeLeft ?? (gamePhase === "day" ? dayDefault : tribunalDefault);
  const isRunning = timer?.isRunning ?? false;
  const timerDone = timer?.timerDone ?? false;
  const [editingDuration, setEditingDuration] = useState(false);
  const [editMinutes, setEditMinutes] = useState("5");
  const [editSeconds, setEditSeconds] = useState("0");

  useEffect(() => {
    setDayDefault(dayDefaultSeconds);
  }, [dayDefaultSeconds]);

  useEffect(() => {
    setTribunalDefault(tribunalDefaultSeconds);
  }, [tribunalDefaultSeconds]);

  const resetTimer = useCallback(() => onTimerAction("reset"), [onTimerAction]);

  useImperativeHandle(ref, () => ({
    toggleTimer: () => {
      onTimerAction(isRunning ? "pause" : "start");
    },
    resetTimer,
    setDuration: (seconds) => {
      onTimerAction("set_duration", Math.max(1, seconds));
    },
  }), [isRunning, onTimerAction, resetTimer]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const votesNeeded = Math.ceil(alivePlayers / 2);

  const handleSaveDuration = () => {
    const m = parseInt(editMinutes);
    const s = parseInt(editSeconds) || 0;
    if (!isNaN(m) && m >= 0 && m <= 30 && s >= 0 && s < 60) {
      const newDur = m * 60 + s;
      if (newDur > 0) {
        onTimerAction("set_duration", newDur);
      }
    }
    setEditingDuration(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {gamePhase === "day" ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Scale className="h-5 w-5 text-yellow-400" />
        )}
        <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">
          {gamePhase === "day" ? `${t("day")} ${nightNumber}` : `${t("tribunal")} — ${t("day")} ${nightNumber}`}
        </h2>
      </div>

      {/* Day dead names */}
      {gamePhase === "day" && dayDeadNames.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
          <p className="text-sm font-body text-destructive">
            {dayDeadNames.map((n, i) => (
              <span key={i}>{i > 0 ? ", " : ""}<strong>{n}</strong></span>
            ))}
            {" "}{dayDeadNames.length > 1 ? t("diedTonightPlural") : t("diedTonightSingular")}
          </p>
        </div>
      )}

      {/* Timer */}
      <div className="bg-card/50 border border-border/30 rounded-lg p-4 text-center space-y-3">
        <div className={`font-display text-5xl tracking-wider ${timeLeft <= 30 ? "text-destructive animate-pulse" : "text-foreground"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {!timerDone && (
            <>
              <Button size="sm" variant="ghost" aria-label={isRunning ? t("pauseTimer") : t("startTimer")}
                disabled={!timer || timerPending} onClick={() => onTimerAction(isRunning ? "pause" : "start")}>
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" aria-label={t("resetTimer")} disabled={!timer || timerPending} onClick={resetTimer}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
          {!editingDuration ? (
            <Button size="sm" variant="ghost" disabled={!timer || timerPending} onClick={() => {
              const dur = gamePhase === "day" ? dayDefault : tribunalDefault;
              setEditMinutes(String(Math.floor(dur / 60)));
              setEditSeconds(String(dur % 60));
              setEditingDuration(true);
            }}>
              <Settings className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Input type="number" value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="w-14 h-8 text-center text-sm" min={0} max={30} />
              <span className="text-xs text-muted-foreground">:</span>
              <Input type="number" value={editSeconds} onChange={(e) => setEditSeconds(e.target.value)} className="w-14 h-8 text-center text-sm" min={0} max={59} />
              <Button size="sm" variant="ghost" onClick={handleSaveDuration}>OK</Button>
            </div>
          )}
        </div>

        {timerDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3"
          >
            <p className="font-display text-yellow-400 text-sm">
              {gamePhase === "day" ? t("dayTimerEnded") : t("tribunalTimerEnded")}
            </p>
          </motion.div>
        )}
      </div>

      {/* Tribunal info */}
      {gamePhase === "tribunal" && (
        <div className="space-y-2">
          <div className="bg-card/50 border border-border/30 rounded-lg p-3 text-center">
            <p className="text-sm font-body">
              {t("votesNeeded")} <span className="font-display text-primary text-lg">{votesNeeded}</span>
            </p>
            <p className="text-xs text-muted-foreground">({alivePlayers} {t("alivePlayers")})</p>
            {travellerCount > 0 && (
              <p className="mt-2 border-t border-border/30 pt-2 text-xs text-gold">
                {format(getTranslation(language).ui.travellers.exileVotes, { n: Math.ceil(totalPlayers / 2) })}
              </p>
            )}
          </div>

          {/* Tribunal script lines */}
          {tribunalLines.length > 0 && (
            <div className="space-y-1">
              {tribunalLines.map((line, i) => {
                const { segments } = parseScriptText(line);
                const lineKey = `${nightNumber}:tribunal:${i}`;
                const completed = completedLineKeys.has(lineKey);
                return (
                  <div key={lineKey} className="flex items-start gap-3 bg-card/50 border border-border/30 rounded-lg py-2 px-3 text-sm font-body">
                    <Checkbox
                      checked={completed}
                      onCheckedChange={(checked) => onLineCompletedChange?.(lineKey, checked === true)}
                      aria-label={t("completeScriptLine")}
                      title={t("completeScriptLine")}
                      className="mt-0.5 h-4 w-4 border-primary data-[state=checked]:bg-primary"
                    />
                    <span className={completed ? "line-through text-muted-foreground" : ""}>
                      {segments.map((seg, j) =>
                        seg.isRole ? (
                          <span key={j} className="font-bold text-blue-400">{seg.text}</span>
                        ) : (
                          <span key={j}>{seg.text}</span>
                        )
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Phase transition buttons — always visible */}
      {gamePhase === "day" && (
        <Button
          onClick={() => {
            onStartTribunal();
            onPhaseChange("tribunal");
          }}
          className={`w-full h-12 font-display tracking-wider ${timerDone ? "bg-yellow-700 hover:bg-yellow-800" : "bg-yellow-700/50 hover:bg-yellow-700"}`}
        >
          <Scale className="h-4 w-4 mr-2" />
          {t("startTribunal")}
        </Button>
      )}

      {gamePhase === "tribunal" && (
        <Button
          onClick={onStartNight}
          className={`w-full h-12 font-display tracking-wider ${timerDone ? "bg-secondary hover:bg-secondary/80" : "bg-secondary/50 hover:bg-secondary/80"} border border-moon/30`}
        >
          <Moon className="mr-2 h-4 w-4" />
          {t("nextNight")}
        </Button>
      )}
    </div>
  );
});

DayTribunalPanel.displayName = "DayTribunalPanel";
