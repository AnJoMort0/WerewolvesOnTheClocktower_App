import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { polyfill } from "mobile-drag-drop";

// Enable HTML5 drag-and-drop on touch devices (tablets, phones)
polyfill({});

// Prevent default touch behaviour on draggable elements
window.addEventListener("touchmove", () => {}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
