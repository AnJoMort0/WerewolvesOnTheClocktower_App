import { useContext, type ReactNode } from "react";
import { Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { GameModalMinimizeContext } from "@/lib/gameModalMinimize";
import { getTranslation, useLanguage } from "@/lib/i18n";

function GameHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="shrink-0 space-y-2 border-b border-gold/20 pb-3 text-left">
    <div className="flex items-start justify-between gap-3">
      <h2 className="min-w-0 font-display text-xl font-semibold text-foreground">{title}</h2>
      {action}
    </div>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </header>;
}

/** Embedded counterpart to GameModal for player actions that retain the player and phase header. */
export function GamePanel({ title, subtitle, children, footer, className }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return <section aria-label={title} className={cn(
    "flex min-w-0 flex-col gap-4 rounded-xl border border-gold/25 bg-card/95 p-4 shadow-lg ring-1 ring-inset ring-gold/10 paper-texture",
    className,
  )}>
    <GameHeader title={title} subtitle={subtitle} />
    <div className="min-h-0 touch-pan-y">{children}</div>
    {footer && <div className="shrink-0 border-t border-gold/20 pt-4">{footer}</div>}
  </section>;
}

/** Shared game dialog layout. Keep role-specific controls in children/footer. */
export function GameModal({ open, onClose, title, subtitle, closeLabel, dismissible = true,
  showCloseButton = dismissible, wide = false, children, footer, className }: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  closeLabel: string;
  dismissible?: boolean;
  showCloseButton?: boolean;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const minimize = useContext(GameModalMinimizeContext);
  const minimizeLabel = getTranslation(useLanguage()).ui.actions.minimize;
  if (minimize?.minimized) return null;
  return <Dialog open={open} onOpenChange={(next) => { if (!next && dismissible) onClose(); }}>
    <DialogContent showCloseButton={false} {...(!subtitle ? { "aria-describedby": undefined } : {})}
      onEscapeKeyDown={(event) => { if (!dismissible) event.preventDefault(); }}
      onInteractOutside={(event) => { if (!dismissible) event.preventDefault(); }}
      className={cn("flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden rounded-xl border-gold/25 p-4 sm:p-6",
        wide ? "max-w-2xl" : "max-w-lg", className)}>
      <DialogHeader className="sr-only"><DialogTitle>{title}</DialogTitle>{subtitle && <DialogDescription>{subtitle}</DialogDescription>}</DialogHeader>
      <GameHeader title={title} subtitle={subtitle} action={<div className="flex shrink-0 items-center gap-1">
        {minimize && <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
          onClick={minimize.onMinimize} aria-label={minimizeLabel} title={minimizeLabel}>
          <Minus className="h-5 w-5" />
        </Button>}
        {showCloseButton && <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
          onClick={onClose} aria-label={closeLabel} title={closeLabel}>
          <X className="h-5 w-5" />
        </Button>}
      </div>} />
      <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="shrink-0 border-t border-gold/20 pt-4">{footer}</div>}
    </DialogContent>
  </Dialog>;
}
