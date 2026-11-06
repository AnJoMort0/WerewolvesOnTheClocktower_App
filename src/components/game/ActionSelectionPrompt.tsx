/** Shared choice summary for GM and player actions. The action stays in the text;
 * buttons remain short so the target is never hidden inside a button label. */
export function ActionSelectionPrompt({ instruction, selection, selectionLabel, emptyLabel }: {
  instruction: string;
  selection?: string | null;
  selectionLabel: string;
  emptyLabel: string;
}) {
  return <div className="overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.09] via-background/85 to-background/65 text-left shadow-sm">
    <p className="px-4 py-3 text-sm leading-relaxed text-foreground sm:px-5">{instruction}</p>
    <div data-testid="action-selection" aria-live="polite" className="border-t border-gold/20 bg-background/45 px-4 py-2.5 sm:px-5">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/85">{selectionLabel}</span>
      <span className={`mt-0.5 block break-words font-display text-base leading-snug ${selection ? "text-foreground" : "text-muted-foreground"}`}>
        {selection || emptyLabel}
      </span>
    </div>
  </div>;
}
