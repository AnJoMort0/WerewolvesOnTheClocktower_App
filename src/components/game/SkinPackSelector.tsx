import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import {
  SKIN_PACK_ORDER,
  getActiveSeasonalEvents,
  getSkinPackIcon,
  getSkinPackLabel,
  hasActiveSeasonalSkins,
  type SkinPackId,
} from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import type { Language } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NOTICE_TEXT: Record<Language, { title: string; body: string; dismiss: string; selector: string }> = {
  pt: {
    title: "Skin sazonal",
    body: "Esta é uma skin sazonal, não uma carta diferente. Podes mudar as skins no canto inferior esquerdo.",
    dismiss: "Fechar aviso de skin sazonal",
    selector: "Escolher skinpack",
  },
  fr: {
    title: "Skin saisonnier",
    body: "Ceci est un skin saisonnier, pas une carte différente. Tu peux changer les skins en bas à gauche.",
    dismiss: "Fermer l'avertissement de skin saisonnier",
    selector: "Choisir le skinpack",
  },
};

function getPreferredLanguage(): Language {
  if (typeof window === "undefined") return "pt";
  const stored = window.localStorage.getItem("preferred_language");
  return stored === "fr" || stored === "pt" ? stored : "pt";
}

function getNoticeScope(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && ["gm", "host", "play", "display"].includes(segments[0])) {
    return `${segments[0]}:${segments[1]}`;
  }
  return "global";
}

export function SkinPackChrome() {
  const { skinPackId, setSkinPackId } = useSkinPack();
  const [language, setLanguage] = useState<Language>(() => getPreferredLanguage());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "preferred_language") setLanguage(getPreferredLanguage());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <>
      <SkinPackSeasonalNotice language={language} skinPackId={skinPackId} />
      <div className="fixed bottom-4 left-4 z-40">
        <Select value={skinPackId} onValueChange={(value) => setSkinPackId(value as SkinPackId)}>
          <SelectTrigger
            className="h-12 w-12 rounded-full border-primary/50 bg-card/95 p-1 shadow-lg backdrop-blur [&>svg]:hidden"
            aria-label={NOTICE_TEXT[language].selector}
            title={NOTICE_TEXT[language].selector}
          >
            <img
              src={getSkinPackIcon(skinPackId)}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
            <span className="sr-only">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[15rem]">
            {SKIN_PACK_ORDER.map((id) => (
              <SelectItem key={id} value={id}>
                <div className="flex items-center gap-2">
                  <img src={getSkinPackIcon(id)} alt="" className="h-7 w-7 rounded object-cover" />
                  <span>{getSkinPackLabel(id, language)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function SkinPackSeasonalNotice({ language, skinPackId }: { language: Language; skinPackId: SkinPackId }) {
  const location = useLocation();
  const activeSeasonalEvents = useMemo(() => getActiveSeasonalEvents(), []);
  const dismissKey = useMemo(
    () => `seasonal_skin_notice_dismissed:${getNoticeScope(location.pathname)}`,
    [location.pathname],
  );
  const [dismissed, setDismissed] = useState(() => (
    typeof window !== "undefined" && window.sessionStorage.getItem(dismissKey) === "1"
  ));

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

  if (skinPackId !== "seasonal" || activeSeasonalEvents.length === 0 || !hasActiveSeasonalSkins() || dismissed) {
    return null;
  }

  const text = NOTICE_TEXT[language];
  return (
    <div className="fixed left-1/2 top-4 z-40 w-[min(calc(100vw-2rem),34rem)] -translate-x-1/2 rounded-md border border-amber-400/70 bg-card/95 p-3 pr-10 text-sm shadow-xl backdrop-blur">
      <div className="font-display text-sm text-amber-300">{text.title}</div>
      <p className="mt-1 leading-snug text-foreground">{text.body}</p>
      <button
        type="button"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => {
          window.sessionStorage.setItem(dismissKey, "1");
          setDismissed(true);
        }}
        aria-label={text.dismiss}
        title={text.dismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
