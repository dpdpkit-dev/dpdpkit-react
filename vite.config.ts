import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@dpdpkit/client"],
    },
    sourcemap: true,
    target: "es2020",
  },
  // Unit tests only; e2e/ is run by Playwright (npm run e2e).
  test: { environment: "jsdom", globals: false, include: ["test/**/*.test.{ts,tsx}"] },
});
