import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function passwordHash(password, salt) {
  return crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
}

export function authPaths(rootDir) {
  const dataDir = process.env.WEBSHELL_DATA_DIR || path.join(rootDir, "data");
  return {
    dataDir,
    authPath: path.join(dataDir, "auth.json"),
    statePath: path.join(dataDir, "state.json")
  };
}

export function createAuthRecord(username, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    username: String(username || "admin"),
    salt,
    passwordHash: passwordHash(password, salt),
    sessions: {}
  };
}

export function writeAuthFile(authPath, username, password) {
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  fs.writeFileSync(authPath, JSON.stringify(createAuthRecord(username, password), null, 2));
}
