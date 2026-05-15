import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import WebSocket from "ws";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const port = Number(process.env.E2E_PORT || 4897);
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "webshell-e2e-"));
let cookie = "";

const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    WEBSHELL_DATA_DIR: dataDir,
    WEBSHELL_USERNAME: "e2e",
    WEBSHELL_PASSWORD: "e2e-password"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const req = http.request({
      host: "127.0.0.1",
      port,
      path: pathname,
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let text = "";
      if (res.headers["set-cookie"]) {
        cookie = res.headers["set-cookie"].map((value) => value.split(";")[0]).join("; ");
      }
      res.on("data", (chunk) => {
        text += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode} ${text}`));
          return;
        }
        resolve(text ? JSON.parse(text) : {});
      });
    });
    req.on("error", reject);
    req.end(payload);
  });
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port, path: "/login.html", method: "GET" }, (res) => {
          res.resume();
          res.on("end", () => {
            if (res.statusCode === 200) resolve();
            else reject(new Error(`unexpected status ${res.statusCode}`));
          });
        });
        req.on("error", reject);
        req.end();
      });
      return;
    } catch {
      await wait(150);
    }
  }
  throw new Error("server did not become ready");
}

try {
  await waitForServer();
  await request("POST", "/api/login", { username: "e2e", password: "e2e-password" });
  const session = await request("POST", "/api/sessions", { title: "e2e" });

  let output = "";
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Cookie: cookie } });
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "terminal:output" || msg.type === "terminal:snapshot") {
      output += msg.data || "";
    }
  });

  ws.send(JSON.stringify({ type: "terminal:attach", sessionId: session.id }));
  await wait(300);
  ws.send(JSON.stringify({ type: "terminal:input", sessionId: session.id, data: "echo WEBSHELL_E2E_OK 中文\r" }));
  await wait(900);

  if (!output.includes("WEBSHELL_E2E_OK") || !output.includes("中文")) {
    throw new Error(`missing expected terminal output: ${JSON.stringify(output.slice(-500))}`);
  }

  await request("POST", `/api/sessions/${session.id}/stop`, {});
  await wait(200);
  const state = await request("GET", "/api/state");
  if (state.sessions.length !== 0) {
    throw new Error("closed session still listed");
  }

  ws.close();
  console.log(JSON.stringify({ ok: true }, null, 2));
} finally {
  server.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
