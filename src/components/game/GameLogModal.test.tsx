import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameLogModal } from "./GameLogModal";
import { LanguageContext } from "@/lib/i18n";
import type { GameLogEvent, GameLogPlayerSnapshot } from "@/lib/gameLog";

const snapshot = (id: string, name: string, role: GameLogPlayerSnapshot["role"]): GameLogPlayerSnapshot => ({
  id,
  name,
  role,
  status: "alive",
  permanentlyDead: false,
  poisoned: false,
  illusion: false,
  effects: [],
});

describe("GameLogModal", () => {
  it("renders dense collapsible rows and filters them by clicked participants", () => {
    const witch = snapshot("witch", "Beatrice", "e02");
    const wolf = snapshot("wolf", "Alexandre", "e01");
    const events: GameLogEvent[] = [
      { id: "poison", createdAt: 1_700_000_000_000, phase: "night", phaseNumber: 1, action: "poison", actor: witch, target: wolf },
      { id: "kill", createdAt: 1_700_000_060_000, phase: "night", phaseNumber: 1, action: "kill", actor: wolf, target: witch },
    ];

    render(
      <LanguageContext.Provider value="en">
        <GameLogModal
          open
          onOpenChange={vi.fn()}
          language="en"
          events={events}
          players={[
            { id: "witch", name: "Beatrice", seat_position: 0, character: "e02", is_alive: true },
            { id: "wolf", name: "Alexandre", seat_position: 1, character: "e01", is_alive: true },
          ]}
          roleAssignments={{ witch: "e02", wolf: "e01" }}
          playerStatuses={{ witch: "alive", wolf: "alive" }}
          permanentlyDead={new Set()}
          playerEffects={{}}
          poisonedPlayerId={null}
          illusionPlayerId={null}
        />
      </LanguageContext.Provider>,
    );

    const details = document.querySelectorAll("details");
    expect(details[0]).not.toHaveAttribute("open");
    expect(details[1]).toHaveAttribute("open");
    expect(document.querySelector("[data-log-groups]")).toHaveClass("xl:grid-cols-2");
    expect(document.querySelectorAll("[data-log-row]")).toHaveLength(2);

    fireEvent.click(screen.getAllByTitle("Beatrice")[0]);
    expect(document.querySelector("[data-selected-player]")).toHaveTextContent("Highlighting: Beatrice");
    document.querySelectorAll("[data-log-row]").forEach((row) => expect(row).toHaveClass("bg-primary/10"));
  });
});
