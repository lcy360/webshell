import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "images");
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  {
    file: "01-cover.svg",
    title: "电脑手机",
    subtitle: "接着同一个 AI 终端继续写",
    lines: ["同一批 shell sessions", "终端一直在服务端跑", "浏览器只是入口"]
  },
  {
    file: "02-problem.svg",
    title: "换设备",
    subtitle: "coding 上下文不该断",
    lines: ["电脑开 Claude / Codex", "手机看进度补 prompt", "回电脑继续同一 session", "不用远程桌面"]
  },
  {
    file: "03-features.svg",
    title: "Webshell",
    subtitle: "跨设备的 terminal session 管理",
    lines: ["电脑手机打开同一 session", "切换 session 不黑屏", "移动端 ↑ ↓ Shift+Tab", "Cloudflare Tunnel 外网访问"]
  },
  {
    file: "04-quick-start.svg",
    title: "快速启动",
    subtitle: "GitHub: lcy360/webshell",
    code: ["git clone github.com/lcy360/webshell", "cd webshell && npm install", "WEBSHELL_PASSWORD=xxx npm run init-user", "npm start"]
  }
];

function escape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderPage(page) {
  const lines = page.code
    ? page.code.map((line, index) => `<text x="92" y="${600 + index * 58}" class="code">${escape(line)}</text>`).join("\n")
    : page.lines.map((line, index) => `<text x="110" y="${590 + index * 72}" class="line">${escape(line)}</text>`).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <rect width="1080" height="1440" fill="#171b20"/>
  <rect x="56" y="56" width="968" height="1328" rx="34" fill="#20262d" stroke="#3a444f" stroke-width="2"/>
  <circle cx="144" cy="138" r="15" fill="#78e2bc"/>
  <circle cx="196" cy="138" r="15" fill="#f0c266"/>
  <circle cx="248" cy="138" r="15" fill="#ee8374"/>
  <text x="92" y="286" class="kicker">REMOTE SHELL MANAGER</text>
  <text x="92" y="412" class="title">${escape(page.title)}</text>
  <text x="92" y="492" class="subtitle">${escape(page.subtitle)}</text>
  <rect x="92" y="540" width="896" height="${page.code ? 270 : 410}" rx="20" fill="#15191f" stroke="#34404a"/>
  ${lines}
  <text x="92" y="1276" class="footer">github.com/lcy360/webshell</text>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Segoe UI", sans-serif; }
    .kicker { fill: #78e2bc; font-size: 28px; font-weight: 700; letter-spacing: 3px; }
    .title { fill: #eef2f4; font-size: 98px; font-weight: 800; letter-spacing: 0; }
    .subtitle { fill: #b8c1ca; font-size: 42px; font-weight: 520; letter-spacing: 0; }
    .line { fill: #e0e6eb; font-size: 46px; font-weight: 650; letter-spacing: 0; }
    .code { fill: #d7dee5; font-size: 30px; font-family: Menlo, Monaco, Consolas, monospace; letter-spacing: 0; }
    .footer { fill: #7e8b96; font-size: 30px; font-weight: 520; letter-spacing: 0; }
  </style>
</svg>`;
}

for (const page of pages) {
  fs.writeFileSync(path.join(outDir, page.file), renderPage(page));
}

console.log(`Generated ${pages.length} SVG assets in ${outDir}`);
