import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authPaths, writeAuthFile } from "../lib/auth.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { authPath } = authPaths(root);
const username = process.env.WEBSHELL_USERNAME || process.argv[2] || "admin";
const password = process.env.WEBSHELL_PASSWORD || process.argv[3];

if (!password) {
  console.error("WEBSHELL_PASSWORD is required. Example: WEBSHELL_PASSWORD='new-secret' npm run reset-password");
  process.exit(1);
}

writeAuthFile(authPath, username, password);

try {
  const auth = JSON.parse(fs.readFileSync(authPath, "utf8"));
  auth.sessions = {};
  fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
} catch {
  // The file was just written. If this fails, startup will report the parse error.
}

console.log(`Reset Webshell credentials for "${username}" at ${authPath}`);
console.log("Browser login sessions have been cleared. Restart the server if it is already running.");
