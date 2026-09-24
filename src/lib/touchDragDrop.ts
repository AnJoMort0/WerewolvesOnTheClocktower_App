/**
 * Find only drag sources that the game explicitly enables.
 *
 * Images are draggable by default in browsers, which made role artwork behave
 * like a game action on touch screens. Checking the HTML attribute rather than
 * the DOM `draggable` property excludes that browser default while retaining
 * every drag source shared with the mouse interface.
 */
export function findExplicitDraggableTarget(event: Pick<TouchEvent, "composedPath">): HTMLElement | undefined {
  return event.composedPath().find((target): target is HTMLElement =>
    target instanceof HTMLElement && target.getAttribute("draggable") === "true"
  );
}

/** Prevent the browser's native image drag unless an enabled game action owns it. */
export function blockImplicitImageDrag(event: DragEvent): void {
  const target = event.target;
  if (target instanceof HTMLImageElement && !target.closest('[draggable="true"]')) {
    event.preventDefault();
  }
}
