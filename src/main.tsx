import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";
import { getLanConfig, prepareLanStorage } from "@/lib/lanMode";
import { blockImplicitImageDrag, findExplicitDraggableTarget } from "@/lib/touchDragDrop";

// Use the same explicit drag sources on touch and mouse. A short hold keeps
// ordinary taps responsive and lets a vertical swipe scroll before drag starts.
polyfill({
  holdToDrag: 250,
  dragImageCenterOnTouch: true,
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
  tryFindDraggableTarget: findExplicitDraggableTarget,
});
document.addEventListener("dragstart", blockImplicitImageDrag, true);

async function mount() {
  if (getLanConfig() && "serviceWorker" in navigator) {
    // A previous hosted preview on this origin may have left a worker that caches streams.
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    if (registrations.length && navigator.serviceWorker.controller) { window.location.reload(); return; }
  }
  await prepareLanStorage();
  createRoot(document.getElementById("root")!).render(<App />);
}
void mount();

if ("serviceWorker" in navigator && import.meta.env.PROD && !getLanConfig()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Failed to register service worker.", error);
    });
  });
}
