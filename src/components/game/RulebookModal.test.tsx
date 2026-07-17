import { fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RulebookModal } from "@/components/game/RulebookModal";
import { SkinPackProvider } from "@/components/game/SkinPackProvider";

describe("RulebookModal", () => {
  it("updates generated rulebook skin previews inside the modal", async () => {
    HTMLElement.prototype.scrollTo = vi.fn();

    render(
      <MemoryRouter initialEntries={["/play/test-room"]}>
        <SkinPackProvider>
          <RulebookModal open onOpenChange={vi.fn()} language="pt" />
        </SkinPackProvider>
      </MemoryRouter>,
    );

    const select = await waitFor(() => {
      const element = document.querySelector<HTMLSelectElement>('select[data-rulebook-skin-select="a02"]');
      expect(element).toBeInTheDocument();
      return element!;
    });
    const thiercelieuxOption = Array.from(select.options).find((option) => option.value === "thiercelieux");
    expect(thiercelieuxOption?.dataset.previewImage).toBeTruthy();

    fireEvent.change(select, { target: { value: "thiercelieux" } });

    await waitFor(() => {
      const image = document.querySelector<HTMLImageElement>('img[data-rulebook-role-image="a02"]');
      expect(image?.getAttribute("src")).toBe(thiercelieuxOption?.dataset.previewImage);
    });
  });
});
