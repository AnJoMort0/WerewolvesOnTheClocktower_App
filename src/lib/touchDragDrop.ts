/**
 * Find only drag sources that the game explicitly enables.
 * Images are draggable by default in browsers, which made role artwork behave
 * like a game action on touch screens. Checking the HTML attribute rather than
 * the DOM `draggable` property excludes that browser default while retaining
 * every drag source shared with the mouse interface.
 */
export function findExplicitDraggableTarget(event: Pick<TouchEvent, "target">): HTMLElement | undefined {
  // holdToDrag invokes this after touchstart dispatch. composedPath() is empty
  // by then, while target still identifies the touched image/card.
  const target = event.target;
  return target instanceof Element
    ? (target.closest('[draggable="true"]') as HTMLElement | null) ?? undefined
    : undefined;
}

/** Stop the browser from starting its own image drag outside a game action. */
export function blockImplicitImageDrag(event: DragEvent): void {
  const target = event.target;
  if (target instanceof HTMLImageElement && !target.closest('[draggable="true"]')) {
    event.preventDefault();
  }
}

/** A long press on a game drag source must not open the browser's image menu. */
export function blockDragSourceContextMenu(event: MouseEvent): void {
  const target = event.target;
  if (target instanceof Element && target.closest('[draggable="true"]')) {
    event.preventDefault();
  }
}
