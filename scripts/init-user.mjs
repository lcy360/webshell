import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authPaths, writeAuthFile } from "../lib/auth.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { authPath } = authPaths(root);
const username = process.env.WEBSHELL_USERNAME || process.argv[2] || "admin";
const password = process.env.WEBSHELL_PASSWORD || process.argv[3];

if (!password) {
  console.error("WEBSHELL_PASSWORD is required. Example: WEBSHELL_USERNAME=admin WEBSHELL_PASSWORD='secret' npm run init-user");
  process.exit(1);
}

if (fs.existsSync(authPath) && !process.argv.includes("--force")) {
  console.error(`Auth file already exists: ${authPath}`);
  console.error("Use npm run reset-password to replace credentials.");
  process.exit(1);
}

writeAuthFile(authPath, username, password);
console.log(`Initialized Webshell user "${username}" at ${authPath}`);
