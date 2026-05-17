import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import pty from "@homebridge/node-pty-prebuilt-multiarch";
import { authPaths, createAuthRecord, passwordHash } from "./lib/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4767);
const HOST = process.env.HOST || "127.0.0.1";
const { dataDir: DATA_DIR, statePath: DB_PATH, authPath: AUTH_PATH } = authPaths(__dirname);
const LIVE_BUFFER_LIMIT = 240_000;
const SNAPSHOT_REPLAY_LIMIT = Math.max(20_000, Number(process.env.WEBSHELL_SNAPSHOT_REPLAY_LIMIT || 80_000));
const OUTPUT_FLUSH_MS = Math.max(0, Number(process.env.WEBSHELL_OUTPUT_FLUSH_MS || 4));
const OUTPUT_FLUSH_BYTES = Math.max(1024, Number(process.env.WEBSHELL_OUTPUT_FLUSH_BYTES || 16_384));
const APP_VERSION = String(Date.now());

fs.mkdirSync(DATA_DIR, { recursive: true });

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureAuth() {
  if (fs.existsSync(AUTH_PATH)) return;

  const username = process.env.WEBSHELL_USERNAME || "admin";
  const generatedPassword = crypto.randomBytes(12).toString("base64url");
  const password = process.env.WEBSHELL_PASSWORD || generatedPassword;
  writeAuth(createAuthRecord(username, password));

  if (!process.env.WEBSHELL_PASSWORD) {
    console.log("");
    console.log("Webshell created an initial local account:");
    console.log(`  username: ${username}`);
    console.log(`  password: ${password}`);
    console.log("Set WEBSHELL_USERNAME and WEBSHELL_PASSWORD before first start to choose your own credentials.");
    console.log("");
  }
}

function readState() {
  if (!fs.existsSync(DB_PATH)) {
    return { projects: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : []
    };
  } catch {
    return { projects: [] };
  }
}

function readAuth() {
  return JSON.parse(fs.readFileSync(AUTH_PATH, "utf8"));
}

function writeAuth(auth) {
  fs.writeFileSync(AUTH_PATH, JSON.stringify(auth, null, 2));
}

ensureAuth();

let state = readState();
state.sessions = [];
const runtime = new Map();
const wsSubscriptions = new WeakMap();

persist();

function parseCookies(header) {
  return Object.fromEntries(String(header || "").split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return null;
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(Boolean));
}

function verifyPassword(password, auth) {
  const hash = Buffer.from(passwordHash(password, auth.salt), "hex");
  const expected = Buffer.from(auth.passwordHash, "hex");
  return expected.length === hash.length && crypto.timingSafeEqual(expected, hash);
}

function createSession() {
  const auth = readAuth();
  const token = crypto.randomBytes(32).toString("base64url");
  auth.sessions ||= {};
  auth.sessions[token] = { createdAt: now(), lastSeenAt: now() };
  writeAuth(auth);
  return token;
}

function isAuthenticated(req) {
  const token = parseCookies(req.headers.cookie).awb_session;
  if (!token) return false;
  const auth = readAuth();
  if (!auth.sessions?.[token]) return false;
  auth.sessions[token].lastSeenAt = now();
  writeAuth(auth);
  return true;
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "authentication required" });
  return res.redirect("/login.html");
}

function expandPath(input) {
  const value = String(input || "").trim();
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify({ projects: state.projects }, null, 2));
}

function publicSession(session) {
  const live = runtime.get(session.id);
  return {
    id: session.id,
    title: session.title,
    cwd: session.cwd,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastActivityAt: session.lastActivityAt,
    startedAt: session.startedAt,
    pid: live?.proc.pid ?? null,
    transport: live?.transport ?? null,
    isLive: Boolean(live)
  };
}

function replayBuffer(live) {
  const buffer = live?.buffer || "";
  if (buffer.length <= SNAPSHOT_REPLAY_LIMIT) return buffer;
  return buffer.slice(buffer.length - SNAPSHOT_REPLAY_LIMIT);
}

function getShell() {
  if (process.platform === "win32") return "powershell.exe";
  if (process.env.SHELL && fs.existsSync(process.env.SHELL)) return process.env.SHELL;
  if (fs.existsSync("/bin/zsh")) return "/bin/zsh";
  if (fs.existsSync("/bin/bash")) return "/bin/bash";
  return "sh";
}

function shellArgs() {
  return process.platform === "win32" ? ["-NoLogo"] : ["-l"];
}

function shellEnv() {
  return {
    ...process.env,
    TERM: "xterm-256color",
    COLORTERM: "truecolor",
    LANG: process.env.LANG || "en_US.UTF-8",
    LC_ALL: process.env.LC_ALL || process.env.LANG || "en_US.UTF-8",
    LC_CTYPE: process.env.LC_CTYPE || process.env.LANG || "en_US.UTF-8"
  };
}

function createChildProcess(cwd) {
  const child = spawn(getShell(), process.platform === "win32" ? ["-NoLogo"] : ["-i"], {
    cwd,
    env: shellEnv(),
    stdio: "pipe"
  });

  if (child.stdout) child.stdout.setEncoding("utf8");
  if (child.stderr) child.stderr.setEncoding("utf8");

  return {
    proc: child,
    transport: "pipe",
    write(data) {
      if (child.stdin?.writable) child.stdin.write(data);
    },
    resize() {},
    kill() {
      child.kill();
    },
    onData(handler) {
      child.stdout?.on("data", handler);
      child.stderr?.on("data", handler);
    },
    onExit(handler) {
      child.on("exit", (code) => handler({ exitCode: code ?? 0 }));
    }
  };
}

function createPtyProcess(cwd, cols, rows) {
  const term = pty.spawn(getShell(), shellArgs(), {
    name: "xterm-256color",
    cols,
    rows,
    cwd,
    env: shellEnv()
  });

  return {
    proc: term,
    transport: "pty",
    write(data) {
      term.write(data);
    },
    resize(nextCols, nextRows) {
      term.resize(nextCols, nextRows);
    },
    kill() {
      term.kill();
    },
    onData(handler) {
      term.onData(handler);
    },
    onExit(handler) {
      term.onExit(handler);
    }
  };
}

function broadcastSession(session) {
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "session:update", session: publicSession(session) }));
    }
  }
}

function removeSession(sessionId) {
  const live = runtime.get(sessionId);
  if (live) live.kill();
  runtime.delete(sessionId);
  state.sessions = state.sessions.filter((session) => session.id !== sessionId);
  persist();
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "session:removed", sessionId }));
    }
  }
}

function startPty(session) {
  if (runtime.has(session.id)) return runtime.get(session.id);

  const cwd = session.cwd || os.homedir();
  let proc;
  let fallbackReason = "";
  try {
    proc = createPtyProcess(cwd, session.cols || 120, session.rows || 34);
  } catch (error) {
    fallbackReason = `PTY unavailable (${error.message}); using pipe transport.`;
    proc = createChildProcess(cwd);
  }

  session.cwd = cwd;
  session.transport = proc.transport;
  session.startedAt ||= now();
  session.updatedAt = now();
  session.pid = proc.proc.pid;

  const live = { ...proc, subscribers: new Set(), buffer: "", pendingOutput: "", flushTimer: null };
  runtime.set(session.id, live);

  function flushOutput() {
    if (!live.pendingOutput) return;
    const data = live.pendingOutput;
    live.pendingOutput = "";
    if (live.flushTimer) {
      clearTimeout(live.flushTimer);
      live.flushTimer = null;
    }
    for (const ws of live.subscribers) {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "terminal:output", sessionId: session.id, data }));
    }
  }

  live.onData((chunk) => {
    session.lastActivityAt = now();
    const data = String(chunk);
    live.buffer += data;
    if (live.buffer.length > LIVE_BUFFER_LIMIT) {
      live.buffer = live.buffer.slice(live.buffer.length - LIVE_BUFFER_LIMIT);
    }
    live.pendingOutput += data;
    if (live.pendingOutput.length >= OUTPUT_FLUSH_BYTES) {
      flushOutput();
      return;
    }
    if (!live.flushTimer) {
      live.flushTimer = setTimeout(flushOutput, OUTPUT_FLUSH_MS);
    }
  });

  live.onExit(() => {
    flushOutput();
    removeSession(session.id);
  });

  broadcastSession(session);
  if (fallbackReason) {
    setTimeout(() => {
      for (const ws of live.subscribers) {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "terminal:output", sessionId: session.id, data: `\r\n[webshell] ${fallbackReason}\r\n` }));
      }
    }, 0);
  }
  return live;
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.post("/api/login", (req, res) => {
  const auth = readAuth();
  if (String(req.body.username || "") !== auth.username || !verifyPassword(req.body.password, auth)) {
    return res.status(401).json({ error: "invalid username or password" });
  }
  const token = createSession();
  res.setHeader("Set-Cookie", [
    `awb_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`
  ]);
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie).awb_session;
  if (token) {
    const auth = readAuth();
    if (auth.sessions) delete auth.sessions[token];
    writeAuth(auth);
  }
  res.setHeader("Set-Cookie", "awb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/login.html", (_req, res) => res.sendFile(path.join(__dirname, "public/login.html")));
app.get("/login.js", (_req, res) => res.sendFile(path.join(__dirname, "public/login.js")));
app.get("/styles.css", (_req, res) => res.sendFile(path.join(__dirname, "public/styles.css")));
app.get("/logo.svg", (_req, res) => res.sendFile(path.join(__dirname, "public/logo.svg")));
app.use(requireAuth);
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders(res, filePath) {
    if (/\.(html|js|css)$/.test(filePath)) {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));
app.use("/vendor/xterm", express.static(path.join(__dirname, "node_modules/@xterm/xterm")));
app.use("/vendor/xterm-addon-fit", express.static(path.join(__dirname, "node_modules/@xterm/addon-fit")));

app.get("/api/state", (_req, res) => {
  res.json({
    projects: state.projects,
    sessions: state.sessions.filter((session) => runtime.has(session.id)).map(publicSession)
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: now(), version: APP_VERSION });
});

app.get("/api/version", (_req, res) => {
  res.json({ version: APP_VERSION });
});

app.get("/api/diagnostics", (_req, res) => {
  res.json({
    ok: true,
    shell: getShell(),
    cwd: process.cwd(),
    pid: process.pid,
    platform: process.platform,
    envShell: process.env.SHELL || null,
    path: process.env.PATH || null,
    env: {
      HOME: process.env.HOME || null
    }
  });
});

app.post("/api/projects", (req, res) => {
  const name = String(req.body.name || "").trim();
  const projectPath = expandPath(req.body.path);
  if (!name || !projectPath) return res.status(400).json({ error: "name and path are required" });
  if (!fs.existsSync(projectPath)) return res.status(400).json({ error: "path does not exist" });

  const project = {
    id: id("proj"),
    name,
    path: projectPath,
    createdAt: now(),
    updatedAt: now()
  };
  state.projects.unshift(project);
  persist();
  res.json(project);
});

app.post("/api/projects/import", (req, res) => {
  const root = expandPath(req.body.root);
  if (!root || !fs.existsSync(root)) return res.status(400).json({ error: "root path does not exist" });
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const created = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const projectPath = path.join(root, entry.name);
    const looksLikeProject = fs.existsSync(path.join(projectPath, ".git")) ||
      fs.existsSync(path.join(projectPath, "package.json")) ||
      fs.existsSync(path.join(projectPath, "pyproject.toml")) ||
      fs.existsSync(path.join(projectPath, "Cargo.toml")) ||
      fs.existsSync(path.join(projectPath, "go.mod"));
    if (!looksLikeProject) continue;
    if (state.projects.some((project) => project.path === projectPath)) continue;

    const project = {
      id: id("proj"),
      name: entry.name,
      path: projectPath,
      createdAt: now(),
      updatedAt: now()
    };
    state.projects.unshift(project);
    created.push(project);
  }

  persist();
  res.json({ created, count: created.length });
});

app.patch("/api/projects/:id", (req, res) => {
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  if (typeof req.body.name === "string") project.name = req.body.name.trim() || project.name;
  if (typeof req.body.path === "string") project.path = expandPath(req.body.path) || project.path;
  project.updatedAt = now();
  persist();
  res.json(project);
});

app.post("/api/sessions", (req, res) => {
  const requestedCwd = expandPath(req.body.cwd || os.homedir());
  const cwd = fs.existsSync(requestedCwd) ? requestedCwd : os.homedir();

  const session = {
    id: id("sess"),
    title: String(req.body.title || "Shell").trim(),
    cwd,
    createdAt: now(),
    updatedAt: now(),
    lastActivityAt: now()
  };
  state.sessions.unshift(session);
  try {
    startPty(session);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.publicMessage || error.message });
  }
  res.json(publicSession(session));
});

app.post("/api/sessions/:id/stop", (req, res) => {
  const session = state.sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "session not found" });
  removeSession(session.id);
  res.json({ ok: true, sessionId: req.params.id });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Webshell listening on http://${HOST}:${PORT}`);
});

const wss = new WebSocketServer({
  server,
  path: "/ws",
  verifyClient(info, done) {
    done(isAuthenticated(info.req), isAuthenticated(info.req) ? 200 : 401);
  }
});

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const session = state.sessions.find((s) => s.id === msg.sessionId);
    if (!session) return;

    if (msg.type === "terminal:attach") {
      const previousSessionId = wsSubscriptions.get(ws);
      if (previousSessionId === session.id) {
        const live = runtime.get(session.id);
        ws.send(JSON.stringify({ type: "terminal:snapshot", sessionId: session.id, data: replayBuffer(live) }));
        ws.send(JSON.stringify({ type: "session:update", session: publicSession(session) }));
        return;
      }
      if (previousSessionId && previousSessionId !== session.id) {
        const previousLive = runtime.get(previousSessionId);
        previousLive?.subscribers.delete(ws);
      }
      const live = runtime.get(session.id);
      wsSubscriptions.set(ws, session.id);
      if (live) live.subscribers.add(ws);
      ws.send(JSON.stringify({ type: "terminal:snapshot", sessionId: session.id, data: replayBuffer(live) }));
      ws.send(JSON.stringify({ type: "session:update", session: publicSession(session) }));
      return;
    }

    if (msg.type === "terminal:input") {
      const live = runtime.get(session.id);
      if (live) live.write(String(msg.data || ""));
      return;
    }

    if (msg.type === "terminal:resize") {
      const live = runtime.get(session.id);
      if (live && Number(msg.cols) > 0 && Number(msg.rows) > 0) {
        live.resize(Number(msg.cols), Number(msg.rows));
        session.cols = Number(msg.cols);
        session.rows = Number(msg.rows);
      }
    }
  });

  ws.on("close", () => {
    for (const live of runtime.values()) live.subscribers.delete(ws);
    wsSubscriptions.delete(ws);
  });
});
