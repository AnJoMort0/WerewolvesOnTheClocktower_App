import { useCallback, useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { RULEBOOK_TEXT } from "@/lib/rulebookContent";

type LoreNote = { anchor: HTMLButtonElement; text: string; hover: boolean };

/** Adds hover/tap notes to annotated passages in the generated rulebook HTML. */
export function RulebookLoreNotes({ container, contentKey, language }: {
  container: HTMLElement;
  contentKey: string;
  language: Language;
}) {
  const [note, setNote] = useState<LoreNote | null>(null);
  const closeTimer = useRef<number | null>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const bubbleId = useId();
  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const close = useCallback(() => { cancelClose(); setNote(null); }, [cancelClose]);
  const closeHover = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setNote((current) => current?.hover ? null : current), 180);
  }, [cancelClose]);

  useEffect(() => {
    close();
    const sentence = (target: EventTarget | null) => target instanceof Element
      ? target.closest<HTMLButtonElement>("button[data-lore-explanation]") : null;
    const click = (event: Event) => {
      const anchor = sentence(event.target);
      if (!anchor) return;
      cancelClose();
      setNote((current) => current?.anchor === anchor && !current.hover ? null
        : { anchor, text: anchor.dataset.loreExplanation!, hover: false });
    };
    const over = (event: MouseEvent) => {
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const anchor = sentence(event.target);
      if (!anchor) return;
      cancelClose();
      setNote((current) => current?.anchor === anchor ? current
        : { anchor, text: anchor.dataset.loreExplanation!, hover: true });
    };
    const out = (event: MouseEvent) => {
      const anchor = sentence(event.target);
      if (!anchor || (event.relatedTarget instanceof Node && (anchor.contains(event.relatedTarget) || bubble.current?.contains(event.relatedTarget)))) return;
      closeHover();
    };
    const toggle = (event: Event) => {
      if (event.target instanceof HTMLDetailsElement && !event.target.open) close();
    };
    container.addEventListener("click", click);
    container.addEventListener("mouseover", over);
    container.addEventListener("mouseout", out);
    container.addEventListener("toggle", toggle, true);
    container.parentElement?.addEventListener("scroll", close);
    return () => {
      cancelClose();
      container.removeEventListener("click", click);
      container.removeEventListener("mouseover", over);
      container.removeEventListener("mouseout", out);
      container.removeEventListener("toggle", toggle, true);
      container.parentElement?.removeEventListener("scroll", close);
    };
  }, [cancelClose, close, closeHover, container, contentKey]);

  useEffect(() => {
    if (!note) return;
    note.anchor.setAttribute("aria-expanded", "true");
    note.anchor.setAttribute("aria-controls", bubbleId);
    return () => {
      note.anchor.setAttribute("aria-expanded", "false");
      note.anchor.removeAttribute("aria-controls");
    };
  }, [bubbleId, note]);

  if (!note) return null;
  return <Popover.Root open onOpenChange={(open) => { if (!open) close(); }}>
    <Popover.Anchor virtualRef={{ current: note.anchor }} />
    <Popover.Portal>
      <Popover.Content ref={bubble} id={bubbleId} side="bottom" align="start" sideOffset={8} collisionPadding={16}
        aria-label={RULEBOOK_TEXT.loreExplanationLabel[language]}
        className="z-[70] w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gold/40 bg-[#403422] p-3 pr-9 font-body text-sm leading-relaxed text-[#f3e6c6] shadow-xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => { if (event.target instanceof Node && note.anchor.contains(event.target)) event.preventDefault(); }}
        onMouseEnter={cancelClose} onMouseLeave={closeHover}>
        {note.text}
        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6" onClick={close}
          aria-label={t("close", language)}><X className="h-3 w-3" /></Button>
        <Popover.Arrow className="fill-[#403422]" width={12} height={6} />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
