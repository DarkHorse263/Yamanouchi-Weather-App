import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Separate from the app config: component tests need no server, secrets or plugins.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    include: ["tests/components/**/*.test.tsx"],
    restoreMocks: true,
  },
});