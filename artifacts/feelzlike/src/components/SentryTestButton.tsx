import { useState } from "react";

export function SentryTestButton() {
  const [sent, setSent] = useState<null | "ok" | "err">(null);

  if (import.meta.env.PROD) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "rgba(17,24,39,0.92)",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 8,
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: 12,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ opacity: 0.7, fontWeight: 600 }}>Sentry test (dev only)</div>
      <button
        onClick={() => {
          throw new Error("Sentry test: client throw from feelzlike");
        }}
        style={{
          background: "#dc2626",
          color: "#fff",
          border: 0,
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Throw client error
      </button>
      <button
        onClick={async () => {
          try {
            const res = await fetch(
              `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/__sentry-test`,
              { method: "POST" },
            );
            setSent(res.ok ? "ok" : "err");
          } catch {
            setSent("err");
          }
        }}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: 0,
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Trigger server error
      </button>
      {sent === "ok" && <div style={{ color: "#86efac" }}>server hit ok</div>}
      {sent === "err" && (
        <div style={{ color: "#fca5a5" }}>server request failed</div>
      )}
    </div>
  );
}
