import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  return <Dialog open={open} onOpenChange={(next) => { if (!next && dismissible) onClose(); }}>
    <DialogContent showCloseButton={false} {...(!subtitle ? { "aria-describedby": undefined } : {})}
      onEscapeKeyDown={(event) => { if (!dismissible) event.preventDefault(); }}
      onInteractOutside={(event) => { if (!dismissible) event.preventDefault(); }}
      className={cn("flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden rounded-lg border-border p-4 sm:p-6",
        wide ? "max-w-2xl" : "max-w-lg", className)}>
      <DialogHeader className="shrink-0 space-y-2 text-left">
        <div className="flex items-start justify-between gap-3">
          <DialogTitle className="min-w-0 font-display text-xl text-blue-400">{title}</DialogTitle>
          {showCloseButton && <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0"
            onClick={onClose} aria-label={closeLabel} title={closeLabel}>
            <X className="h-5 w-5" />
          </Button>}
        </div>
        {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="shrink-0 border-t border-border/60 pt-4">{footer}</div>}
    </DialogContent>
  </Dialog>;
}
