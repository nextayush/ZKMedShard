import fs from "fs";
import { PATHS } from "./paths.js";

function rm(p) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

try {
  rm(PATHS.artifactsDir);
  console.log("🧹 Cleaned artifacts/");

  // keep ptau and inputs
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
