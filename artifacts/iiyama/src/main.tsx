import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.name === "AbortError" ||
    event.reason?.message === "signal is aborted without reason"
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
