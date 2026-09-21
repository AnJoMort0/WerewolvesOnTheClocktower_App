import { describe, expect, it } from "vitest";
import { parseRoomQrDestination } from "@/lib/roomQr";

describe("room QR destinations", () => {
  it("accepts plain room codes and both supported join-link formats", () => {
    expect(parseRoomQrDestination("abcde", "https://game.example")).toEqual({
      code: "ABCDE",
      href: "https://game.example/join/ABCDE",
    });
    expect(parseRoomQrDestination("https://game.example/join/ABCDE", "https://game.example")).toEqual({
      code: "ABCDE",
      href: "https://game.example/join/ABCDE",
    });
    expect(parseRoomQrDestination("http://192.168.1.20:8080/join?room=ABCDE", "https://game.example")).toEqual({
      code: "ABCDE",
      href: "http://192.168.1.20:8080/join?room=ABCDE",
    });
  });

  it("rejects unrelated links and invalid room codes", () => {
    expect(parseRoomQrDestination("https://example.com/not-a-room?room=ABCDE", "https://game.example")).toBeNull();
    expect(parseRoomQrDestination("javascript:alert(1)", "https://game.example")).toBeNull();
    expect(parseRoomQrDestination("ABC", "https://game.example")).toBeNull();
  });
});
