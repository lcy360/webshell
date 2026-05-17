const state = {
  sessions: [],
  activeSessionId: null,
  ws: null,
  term: null,
  fit: null,
  attachedSessionId: null,
  pendingAttachSessionId: null,
  replayToken: 0,
  isProgrammaticWrite: false,
  isComposing: false,
  compositionBuffer: "",
  outputQueue: "",
  outputFrame: 0
};

const $ = (id) => document.getElementById(id);
let toastTimer = null;
let loadedServerVersion = null;
let resizeTimer = null;

function updateViewportMode() {
  const isMobile = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  document.documentElement.classList.toggle("mobile-browser", isMobile);
}

updateViewportMode();

function showToast(message, type = "ok") {
  const toast = $("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function runAction(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Action failed", "error");
    }
  };
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`);
  return body;
}

async function checkVersion() {
  const res = await fetch("/api/version", { cache: "no-store" });
  if (!res.ok) return;
  const body = await res.json();
  if (!loadedServerVersion) {
    loadedServerVersion = body.version;
    return;
  }
  if (loadedServerVersion !== body.version) {
    showToast("Webshell updated. Refresh the page.", "error");
  }
}

function activeSession() {
  return state.sessions.find((session) => session.id === state.activeSessionId) || null;
}

function upsertSession(session) {
  const index = state.sessions.findIndex((existing) => existing.id === session.id);
  if (index >= 0) {
    state.sessions[index] = session;
  } else {
    state.sessions.unshift(session);
  }
}

function removeSession(sessionId) {
  state.sessions = state.sessions.filter((session) => session.id !== sessionId);
  if (state.activeSessionId === sessionId) {
    const next = state.sessions[0] || null;
    state.activeSessionId = next?.id || null;
    state.attachedSessionId = null;
    if (next) {
      attachTerminal(next.id);
    } else {
      state.term?.reset();
      state.term?.clear();
    }
  }
  render();
}

function renderSessions() {
  $("sessionCount").textContent = state.sessions.length;
  $("sessions").innerHTML = state.sessions.map((session) => `
    <button class="session-item ${session.id === state.activeSessionId ? "active" : ""}" data-session="${session.id}">
      <span class="item-top">
        <span class="item-title">${escapeHtml(session.title)}</span>
        <span class="badge running">live</span>
      </span>
      <span class="item-meta">pid ${session.pid || ""} · ${formatTime(session.lastActivityAt)}</span>
      <span class="item-path">${escapeHtml(session.cwd || "")}</span>
    </button>
  `).join("");

  document.querySelectorAll("[data-session]").forEach((el) => {
    el.addEventListener("click", () => attachTerminal(el.dataset.session));
  });
}

function renderTerminalMeta() {
  const session = activeSession();
  $("terminalTitle").textContent = session ? session.title : "No shell selected";
  $("terminalMeta").textContent = session
    ? `${session.cwd || ""} · pid ${session.pid || ""}`
    : "Create a shell to start.";
  $("closeSessionBtn").disabled = !session;
}

function render() {
  renderSessions();
  renderTerminalMeta();
}

async function loadState() {
  const data = await api("/api/state");
  state.sessions = data.sessions;
  if (!state.activeSessionId && state.sessions[0]) state.activeSessionId = state.sessions[0].id;
  render();
  if (state.activeSessionId) attachTerminal(state.activeSessionId);
}

function ensureTerminal() {
  if (state.term) return;
  state.term = new Terminal({
    cursorBlink: true,
    fontFamily: "Menlo, Monaco, 'PingFang SC', 'Hiragino Sans GB', Consolas, 'Liberation Mono', monospace",
    fontSize: 13,
    lineHeight: 1.12,
    scrollback: 6000,
    convertEol: false,
    windowsMode: false,
    theme: {
      background: "#15181d",
      foreground: "#d9dde2",
      cursor: "#6ee7b7",
      selectionBackground: "#314154"
    }
  });
  state.fit = new FitAddon.FitAddon();
  state.term.loadAddon(state.fit);
  state.term.open($("terminal"));
  bindCompositionEvents();
  scheduleFit();
  $("terminal").addEventListener("click", () => state.term.focus());
  state.term.onData((data) => {
    if (state.isProgrammaticWrite) return;
    if (state.isComposing) {
      state.compositionBuffer += data;
      return;
    }
    sendTerminalInput(data);
  });
}

function bindCompositionEvents() {
  const textarea = $("terminal").querySelector(".xterm-helper-textarea");
  if (!textarea) return;
  textarea.addEventListener("compositionstart", () => {
    state.isComposing = true;
    state.compositionBuffer = "";
  });
  textarea.addEventListener("compositionend", () => {
    setTimeout(() => {
      state.isComposing = false;
      if (state.compositionBuffer) {
        const data = state.compositionBuffer;
        state.compositionBuffer = "";
        sendTerminalInput(data);
      }
      state.term?.focus();
    }, 0);
  });
}

function sendTerminalInput(data) {
  if (state.ws?.readyState === WebSocket.OPEN && state.activeSessionId && data) {
    state.ws.send(JSON.stringify({ type: "terminal:input", sessionId: state.activeSessionId, data }));
  }
}

function enqueueOutput(data) {
  if (!state.outputFrame && !state.outputQueue && data.length < 2048) {
    state.term.write(data);
    return;
  }
  state.outputQueue += data;
  if (state.outputFrame) return;
  state.outputFrame = requestAnimationFrame(() => {
    const next = state.outputQueue;
    state.outputQueue = "";
    state.outputFrame = 0;
    if (next) state.term.write(next);
  });
}

function connectSocket() {
  if (state.ws && state.ws.readyState !== WebSocket.CLOSED) return;
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  state.ws = new WebSocket(`${protocol}://${location.host}/ws`);
  state.attachedSessionId = null;
  state.ws.addEventListener("open", () => {
    if (state.pendingAttachSessionId || state.activeSessionId) {
      sendAttach(state.pendingAttachSessionId || state.activeSessionId);
    }
  });
  state.ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "terminal:snapshot" && msg.sessionId === state.activeSessionId) {
      const token = ++state.replayToken;
      state.outputQueue = "";
      if (state.outputFrame) cancelAnimationFrame(state.outputFrame);
      state.outputFrame = 0;
      state.term.reset();
      state.term.clear();
      state.isProgrammaticWrite = true;
      state.isComposing = false;
      state.compositionBuffer = "";
      const done = () => {
        if (token !== state.replayToken) return;
        requestAnimationFrame(() => {
          if (token !== state.replayToken) return;
          state.isProgrammaticWrite = false;
          fitAndResize();
          state.term.focus();
        });
      };
      if (msg.data) state.term.write(msg.data, done);
      else done();
    }
    if (msg.type === "terminal:output" && msg.sessionId === state.activeSessionId) {
      enqueueOutput(msg.data);
    }
    if (msg.type === "session:update") {
      upsertSession(msg.session);
      render();
    }
    if (msg.type === "session:removed") {
      removeSession(msg.sessionId);
    }
  });
}

function sendAttach(sessionId) {
  if (!sessionId || state.ws?.readyState !== WebSocket.OPEN) {
    state.pendingAttachSessionId = sessionId;
    return;
  }
  state.ws.send(JSON.stringify({ type: "terminal:attach", sessionId }));
  state.attachedSessionId = sessionId;
  state.pendingAttachSessionId = null;
  scheduleFitAndResize();
}

function attachTerminal(sessionId) {
  ensureTerminal();
  connectSocket();
  state.replayToken += 1;
  state.isProgrammaticWrite = false;
  state.isComposing = false;
  state.compositionBuffer = "";
  state.outputQueue = "";
  if (state.outputFrame) cancelAnimationFrame(state.outputFrame);
  state.outputFrame = 0;
  state.term.reset();
  state.term.clear();
  state.activeSessionId = sessionId;
  render();
  scheduleFit();
  sendAttach(sessionId);
}

function fitAndResize() {
  if (!state.term || !state.fit || !state.activeSessionId) return;
  requestAnimationFrame(() => {
    state.fit.fit();
    if (state.ws?.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: "terminal:resize",
        sessionId: state.activeSessionId,
        cols: state.term.cols,
        rows: state.term.rows
      }));
    }
  });
}

function scheduleFit() {
  if (!state.term || !state.fit) return;
  for (const delay of [0, 50, 150]) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        state.fit.fit();
      });
    }, delay);
  }
}

function scheduleFitAndResize() {
  if (!state.term || !state.fit || !state.activeSessionId) return;
  for (const delay of [0, 50, 150]) {
    setTimeout(fitAndResize, delay);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

$("startSessionBtn").addEventListener("click", runAction(async () => {
  const title = $("sessionTitle").value.trim() || "Shell";
  const session = await api("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ title })
  });
  upsertSession(session);
  $("sessionTitle").value = "";
  attachTerminal(session.id);
  showToast(`Started ${session.title}`);
}));

$("closeSessionBtn").addEventListener("click", runAction(async () => {
  const session = activeSession();
  if (!session) return;
  await api(`/api/sessions/${session.id}/stop`, { method: "POST", body: "{}" });
  showToast(`Closed ${session.title}`);
}));

document.querySelectorAll("[data-terminal-input]").forEach((button) => {
  button.addEventListener("click", () => {
    const inputMap = {
      up: "\x1b[A",
      down: "\x1b[B",
      "shift-tab": "\x1b[Z"
    };
    sendTerminalInput(inputMap[button.dataset.terminalInput]);
    state.term?.focus();
  });
});

$("refreshBtn").addEventListener("click", runAction(async () => {
  await loadState();
  showToast("Refreshed");
}));

$("logoutBtn").addEventListener("click", runAction(async () => {
  await api("/api/logout", { method: "POST", body: "{}" });
  window.location.href = "/login.html";
}));

window.addEventListener("resize", () => {
  updateViewportMode();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(scheduleFitAndResize, 80);
});
window.visualViewport?.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(scheduleFitAndResize, 80);
});
window.addEventListener("focus", () => checkVersion().catch(() => {}));

loadState().catch((error) => {
  console.error(error);
  alert(error.message);
});
checkVersion().catch(() => {});
