// Backwards-compat re-exports. Use @/lib/i18n directly for multi-language support.
import { pt } from "@/lib/i18n/pt";
import type { RoleId } from "./roles";
import type { ScriptLine } from "@/lib/i18n/types";

export type { ScriptLine };

export const firstNightScript: ScriptLine[] = pt.scripts.firstNight;
export const secondNightScript: ScriptLine[] = pt.scripts.secondNight;
export const normalNightScript: ScriptLine[] = pt.scripts.normalNight;

/** Render script text with character names wrapped in blue spans. */
export function parseScriptText(text: string): { segments: Array<{ text: string; isRole: boolean }> } {
  const segments: Array<{ text: string; isRole: boolean }> = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isRole: false });
    }
    segments.push({ text: match[1], isRole: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isRole: false });
  }

  return { segments };
}

export function getScriptOrderIndex(roleId: RoleId): number {
  for (let i = 0; i < normalNightScript.length; i++) {
    const line = normalNightScript[i];
    if (line.requires?.includes(roleId)) return i;
  }
  return normalNightScript.length;
}
