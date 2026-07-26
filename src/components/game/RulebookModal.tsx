import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArrowUp, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SkinPackSelectButton } from "@/components/game/SkinPackSelector";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID, RULEBOOK_TOP_ID } from "@/lib/rulebook";
import { t, type Language } from "@/lib/i18n";
import type { RoleId } from "@/lib/roles";
import { useSkinPack } from "@/lib/skinPackContext";
import type { RulebookSkinPreviewValue } from "@/lib/skinPacks";
import { handleRulebookSkinPreviewChange } from "@/lib/rulebookSkinPreview";
import { RULEBOOK_CHARACTERS, RULEBOOK_TEXT, type RulebookCharacterId } from "@/lib/rulebookContent";

interface RulebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  roleId?: RoleId | null;
}

export function RulebookModal({ open, onOpenChange, language, roleId = null }: RulebookModalProps) {
  const [viewRoleId, setViewRoleId] = useState<RulebookCharacterId | null>(roleId);
  const [pendingScroll, setPendingScroll] = useState<"top" | "summary" | null>(null);
  const [skinPreviewOverrides, setSkinPreviewOverrides] = useState<Partial<Record<RulebookCharacterId, RulebookSkinPreviewValue>>>({});
  const [articleElement, setArticleElement] = useState<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { skinPackId } = useSkinPack();
  const html = useMemo(
    () => getRulebookHtml(language, viewRoleId, { skinPackId, skinPreviewOverrides }),
    [language, viewRoleId, skinPackId, skinPreviewOverrides],
  );
  const title = viewRoleId ? RULEBOOK_CHARACTERS[viewRoleId]?.name[language] ?? t("rulebook", language) : t("rulebook", language);

  const findRulebookTarget = useCallback((targetId: string): HTMLElement | null => {
    const scroller = scrollerRef.current;
    if (!scroller) return null;
    return Array.from(scroller.querySelectorAll<HTMLElement>("[id]")).find((element) => element.id === targetId) ?? null;
  }, []);

  const scrollToTarget = useCallback((targetId: string, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    const target = findRulebookTarget(targetId);
    if (!scroller || !target) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top = Math.max(0, targetRect.top - scrollerRect.top + scroller.scrollTop - 12);
    scroller.scrollTo({ top, behavior });
  }, [findRulebookTarget]);

  useEffect(() => {
    if (!open) return;
    setViewRoleId(roleId);
    setSkinPreviewOverrides({});
    setPendingScroll("top");
  }, [open, roleId]);

  useEffect(() => {
    if (!open || !pendingScroll) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToTarget(pendingScroll === "summary" ? RULEBOOK_SUMMARY_ID : RULEBOOK_TOP_ID, "auto");
      setPendingScroll(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [html, open, pendingScroll, scrollToTarget]);

  useEffect(() => {
    if (!open || !articleElement) return;

    const handleChange = (event: Event) => {
      handleRulebookSkinPreviewChange(event, articleElement, setSkinPreviewOverrides);
    };

    articleElement.addEventListener("change", handleChange);
    return () => articleElement.removeEventListener("change", handleChange);
  }, [articleElement, open]);

  const handleArticleClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
    if (!link) return;

    const targetId = decodeURIComponent(link.hash.slice(1));
    if (!targetId) return;
    event.preventDefault();
    scrollToTarget(targetId);
  };

  const handleShowAllCharacters = () => {
    setViewRoleId(null);
    setPendingScroll("summary");
  };

  const handleFloatingUp = () => {
    const scroller = scrollerRef.current;
    const summary = findRulebookTarget(RULEBOOK_SUMMARY_ID);
    if (!scroller || !summary) {
      scrollToTarget(RULEBOOK_TOP_ID);
      return;
    }

    const summaryTop = summary.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scrollToTarget(scroller.scrollTop > summaryTop + 24 ? RULEBOOK_SUMMARY_ID : RULEBOOK_TOP_ID);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none flex-col gap-0 overflow-hidden border-border bg-background p-0 sm:rounded-lg md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)]">
        <DialogHeader className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 pr-9">
            <DialogTitle className="min-w-0 flex-1 truncate font-display text-xl text-gradient-blood">
              {title}
            </DialogTitle>
            <SkinPackSelectButton language={language} className="h-9 w-10" />
            {viewRoleId && (
              <Button type="button" size="sm" variant="secondary" onClick={handleShowAllCharacters} className="shrink-0">
                <List className="mr-2 h-4 w-4" />
                {RULEBOOK_TEXT.singleCardAllCharacters[language]}
              </Button>
            )}
          </div>
        </DialogHeader>
        <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
          <article
            ref={setArticleElement}
            className="rulebook-content mx-auto max-w-6xl py-4"
            onClick={handleArticleClick}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 z-10 h-11 w-11 rounded-full shadow-lg"
          onClick={handleFloatingUp}
          aria-label={RULEBOOK_TEXT.backToIndex[language]}
          title={RULEBOOK_TEXT.backToIndex[language]}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
