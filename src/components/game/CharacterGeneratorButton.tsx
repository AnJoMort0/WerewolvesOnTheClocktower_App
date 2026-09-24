import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getTranslation, type Language } from "@/lib/i18n";

export function CharacterGeneratorButton({ language }: { language: Language }) {
  const navigate = useNavigate();
  const text = getTranslation(language).ui.characterGenerator;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        window.localStorage.setItem("preferred_language", language);
        navigate(`/characters?lang=${language}`);
      }}
      className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
    >
      <Wand2 className="mr-2 h-3.5 w-3.5" />
      {text.open}
    </Button>
  );
}
