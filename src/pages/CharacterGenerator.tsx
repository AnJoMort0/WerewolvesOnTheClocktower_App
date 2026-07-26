import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, BookOpen, Copy, Images, RotateCcw, Shuffle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelector } from "@/components/game/RoleSelector";
import { SkinPackSelectButton } from "@/components/game/SkinPackSelector";
import { LanguageContext, coerceLanguage, format, getRoleLabel, getTranslation, t, type Language } from "@/lib/i18n";
import { RULEBOOK_NIGHT_SCRIPT, type RulebookNightPhase } from "@/lib/rulebookContent";
import { assignRoles, type RoleId } from "@/lib/roles";
import { autoFixRoleSelection, validateRoleSelection } from "@/lib/roleValidation";
import { resolveRoleImage, type SkinPackId } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";

const MIN_PLAYERS = 8;

const phaseOrder: RulebookNightPhase[] = ["firstNight", "secondNight", "normalNight"];

function getInitialLanguage(searchLanguage: string | null): Language {
  if (searchLanguage) return coerceLanguage(searchLanguage);
  const stored = typeof window === "undefined" ? null : window.localStorage.getItem("preferred_language");
  return coerceLanguage(stored);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rulebookUrl(roleId: RoleId, language: Language): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/rulebook/${roleId}?lang=${language}`;
}

function richPayload(roleId: RoleId, language: Language, skinPackId: SkinPackId): { html: string; text: string } {
  const label = getRoleLabel(roleId, language);
  const roleImage = resolveRoleImage(roleId, { skinPackId }).src;
  const url = rulebookUrl(roleId, language);
  const copy = getTranslation(language).ui.characterGenerator;
  const text = format(copy.messageWithRulebook, { id: roleId, name: label, url });
  const prefix = copy.richMessagePrefix;
  const linkLabel = copy.rulebook;
  const html = `
    <div style="display:flex;gap:12px;align-items:center;font-family:Georgia,'Times New Roman',serif;color:#2d231f;max-width:560px;">
      <img src="${escapeHtml(roleImage)}" alt="${escapeHtml(`${roleId}.${label}`)}" style="width:92px;height:92px;object-fit:contain;border-radius:12px;border:1px solid #7d2424;background:#211d19;">
      <div style="font-size:16px;line-height:1.35;">
        ${escapeHtml(prefix)} <strong>${escapeHtml(`${roleId}.${label}`)}</strong><br>
        <a href="${escapeHtml(url)}">${escapeHtml(linkLabel)}</a>
      </div>
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

export default function CharacterGeneratorPage() {
  const [searchParams] = useSearchParams();
  const [language] = useState<Language>(() => getInitialLanguage(searchParams.get("lang")));
  const { skinPackId } = useSkinPack();
  const text = getTranslation(language).ui.characterGenerator;
  const [playerCount, setPlayerCount] = useState("10");
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [roleIds, setRoleIds] = useState<RoleId[]>([]);
  const [status, setStatus] = useState(text.empty);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<RulebookNightPhase>("firstNight");
  const [completedLines, setCompletedLines] = useState<Set<string>>(new Set());
  const [lockedLines, setLockedLines] = useState<Set<string>>(new Set());

  const payloads = useMemo(() => roleIds.map((roleId) => richPayload(roleId, language, skinPackId)), [roleIds, language, skinPackId]);
  const warnings = useMemo(() => roleIds.length > 0 ? validateRoleSelection(roleIds, language) : [], [roleIds, language]);
  const activeRoles = useMemo(() => new Set(roleIds), [roleIds]);
  const scriptLines = useMemo(() => {
    return RULEBOOK_NIGHT_SCRIPT[phase].filter((line) => {
      return line.refs.some((ref) => ref === "general" || activeRoles.has(ref));
    });
  }, [activeRoles, phase]);

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
      setCompletedLines(new Set());
      setLockedLines(new Set());
      return;
    }

    setRoleIds(assignRoles(count, advancedEnabled));
    setStatus("");
    setCompletedLines(new Set());
    setLockedLines(new Set());
  };

  const changeRole = (index: number, roleId: RoleId) => {
    setRoleIds((current) => current.map((value, i) => i === index ? roleId : value));
  };

  const fixWarnings = () => {
    setRoleIds((current) => autoFixRoleSelection(current));
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

  const toggleLine = (lineId: string, checked: boolean) => {
    setCompletedLines((current) => {
      const next = new Set(current);
      if (checked) next.add(lineId);
      else next.delete(lineId);
      return next;
    });
  };

  const toggleLockedLine = (lineId: string, checked: boolean) => {
    setLockedLines((current) => {
      const next = new Set(current);
      if (checked) next.add(lineId);
      else next.delete(lineId);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={language}>
      <main className="min-h-screen bg-background px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("backHome", language)}
                </Link>
              </Button>
              <div>
                <h1 className="font-display text-3xl font-bold text-gradient-blood sm:text-4xl">{text.title}</h1>
                <p className="max-w-3xl text-muted-foreground">{text.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkinPackSelectButton language={language} />
              <Button asChild variant="outline" size="sm">
                <Link to={`/rulebook?lang=${language}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t("rulebook", language)}
                </Link>
              </Button>
            </div>
          </header>

          <section className="grid gap-3 rounded-lg border border-border/60 bg-card/60 p-3 md:grid-cols-[minmax(140px,180px)_1fr_auto] md:items-end">
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
          </section>

          <section className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-sm ${status === text.invalid ? "text-destructive" : "text-muted-foreground"}`}>
              {status || format(text.ready, { count: roleIds.length })}
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
          </section>

          {warnings.length > 0 && (
            <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {text.warnings}
                  </h2>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                    {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={fixWarnings}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {text.autoFix}
                </Button>
              </div>
            </section>
          )}

          {roleIds.length === 0 ? (
            <section className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {text.empty}
            </section>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {roleIds.map((roleId, index) => {
                  const label = getRoleLabel(roleId, language);
                  const payload = payloads[index];
                  const keyPrefix = `${index}-${roleId}`;
                  const url = rulebookUrl(roleId, language);
                  const roleImage = resolveRoleImage(roleId, { skinPackId }).src;

                  return (
                    <article key={`${index}-${roleId}`} className="grid gap-3 rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-gold/10 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-gold">
                          {format(text.player, { index: index + 1 })}
                        </span>
                        <span className="font-display text-xs uppercase tracking-wider text-primary">{roleId}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/rulebook/${roleId}?lang=${language}`}
                          className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-primary/40 bg-secondary"
                          title={text.rulebook}
                        >
                          <img src={roleImage} alt={label} className="h-full w-full object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1 space-y-2">
                          <h3 className="truncate font-display text-lg text-foreground">{label}</h3>
                          <RoleSelector value={roleId} onChange={(nextRole) => changeRole(index, nextRole)} advancedEnabled={advancedEnabled} />
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap rounded-md border border-border/50 bg-secondary/50 p-2 font-mono text-xs text-foreground">
                        {payload.text}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={url} target="_blank" rel="noreferrer">
                            <BookOpen className="mr-2 h-4 w-4" />
                            {text.rulebook}
                          </a>
                        </Button>
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
              </section>

              <section className="rounded-lg border border-border bg-card p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl text-gradient-blood">{text.scriptTitle}</h2>
                  <div className="flex flex-wrap gap-2">
                    {phaseOrder.map((phaseId) => (
                      <Button
                        key={phaseId}
                        type="button"
                        variant={phase === phaseId ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setPhase(phaseId)}
                      >
                        {text[phaseId]}
                      </Button>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setCompletedLines(new Set())}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {text.clearScript}
                    </Button>
                  </div>
                </div>

                {scriptLines.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-center text-muted-foreground">
                    {text.noScriptLines}
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {scriptLines.map((line) => {
                      const checked = completedLines.has(line.id);
                      const locked = lockedLines.has(line.id);
                      const lineDone = checked || locked;
                      return (
                        <li
                          key={line.id}
                          className="grid grid-cols-[auto_auto_1fr] gap-3 rounded-md border border-border/60 bg-secondary/45 p-3 text-sm leading-relaxed"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => toggleLine(line.id, next === true)}
                            title={text.clearScript}
                            aria-label={text.clearScript}
                            className="mt-0.5 h-5 w-5 border-primary data-[state=checked]:bg-primary"
                          />
                          <Checkbox
                            checked={locked}
                            onCheckedChange={(next) => toggleLockedLine(line.id, next === true)}
                            title={text.permanentScriptLine}
                            aria-label={text.permanentScriptLine}
                            className="mt-0.5 h-5 w-5 border-destructive data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
                          />
                          <span className={lineDone ? "text-muted-foreground line-through" : ""}>
                            {line.text[language]}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </LanguageContext.Provider>
  );
}
