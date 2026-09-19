import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { polyfill } from "mobile-drag-drop";
import { getLanConfig, prepareLanStorage } from "@/lib/lanMode";

// Enable HTML5 drag-and-drop on touch devices (tablets, phones)
polyfill({});

// Prevent default touch behaviour on draggable elements
window.addEventListener("touchmove", () => {}, { passive: false });

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
