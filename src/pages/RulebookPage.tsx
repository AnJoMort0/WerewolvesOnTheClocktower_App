import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkinPackSelectButton } from "@/components/game/SkinPackSelector";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID, RULEBOOK_TOP_ID, isRulebookCharacterId } from "@/lib/rulebook";
import { coerceLanguage, t, type Language } from "@/lib/i18n";
import { useSkinPack } from "@/lib/skinPackContext";
import type { RulebookSkinPreviewValue } from "@/lib/skinPacks";
import { handleRulebookSkinPreviewChange } from "@/lib/rulebookSkinPreview";
import type { RulebookCharacterId } from "@/lib/rulebookContent";
import { RulebookLoreNotes } from "@/components/game/RulebookLoreNotes";

function getInitialLanguage(searchLanguage: string | null): Language {
  if (searchLanguage) return coerceLanguage(searchLanguage);
  const stored = typeof window === "undefined" ? null : window.localStorage.getItem("preferred_language");
  return coerceLanguage(stored);
}

export default function RulebookPage() {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId?: string }>();
  const [searchParams] = useSearchParams();
  const language = getInitialLanguage(searchParams.get("lang"));
  const { skinPackId } = useSkinPack();
  const [skinPreviewOverrides, setSkinPreviewOverrides] = useState<Partial<Record<RulebookCharacterId, RulebookSkinPreviewValue>>>({});
  const [articleElement, setArticleElement] = useState<HTMLElement | null>(null);
  const html = useMemo(
    () => getRulebookHtml(language, null, { skinPackId, skinPreviewOverrides }),
    [language, skinPackId, skinPreviewOverrides],
  );

  useEffect(() => {
    const article = articleElement;
    if (!article) return;

    const handleChange = (event: Event) => {
      handleRulebookSkinPreviewChange(event, article, setSkinPreviewOverrides);
    };

    article.addEventListener("change", handleChange);
    return () => article.removeEventListener("change", handleChange);
  }, [articleElement]);

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

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="fixed right-4 top-4 z-20 h-10 w-10 rounded-md shadow-md"
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
        <div className="pr-14 sm:pr-0">
          <SkinPackSelectButton language={language} />
        </div>
      </div>
      <article
        ref={setArticleElement}
        lang={language}
        className="rulebook-content mx-auto max-w-6xl pb-16"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {articleElement && <RulebookLoreNotes container={articleElement} contentKey={html} language={language} />}
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="fixed bottom-4 right-4 z-20 h-10 w-10 rounded-md shadow-md"
        onClick={scrollUp}
        aria-label={t("rulebook", language)}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </main>
  );
}
