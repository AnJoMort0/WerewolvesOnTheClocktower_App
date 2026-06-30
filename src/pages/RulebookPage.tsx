import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRulebookHtml, RULEBOOK_SUMMARY_ID, RULEBOOK_TOP_ID, isRulebookCharacterId } from "@/lib/rulebook";
import { t, type Language } from "@/lib/i18n";

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
  const html = useMemo(() => getRulebookHtml(language), [language]);

  useEffect(() => {
    const targetId = roleId && isRulebookCharacterId(roleId) ? roleId : RULEBOOK_TOP_ID;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [roleId, html]);

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
