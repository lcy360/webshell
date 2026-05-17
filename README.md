# Webshell

Webshell is a browser console for managing live shell terminals on your own machine or server.

It does not wrap Codex, Claude, SSH, or any specific CLI. It gives you stable browser-based shell sessions, then you run whatever command you want inside the shell.

## Features

- Multiple live shell sessions in one web UI
- Real PTY transport through `node-pty`
- xterm.js browser terminal
- Local username/password login
- Mobile responsive layout
- Mobile shortcut keys for `↑`, `↓`, and `Shift+Tab`
- UTF-8 locale defaults for Chinese and other non-ASCII input
- In-memory terminal snapshots when switching sessions
- No terminal output persisted to disk

## Requirements

- Node.js 18 or newer
- macOS or Linux recommended
- A local shell such as `zsh`, `bash`, or `sh`

## Quick Start

```bash
git clone https://github.com/lcy360/webshell.git
cd webshell
npm install
WEBSHELL_USERNAME=admin WEBSHELL_PASSWORD='change-me' npm run init-user
npm start
```

Open:

```text
http://127.0.0.1:4767
```

If you skip `npm run init-user`, first startup creates user `admin` and prints a random password in the server log.

## Account Commands

Initialize credentials before first start:

```bash
WEBSHELL_USERNAME=admin WEBSHELL_PASSWORD='change-me' npm run init-user
```

Reset credentials later:

```bash
WEBSHELL_USERNAME=admin WEBSHELL_PASSWORD='new-secret' npm run reset-password
```

`reset-password` clears browser login sessions. Restart the server after resetting credentials.

## Configuration

Environment variables:

```text
HOST=127.0.0.1
PORT=4767
WEBSHELL_USERNAME=admin
WEBSHELL_PASSWORD=change-me
WEBSHELL_DATA_DIR=/path/to/runtime-data
WEBSHELL_OUTPUT_FLUSH_MS=4
WEBSHELL_OUTPUT_FLUSH_BYTES=16384
```

`WEBSHELL_DATA_DIR` defaults to `./data`.

For lower perceived latency, reduce `WEBSHELL_OUTPUT_FLUSH_MS`. For less network and CPU churn, increase it. `4` is a practical default for interactive use.

## Runtime Data

Runtime files are ignored by git:

```text
data/auth.json
data/state.json
```

`auth.json` contains the password hash and browser sessions. Do not commit it.

Live shell sessions and terminal output are runtime-only. They are not persisted after the process exits.

## Remote Access

Bind Webshell to localhost and expose it through HTTPS:

```bash
HOST=127.0.0.1 PORT=4767 npm start
```

Cloudflare Tunnel target:

```text
http://127.0.0.1:4767
```

Templates are included:

- `deploy/cloudflare-tunnel/config.yml`
- `deploy/nginx/webshell.conf`

Anyone who can log in can run shell commands as the operating-system user running Webshell. Use HTTPS, a strong password, and preferably Cloudflare Access or another upstream access control layer.

## Run As A Service

Linux systemd template:

```bash
sudo cp deploy/systemd/webshell.service /etc/systemd/system/webshell.service
sudo systemctl daemon-reload
sudo systemctl enable --now webshell
```

Edit `WorkingDirectory`, `ExecStart`, and environment values before enabling.

macOS launchd template:

```bash
cp deploy/launchd/com.webshell.app.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.webshell.app.plist
```

Edit paths and the `npm` executable path first. On Apple Silicon Homebrew, `npm` is often `/opt/homebrew/bin/npm`.

## Docker

```bash
docker compose up -d
```

The Docker container manages a shell inside the container. It does not expose your host shell unless you deliberately mount host paths and design that isolation boundary yourself.

## Mobile Use

On phone browsers, Webshell switches to a compact layout:

- Shell creation stays at the top
- Terminal fills the main screen
- `↑`, `↓`, and `Shift+Tab` shortcut buttons sit next to the `X` close button

These shortcut buttons send terminal control sequences directly to the PTY, which helps when a mobile keyboard cannot emit them.

## Chinese Input And Latency

Webshell sets `LANG`, `LC_ALL`, and `LC_CTYPE` to UTF-8 defaults when the host does not provide them. The browser terminal font stack includes common Chinese fonts on macOS and Linux.

The frontend tracks IME composition events so partially composed Chinese text is not sent early. Output uses immediate writes for small chunks and batched writes for large bursts, which keeps normal typing responsive without making large command output expensive.

## Development

Syntax check:

```bash
npm run check
```

End-to-end smoke test:

```bash
npm run test:e2e
```

The E2E test starts Webshell on a temporary port with a temporary data directory, logs in, creates a shell, sends English and Chinese output, verifies it, and closes the shell.

## What Webshell Is Not

- Not an SSH server
- Not a terminal transcript recorder
- Not an AI agent wrapper
- Not a multi-user authorization system

It is a lightweight remote-control surface for shell terminals you own.
