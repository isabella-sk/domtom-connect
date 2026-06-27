import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Définir la langue pour RGAA/accessibilité
document.documentElement.lang = "fr";

// Meta description SEO
const meta = document.createElement("meta");
meta.name = "description";
meta.content =
  "DOM-TOM Connect - La plateforme communautaire pour toutes personnes originaires des territoires d'outre-mer qui s'installent en France métropolitaine. Guides administratifs, bons plans, alertes arnaques, carte.";
document.head.appendChild(meta);

// Meta viewport (sécurité responsive)
const viewport = document.querySelector('meta[name="viewport"]');
if (!viewport) {
  const vp = document.createElement("meta");
  vp.name = "viewport";
  vp.content = "width=device-width, initial-scale=1";
  document.head.appendChild(vp);
}

// Open Graph
const ogTitle = document.createElement("meta");
ogTitle.setAttribute("property", "og:title");
ogTitle.content = "DOM-TOM Connect";
document.head.appendChild(ogTitle);

const ogDesc = document.createElement("meta");
ogDesc.setAttribute("property", "og:description");
ogDesc.content =
  "La plateforme pour les étudiants ultramarins en France métropolitaine.";
document.head.appendChild(ogDesc);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
