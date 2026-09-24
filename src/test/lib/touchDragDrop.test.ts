import { describe, expect, it, vi } from "vitest";
import { blockImplicitImageDrag, findExplicitDraggableTarget } from "@/lib/touchDragDrop";

describe("touch drag-and-drop", () => {
  it("does not treat the browser's default draggable image as a game drag source", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    container.append(image);

    expect(image.draggable).toBe(true);
    expect(findExplicitDraggableTarget({ composedPath: () => [image, container, document, window] })).toBeUndefined();
  });

  it("uses the nearest explicitly draggable game element", () => {
    const dragSource = document.createElement("div");
    dragSource.draggable = true;
    const image = document.createElement("img");
    dragSource.append(image);

    expect(findExplicitDraggableTarget({ composedPath: () => [image, dragSource, document, window] })).toBe(dragSource);
  });

  it("blocks native mouse dragging for a standalone image", () => {
    const image = document.createElement("img");
    const preventDefault = vi.fn();

    blockImplicitImageDrag({ target: image, preventDefault } as unknown as DragEvent);

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("keeps image gestures available to an explicitly draggable parent", () => {
    const dragSource = document.createElement("div");
    dragSource.draggable = true;
    const image = document.createElement("img");
    dragSource.append(image);
    const preventDefault = vi.fn();

    blockImplicitImageDrag({ target: image, preventDefault } as unknown as DragEvent);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
