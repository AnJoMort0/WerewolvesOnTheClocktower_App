import { describe, expect, it } from "vitest";
import { buildJoinUrl, getDefaultJoinBaseUrl, isLoopbackOrigin, normalizeJoinBaseUrl } from "./joinUrl";

describe("join URL helpers", () => {
  it("normalizes trailing slashes and strips query/hash from the base URL", () => {
    expect(normalizeJoinBaseUrl("https://example.pages.dev/game/?x=1#top")).toBe("https://example.pages.dev/game");
  });

  it("builds QR-friendly join links with room query parameters", () => {
    expect(buildJoinUrl("abc12", "https://example.pages.dev/")).toBe("https://example.pages.dev/join?room=ABC12");
  });

  it("prefers an explicit public app URL over the current browser origin", () => {
    expect(getDefaultJoinBaseUrl("http://localhost:8080", "https://example.pages.dev")).toBe("https://example.pages.dev");
  });

  it("detects loopback origins that should not be used by player phones", () => {
    expect(isLoopbackOrigin("http://localhost:8080")).toBe(true);
    expect(isLoopbackOrigin("http://10.0.0.50:8080")).toBe(false);
  });
});
