const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"]);

export const normalizeJoinBaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

export const isLoopbackOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin);
    return LOOPBACK_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

export const getDefaultJoinBaseUrl = (origin: string, configuredBaseUrl?: string) => {
  const configured = normalizeJoinBaseUrl(configuredBaseUrl ?? "");
  if (configured) return configured;
  return normalizeJoinBaseUrl(origin);
};

export const buildJoinUrl = (roomCode: string, baseUrl: string) => {
  const base = normalizeJoinBaseUrl(baseUrl);
  return `${base}/join?room=${encodeURIComponent(roomCode.toUpperCase())}`;
};
