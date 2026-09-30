import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TravellerAlignmentModal } from "@/components/game/TravellerAlignmentModal";
import evilBeingIcon from "@/assets/display/icons/evil_being.webp";
import villagerIcon from "@/assets/display/icons/villager.webp";

const players = Array.from({ length: 16 }, (_, index) => ({
  id: `player-${index}`,
  name: `Player ${index}`,
  isWerewolf: index < 4,
  isAlive: true,
}));

describe("TravellerAlignmentModal", () => {
  it("uses the alignment artwork and keeps the evil circle within the modal", () => {
    const { getByAltText, getByText, rerender } = render(<TravellerAlignmentModal
      open
      language="en"
      alignment="evil"
      roleId="t01"
      players={players}
      onAcknowledge={() => undefined}
    />);

    expect(getByAltText("Evil Being")).toHaveAttribute("src", evilBeingIcon);
    const circle = getByText("The Werewolves are marked below.").nextElementSibling;
    expect(circle).toHaveClass("w-full", "max-w-[300px]", "overflow-hidden");
    expect(circle?.parentElement?.parentElement).toHaveClass("overflow-x-hidden");

    rerender(<TravellerAlignmentModal
      open
      language="en"
      alignment="villager"
      roleId="t01"
      players={players}
      onAcknowledge={() => undefined}
    />);
    expect(getByAltText("Villager")).toHaveAttribute("src", villagerIcon);
  });
});
