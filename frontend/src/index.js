import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { register } from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Registra o Service Worker com Workbox
// Funciona no iOS/Safari, Android/Chrome e desktop
register({
  onSuccess: () => console.log("[RepFlow PWA] Pronto para uso offline!"),
  onUpdate: () => console.log("[RepFlow PWA] Nova versão disponível."),
});