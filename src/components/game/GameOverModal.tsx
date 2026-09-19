import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, getGameOver, getWinLabel, type WinKind } from "@/lib/i18n";
import { useModalBackdrop } from "@/lib/modalBackdrop";

interface GameOverModalProps {
  open: boolean;
  kind: WinKind | null;
  outcome: "victory" | "defeat";
  onDismiss: () => void;
}

export const GameOverModal = ({ open, kind, outcome, onDismiss }: GameOverModalProps) => {
  const lang = useLanguage();
  const backdrop = useModalBackdrop();
  return (
    <AnimatePresence>
      {open && kind && (
        <motion.div
          initial={backdrop.opaque ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={backdrop.opaque ? undefined : { opacity: 0 }}
          data-modal-backdrop={backdrop.opaque ? "opaque" : "blurred"}
          className={`fixed inset-0 z-[80] flex items-center justify-center p-4 ${backdrop.className}`}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-xl paper-texture"
          >
            <Trophy className={`h-12 w-12 mx-auto ${outcome === "victory" ? "text-yellow-400" : "text-muted-foreground"}`} />
            <h2 className={`font-display text-3xl ${outcome === "victory" ? "text-gradient-blood" : "text-muted-foreground"}`}>
              {outcome === "victory" ? getGameOver("victory", lang) : getGameOver("defeat", lang)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getGameOver("winSubtitlePrefix", lang)}<strong>{getWinLabel(kind, lang)}</strong>
            </p>
            <Button variant="secondary" className="w-full font-display" onClick={onDismiss}>
              <X className="h-4 w-4 mr-2" /> {getGameOver("dismiss", lang)}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
