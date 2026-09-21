const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,6}$/;

export type RoomQrDestination = {
  code: string;
  href: string;
};

/** Accept a room code or one of the app's /join QR links, including LAN links. */
export function parseRoomQrDestination(value: string, currentOrigin: string): RoomQrDestination | null {
  const trimmed = value.trim();
  const plainCode = trimmed.toUpperCase();
  if (ROOM_CODE_PATTERN.test(plainCode)) {
    return { code: plainCode, href: `${currentOrigin}/join/${plainCode}` };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const match = url.pathname.match(/(?:^|\/)join(?:\/([A-Z0-9]{4,6}))?\/?$/i);
    if (!match) return null;
    const code = (match[1] ?? url.searchParams.get("room") ?? "").toUpperCase();
    if (!ROOM_CODE_PATTERN.test(code)) return null;
    return { code, href: url.toString() };
  } catch {
    return null;
  }
}
