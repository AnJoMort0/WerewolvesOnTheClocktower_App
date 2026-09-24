import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GMPlayerActionApprovalPanel } from "@/components/game/GMPlayerActionApprovalPanel";

describe("GM player-action approval panel", () => {
  it("is an inline panel with working approval controls", () => {
    const onAccept = vi.fn();
    render(<div><div data-testid="circle">circle</div><GMPlayerActionApprovalPanel
      title="Request" description="Angel chose Alex" acceptLabel="Accept" denyLabel="Deny" closeLabel="Close"
      resolved={false} onAccept={onAccept} onDeny={vi.fn()} onClose={vi.fn()} /></div>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("circle")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalledOnce();
  });
});
