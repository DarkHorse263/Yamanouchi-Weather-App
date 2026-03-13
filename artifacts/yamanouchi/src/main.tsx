import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// AbortErrors are benign — they happen when a fetch is cancelled because the
// user navigated away before it completed. Suppress them so the dev overlay
// doesn't show a false alarm.
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.name === "AbortError" ||
    event.reason?.message === "signal is aborted without reason"
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
