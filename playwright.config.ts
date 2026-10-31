// Widget tests against a real backend: examples/fastapi_shop from a dpdpkit-fastapi checkout.
//   DPDPKIT_FASTAPI_DIR  path to the dpdpkit-fastapi checkout (default ../dpdpkit-fastapi)
//   DPDPKIT_PYTHON       Python with dpdpkit-fastapi installed (default python)
//   DPDPKIT_E2E_API_PORT / DPDPKIT_E2E_PORT   ports for the backend and the harness (18765 / 15174)
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const shop = resolve(process.env.DPDPKIT_FASTAPI_DIR ?? "../dpdpkit-fastapi", "examples/fastapi_shop");
const python = process.env.DPDPKIT_PYTHON ?? "python";
const db = join(tmpdir(), `dpdpkit-e2e-${Date.now()}.db`).replaceAll("\\", "/");
const apiPort = process.env.DPDPKIT_E2E_API_PORT ?? "18765";
const port = process.env.DPDPKIT_E2E_PORT ?? "15174";
const api = `http://127.0.0.1:${apiPort}`;
const harness = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: harness, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `"${python}" -m uvicorn app:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: shop,
      env: { DATABASE_URL: `sqlite:///${db}`, PYTHONIOENCODING: "utf-8" },
      url: `${api}/dpdp/notices/current`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --config e2e/vite.config.ts --host 127.0.0.1 --port ${port} --strictPort`,
      env: { DPDPKIT_E2E_API: api },
      url: harness,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
