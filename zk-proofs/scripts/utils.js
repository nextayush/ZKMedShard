// Cross-platform helpers to spawn CLI tools and ensure dirs exist.
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function assertExists(p, msg = `Missing file: ${p}`) {
  if (!fs.existsSync(p)) throw new Error(msg);
}

export function here(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname };
}
