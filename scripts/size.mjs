// Bundle-size budget: fails when a built file grows past its gzip limit.
// Raise a limit only on purpose, in the same PR as the change that needs it.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgets = {
  "dist/index.js": 6, // kB gzip; 4.5 kB at 0.1.0-alpha.1
  "dist/index.cjs": 6,
  "dist/styles.css": 2,
};

let failed = false;
for (const [file, limitKb] of Object.entries(budgets)) {
  const kb = gzipSync(readFileSync(file), { level: 9 }).length / 1024;
  const ok = kb <= limitKb;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${file}: ${kb.toFixed(2)} kB gzip (budget ${limitKb} kB)`);
}
process.exit(failed ? 1 : 0);
