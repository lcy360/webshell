# Webshell

A small local web console for managing live shell terminals from a browser.

Webshell does not wrap Codex, Claude, or any other CLI. It gives you stable browser-based shell sessions, and you can run whatever command you want inside the shell.

## Features

- Multiple live shell sessions in one web UI
- Real PTY transport through `node-pty`
- Browser terminal powered by xterm.js
- Login screen with local username/password authentication
- Mobile responsive layout
- Mobile shortcut keys for `↑`, `↓`, and `Shift+Tab`
- UTF-8 shell locale defaults for Chinese and other non-ASCII input
- In-memory terminal snapshots for switching sessions
- No terminal output persisted to disk

## Requirements

- Node.js 18 or newer
- macOS or Linux recommended
- A shell available on the host, such as `zsh`, `bash`, or `sh`

## Install

```bash
git clone <your-repo-url> webshell
cd webshell
npm install
```

## Run

```bash
npm start
```

Open:

```text
http://127.0.0.1:4767
```

The first start creates `data/auth.json`.

If you do not provide credentials, Webshell creates user `admin` and prints a random password in the server log.

To choose credentials before the first start:

```bash
WEBSHELL_USERNAME=admin WEBSHELL_PASSWORD='change-me' npm start
```

## Configuration

Environment variables:

```text
HOST=127.0.0.1
PORT=4767
WEBSHELL_USERNAME=admin
WEBSHELL_PASSWORD=change-me
WEBSHELL_DATA_DIR=/path/to/runtime-data
```

`WEBSHELL_DATA_DIR` is optional. By default runtime files are stored in `./data`.

## Runtime Data

Runtime files are intentionally ignored by git:

```text
data/auth.json
data/state.json
```

`auth.json` contains password hash and browser sessions. Do not commit it.

`state.json` currently stores project metadata only. Live shell sessions and terminal output are not persisted.

## Mobile Use

On phone browsers, Webshell switches to a compact layout:

- Session controls stay at the top
- Terminal fills the main screen
- `↑`, `↓`, and `Shift+Tab` shortcuts appear next to the `X` close button

These shortcut buttons send terminal control sequences directly to the PTY, which helps when the mobile keyboard cannot emit them.

## Exposing Remotely

For remote access, put Webshell behind a secure tunnel or reverse proxy, for example Cloudflare Tunnel.

Keep the server bound to localhost:

```bash
HOST=127.0.0.1 PORT=4767 npm start
```

Then point your tunnel to:

```text
http://127.0.0.1:4767
```

Use HTTPS and a strong password. This application can run arbitrary shell commands as your local user.

## Development

Syntax check:

```bash
npm run check
```

End-to-end smoke test:

```bash
npm run test:e2e
```

The E2E test starts Webshell on a temporary port with a temporary data directory, creates a shell session, sends an English and Chinese `echo`, verifies output, and closes the session.

## Security Notes

Webshell is a local operator tool. Anyone who can log in can run commands on the host as the user running the server.

Recommended defaults:

- Bind to `127.0.0.1`
- Use HTTPS through a trusted reverse proxy or tunnel
- Use a long unique password
- Do not commit runtime data
- Avoid exposing it directly to the public internet
