import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, getGameOver, getWinLabel, type WinKind } from "@/lib/i18n";

interface GameOverModalProps {
  open: boolean;
  kind: WinKind | null;
  outcome: "victory" | "defeat";
  onDismiss: () => void;
}

export const GameOverModal = ({ open, kind, outcome, onDismiss }: GameOverModalProps) => {
  const lang = useLanguage();
  return (
    <AnimatePresence>
      {open && kind && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 text-center"
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
