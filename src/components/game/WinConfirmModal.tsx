import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage, getGameOver, getWinLabel, format, type WinKind } from "@/lib/i18n";
import type { AutomaticWinKind } from "@/lib/victory";

const TIE_WINNER_GROUPS: AutomaticWinKind[] = ["village", "werewolves", "lovers", "whiteWolf", "secretLover"];

interface WinConfirmModalProps {
  open: boolean;
  kind: WinKind | null;
  onAccept: () => void;
  onDecline: () => void;
  tieWinnerGroups?: Set<AutomaticWinKind>;
  onTieWinnerGroupToggle?: (kind: AutomaticWinKind) => void;
}

export const WinConfirmModal = ({
  open,
  kind,
  onAccept,
  onDecline,
  tieWinnerGroups = new Set(),
  onTieWinnerGroupToggle,
}: WinConfirmModalProps) => {
  const lang = useLanguage();
  return (
    <AnimatePresence>
      {open && kind && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-xl paper-texture"
          >
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h2 className="font-display text-xl text-gradient-blood">{getGameOver("confirmEndGame", lang)}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(getGameOver("endGameQuestion", lang), { label: getWinLabel(kind, lang) })}
            </p>
            {kind === "tie" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{getGameOver("selectTieWinners", lang)}</p>
                <div className="space-y-2">
                  {TIE_WINNER_GROUPS.map((group) => (
                    <label key={group} className="flex items-center gap-3 text-sm font-body cursor-pointer">
                      <Checkbox
                        checked={tieWinnerGroups.has(group)}
                        onCheckedChange={() => onTieWinnerGroupToggle?.(group)}
                      />
                      <span>{getWinLabel(group, lang)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onDecline}>{getGameOver("decline", lang)}</Button>
              <Button onClick={onAccept} className="bg-primary hover:bg-blood-glow">{getGameOver("accept", lang)}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface WinPickerModalProps {
  open: boolean;
  onPick: (kind: WinKind) => void;
  onClose: () => void;
}

const ALL_KINDS: WinKind[] = ["village", "werewolves", "lovers", "whiteWolf", "secretLover", "tie"];

export const WinPickerModal = ({ open, onPick, onClose }: WinPickerModalProps) => {
  const lang = useLanguage();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-xl paper-texture"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-gradient-blood">{getGameOver("manualGameOver", lang)}</h2>
              <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label={getGameOver("dismiss", lang)} title={getGameOver("dismiss", lang)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{getGameOver("selectWinCondition", lang)}</p>
            <div className="flex flex-col gap-2">
              {ALL_KINDS.map((k) => (
                <Button key={k} variant="secondary" className="justify-start font-display" onClick={() => onPick(k)}>
                  {getWinLabel(k, lang)}
                </Button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
