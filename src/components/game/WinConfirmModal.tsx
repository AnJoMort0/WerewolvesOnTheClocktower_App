import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, getGameOver, getWinLabel, format, type WinKind } from "@/lib/i18n";

interface WinConfirmModalProps {
  open: boolean;
  kind: WinKind | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const WinConfirmModal = ({ open, kind, onAccept, onDecline }: WinConfirmModalProps) => {
  const lang = useLanguage();
  return (
    <AnimatePresence>
      {open && kind && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h2 className="font-display text-xl text-gradient-blood">{getGameOver("confirmEndGame", lang)}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(getGameOver("endGameQuestion", lang), { label: getWinLabel(kind, lang) })}
            </p>
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-gradient-blood">{getGameOver("manualGameOver", lang)}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
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
