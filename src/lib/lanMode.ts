import type { Language } from "@/lib/i18n";

export type LanConfig = { joinBaseUrl: string; host: boolean };
declare global {
  interface Window { __WOTCT_LAN__?: LanConfig }
}

export const getLanConfig = () => typeof window === "undefined" ? undefined : window.__WOTCT_LAN__;

export const lanText: Record<Language, { mode: string; start: string; pin: string; unlock: string; error: string }> = {
  en: { mode: "Offline LAN · same network", start: "Start LAN game", pin: "GM PIN shown in the server window", unlock: "Enable GM access", error: "Unable to connect or incorrect GM PIN." },
  fr: { mode: "LAN hors ligne · même réseau", start: "Démarrer une partie LAN", pin: "Code MJ affiché dans la fenêtre du serveur", unlock: "Activer l’accès MJ", error: "Connexion impossible ou code MJ incorrect." },
  pt: { mode: "LAN offline · mesma rede", start: "Iniciar jogo LAN", pin: "PIN do mestre mostrado na janela do servidor", unlock: "Ativar acesso de mestre", error: "Não foi possível ligar ou o PIN está incorreto." },
};

export async function unlockLanHost(pin: string) {
  try {
    const response = await fetch("/api/lan/host", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }),
    });
    if (!response.ok) return false;
    getLanConfig()!.host = true;
    return true;
  } catch { return false; }
}

const isGameStorageKey = (key: string) => /^wotct_(gm_snapshot_|phone_|runtime_)/.test(key);

/** Restore host backups before hooks read localStorage. Player identities stay on their own devices. */
export async function prepareLanStorage() {
  if (!getLanConfig()?.host) return;
  try {
    const response = await fetch("/api/lan/snapshots");
    if (!response.ok) throw new Error("Cannot restore LAN snapshots");
    const snapshots = await response.json() as Record<string, string>;
    for (const [key, value] of Object.entries(snapshots)) {
      if (isGameStorageKey(key) && localStorage.getItem(key) === null) localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error("LAN snapshot restore failed; retaining browser state.", error);
  }
  let previous = "";
  let pending = false;
  const backup = async () => {
    if (pending) return;
    const roomId = window.location.pathname.match(/^\/(?:gm|host)\/([^/]+)\/?$/)?.[1];
    if (!roomId) return;
    const snapshots: Record<string, string> = {};
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)!;
      if (isGameStorageKey(key) && key.endsWith(`_${roomId}`)) snapshots[key] = localStorage.getItem(key)!;
    }
    const body = JSON.stringify(snapshots);
    if (body === previous) return;
    pending = true;
    try {
      const response = await fetch("/api/lan/snapshots", {
        method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60_000,
      });
      if (response.ok) previous = body;
    } catch { /* Retry on the next interval after a server restart. */ }
    finally { pending = false; }
  };
  window.setInterval(() => void backup(), 2000);
  window.addEventListener("pagehide", () => void backup());
}
