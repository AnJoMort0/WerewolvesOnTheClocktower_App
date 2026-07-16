import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID, RULEBOOK_TOP_ID, isRulebookCharacterId } from "@/lib/rulebook";
import { t, type Language } from "@/lib/i18n";
import { useSkinPack } from "@/lib/skinPackContext";
import type { RulebookSkinPreviewValue } from "@/lib/skinPacks";
import { RULEBOOK_CHARACTERS, type RulebookCharacterId } from "@/lib/rulebookContent";

function getInitialLanguage(searchLanguage: string | null): Language {
  if (searchLanguage === "fr" || searchLanguage === "pt") return searchLanguage;
  const stored = typeof window === "undefined" ? null : window.localStorage.getItem("preferred_language");
  return stored === "fr" || stored === "pt" ? stored : "pt";
}

export default function RulebookPage() {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId?: string }>();
  const [searchParams] = useSearchParams();
  const language = getInitialLanguage(searchParams.get("lang"));
  const { skinPackId } = useSkinPack();
  const [skinPreviewOverrides, setSkinPreviewOverrides] = useState<Partial<Record<RulebookCharacterId, RulebookSkinPreviewValue>>>({});
  const html = useMemo(
    () => getRulebookHtml(language, null, { skinPackId, skinPreviewOverrides }),
    [language, skinPackId, skinPreviewOverrides],
  );

  useEffect(() => {
    const targetId = roleId && isRulebookCharacterId(roleId) ? roleId : RULEBOOK_TOP_ID;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [roleId]);

  const scrollUp = () => {
    const summary = document.getElementById(RULEBOOK_SUMMARY_ID);
    const summaryTop = summary ? summary.getBoundingClientRect().top + window.scrollY : 0;
    window.scrollTo({
      top: window.scrollY > summaryTop + 24 ? summaryTop : 0,
      behavior: "smooth",
    });
  };

  const leaveRulebook = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleArticleChange = (event: ChangeEvent<HTMLElement>) => {
    const select = (event.target as HTMLElement).closest<HTMLSelectElement>("select[data-rulebook-skin-select]");
    if (!select) return;
    const characterId = select.dataset.rulebookSkinSelect as RulebookCharacterId | undefined;
    if (!characterId || !(characterId in RULEBOOK_CHARACTERS)) return;
    const value = select.value as RulebookSkinPreviewValue;
    setSkinPreviewOverrides((current) => {
      const next = { ...current };
      if (value === "device") delete next[characterId];
      else next[characterId] = value;
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="fixed right-4 top-4 z-20 h-11 w-11 rounded-full shadow-lg"
        onClick={leaveRulebook}
        aria-label={t("close", language)}
        title={t("close", language)}
      >
        <X className="h-5 w-5" />
      </Button>
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
        <Button asChild variant="secondary" size="sm">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backHome", language)}
          </Link>
        </Button>
      </div>
      <article
        className="rulebook-content mx-auto max-w-6xl pb-16"
        onChange={handleArticleChange}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="fixed bottom-4 right-4 z-20 h-11 w-11 rounded-full shadow-lg"
        onClick={scrollUp}
        aria-label={t("rulebook", language)}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </main>
  );
}
