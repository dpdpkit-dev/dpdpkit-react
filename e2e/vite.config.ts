import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const api = process.env.DPDPKIT_E2E_API ?? "http://127.0.0.1:18765";

export default defineConfig({
  root: fileURLToPath(new URL("./harness", import.meta.url)),
  plugins: [react()],
  server: { proxy: { "/dpdp": api, "/offers": api } },
});
