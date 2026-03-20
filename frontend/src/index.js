import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "@/index.css";
import App from "@/App";
import { register } from "./serviceWorkerRegistration";

// ─────────────────────────────────────────────
// Sentry — Monitoramento de erros em produção
// ─────────────────────────────────────────────
Sentry.init({
  dsn: "https://8097d35ce87e6cc34f8c26b5b74dbbb2@o4511075949674496.ingest.us.sentry.io/4511075957080064",
  environment: process.env.NODE_ENV,
  // Só envia erros em produção — não polui com erros de desenvolvimento
  enabled: process.env.NODE_ENV === "production",
  // Amostragem de performance — 10% das sessões
  tracesSampleRate: 0.1,
  // Não envia dados pessoais automaticamente
  sendDefaultPii: false,
  // Ignora erros comuns que não são bugs reais
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed",
    "Network request failed",
    "Failed to fetch",
    "Load failed",
  ],
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          minHeight: "100vh", gap: 16, padding: 24,
          fontFamily: "sans-serif", color: "#0F172A",
        }}>
          <img src="/icons/icon-96x96.png" alt="RepFlow" width={64} style={{ borderRadius: 12 }} />
          <h2 style={{ margin: 0, fontSize: 20 }}>Algo deu errado</h2>
          <p style={{ margin: 0, color: "#64748B", textAlign: "center" }}>
            O RepFlow encontrou um erro inesperado.<br />
            Nossa equipe já foi notificada automaticamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#1E40AF", color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 24px", fontSize: 14,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Recarregar o app
          </button>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Service Worker — PWA offline
register({
  onSuccess: () => console.log("[RepFlow PWA] Pronto para uso offline!"),
  onUpdate: () => console.log("[RepFlow PWA] Nova versão disponível."),
});