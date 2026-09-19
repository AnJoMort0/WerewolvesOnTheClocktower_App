import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SkinPackProvider } from "@/components/game/SkinPackProvider";
import RulebookPage from "@/pages/RulebookPage";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <SkinPackProvider>
      <RulebookPage standalone />
    </SkinPackProvider>
  </BrowserRouter>,
);
