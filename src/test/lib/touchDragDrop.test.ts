import { describe, expect, it, vi } from "vitest";
import { blockDragSourceContextMenu, blockImplicitImageDrag, findExplicitDraggableTarget } from "@/lib/touchDragDrop";

describe("touch drag-and-drop", () => {
  it("does not treat the browser's default draggable image as a game drag source", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    container.append(image);

    expect(image.draggable).toBe(true);
    expect(findExplicitDraggableTarget({ target: image })).toBeUndefined();
  });

  it("uses the nearest explicitly draggable game element", () => {
    const dragSource = document.createElement("div");
    dragSource.draggable = true;
    const image = document.createElement("img");
    dragSource.append(image);

    expect(findExplicitDraggableTarget({ target: image })).toBe(dragSource);
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

  it("suppresses the long-press menu only on an enabled drag source", () => {
    const dragSource = document.createElement("div");
    dragSource.draggable = true;
    const image = document.createElement("img");
    dragSource.append(image);
    const preventDefault = vi.fn();

    blockDragSourceContextMenu({ target: image, preventDefault } as unknown as MouseEvent);
    expect(preventDefault).toHaveBeenCalledOnce();

    preventDefault.mockClear();
    blockDragSourceContextMenu({ target: document.createElement("img"), preventDefault } as unknown as MouseEvent);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
