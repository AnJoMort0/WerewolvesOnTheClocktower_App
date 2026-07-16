import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Images, Shuffle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleSelector } from "@/components/game/RoleSelector";
import { RulebookModal } from "@/components/game/RulebookModal";
import { assignRoles, type RoleId } from "@/lib/roles";
import { LanguageContext, getRoleLabel, type Language } from "@/lib/i18n";
import { resolveRoleImage, type SkinPackId } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";

const MIN_PLAYERS = 8;

const strings = {
  pt: {
    open: "Só gerar personagens",
    title: "Gerar personagens",
    players: "Número de jogadores",
    advanced: "Incluir personagens avançadas",
    generate: "Gerar",
    regenerate: "Gerar de novo",
    copyAllRich: "Copiar tudo com imagens",
    copyAllText: "Copiar tudo em texto",
    copyRich: "Copiar imagem + texto",
    copyText: "Copiar texto",
    copied: "Copiado",
    copiedFallback: "Texto copiado",
    empty: "As personagens geradas aparecem aqui.",
    invalid: "Insere pelo menos 8 jogadores.",
    player: (index: number) => `Jogador ${index}`,
    message: (id: RoleId, name: string) => `O teu personagem é ${id}.${name}`,
  },
  fr: {
    open: "Seulement générer les personnages",
    title: "Générer les personnages",
    players: "Nombre de joueurs",
    advanced: "Inclure les personnages avancés",
    generate: "Générer",
    regenerate: "Générer à nouveau",
    copyAllRich: "Tout copier avec images",
    copyAllText: "Tout copier en texte",
    copyRich: "Copier image + texte",
    copyText: "Copier texte",
    copied: "Copié",
    copiedFallback: "Texte copié",
    empty: "Les personnages générés apparaissent ici.",
    invalid: "Entre au moins 8 joueurs.",
    player: (index: number) => `Joueur ${index}`,
    message: (id: RoleId, name: string) => `Ton personnage est ${id}.${name}`,
  },
};

export function CharacterGeneratorButton({ language }: { language: Language }) {
  const navigate = useNavigate();

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
      {strings[language].open}
    </Button>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function roleMessage(roleId: RoleId, language: Language): string {
  return strings[language].message(roleId, getRoleLabel(roleId, language));
}

function richPayload(roleId: RoleId, language: Language, skinPackId: SkinPackId): { html: string; text: string } {
  const label = getRoleLabel(roleId, language);
  const roleImage = resolveRoleImage(roleId, { skinPackId }).src;
  const text = roleMessage(roleId, language);
  const prefix = language === "fr" ? "Ton personnage est" : "O teu personagem é";
  const html = `
    <div style="display:flex;gap:12px;align-items:center;font-family:Georgia,'Times New Roman',serif;color:#2d231f;max-width:520px;">
      <img src="${escapeHtml(roleImage)}" alt="${escapeHtml(`${roleId}.${label}`)}" style="width:92px;height:92px;object-fit:contain;border-radius:12px;border:1px solid #7d2424;background:#211d19;">
      <div style="font-size:16px;line-height:1.35;">${escapeHtml(prefix)} <strong>${escapeHtml(`${roleId}.${label}`)}</strong></div>
    </div>
  `.trim();
  return { html, text };
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copyRich(html: string, text: string): Promise<boolean> {
  if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
    const htmlBlob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([text], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      }),
    ]);
    return true;
  }

  await copyText(text);
  return false;
}

function CharacterGeneratorModal({ open, onOpenChange, language }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
}) {
  const text = strings[language];
  const { skinPackId } = useSkinPack();
  const [playerCount, setPlayerCount] = useState("10");
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [roleIds, setRoleIds] = useState<RoleId[]>([]);
  const [status, setStatus] = useState(text.empty);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [rulebookRoleId, setRulebookRoleId] = useState<RoleId | null>(null);

  const payloads = useMemo(() => roleIds.map((roleId) => richPayload(roleId, language, skinPackId)), [roleIds, language, skinPackId]);

  const markCopied = (key: string, label: string) => {
    setCopiedKey(key);
    setStatus(label);
    window.setTimeout(() => setCopiedKey((current) => current === key ? null : current), 1300);
  };

  const generate = () => {
    const count = Number.parseInt(playerCount, 10);
    if (!Number.isInteger(count) || count < MIN_PLAYERS) {
      setRoleIds([]);
      setStatus(text.invalid);
      return;
    }

    setRoleIds(assignRoles(count, advancedEnabled));
    setStatus("");
  };

  const changeRole = (index: number, roleId: RoleId) => {
    setRoleIds((current) => current.map((value, i) => i === index ? roleId : value));
  };

  const openRulebook = (roleId: RoleId) => {
    setRulebookRoleId(roleId);
    setRulebookOpen(true);
  };

  const copyAllText = async () => {
    const plain = payloads.map((payload) => payload.text).join("\n\n");
    await copyText(plain);
    markCopied("all-text", text.copied);
  };

  const copyAllRich = async () => {
    const html = `<div>${payloads.map((payload) => payload.html).join("<br><br>")}</div>`;
    const plain = payloads.map((payload) => payload.text).join("\n\n");
    const rich = await copyRich(html, plain);
    markCopied("all-rich", rich ? text.copied : text.copiedFallback);
  };

  return (
    <LanguageContext.Provider value={language}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-6xl gap-4 border-border bg-background p-0 sm:rounded-lg md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)]">
          <DialogHeader className="border-b border-border px-4 py-3 sm:px-6">
            <DialogTitle className="font-display text-xl text-gradient-blood">
              {text.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] gap-4 px-4 pb-4 sm:px-6">
            <div className="grid gap-3 rounded-lg border border-border/60 bg-card/60 p-3 md:grid-cols-[minmax(120px,160px)_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="character-count" className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  {text.players}
                </Label>
                <Input
                  id="character-count"
                  type="number"
                  min={MIN_PLAYERS}
                  step={1}
                  value={playerCount}
                  onChange={(event) => setPlayerCount(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") generate();
                  }}
                  className="h-10 bg-secondary"
                />
              </div>

              <label className="flex items-center gap-2 rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={advancedEnabled}
                  onCheckedChange={(checked) => setAdvancedEnabled(checked === true)}
                  className="h-4 w-4 border-primary data-[state=checked]:bg-primary"
                />
                <span>{text.advanced}</span>
              </label>

              <Button type="button" onClick={generate} className="h-10 font-display tracking-wider">
                <Shuffle className="mr-2 h-4 w-4" />
                {roleIds.length > 0 ? text.regenerate : text.generate}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-sm ${status === text.invalid ? "text-destructive" : "text-muted-foreground"}`}>
                {status || `${roleIds.length} ${language === "fr" ? "messages prêts" : "mensagens prontas"}.`}
              </p>
              {roleIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={copyAllRich}>
                    <Images className="mr-2 h-4 w-4" />
                    {copiedKey === "all-rich" ? text.copied : text.copyAllRich}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={copyAllText}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copiedKey === "all-text" ? text.copied : text.copyAllText}
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="min-h-0">
              {roleIds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                  {text.empty}
                </div>
              ) : (
                <div className="grid gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-3">
                  {roleIds.map((roleId, index) => {
                    const label = getRoleLabel(roleId, language);
                    const payload = payloads[index];
                    const keyPrefix = `${index}-${roleId}`;
                    const roleImage = resolveRoleImage(roleId, { skinPackId }).src;

                    return (
                      <article key={`${index}-${roleId}`} className="grid gap-3 rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-gold/10 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-gold">
                            {text.player(index + 1)}
                          </span>
                          <span className="font-display text-xs uppercase tracking-wider text-primary">{roleId}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openRulebook(roleId)}
                            className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-primary/40 bg-secondary"
                          >
                            <img src={roleImage} alt={label} className="h-full w-full object-cover" />
                          </button>
                          <div className="min-w-0 flex-1 space-y-2">
                            <h3 className="truncate font-display text-lg text-foreground">{label}</h3>
                            <RoleSelector value={roleId} onChange={(nextRole) => changeRole(index, nextRole)} advancedEnabled={advancedEnabled} />
                          </div>
                        </div>

                        <p className="rounded-md border border-border/50 bg-secondary/50 p-2 font-mono text-xs text-foreground">
                          {payload.text}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              const rich = await copyRich(payload.html, payload.text);
                              markCopied(`${keyPrefix}-rich`, rich ? text.copied : text.copiedFallback);
                            }}
                          >
                            <Images className="mr-2 h-4 w-4" />
                            {copiedKey === `${keyPrefix}-rich` ? text.copied : text.copyRich}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              await copyText(payload.text);
                              markCopied(`${keyPrefix}-text`, text.copied);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {copiedKey === `${keyPrefix}-text` ? text.copied : text.copyText}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <RulebookModal
        open={rulebookOpen}
        onOpenChange={setRulebookOpen}
        language={language}
        roleId={rulebookRoleId}
      />
    </LanguageContext.Provider>
  );
}
